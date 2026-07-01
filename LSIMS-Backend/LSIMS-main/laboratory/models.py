"""
LSIMS Laboratory — Models
Sprint 2: Core Engine (Jobs, Samples & Blind Aliasing)

Implements TestCatalog, JobOrder, BlindCode, Sample, and SampleTest models
per the LSIMS Inception Document (Sections 4.2, 4.3) and Sprint 2 blueprint.
"""

import uuid
import random
import string
from decimal import Decimal

from django.conf import settings
from django.db import IntegrityError, models, transaction
from django.utils import timezone


# ---------------------------------------------------------------------------
# TestCatalog — Master list of available analysis tests with pricing
# Inception Document Req #8-9: "The system shall maintain test catalogs"
# ---------------------------------------------------------------------------
class TestCatalog(models.Model):
    """
    Master catalog of laboratory analysis tests available for selection.
    Each test has a unique code, description, measurement unit, and price.
    Admin-managed; read-only for all other roles.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    test_name = models.CharField(
        max_length=200,
        unique=True,
        help_text="Full name of the analysis test (e.g., 'Gold Fire Assay').",
    )
    test_code = models.CharField(
        max_length=20,
        unique=True,
        help_text="Short identifier code (e.g., 'GFA-01').",
    )
    description = models.TextField(
        blank=True,
        default="",
        help_text="Detailed description of the test procedure and purpose.",
    )
    unit = models.CharField(
        max_length=30,
        help_text="Measurement unit for results (e.g., 'ppm', '%%', 'mg/kg').",
    )
    price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Price per test in ETB.",
    )
    department = models.ForeignKey(
        "accounts.Department",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tests",
        help_text="Department responsible for this test.",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Inactive tests are hidden from selection but preserved for history.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "test_catalog"
        ordering = ["test_code"]
        verbose_name = "Test Catalog Entry"
        verbose_name_plural = "Test Catalog"

    def __str__(self):
        return f"{self.test_code} — {self.test_name}"


# ---------------------------------------------------------------------------
# JobOrder — Tracks a client's submission request through the workflow
# Inception Document Section 4.2: job_orders table
# ---------------------------------------------------------------------------
class JobOrder(models.Model):
    """
    Represents a client's analysis request (job).
    Created by Receptionists upon sample intake.
    Tracks the full lifecycle from draft to completion.
    """

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SUBMITTED = "submitted", "Submitted"
        PENDING_FINANCE = "pending_finance", "Pending finance"
        RECEIVED = "received", "Received"
        IN_PREP = "in_prep", "In Preparation"
        IN_ANALYSIS = "in_analysis", "In Analysis"
        QC = "qc", "Quality Control"
        FINANCE_HOLD = "finance_hold", "Finance Hold"
        COMPLETED = "completed", "Completed"

    class Priority(models.TextChoices):
        NORMAL = "normal", "Normal"
        URGENT = "urgent", "Urgent"
        CRITICAL = "critical", "Critical"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="job_orders_as_client",
        help_text="External client who owns this job.",
    )
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="job_orders_submitted",
        help_text="Receptionist who registered this job.",
    )
    current_status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.RECEIVED,
        help_text="Current workflow stage of the job.",
    )
    status_reason = models.TextField(
        blank=True,
        default="",
        help_text="Explanation of current delay or hold (e.g., 'Waiting for Prep').",
    )
    blocked_by_role = models.ForeignKey(
        "accounts.Role",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="blocking_jobs",
        help_text="Role responsible for the next action on this job.",
    )
    is_cancelled = models.BooleanField(
        default=False,
        help_text="Whether this job has been cancelled.",
    )
    cancellation_reason = models.TextField(
        blank=True,
        default="",
        help_text="Reason for cancellation (required if is_cancelled=True).",
    )
    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.NORMAL,
        help_text="Processing priority level.",
    )
    description = models.TextField(
        blank=True,
        default="",
        help_text="General notes or description for this job order.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "job_orders"
        ordering = ["-created_at"]
        verbose_name = "Job Order"
        verbose_name_plural = "Job Orders"

    def __str__(self):
        return f"JOB-{str(self.id)[:8]} ({self.get_current_status_display()})"


def generate_invoice_no():
    """Generate a readable invoice number for finance records."""
    return f"INV-{timezone.now():%Y%m%d}-{uuid.uuid4().hex[:8].upper()}"


# ---------------------------------------------------------------------------
# BlindCode — Anonymous identifier for anti-corruption blind analysis
# Inception Document Section 4.3 / Section 5B: blind_codes table
# ---------------------------------------------------------------------------
class BlindCode(models.Model):
    """
    System-generated anonymous code used to shield sample identity from analysts.
    Each sample receives a unique BlindCode upon registration.
    Format: BC-XXXXXX (6-character alphanumeric).
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    code = models.CharField(
        max_length=20,
        unique=True,
        help_text="Auto-generated anonymous identifier (e.g., 'BC-A3K9F2').",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "blind_codes"
        ordering = ["-created_at"]

    def __str__(self):
        return self.code

    @staticmethod
    def generate_unique_code():
        """
        Generate a unique BlindCode string with collision prevention.
        Format: BC-XXXXXX (6 uppercase alphanumeric characters).
        Retries up to 10 times if a collision is detected.
        """
        for _ in range(10):
            suffix = "".join(
                random.choices(string.ascii_uppercase + string.digits, k=6)
            )
            code = f"BC-{suffix}"
            if not BlindCode.objects.filter(code=code).exists():
                return code
        raise RuntimeError(
            "Failed to generate a unique BlindCode after 10 attempts. "
            "This is extremely unlikely — check for database issues."
        )


class SampleCodeSequence(models.Model):
    """
    Tracks the latest allocated sample number for each calendar year.
    Keeping this counter in its own row makes sample code allocation atomic
    and safe under concurrent writes.
    """

    year = models.PositiveIntegerField(unique=True)
    last_number = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "sample_code_sequences"
        ordering = ["-year"]

    def __str__(self):
        return f"{self.year}: {self.last_number:04d}"

    @staticmethod
    def _initial_last_number(year):
        """
        Bootstrap a sequence from existing samples when this table is introduced
        into a database that already contains Sprint 2 sample rows.
        """
        prefix = f"SMP-{year}-"
        max_number = 0
        sample_codes = Sample.objects.filter(sample_code__startswith=prefix).values_list(
            "sample_code", flat=True
        )

        for sample_code in sample_codes.iterator():
            try:
                max_number = max(max_number, int(sample_code.rsplit("-", 1)[-1]))
            except (TypeError, ValueError):
                continue

        return max_number

    @classmethod
    def next_code(cls):
        """
        Allocate the next sample code atomically.
        Format: SMP-YYYY-NNNN (e.g., SMP-2026-0001).
        """
        year = timezone.now().year

        while True:
            try:
                with transaction.atomic():
                    sequence = cls.objects.select_for_update().filter(year=year).first()
                    if sequence is None:
                        initial_last_number = cls._initial_last_number(year)
                        try:
                            sequence = cls.objects.create(
                                year=year,
                                last_number=initial_last_number,
                            )
                        except IntegrityError:
                            continue
                        sequence = cls.objects.select_for_update().get(pk=sequence.pk)

                    sequence.last_number += 1
                    sequence.save(update_fields=["last_number", "updated_at"])
                    return f"SMP-{year}-{sequence.last_number:04d}"
            except IntegrityError:
                continue


# ---------------------------------------------------------------------------
# Sample — Physical sample linked to a job and anonymized via BlindCode
# Inception Document Section 4.3: samples table
# ---------------------------------------------------------------------------
class Sample(models.Model):
    """
    Represents a physical sample submitted for analysis.
    Automatically assigned a BlindCode upon creation to enforce
    the blind analysis anti-corruption protocol.

    Workflow stages mirror :class:`JobOrder.Status` so jobs and samples can stay aligned.
    Use ``status_sync_with_job`` (default True) so ``sample_status`` follows the parent job;
    turn it off for per-sample manual workflow control.
    """

    class SampleStatus(models.TextChoices):
        """Aligned with ``JobOrder.Status`` values for a single pipeline vocabulary."""

        DRAFT = "draft", "Draft"
        SUBMITTED = "submitted", "Submitted"
        PENDING_FINANCE = "pending_finance", "Pending finance"
        RECEIVED = "received", "Received"
        IN_PREP = "in_prep", "In Preparation"
        IN_ANALYSIS = "in_analysis", "In Analysis"
        QC = "qc", "Quality Control"
        FINANCE_HOLD = "finance_hold", "Finance Hold"
        COMPLETED = "completed", "Completed"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    job = models.ForeignKey(
        JobOrder,
        on_delete=models.CASCADE,
        related_name="samples",
        help_text="Parent job order this sample belongs to.",
    )
    blind_alias = models.OneToOneField(
        BlindCode,
        on_delete=models.PROTECT,
        related_name="sample",
        null=True,
        blank=True,
        help_text="Auto-assigned anonymous code for blind analysis.",
    )
    sample_code = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        help_text="Human-readable sequential code (e.g., 'SMP-2026-0001').",
    )
    sample_name = models.CharField(
        max_length=200,
        help_text="Descriptive name of the sample (e.g., 'Quartz Ore — Site B').",
    )
    sample_weight = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        null=True,
        blank=True,
        help_text="Weight of the sample in grams.",
    )
    packaging_type = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="Type of packaging (e.g., 'Sealed Bag', 'Plastic Container').",
    )
    collection_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date the sample was collected in the field.",
    )
    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="samples_received",
        null=True,
        blank=True,
        help_text=(
            "Receptionist who physically received this sample at the lab. "
            "Null when the row was created from a client self-service request "
            "before intake (staff may set this at receipt)."
        ),
    )
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="samples_submitted",
        help_text="Client who submitted this sample.",
    )
    assigned_analyst = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_samples",
        help_text="Lab Analyst assigned to work on this sample.",
    )
    assigned_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the analyst was assigned.",
    )
    reassigned_reason = models.TextField(
        blank=True,
        default="",
        help_text="Reason for reassigning to a different analyst.",
    )
    status_sync_with_job = models.BooleanField(
        default=True,
        help_text=(
            "When True, sample_status is kept in sync with the parent job's current_status "
            "(automatic workflow). When False, staff can set sample_status independently."
        ),
    )
    sample_status = models.CharField(
        max_length=20,
        choices=SampleStatus.choices,
        default=SampleStatus.RECEIVED,
        help_text="Current processing status of the sample.",
    )
    notes = models.TextField(
        blank=True,
        default="",
        help_text="Additional notes about the sample.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "samples"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.sample_code or 'PENDING-CODE'} — {self.sample_name}"

    @staticmethod
    def generate_sample_code():
        """
        Generate a sequential human-readable sample code using an atomic
        per-year counter so parallel writes cannot allocate the same value.
        """
        return SampleCodeSequence.next_code()

    def save(self, *args, **kwargs):
        """
        Save without assigning permanent identity until finance clears payment.
        """
        if self._state.adding and self.status_sync_with_job:
            self.sample_status = self.job.current_status

        was_adding = self._state.adding
        result = super().save(*args, **kwargs)

        if was_adding:
            try:
                financial_record = self.job.financial_record
            except FinancialRecord.DoesNotExist:
                financial_record = None
            from .services.workflow import (
                financial_record_clears_payment_gate as _financial_record_clears_payment_gate,
            )

            if (
                financial_record
                and _financial_record_clears_payment_gate(financial_record)
            ):
                self.assign_permanent_identity()

        return result

    def assign_permanent_identity(self):
        """Assign missing permanent codes idempotently after payment confirmation."""
        from .services.workflow import assign_sample_permanent_identity

        return assign_sample_permanent_identity(self)


def code_paid_job_samples(job):
    """Generate missing sample identities for a paid job."""
    from .services.workflow import code_paid_job_samples as service_code_paid_job_samples

    return service_code_paid_job_samples(job)


def generate_preparation_reference():
    """Generate a readable preparation workflow reference."""
    return f"PREP-{timezone.now():%Y%m%d}-{uuid.uuid4().hex[:8].upper()}"


class PreparationRecord(models.Model):
    """Tracks lab technician preparation work for a paid and coded sample."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sample = models.OneToOneField(
        Sample,
        on_delete=models.CASCADE,
        related_name="preparation_record",
        help_text="Paid/coded sample being prepared for analysis.",
    )
    reference_code = models.CharField(
        max_length=32,
        unique=True,
        default=generate_preparation_reference,
        help_text="Internal preparation reference code.",
    )
    technician = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="preparation_records",
        help_text="Lab Technician assigned to preparation.",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    preparation_data = models.JSONField(blank=True, default=dict)
    notes = models.TextField(blank=True, default="")
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="preparation_records_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "preparation_records"
        ordering = ["-created_at"]
        verbose_name = "Preparation Record"
        verbose_name_plural = "Preparation Records"

    def __str__(self):
        return f"{self.reference_code} ({self.get_status_display()})"


class AnalysisResult(models.Model):
    """Analyst-entered result for a requested sample test."""

    class State(models.TextChoices):
        DRAFT = "draft", "Draft"
        SUBMITTED = "submitted", "Submitted for QC"
        REJECTED = "rejected", "Rejected"
        APPROVED = "approved", "Approved"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sample_test = models.OneToOneField(
        "laboratory.SampleTest",
        on_delete=models.CASCADE,
        related_name="analysis_result",
        help_text="Sample test this result satisfies.",
    )
    analyst = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="analysis_results",
        help_text="Analyst responsible for this result.",
    )
    state = models.CharField(
        max_length=20,
        choices=State.choices,
        default=State.DRAFT,
    )
    value = models.TextField(blank=True, default="")
    unit = models.CharField(max_length=50, blank=True, default="")
    method = models.CharField(max_length=200, blank=True, default="")
    remarks = models.TextField(blank=True, default="")
    revision = models.PositiveIntegerField(default=1)
    submitted_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    rejected_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "analysis_results"
        ordering = ["-created_at"]
        verbose_name = "Analysis Result"
        verbose_name_plural = "Analysis Results"

    def __str__(self):
        return f"Result for {self.sample_test}"


class CalibrationRecord(models.Model):
    """Calibration metadata recorded with an analysis result."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    analysis_result = models.ForeignKey(
        AnalysisResult,
        on_delete=models.CASCADE,
        related_name="calibration_records",
    )
    instrument_name = models.CharField(max_length=200)
    calibration_reference = models.CharField(max_length=200, blank=True, default="")
    calibration_date = models.DateField(null=True, blank=True)
    calibration_data = models.JSONField(blank=True, default=dict)
    notes = models.TextField(blank=True, default="")
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="calibration_records",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "calibration_records"
        ordering = ["-created_at"]
        verbose_name = "Calibration Record"
        verbose_name_plural = "Calibration Records"

    def __str__(self):
        return f"{self.instrument_name} calibration for {self.analysis_result_id}"


class QCDecision(models.Model):
    """Department Manager/QC decision for a submitted analysis result."""

    class Decision(models.TextChoices):
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    analysis_result = models.ForeignKey(
        AnalysisResult,
        on_delete=models.CASCADE,
        related_name="qc_decisions",
    )
    decision = models.CharField(max_length=20, choices=Decision.choices)
    reason = models.TextField(blank=True, default="")
    decided_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="qc_decisions",
    )
    decided_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "qc_decisions"
        ordering = ["-decided_at"]
        verbose_name = "QC Decision"
        verbose_name_plural = "QC Decisions"

    def __str__(self):
        return f"{self.get_decision_display()} for {self.analysis_result_id}"


class ComplaintRecord(models.Model):
    """Client/internal complaint or dispute against a job/sample/result."""

    class Category(models.TextChoices):
        PAYMENT = "payment", "Payment"
        SAMPLE = "sample", "Sample"
        RESULT = "result", "Result"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        OPEN = "open", "Open"
        IN_REVIEW = "in_review", "In Review"
        RESOLVED = "resolved", "Resolved"
        REJECTED = "rejected", "Rejected"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="complaints",
    )
    job = models.ForeignKey(
        JobOrder,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="complaints",
    )
    sample = models.ForeignKey(
        Sample,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="complaints",
    )
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.OTHER,
    )
    description = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN,
    )
    resolution = models.TextField(blank=True, default="")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="complaints_created",
    )
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="complaints_resolved",
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "complaint_records"
        ordering = ["-created_at"]
        verbose_name = "Complaint Record"
        verbose_name_plural = "Complaint Records"

    def __str__(self):
        return f"{self.get_category_display()} complaint ({self.get_status_display()})"


