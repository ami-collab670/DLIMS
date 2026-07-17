"""
LSIMS Laboratory — DRF Serializers
Sprint 2: Core Engine (Jobs, Samples & Blind Aliasing)

Two Sample serializer variants enforce the blind analysis protocol:
- SampleSerializer: full detail for Admin/Receptionist (shows client info)
- SampleAnalystSerializer: blind-only for Analysts (hides all client/sample identity)
"""

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import (
    FinancialRecord,
    TestCatalog,
    JobOrder,
    AnalysisResult,
    BlindCode,
    CalibrationRecord,
    ComplaintRecord,
    DiscountApproval,
    PreparationRecord,
    QCDecision,
    Sample,
    SampleTest,
)
from .policies import sample_tests_for_sample_visible_to

User = get_user_model()


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
        read_only_fields = [
            "id",
            "submitted_by",
            "current_status",
            "status_reason",
            "blocked_by_role",
            "is_cancelled",
            "cancellation_reason",
            "created_at",
            "updated_at",
        ]


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
            "payment_required",
            "waiver_reason",
            "waiver_approved_by",
            "waiver_approved_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "invoice_no",
            "paid_at",
            "payment_required",
            "waiver_reason",
            "waiver_approved_by",
            "waiver_approved_at",
            "created_at",
            "updated_at",
        ]

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
        read_only_fields = [
            "id",
            "submitted_by",
            "current_status",
            "status_reason",
            "blocked_by_role",
            "is_cancelled",
            "cancellation_reason",
            "created_at",
            "updated_at",
        ]

    @extend_schema_field(serializers.CharField())
    def get_client_name(self, obj):
        return obj.client.get_full_name() or obj.client.username

    @extend_schema_field(serializers.IntegerField())
    def get_sample_count(self, obj):
        return obj.samples.count()


# edited by kiya
class ClientJobSampleIntakeSerializer(serializers.Serializer):
    """Nested sample row for client self-service job requests (pre-intake)."""

    sample_name = serializers.CharField(max_length=200)
    notes = serializers.CharField(required=False, default="", allow_blank=True)
    packaging_type = serializers.CharField(
        required=False, default="", allow_blank=True, max_length=100
    )
    sample_weight = serializers.DecimalField(
        max_digits=10, decimal_places=3, required=False, allow_null=True
    )
    collection_date = serializers.DateField(required=False, allow_null=True)


# edited by kiya
class ClientJobOrderCreateSerializer(serializers.Serializer):
    """
    Serializer for external client self-service job requests.
    Auto-sets client/submitted_by to the authenticated user and pending_finance status.
    """

    description = serializers.CharField()
    priority = serializers.ChoiceField(choices=JobOrder.Priority.choices)
    samples = ClientJobSampleIntakeSerializer(many=True, required=False)

    def validate(self, attrs):
        if "client" in self.initial_data:
            raise serializers.ValidationError(
                {
                    "client": (
                        "Self-service clients cannot use receptionist intake fields."
                    )
                }
            )
        return attrs

    def create(self, validated_data):
        samples_data = validated_data.pop("samples", [])
        user = self.context["request"].user
        job = JobOrder.objects.create(
            client=user,
            submitted_by=user,
            current_status=JobOrder.Status.PENDING_FINANCE,
            priority=validated_data["priority"],
            description=validated_data.get("description", ""),
        )
        for sample_data in samples_data:
            Sample.objects.create(
                job=job,
                sample_name=sample_data["sample_name"],
                notes=sample_data.get("notes", ""),
                packaging_type=sample_data.get("packaging_type", ""),
                sample_weight=sample_data.get("sample_weight"),
                collection_date=sample_data.get("collection_date"),
                submitted_by=user,
                received_by=None,
                sample_status=JobOrder.Status.PENDING_FINANCE,
            )
        return job


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
        if value != JobOrder.Status.PENDING_FINANCE:
            raise serializers.ValidationError(
                "New job orders must start in the 'pending_finance' state."
            )
        return value

    # edited by kiya
    def create(self, validated_data):
        """Auto-set submitted_by and default intake status for receptionist intake."""
        validated_data["submitted_by"] = self.context["request"].user
        validated_data.setdefault(
            "current_status", JobOrder.Status.PENDING_FINANCE
        )
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
        read_only_fields = [
            "id",
            "blind_alias_code",
            "sample_code",
            "received_by",
            "sample_status",
        ]

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
            "notes",
        ]


class SampleAssignAnalystSerializer(serializers.ModelSerializer):
    """Department Manager/Admin assignment endpoint for distributing work."""

    assigned_analyst = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(is_active=True)
    )

    class Meta:
        model = Sample
        fields = ["assigned_analyst", "assigned_at", "reassigned_reason"]
        read_only_fields = ["assigned_at"]

    def validate_assigned_analyst(self, value):
        return _validate_assigned_analyst(value)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        request = self.context.get("request")
        user = request.user if request else None
        analyst = attrs["assigned_analyst"]

        if getattr(user, "role_name", None) == "qc_manager":
            department_id = getattr(user, "department_id", None)
            if department_id is None:
                raise serializers.ValidationError(
                    {"assigned_analyst": "Department Manager must have a department."}
                )
            if analyst.department_id != department_id:
                raise serializers.ValidationError(
                    {
                        "assigned_analyst": (
                            "Assigned analyst must belong to the manager's department."
                        )
                    }
                )
            if not self.instance.sample_tests.filter(
                test__department_id=department_id
            ).exists():
                raise serializers.ValidationError(
                    {"assigned_analyst": "Sample is not in the manager's department."}
                )
        return attrs

    def update(self, instance, validated_data):
        instance.assigned_analyst = validated_data["assigned_analyst"]
        instance.assigned_at = timezone.now()
        if "reassigned_reason" in validated_data:
            instance.reassigned_reason = validated_data["reassigned_reason"]
        instance.save(
            update_fields=[
                "assigned_analyst",
                "assigned_at",
                "reassigned_reason",
                "updated_at",
            ]
        )
        return instance


class PreparationRecordSerializer(serializers.ModelSerializer):
    """Preparation workflow record for paid/coded samples."""

    sample_code = serializers.CharField(source="sample.sample_code", read_only=True)
    sample_name = serializers.CharField(source="sample.sample_name", read_only=True)
    job = serializers.UUIDField(source="sample.job_id", read_only=True)
    job_status = serializers.CharField(source="sample.job.current_status", read_only=True)
    technician_email = serializers.EmailField(source="technician.email", read_only=True)
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True)

    class Meta:
        model = PreparationRecord
        fields = [
            "id",
            "sample",
            "sample_code",
            "sample_name",
            "job",
            "job_status",
            "reference_code",
            "technician",
            "technician_email",
            "status",
            "preparation_data",
            "notes",
            "started_at",
            "completed_at",
            "created_by",
            "created_by_email",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "sample_code",
            "sample_name",
            "job",
            "job_status",
            "reference_code",
            "status",
            "started_at",
            "completed_at",
            "created_by",
            "created_at",
            "updated_at",
        ]

    def validate_sample(self, value):
        if value.sample_code is None or value.blind_alias_id is None:
            raise serializers.ValidationError(
                "Only paid and permanently coded samples can enter preparation."
            )
        if not value.sample_tests.exists():
            raise serializers.ValidationError(
                "Sample must have at least one assigned test before preparation."
            )
        return value

    def validate_technician(self, value):
        if value is None:
            return value
        if not value.is_active:
            raise serializers.ValidationError("Technician must be active.")
        if value.user_type != "internal" or getattr(value, "role_name", None) != "lab_technician":
            raise serializers.ValidationError(
                "technician must be an internal user with the Lab Technician role."
            )
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if self.instance is not None and "sample" in attrs:
            raise serializers.ValidationError(
                {"sample": "Preparation sample cannot be changed."}
            )

        sample = attrs.get("sample", self.instance.sample if self.instance else None)
        technician = attrs.get(
            "technician",
            self.instance.technician if self.instance else None,
        )
        request = self.context.get("request")
        user = request.user if request else None

        if sample is not None and user is not None:
            _validate_sample_department_scope(sample, user)
        if sample is not None and technician is not None:
            _validate_technician_department_scope(sample, technician)
        return attrs


