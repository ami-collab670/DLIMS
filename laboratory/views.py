"""
LSIMS Laboratory — DRF Views
Sprint 2: Core Engine (Jobs, Samples & Blind Aliasing)

Implements role-based access control:
- TestCatalog: Admin writes, all authenticated reads.
- JobOrder: Receptionist creates; Admin manages existing jobs; Clients see only their own.
- Sample: Receptionist creates; Admin manages existing samples; Analysts see only assigned + blind serializer.
- SampleTest: Receptionist/Admin assigns tests to samples.
"""

from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, extend_schema_view

from accounts.permissions import IsAdminOrReadOnly, IsAdminOrReceptionist, IsReceptionist
from .models import FinancialRecord, TestCatalog, JobOrder, Sample, SampleTest
from .policies import (
    financial_records_visible_to,
    jobs_visible_to,
    samples_visible_to,
    sample_tests_visible_to,
    tests_visible_to,
)
from .serializers import (
    FinancialRecordSerializer,
    TestCatalogSerializer,
    JobOrderSerializer,
    JobOrderCreateSerializer,
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

    serializer_class = TestCatalogSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    filterset_fields = ["is_active", "department"]
    search_fields = ["test_name", "test_code", "department__name"]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return TestCatalog.objects.none()

        base_qs = TestCatalog.objects.select_related("department")
        return tests_visible_to(self.request.user, base_qs)


# ---------------------------------------------------------------------------
# FinancialRecord ViewSet — Finance/Admin manage payment gate
# ---------------------------------------------------------------------------
@extend_schema_view(
    list=extend_schema(summary="List financial records", tags=["Financial Records"]),
    retrieve=extend_schema(summary="Get financial record details", tags=["Financial Records"]),
    create=extend_schema(summary="Create a financial record", tags=["Financial Records"]),
    update=extend_schema(summary="Update a financial record", tags=["Financial Records"]),
    partial_update=extend_schema(summary="Partially update a financial record", tags=["Financial Records"]),
    destroy=extend_schema(summary="Delete a financial record", tags=["Financial Records"]),
)
class FinancialRecordViewSet(viewsets.ModelViewSet):
    """
    Payment records for job orders.

    Finance/Admin can create and update payment records. Clients can read only
    their own records. Payment changing to paid triggers permanent sample coding.
    """

    serializer_class = FinancialRecordSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "invoice_no"
    filterset_fields = ["payment_status", "job"]
    search_fields = ["invoice_no", "job__description", "job__client__email"]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return FinancialRecord.objects.none()

        base_qs = FinancialRecord.objects.select_related("job", "job__client")
        return financial_records_visible_to(self.request.user, base_qs)

    def check_permissions(self, request):
        super().check_permissions(request)
        if request.method not in ("GET", "HEAD", "OPTIONS"):
            role_name = getattr(request.user, "role_name", None)
            if not request.user.is_superuser and role_name not in {"admin", "finance"}:
                self.permission_denied(
                    request,
                    message="Only Admin or Finance can manage financial records.",
                )


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
    - Receptionist: create + read/update all jobs.
    - Client (external): read-only, only their own jobs.
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

        base_qs = JobOrder.objects.select_related(
            "client", "submitted_by", "blocked_by_role"
        ).prefetch_related("samples", "samples__sample_tests__test")
        return jobs_visible_to(self.request.user, base_qs)

    def get_serializer_class(self):
        if self.action == "create":
            return JobOrderCreateSerializer
        return JobOrderSerializer

    def check_permissions(self, request):
        """
        Enforce job-order write permissions:
        - Only Receptionists can create new job orders.
        - Admin/Receptionist can update or delete existing job orders.
        - Everyone else gets read-only.
        """
        super().check_permissions(request)
        if self.action == "create":
            if not IsReceptionist().has_permission(request, self):
                self.permission_denied(
                    request,
                    message="Only Receptionists can create job orders.",
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

        base_qs = Sample.objects.select_related(
            "job",
            "job__client",
            "blind_alias",
            "received_by",
            "submitted_by",
            "assigned_analyst",
        ).prefetch_related("sample_tests__test")
        return samples_visible_to(self.request.user, base_qs)

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
        if getattr(self, "swagger_fake_view", False):
            return SampleTest.objects.none()

        base_qs = SampleTest.objects.select_related(
            "sample",
            "sample__job",
            "sample__job__client",
            "sample__assigned_analyst",
            "test",
            "test__department",
        )
        return sample_tests_visible_to(self.request.user, base_qs)

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