class DiscountApproval(models.Model):
    """Director approval record for discounts or free-test cases."""

    class DiscountType(models.TextChoices):
        PERCENTAGE = "percentage", "Percentage"
        FIXED_AMOUNT = "fixed_amount", "Fixed Amount"
        FREE_TEST = "free_test", "Free Test"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.ForeignKey(
        JobOrder,
        on_delete=models.CASCADE,
        related_name="discount_approvals",
    )
    discount_type = models.CharField(max_length=20, choices=DiscountType.choices)
    percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )
    reason = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="discount_approvals_requested",
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="discount_approvals_reviewed",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_note = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "discount_approvals"
        ordering = ["-created_at"]
        verbose_name = "Discount Approval"
        verbose_name_plural = "Discount Approvals"

    def __str__(self):
        return f"{self.get_discount_type_display()} ({self.get_status_display()})"


class FinancialRecord(models.Model):
    """Finance record that gates permanent sample coding for a job."""

    class PaymentStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PARTIAL = "partial", "Partial"
        PAID = "paid", "Paid"

    invoice_no = models.CharField(
        max_length=32,
        primary_key=True,
        default=generate_invoice_no,
        help_text="Unique invoice number for this job.",
    )
    job = models.OneToOneField(
        JobOrder,
        on_delete=models.CASCADE,
        related_name="financial_record",
        help_text="Job order covered by this financial record.",
    )
    amount_expected = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    amount_paid = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    payment_status = models.CharField(
        max_length=10,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
    )
    paid_at = models.DateTimeField(null=True, blank=True)
    payment_required = models.BooleanField(
        default=True,
        help_text="When false, an approved waiver bypasses the payment gate.",
    )
    waiver_reason = models.TextField(
        blank=True,
        default="",
        help_text="Reason payment was waived for this job.",
    )
    waiver_approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="financial_waivers_approved",
        help_text="User who approved the payment waiver.",
    )
    waiver_approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "financial_records"
        ordering = ["-created_at"]
        verbose_name = "Financial Record"
        verbose_name_plural = "Financial Records"

    def __str__(self):
        return f"{self.invoice_no} ({self.get_payment_status_display()})"

    def save(self, *args, **kwargs):
        previous_status = None
        previous_payment_required = None
        previous_waiver_approved_at = None
        if self.pk:
            previous_values = (
                FinancialRecord.objects.filter(pk=self.pk)
                .values_list(
                    "payment_status",
                    "payment_required",
                    "waiver_approved_at",
                )
                .first()
            )
            if previous_values:
                (
                    previous_status,
                    previous_payment_required,
                    previous_waiver_approved_at,
                ) = previous_values

        if self.payment_status == self.PaymentStatus.PAID and self.paid_at is None:
            self.paid_at = timezone.now()
        if self.payment_status != self.PaymentStatus.PAID:
            self.paid_at = None
        if not self.payment_required and self.waiver_approved_at is None:
            self.waiver_approved_at = timezone.now()

        with transaction.atomic():
            super().save(*args, **kwargs)
            from .services.workflow import handle_financial_record_saved

            handle_financial_record_saved(
                self,
                previous_status,
                previous_payment_required,
                previous_waiver_approved_at,
            )


# ---------------------------------------------------------------------------
# SampleTest — Junction table linking Samples to requested TestCatalog tests
# Inception Document Req #9: "The system shall allow test selection"
# ---------------------------------------------------------------------------
class SampleTest(models.Model):
    """
    Links a Sample to a specific test from the TestCatalog.
    Represents which tests have been requested for each sample.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    sample = models.ForeignKey(
        Sample,
        on_delete=models.CASCADE,
        related_name="sample_tests",
        help_text="The sample to be tested.",
    )
    test = models.ForeignKey(
        TestCatalog,
        on_delete=models.PROTECT,
        related_name="sample_tests",
        help_text="The test to perform on this sample.",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "sample_tests"
        ordering = ["-created_at"]
        unique_together = [("sample", "test")]
        verbose_name = "Sample Test Assignment"
        verbose_name_plural = "Sample Test Assignments"

    def __str__(self):
        return f"{self.sample.sample_code or 'PENDING-CODE'} → {self.test.test_code}"