class PreparationCompleteSerializer(serializers.Serializer):
    """Payload for completing preparation work."""

    preparation_data = serializers.JSONField(required=False)
    notes = serializers.CharField(required=False, allow_blank=True)


class AnalysisResultSerializer(serializers.ModelSerializer):
    """Analysis result draft/submission record for a sample test."""

    sample = serializers.UUIDField(source="sample_test.sample_id", read_only=True)
    sample_code = serializers.CharField(
        source="sample_test.sample.sample_code",
        read_only=True,
    )
    test = serializers.UUIDField(source="sample_test.test_id", read_only=True)
    test_name = serializers.CharField(source="sample_test.test.test_name", read_only=True)
    test_code = serializers.CharField(source="sample_test.test.test_code", read_only=True)
    analyst_email = serializers.EmailField(source="analyst.email", read_only=True)

    class Meta:
        model = AnalysisResult
        fields = [
            "id",
            "sample_test",
            "sample",
            "sample_code",
            "test",
            "test_name",
            "test_code",
            "analyst",
            "analyst_email",
            "state",
            "value",
            "unit",
            "method",
            "remarks",
            "revision",
            "submitted_at",
            "approved_at",
            "rejected_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "sample",
            "sample_code",
            "test",
            "test_name",
            "test_code",
            "analyst",
            "state",
            "revision",
            "submitted_at",
            "approved_at",
            "rejected_at",
            "created_at",
            "updated_at",
        ]

    def validate_sample_test(self, value):
        sample = value.sample
        if sample.sample_status not in {
            Sample.SampleStatus.IN_ANALYSIS,
        }:
            raise serializers.ValidationError(
                "Sample must complete preparation before result entry."
            )
        try:
            preparation_record = sample.preparation_record
        except PreparationRecord.DoesNotExist as exc:
            raise serializers.ValidationError(
                "Sample must have a completed preparation record."
            ) from exc
        if preparation_record.status != PreparationRecord.Status.COMPLETED:
            raise serializers.ValidationError(
                "Sample preparation must be completed before result entry."
            )
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        request = self.context.get("request")
        user = request.user if request else None

        if self.instance is not None and "sample_test" in attrs:
            raise serializers.ValidationError(
                {"sample_test": "Analysis result assignment cannot be changed."}
            )

        if self.instance is not None and self.instance.state in {
            AnalysisResult.State.SUBMITTED,
            AnalysisResult.State.APPROVED,
        }:
            raise serializers.ValidationError(
                {"state": "Submitted or approved results cannot be edited."}
            )

        sample_test = attrs.get(
            "sample_test",
            self.instance.sample_test if self.instance else None,
        )
        if sample_test is not None and user is not None:
            _validate_analysis_assignment_scope(sample_test, user)
        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        if request and getattr(request.user, "role_name", None) == "analyst":
            validated_data["analyst"] = request.user
        return super().create(validated_data)


class CalibrationRecordSerializer(serializers.ModelSerializer):
    """Calibration data linked to an analysis result."""

    recorded_by_email = serializers.EmailField(source="recorded_by.email", read_only=True)

    class Meta:
        model = CalibrationRecord
        fields = [
            "id",
            "analysis_result",
            "instrument_name",
            "calibration_reference",
            "calibration_date",
            "calibration_data",
            "notes",
            "recorded_by",
            "recorded_by_email",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "recorded_by",
            "created_at",
            "updated_at",
        ]

    def validate_analysis_result(self, value):
        if value.state not in {AnalysisResult.State.DRAFT, AnalysisResult.State.REJECTED}:
            raise serializers.ValidationError(
                "Calibration can only be added to draft or rejected results."
            )
        request = self.context.get("request")
        user = request.user if request else None
        if user is not None:
            _validate_analysis_result_scope(value, user)
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if self.instance is not None and "analysis_result" in attrs:
            raise serializers.ValidationError(
                {"analysis_result": "Calibration result link cannot be changed."}
            )

        analysis_result = attrs.get(
            "analysis_result",
            self.instance.analysis_result if self.instance else None,
        )
        if analysis_result and analysis_result.state not in {
            AnalysisResult.State.DRAFT,
            AnalysisResult.State.REJECTED,
        }:
            raise serializers.ValidationError(
                {
                    "analysis_result": (
                        "Calibration can only be edited while the result is draft "
                        "or rejected."
                    )
                }
            )
        request = self.context.get("request")
        user = request.user if request else None
        if analysis_result is not None and user is not None:
            _validate_analysis_result_scope(analysis_result, user)
        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            validated_data["recorded_by"] = request.user
        return super().create(validated_data)


class QCDecisionSerializer(serializers.ModelSerializer):
    """Read-only QC decision history."""

    decided_by_email = serializers.EmailField(source="decided_by.email", read_only=True)

    class Meta:
        model = QCDecision
        fields = [
            "id",
            "analysis_result",
            "decision",
            "reason",
            "decided_by",
            "decided_by_email",
            "decided_at",
        ]
        read_only_fields = fields


class QCReviewSerializer(serializers.Serializer):
    """Payload for QC approve/reject actions."""

    reason = serializers.CharField(required=False, allow_blank=True)


class ResultSummarySerializer(serializers.Serializer):
    """Compiled result summary for a job."""

    job = serializers.UUIDField()
    job_status = serializers.CharField()
    total_tests = serializers.IntegerField()
    draft = serializers.IntegerField()
    submitted = serializers.IntegerField()
    rejected = serializers.IntegerField()
    approved = serializers.IntegerField()
    results = AnalysisResultSerializer(many=True)


class ComplaintRecordSerializer(serializers.ModelSerializer):
    """Complaint/dispute record for jobs, samples, payments, or results."""

    client_email = serializers.EmailField(source="client.email", read_only=True)
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True)
    resolved_by_email = serializers.EmailField(source="resolved_by.email", read_only=True)

    class Meta:
        model = ComplaintRecord
        fields = [
            "id",
            "client",
            "client_email",
            "job",
            "sample",
            "category",
            "description",
            "status",
            "resolution",
            "created_by",
            "created_by_email",
            "resolved_by",
            "resolved_by_email",
            "resolved_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "resolution",
            "created_by",
            "resolved_by",
            "resolved_at",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {"client": {"required": False}}

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if self.instance is not None:
            immutable_fields = {"client", "job", "sample"}
            changed_fields = immutable_fields.intersection(attrs)
            if changed_fields:
                raise serializers.ValidationError(
                    {
                        field: "Complaint ownership fields cannot be changed."
                        for field in changed_fields
                    }
                )

        request = self.context.get("request")
        user = request.user if request else None
        client = attrs.get("client", self.instance.client if self.instance else None)
        job = attrs.get("job", self.instance.job if self.instance else None)
        sample = attrs.get("sample", self.instance.sample if self.instance else None)

        if user is not None and getattr(user, "user_type", None) == "external":
            client = user
            attrs["client"] = user

        if client is not None and getattr(client, "user_type", None) != "external":
            raise serializers.ValidationError(
                {"client": "Complaints must be associated with an external client."}
            )
        if job is not None and client is not None and job.client_id != client.id:
            raise serializers.ValidationError(
                {"job": "Job must belong to the complaint client."}
            )
        if sample is not None:
            if client is not None and sample.job.client_id != client.id:
                raise serializers.ValidationError(
                    {"sample": "Sample must belong to the complaint client."}
                )
            if job is not None and sample.job_id != job.id:
                raise serializers.ValidationError(
                    {"sample": "Sample must belong to the selected job."}
                )
        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            validated_data["created_by"] = request.user
            if getattr(request.user, "user_type", None) == "external":
                validated_data["client"] = request.user
        return super().create(validated_data)


class ComplaintResolveSerializer(serializers.Serializer):
    """Payload for resolving or rejecting a complaint."""

    resolution = serializers.CharField()


class DiscountApprovalSerializer(serializers.ModelSerializer):
    """Director discount/free-test approval request."""

    requested_by_email = serializers.EmailField(source="requested_by.email", read_only=True)
    reviewed_by_email = serializers.EmailField(source="reviewed_by.email", read_only=True)
    job_client_email = serializers.EmailField(source="job.client.email", read_only=True)

    class Meta:
        model = DiscountApproval
        fields = [
            "id",
            "job",
            "job_client_email",
            "discount_type",
            "percentage",
            "amount",
            "reason",
            "status",
            "requested_by",
            "requested_by_email",
            "reviewed_by",
            "reviewed_by_email",
            "reviewed_at",
            "review_note",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "requested_by",
            "reviewed_by",
            "reviewed_at",
            "review_note",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if self.instance is not None:
            immutable_fields = {"job", "discount_type", "percentage", "amount"}
            changed_fields = immutable_fields.intersection(attrs)
            if changed_fields:
                raise serializers.ValidationError(
                    {
                        field: "Discount approval request fields cannot be changed."
                        for field in changed_fields
                    }
                )

        discount_type = attrs.get(
            "discount_type",
            self.instance.discount_type if self.instance else None,
        )
        percentage = attrs.get(
            "percentage",
            self.instance.percentage if self.instance else None,
        )
        amount = attrs.get("amount", self.instance.amount if self.instance else None)

        if discount_type == DiscountApproval.DiscountType.PERCENTAGE:
            if percentage is None or percentage <= 0 or percentage > 100:
                raise serializers.ValidationError(
                    {"percentage": "Percentage discounts must be between 0 and 100."}
                )
        if discount_type == DiscountApproval.DiscountType.FIXED_AMOUNT:
            if amount is None or amount <= 0:
                raise serializers.ValidationError(
                    {"amount": "Fixed amount discounts must be greater than zero."}
                )
        if discount_type == DiscountApproval.DiscountType.FREE_TEST:
            attrs["percentage"] = None
            attrs["amount"] = None
        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            validated_data["requested_by"] = request.user
        return super().create(validated_data)


class ApprovalReviewSerializer(serializers.Serializer):
    """Payload for approving or rejecting discount/free-test requests."""

    review_note = serializers.CharField(required=False, allow_blank=True)


class PriorityAlertSerializer(serializers.Serializer):
    """Computed priority/workload alert row."""

    job = serializers.UUIDField()
    priority = serializers.CharField()
    current_status = serializers.CharField()
    age_days = serializers.IntegerField()
    sample_count = serializers.IntegerField()
    reason = serializers.CharField()


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


def _sample_department_ids(sample):
    return set(
        sample.sample_tests.filter(test__department_id__isnull=False).values_list(
            "test__department_id",
            flat=True,
        )
    )


def _validate_sample_department_scope(sample, user):
    role_name = getattr(user, "role_name", None)
    if user.is_superuser or role_name in {"admin", "receptionist"}:
        return
    if role_name in {"lab_technician", "qc_manager"}:
        department_id = getattr(user, "department_id", None)
        if department_id is None or department_id not in _sample_department_ids(sample):
            raise serializers.ValidationError(
                {"sample": "Sample is not in the user's department."}
            )


def _validate_technician_department_scope(sample, technician):
    department_id = getattr(technician, "department_id", None)
    if department_id is None or department_id not in _sample_department_ids(sample):
        raise serializers.ValidationError(
            {"technician": "Technician must belong to the sample's department."}
        )


def _validate_analysis_assignment_scope(sample_test, user):
    role_name = getattr(user, "role_name", None)
    if user.is_superuser or role_name == "admin":
        return
    if role_name != "analyst":
        raise serializers.ValidationError(
            {"sample_test": "Only assigned analysts can draft analysis results."}
        )
    sample = sample_test.sample
    if sample.assigned_analyst_id != user.id:
        raise serializers.ValidationError(
            {"sample_test": "Analyst must be assigned to this sample."}
        )
    if sample_test.test.department_id != getattr(user, "department_id", None):
        raise serializers.ValidationError(
            {"sample_test": "Sample test is not in the analyst's department."}
        )


def _validate_analysis_result_scope(analysis_result, user):
    role_name = getattr(user, "role_name", None)
    if user.is_superuser or role_name == "admin":
        return
    if role_name != "analyst":
        raise serializers.ValidationError(
            {"analysis_result": "Only the assigned analyst can modify calibration data."}
        )
    if analysis_result.analyst_id != user.id:
        raise serializers.ValidationError(
            {"analysis_result": "Analyst must own this analysis result."}
        )


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
    if request is None or not request.user.is_authenticated:
        return sample.sample_tests.select_related("test", "test__department").all()
    return sample_tests_for_sample_visible_to(sample, request.user)
