"""
LSIMS Laboratory — DRF Serializers
Sprint 2: Core Engine (Jobs, Samples & Blind Aliasing)

Two Sample serializer variants enforce the blind analysis protocol:
- SampleSerializer: full detail for Admin/Receptionist (shows client info)
- SampleAnalystSerializer: blind-only for Analysts (hides all client/sample identity)
"""

from django.db import IntegrityError, transaction
from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field

from accounts.fields import UserIdentityField

from .models import TestCatalog, JobOrder, BlindCode, Sample, SampleTest


# ---------------------------------------------------------------------------
# TestCatalog Serializers
# ---------------------------------------------------------------------------
class TestCatalogSerializer(serializers.ModelSerializer):
    """Full TestCatalog serializer for Admin CRUD and read-only views."""

    class Meta:
        model = TestCatalog
        fields = [
            "id",
            "test_name",
            "test_code",
            "description",
            "unit",
            "price",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


# ---------------------------------------------------------------------------
# BlindCode Serializer (read-only, embedded in Sample responses)
# ---------------------------------------------------------------------------
class BlindCodeSerializer(serializers.ModelSerializer):
    """Read-only serializer for BlindCode — only exposes the code string."""

    class Meta:
        model = BlindCode
        fields = ["id", "code"]
        read_only_fields = ["id", "code"]


# ---------------------------------------------------------------------------
# SampleTest Serializers
# ---------------------------------------------------------------------------
class SampleTestSerializer(serializers.ModelSerializer):
    """Full SampleTest serializer for creating and viewing test assignments."""

    test_name = serializers.CharField(source="test.test_name", read_only=True)
    test_code = serializers.CharField(source="test.test_code", read_only=True)

    class Meta:
        model = SampleTest
        fields = ["id", "sample", "test", "test_name", "test_code", "created_at"]
        read_only_fields = ["id", "created_at"]


class SampleTestCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating SampleTest assignments (accepts sample + test UUIDs)."""

    class Meta:
        model = SampleTest
        fields = ["id", "sample", "test"]
        read_only_fields = ["id"]

    def validate(self, attrs):
        """Prevent duplicate test assignments for the same sample."""
        sample = attrs.get("sample")
        test = attrs.get("test")
        if SampleTest.objects.filter(sample=sample, test=test).exists():
            raise serializers.ValidationError(
                {"test": "This test is already assigned to this sample."}
            )
        if not test.is_active:
            raise serializers.ValidationError(
                {"test": "Cannot assign an inactive test."}
            )
        return attrs


# ---------------------------------------------------------------------------
# JobOrder Serializers
# ---------------------------------------------------------------------------
class JobOrderSerializer(serializers.ModelSerializer):
    """
    Full JobOrder serializer for Admin/Receptionist views.
    ``client`` and ``submitted_by`` are the users' email addresses (read/write where allowed).
    """

    client = UserIdentityField()
    submitted_by = UserIdentityField(read_only=True)
    client_name = serializers.SerializerMethodField(read_only=True)
    sample_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = JobOrder
        fields = [
            "id",
            "client",
            "client_name",
            "submitted_by",
            "current_status",
            "status_reason",
            "blocked_by_role",
            "is_cancelled",
            "cancellation_reason",
            "priority",
            "description",
            "sample_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    @extend_schema_field(serializers.CharField())
    def get_client_name(self, obj):
        return obj.client.get_full_name() or obj.client.username

    @extend_schema_field(serializers.IntegerField())
    def get_sample_count(self, obj):
        # Prefer annotated value from JobOrderViewSet queryset (single query, no N+1).
        ac = getattr(obj, "sample_count", None)
        if ac is not None:
            return ac
        return obj.samples.count()


class ClientSelfServiceSampleSerializer(serializers.Serializer):
    """One physical sample line on a client self-service job request (pre-intake)."""

    sample_name = serializers.CharField(max_length=200, trim_whitespace=True)
    notes = serializers.CharField(
        max_length=4000, required=False, allow_blank=True, default=""
    )
    packaging_type = serializers.CharField(
        max_length=100, required=False, allow_blank=True, default=""
    )
    sample_weight = serializers.DecimalField(
        max_digits=10, decimal_places=3, required=False, allow_null=True
    )
    collection_date = serializers.DateField(required=False, allow_null=True)


class JobOrderCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new job orders (Receptionist only).
    Auto-sets `submitted_by` to the current user.
    ``client`` is the external user's email (case-insensitive) or legacy UUID.
    """

    client = UserIdentityField()

    class Meta:
        model = JobOrder
        fields = [
            "id",
            "client",
            "submitted_by",
            "current_status",
            "priority",
            "description",
        ]
        read_only_fields = ["id", "submitted_by"]

    def validate_client(self, value):
        """Ensure the client is an external user."""
        if value.user_type != "external":
            raise serializers.ValidationError(
                "Job orders can only be created for external (client) users."
            )
        if not value.is_active:
            raise serializers.ValidationError(
                "Cannot create a job order for a deactivated user."
            )
        return value

    def validate_current_status(self, value):
        """
        Sprint 2 job intake starts in the received state.
        Reject attempts to create jobs directly in downstream workflow states.
        """
        if value != JobOrder.Status.RECEIVED:
            raise serializers.ValidationError(
                "New job orders must start in the 'received' state."
            )
        return value

    def create(self, validated_data):
        """Auto-set submitted_by to the authenticated user."""
        validated_data["submitted_by"] = self.context["request"].user
        return super().create(validated_data)


class JobOrderClientSelfCreateSerializer(serializers.ModelSerializer):
    """
    External clients create a job request for themselves.
    Sets client and submitted_by to the current user and starts in
    ``pending_finance`` until finance approves (``received`` = laboratory intake).
    Optional ``samples`` pre-registers sample rows (received_by empty until intake).
    """

    description = serializers.CharField(
        required=True,
        min_length=10,
        max_length=16000,
        trim_whitespace=True,
    )
    samples = ClientSelfServiceSampleSerializer(
        many=True,
        required=False,
        allow_empty=True,
    )

    class Meta:
        model = JobOrder
        fields = ["id", "priority", "description", "samples"]
        read_only_fields = ["id"]

    def validate_samples(self, value):
        if value is None:
            return value
        if len(value) > 50:
            raise serializers.ValidationError(
                "A maximum of 50 samples per request is allowed."
            )
        return value

    def create(self, validated_data):
        request = self.context["request"]
        user = request.user
        samples_data = validated_data.pop("samples", None) or []
        try:
            with transaction.atomic():
                job = JobOrder.objects.create(
                    client=user,
                    submitted_by=user,
                    current_status=JobOrder.Status.PENDING_FINANCE,
                    **validated_data,
                )
                for row in samples_data:
                    Sample.objects.create(
                        job=job,
                        sample_name=row["sample_name"],
                        notes=row.get("notes") or "",
                        packaging_type=row.get("packaging_type") or "",
                        sample_weight=row.get("sample_weight"),
                        collection_date=row.get("collection_date"),
                        submitted_by=user,
                        received_by=None,
                    )
        except IntegrityError as exc:
            # Most common: DB not migrated — samples.received_by still NOT NULL while client intake sends null.
            raise serializers.ValidationError(
                {
                    "samples": (
                        "Could not save sample rows. Run database migrations "
                        "(laboratory 0006_sample_received_by_optional_client_intake) "
                        "so client-requested samples may omit received_by until lab intake."
                    )
                }
            ) from exc
        return job


# ---------------------------------------------------------------------------
# Sample Serializers — The Blind Analysis Protocol Split
# ---------------------------------------------------------------------------
class SampleSerializer(serializers.ModelSerializer):
    """
    Full Sample serializer for Admin/Receptionist.
    Exposes ALL fields including client identity, sample name, and job details.
    User FKs serialize as email addresses.
    """

    blind_alias_code = serializers.CharField(
        source="blind_alias.code", read_only=True
    )
    job_status = serializers.CharField(
        source="job.current_status", read_only=True
    )
    received_by = UserIdentityField(read_only=True, allow_null=True)
    submitted_by = UserIdentityField(read_only=True)
    assigned_analyst = UserIdentityField(read_only=True, allow_null=True)
    sample_tests = SampleTestSerializer(many=True, read_only=True)

    class Meta:
        model = Sample
        fields = [
            "id",
            "job",
            "job_status",
            "blind_alias",
            "blind_alias_code",
            "sample_code",
            "sample_name",
            "sample_weight",
            "packaging_type",
            "collection_date",
            "received_by",
            "submitted_by",
            "assigned_analyst",
            "assigned_at",
            "reassigned_reason",
            "status_sync_with_job",
            "sample_status",
            "notes",
            "sample_tests",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "blind_alias",
            "sample_code",
            "created_at",
            "updated_at",
        ]


class SampleCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new samples (Receptionist only).
    blind_alias and sample_code are auto-generated in model.save().
    Returns auto-generated fields in the response for confirmation.
    """

    blind_alias_code = serializers.CharField(
        source="blind_alias.code", read_only=True
    )
    submitted_by = UserIdentityField()
    assigned_analyst = UserIdentityField(required=False, allow_null=True)

    class Meta:
        model = Sample
        fields = [
            "id",
            "job",
            "blind_alias_code",
            "sample_code",
            "sample_name",
            "sample_weight",
            "packaging_type",
            "collection_date",
            "received_by",
            "submitted_by",
            "assigned_analyst",
            "status_sync_with_job",
            "sample_status",
            "notes",
        ]
        read_only_fields = ["id", "blind_alias_code", "sample_code", "received_by"]

    def validate(self, attrs):
        """Keep intake ownership and analyst assignment consistent."""
        attrs = super().validate(attrs)
        job = attrs.get("job")
        submitted_by = attrs.get("submitted_by")
        assigned_analyst = attrs.get("assigned_analyst")

        if submitted_by.user_type != "external":
            raise serializers.ValidationError(
                {"submitted_by": "Samples must be submitted by an external client."}
            )
        if not submitted_by.is_active:
            raise serializers.ValidationError(
                {"submitted_by": "Cannot register a sample for a deactivated client."}
            )
        if job and submitted_by != job.client:
            raise serializers.ValidationError(
                {
                    "submitted_by": (
                        "submitted_by must match the client on the selected job order."
                    )
                }
            )

        try:
            _validate_assigned_analyst(assigned_analyst)
        except serializers.ValidationError as exc:
            raise serializers.ValidationError({"assigned_analyst": exc.detail}) from exc
        return attrs

    def create(self, validated_data):
        """Auto-set received_by to the authenticated user (receptionist)."""
        validated_data["received_by"] = self.context["request"].user
        return super().create(validated_data)


class SampleUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating existing samples (PATCH/PUT).
    Excludes auto-generated fields and read-only identity fields.
    Only exposes mutable fields that Admin/Receptionist can change.
    """

    assigned_analyst = UserIdentityField(required=False, allow_null=True)

    class Meta:
        model = Sample
        fields = [
            "sample_name",
            "sample_weight",
            "packaging_type",
            "collection_date",
            "assigned_analyst",
            "assigned_at",
            "reassigned_reason",
            "status_sync_with_job",
            "sample_status",
            "notes",
        ]

    def validate_assigned_analyst(self, value):
        return _validate_assigned_analyst(value)

    def validate(self, attrs):
        instance = self.instance
        sync_after = attrs.get(
            "status_sync_with_job",
            getattr(instance, "status_sync_with_job", True),
        )
        if sync_after and "sample_status" in attrs:
            raise serializers.ValidationError(
                {
                    "sample_status": (
                        "While 'sync with job' is enabled, sample status follows the job. "
                        "Set status_sync_with_job to false to pick a status manually."
                    )
                }
            )
        return attrs

    def update(self, instance, validated_data):
        new_sync = validated_data.get(
            "status_sync_with_job", instance.status_sync_with_job
        )
        if new_sync:
            validated_data["sample_status"] = instance.job.current_status
        return super().update(instance, validated_data)


def _validate_assigned_analyst(value):
    """Ensure assignments only target active users with the analyst role."""
    if value is None:
        return value

    if not value.is_active:
        raise serializers.ValidationError("Assigned analyst must be active.")

    if value.user_type != "internal" or getattr(value, "role_name", None) != "analyst":
        raise serializers.ValidationError(
            "assigned_analyst must be an internal user with the analyst role."
        )

    return value


class SampleAnalystSerializer(serializers.ModelSerializer):
    """
    BLIND serializer for Lab Analysts.
    Exposes the blind alias identifier, readable blind code, and technical metadata.
    HIDES: client identity, sample name, job client, submitted_by.
    This enforces the anti-corruption "Blind Analysis" protocol.
    """

    blind_alias_id = serializers.UUIDField(read_only=True)
    blind_alias_code = serializers.CharField(
        source="blind_alias.code", read_only=True
    )
    sample_tests = SampleTestSerializer(many=True, read_only=True)

    class Meta:
        model = Sample
        fields = [
            "id",
            "blind_alias_id",
            "blind_alias_code",
            "sample_weight",
            "packaging_type",
            "collection_date",
            "status_sync_with_job",
            "sample_status",
            "assigned_at",
            "sample_tests",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields
