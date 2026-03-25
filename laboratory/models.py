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
    """

    class SampleStatus(models.TextChoices):
        REGISTERED = "registered", "Registered"
        IN_QUEUE = "in_queue", "In Queue"
        IN_PREP = "in_prep", "In Preparation"
        PENDING_ANALYSIS = "pending_analysis", "Pending Analysis"
        IN_ANALYSIS = "in_analysis", "In Analysis"
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
        help_text="Auto-assigned anonymous code for blind analysis.",
    )
    sample_code = models.CharField(
        max_length=20,
        unique=True,
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
        help_text="Receptionist who received this sample.",
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
    sample_status = models.CharField(
        max_length=20,
        choices=SampleStatus.choices,
        default=SampleStatus.REGISTERED,
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
        return f"{self.sample_code} — {self.sample_name}"

    @staticmethod
    def generate_sample_code():
        """
        Generate a sequential human-readable sample code using an atomic
        per-year counter so parallel writes cannot allocate the same value.
        """
        return SampleCodeSequence.next_code()

    def save(self, *args, **kwargs):
        """
        Override save to auto-generate BlindCode and sample_code on creation.
        - BlindCode: collision-safe BC-XXXXXX format.
        - sample_code: sequential SMP-YYYY-NNNN format allocated atomically.
        """
        if not self.pk or self._state.adding:
            with transaction.atomic():
                if not self.blind_alias_id:
                    code_str = BlindCode.generate_unique_code()
                    blind_code = BlindCode.objects.create(code=code_str)
                    self.blind_alias = blind_code

                if not self.sample_code:
                    self.sample_code = Sample.generate_sample_code()

                return super().save(*args, **kwargs)

        return super().save(*args, **kwargs)


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
        return f"{self.sample.sample_code} → {self.test.test_code}"
