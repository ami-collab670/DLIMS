"""
LSIMS Laboratory — DRF Views
Sprint 2: Core Engine (Jobs, Samples & Blind Aliasing)

Implements role-based access control:
- TestCatalog: Admin writes, all authenticated reads.
- JobOrder: Receptionist creates; Admin manages existing jobs; Clients see only their own.
- Sample: Receptionist creates; Admin manages existing samples; Analysts see only assigned + blind serializer.
- SampleTest: Receptionist/Admin assigns tests to samples.
"""

from django.db.models import Count

from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view

from accounts.permissions import IsAdminOrReadOnly, IsAdminOrReceptionist, IsReceptionist
from .models import TestCatalog, JobOrder, Sample, SampleTest
from .serializers import (
    TestCatalogSerializer,
    JobOrderSerializer,
    JobOrderCreateSerializer,
    JobOrderClientSelfCreateSerializer,
    SampleSerializer,
    SampleCreateSerializer,
    SampleUpdateSerializer,
    SampleAnalystSerializer,
    SampleTestSerializer,
    SampleTestCreateSerializer,
)


# ---------------------------------------------------------------------------
# TestCatalog ViewSet — Admin manages, all authenticated can read
# ---------------------------------------------------------------------------
@extend_schema_view(
    list=extend_schema(summary="List all available tests", tags=["Test Catalog"]),
    retrieve=extend_schema(summary="Get test details", tags=["Test Catalog"]),
    create=extend_schema(summary="Create a new test", tags=["Test Catalog"]),
    update=extend_schema(summary="Update a test", tags=["Test Catalog"]),
    partial_update=extend_schema(summary="Partially update a test", tags=["Test Catalog"]),
    destroy=extend_schema(summary="Delete a test", tags=["Test Catalog"]),
)
class TestCatalogViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for the Test Catalog.
    Admin has full access. All authenticated users can read (list/retrieve).
    """

    queryset = TestCatalog.objects.all()
    serializer_class = TestCatalogSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    filterset_fields = ["is_active"]
    search_fields = ["test_name", "test_code"]


# ---------------------------------------------------------------------------
# JobOrder ViewSet — Receptionist creates, queryset filtered by role
# ---------------------------------------------------------------------------
@extend_schema_view(
    list=extend_schema(summary="List job orders", tags=["Job Orders"]),
    retrieve=extend_schema(summary="Get job order details", tags=["Job Orders"]),
    create=extend_schema(summary="Create a new job order", tags=["Job Orders"]),
    update=extend_schema(summary="Update a job order", tags=["Job Orders"]),
    partial_update=extend_schema(summary="Partially update a job order", tags=["Job Orders"]),
    destroy=extend_schema(summary="Soft-cancel a job order", tags=["Job Orders"]),
)
class JobOrderViewSet(viewsets.ModelViewSet):
    """
    Job Order management.

    Access rules:
    - Admin: read/update/delete on all jobs.
    - Receptionist: create + read/update all jobs (full intake payload).
    - Client (external): create job **requests** for themselves; read-only on existing jobs.
    - Other roles: read-only, all jobs (for downstream workflow visibility).

    DELETE is implemented as a soft cancel that keeps the database row.
    """

    permission_classes = [IsAuthenticated]
    filterset_fields = ["current_status", "priority", "is_cancelled"]
    search_fields = ["description"]

    def get_queryset(self):
        """
        Filter job orders based on the authenticated user's role.
        - Clients see only their own jobs.
        - All internal roles see all jobs (needed for workflow visibility).
        """
        # Guard for drf-spectacular schema generation
        if getattr(self, "swagger_fake_view", False):
            return JobOrder.objects.none()

        user = self.request.user
        # Annotate counts instead of prefetching samples — avoids loading every Sample row
        # (large payloads, and prefetch uses SELECT * which breaks if migrations are pending).
        base_qs = JobOrder.objects.select_related(
            "client", "submitted_by", "blocked_by_role"
        ).annotate(sample_count=Count("samples", distinct=True))

        # Superusers should always see the full queryset, even if their
        # LSIMS profile fields were misconfigured.
        if user.is_superuser:
            return base_qs

        # External clients: only their own jobs
        if user.user_type == "external":
            return base_qs.filter(client=user)

        # All internal roles see all jobs
        return base_qs

    def get_serializer_class(self):
        if self.action == "create":
            user = self.request.user
            if getattr(user, "user_type", None) == "external":
                return JobOrderClientSelfCreateSerializer
            return JobOrderCreateSerializer
        return JobOrderSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        # Re-fetch with list queryset (annotations, select_related) so the response
        # matches detail/list payloads and avoids subtle ORM edge cases.
        instance = self.get_queryset().get(pk=serializer.instance.pk)
        output = JobOrderSerializer(instance, context=self.get_serializer_context())
        headers = self.get_success_headers(output.data)
        return Response(output.data, status=status.HTTP_201_CREATED, headers=headers)

    def check_permissions(self, request):
        """
        Enforce job-order write permissions:
        - Receptionist (or Admin via role): create with full intake serializer.
        - External clients: create self-requests only (handled via serializer branch).
        - Admin/Receptionist can update or delete existing job orders.
        - Everyone else gets read-only on non-create writes.
        """
        super().check_permissions(request)
        if self.action == "create":
            user = request.user
            if getattr(user, "user_type", None) == "external":
                return
            if not IsReceptionist().has_permission(request, self):
                self.permission_denied(
                    request,
                    message="Only Receptionists can create job orders on behalf of clients.",
                )
        elif request.method not in ("GET", "HEAD", "OPTIONS"):
            if not IsAdminOrReceptionist().has_permission(request, self):
                self.permission_denied(
                    request,
                    message="Only Admin or Receptionist can modify job orders.",
                )

    def perform_destroy(self, instance):
        """Soft-cancel a job order instead of hard-deleting its database row."""
        instance.is_cancelled = True
        instance.save(update_fields=["is_cancelled"])


# ---------------------------------------------------------------------------
# Sample ViewSet — The blind analysis serializer switch lives here
# ---------------------------------------------------------------------------
@extend_schema_view(
    list=extend_schema(summary="List samples", tags=["Samples"]),
    retrieve=extend_schema(summary="Get sample details", tags=["Samples"]),
    create=extend_schema(summary="Register a new sample", tags=["Samples"]),
    update=extend_schema(summary="Update a sample", tags=["Samples"]),
    partial_update=extend_schema(summary="Partially update a sample", tags=["Samples"]),
    destroy=extend_schema(summary="Hard delete a sample", tags=["Samples"]),
)
class SampleViewSet(viewsets.ModelViewSet):
    """
    Sample management with blind analysis enforcement.

    Access rules:
    - Admin/Receptionist: full detail access, sees all fields (client info, sample name, etc.)
    - Analyst: read-only, only assigned samples, BLIND serializer (no client info).
    - Client: read-only, only their own samples (via job).
    - Other roles: read-only, all samples.

    DELETE remains a hard database delete unless a later workflow changes it.
    """

    permission_classes = [IsAuthenticated]
    filterset_fields = ["sample_status", "job"]
    search_fields = ["sample_code", "sample_name"]

    def get_queryset(self):
        """
        Filter samples based on the authenticated user's role.
        - Analysts: only samples assigned to them.
        - Clients: only samples belonging to their jobs.
        - Admin/Receptionist/Others: all samples.
        """
        # Guard for drf-spectacular schema generation
        if getattr(self, "swagger_fake_view", False):
            return Sample.objects.none()

        user = self.request.user
        base_qs = Sample.objects.select_related(
            "job", "blind_alias", "received_by", "submitted_by", "assigned_analyst"
        ).prefetch_related("sample_tests__test")

        # Superusers should always see the full queryset, even if their
        # LSIMS profile fields were misconfigured.
        if user.is_superuser:
            return base_qs

        role_name = getattr(user, "role_name", None)

        # Analyst: only samples assigned to them
        if role_name == "analyst":
            return base_qs.filter(assigned_analyst=user)

        # External client: only samples from their own jobs
        if user.user_type == "external":
            return base_qs.filter(job__client=user)

        # Admin, Receptionist, QC, Finance, etc.: all samples
        return base_qs

    def get_serializer_class(self):
        """
        Serializer switch for blind analysis:
        - Analysts get SampleAnalystSerializer (blind — no client info).
        - Create action gets SampleCreateSerializer.
        - Update/partial_update gets SampleUpdateSerializer.
        - Everyone else gets the full SampleSerializer (read).
        """
        if self.action == "create":
            return SampleCreateSerializer
        if self.action in ("update", "partial_update"):
            return SampleUpdateSerializer

        user = self.request.user
        role_name = getattr(user, "role_name", None)
        if role_name == "analyst":
            return SampleAnalystSerializer

        return SampleSerializer

    def check_permissions(self, request):
        """
        Enforce sample write permissions:
        - Only Receptionists can register new samples.
        - Admin/Receptionist can update or delete existing samples.
        - Everyone else gets read-only.
        """
        super().check_permissions(request)
        if self.action == "create":
            if not IsReceptionist().has_permission(request, self):
                self.permission_denied(
                    request,
                    message="Only Receptionists can register samples.",
                )
        elif request.method not in ("GET", "HEAD", "OPTIONS"):
            if not IsAdminOrReceptionist().has_permission(request, self):
                self.permission_denied(
                    request,
                    message=(
                        "Only Admin or Receptionist can modify or hard-delete samples."
                    ),
                )


# ---------------------------------------------------------------------------
# SampleTest ViewSet — Assign tests to samples
# ---------------------------------------------------------------------------
@extend_schema_view(
    list=extend_schema(summary="List sample test assignments", tags=["Sample Tests"]),
    retrieve=extend_schema(summary="Get sample test assignment", tags=["Sample Tests"]),
    create=extend_schema(summary="Assign a test to a sample", tags=["Sample Tests"]),
    destroy=extend_schema(summary="Remove a test assignment", tags=["Sample Tests"]),
)
class SampleTestViewSet(viewsets.ModelViewSet):
    """
    Manage test assignments for samples.
    Admin and Receptionist can assign/remove tests.
    Others can read.
    """

    permission_classes = [IsAuthenticated]
    filterset_fields = ["sample", "test"]
    # Disable PUT/PATCH — test assignments are create-or-delete, not editable
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        return SampleTest.objects.select_related("sample", "test").all()

    def get_serializer_class(self):
        if self.action == "create":
            return SampleTestCreateSerializer
        return SampleTestSerializer

    def check_permissions(self, request):
        """Only Admin/Receptionist can create or delete test assignments."""
        super().check_permissions(request)
        if request.method not in ("GET", "HEAD", "OPTIONS"):
            if not IsAdminOrReceptionist().has_permission(request, self):
                self.permission_denied(
                    request,
                    message="Only Admin or Receptionist can manage test assignments.",
                )
