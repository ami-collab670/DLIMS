"""
LSIMS Laboratory — DRF Serializers
Sprint 2: Core Engine (Jobs, Samples & Blind Aliasing)

Two Sample serializer variants enforce the blind analysis protocol:
- SampleSerializer: full detail for Admin/Receptionist (shows client info)
- SampleAnalystSerializer: blind-only for Analysts (hides all client/sample identity)
"""

from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import FinancialRecord, TestCatalog, JobOrder, BlindCode, Sample, SampleTest


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
            "department",
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
# FinancialRecord Serializers
# ---------------------------------------------------------------------------
class FinancialRecordSerializer(serializers.ModelSerializer):
    """Serializer for job-level payment records that gate permanent coding."""

    job_client_email = serializers.EmailField(source="job.client.email", read_only=True)
    job_status = serializers.CharField(source="job.current_status", read_only=True)

    class Meta:
        model = FinancialRecord
        fields = [
            "invoice_no",
            "job",
            "job_client_email",
            "job_status",
            "amount_expected",
            "amount_paid",
            "payment_status",
            "paid_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["invoice_no", "paid_at", "created_at", "updated_at"]

    def validate(self, attrs):
        amount_expected = attrs.get(
            "amount_expected",
            self.instance.amount_expected if self.instance else None,
        )
        amount_paid = attrs.get(
            "amount_paid",
            self.instance.amount_paid if self.instance else None,
        )

        if amount_expected is not None and amount_expected < 0:
            raise serializers.ValidationError(
                {"amount_expected": "Amount expected cannot be negative."}
            )
        if amount_paid is not None and amount_paid < 0:
            raise serializers.ValidationError(
                {"amount_paid": "Amount paid cannot be negative."}
            )
        return attrs


# ---------------------------------------------------------------------------
# JobOrder Serializers
# ---------------------------------------------------------------------------
class JobOrderSerializer(serializers.ModelSerializer):
    """
    Full JobOrder serializer for Admin/Receptionist views.
    Shows client details, sample count, and status information.
    """

    client_email = serializers.EmailField(source="client.email", read_only=True)
    client_name = serializers.SerializerMethodField(read_only=True)
    submitted_by_email = serializers.EmailField(
        source="submitted_by.email", read_only=True
    )
    sample_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = JobOrder
        fields = [
            "id",
            "client",
            "client_email",
            "client_name",
            "submitted_by",
            "submitted_by_email",
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
        return obj.samples.count()


class JobOrderCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new job orders (Receptionist only).
    Auto-sets `submitted_by` to the current user.
    Returns submitted_by in the response for confirmation.
    """

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
        Sprint 3 intake starts in the payment-pending state.
        Reject attempts to create jobs directly in downstream workflow states.
        """
        if value != JobOrder.Status.PAYMENT_PENDING:
            raise serializers.ValidationError(
                "New job orders must start in the 'payment_pending' state."
            )
        return value

    def create(self, validated_data):
        """Auto-set submitted_by to the authenticated user."""
        validated_data["submitted_by"] = self.context["request"].user
        return super().create(validated_data)


# ---------------------------------------------------------------------------
# Sample Serializers — The Blind Analysis Protocol Split
# ---------------------------------------------------------------------------
class SampleSerializer(serializers.ModelSerializer):
    """
    Full Sample serializer for Admin/Receptionist.
    Exposes ALL fields including client identity, sample name, and job details.
    """

    blind_alias_code = serializers.SerializerMethodField(read_only=True)
    job_status = serializers.CharField(
        source="job.current_status", read_only=True
    )
    received_by_email = serializers.EmailField(
        source="received_by.email", read_only=True
    )
    submitted_by_email = serializers.EmailField(
        source="submitted_by.email", read_only=True
    )
    assigned_analyst_email = serializers.EmailField(
        source="assigned_analyst.email", read_only=True, default=None
    )
    sample_tests = serializers.SerializerMethodField(read_only=True)

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
            "received_by_email",
            "submitted_by",
            "submitted_by_email",
            "assigned_analyst",
            "assigned_analyst_email",
            "assigned_at",
            "reassigned_reason",
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

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_blind_alias_code(self, obj):
        return obj.blind_alias.code if obj.blind_alias_id else None

    @extend_schema_field(SampleTestSerializer(many=True))
    def get_sample_tests(self, obj):
        sample_tests = _visible_sample_tests_for_request(obj, self.context.get("request"))
        return SampleTestSerializer(
            sample_tests,
            many=True,
            context=self.context,
        ).data


class SampleCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new samples (Receptionist only).
    blind_alias and sample_code are payment-gated and remain empty until
    finance confirms payment for the parent job.
    """

    blind_alias_code = serializers.SerializerMethodField(read_only=True)

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

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_blind_alias_code(self, obj):
        return obj.blind_alias.code if obj.blind_alias_id else None


class SampleUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating existing samples (PATCH/PUT).
    Excludes auto-generated fields and read-only identity fields.
    Only exposes mutable fields that Admin/Receptionist can change.
    """

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
            "sample_status",
            "notes",
        ]

    def validate_assigned_analyst(self, value):
        return _validate_assigned_analyst(value)


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
    blind_alias_code = serializers.SerializerMethodField(read_only=True)
    sample_tests = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Sample
        fields = [
            "id",
            "blind_alias_id",
            "blind_alias_code",
            "sample_weight",
            "packaging_type",
            "collection_date",
            "sample_status",
            "assigned_at",
            "sample_tests",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_blind_alias_code(self, obj):
        return obj.blind_alias.code if obj.blind_alias_id else None

    @extend_schema_field(SampleTestSerializer(many=True))
    def get_sample_tests(self, obj):
        sample_tests = _visible_sample_tests_for_request(obj, self.context.get("request"))
        return SampleTestSerializer(
            sample_tests,
            many=True,
            context=self.context,
        ).data


def _visible_sample_tests_for_request(sample, request):
    """Prevent department-scoped staff from seeing other departments' tests."""
    sample_tests = sample.sample_tests.select_related("test", "test__department")
    if request is None or not request.user.is_authenticated:
        return sample_tests.all()

    user = request.user
    role_name = getattr(user, "role_name", None)
    if role_name not in {"analyst", "qc_manager"}:
        return sample_tests.all()

    department_id = getattr(user, "department_id", None)
    if department_id is None:
        return sample_tests.none()
    return sample_tests.filter(test__department_id=department_id)
