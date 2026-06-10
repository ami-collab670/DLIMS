"""
Laboratory workflow services.

This module owns workflow side effects such as payment-triggered permanent
coding and job status movement. Keeping these operations here makes the next
workflow stages easier to audit and test.
"""

from django.db import transaction
from django.utils import timezone

from laboratory.models import (
    AnalysisResult,
    BlindCode,
    ComplaintRecord,
    DiscountApproval,
    FinancialRecord,
    JobOrder,
    PreparationRecord,
    QCDecision,
    Sample,
)


class WorkflowTransitionError(ValueError):
    """Raised when a requested workflow transition is not allowed."""


VALID_JOB_TRANSITIONS = {
    (JobOrder.Status.PAYMENT_PENDING, JobOrder.Status.RECEIVED),
    (JobOrder.Status.RECEIVED, JobOrder.Status.IN_PREP),
    (JobOrder.Status.IN_PREP, JobOrder.Status.IN_ANALYSIS),
    (JobOrder.Status.IN_ANALYSIS, JobOrder.Status.QC),
    (JobOrder.Status.QC, JobOrder.Status.IN_ANALYSIS),
    (JobOrder.Status.QC, JobOrder.Status.COMPLETED),
}


def transition_job(job, to_status, *, reason="", allowed_from=None):
    """
    Move a job to a new status using explicit transition rules.

    `allowed_from` can be supplied by a caller that needs a narrower transition
    than the global workflow map.
    """
    valid_statuses = {choice[0] for choice in JobOrder.Status.choices}
    if to_status not in valid_statuses:
        raise WorkflowTransitionError(f"Unknown job status: {to_status}")

    if job.current_status == to_status:
        return job

    allowed_pairs = VALID_JOB_TRANSITIONS
    if allowed_from is not None:
        allowed_pairs = {(from_status, to_status) for from_status in allowed_from}

    if (job.current_status, to_status) not in allowed_pairs:
        raise WorkflowTransitionError(
            f"Cannot transition job from {job.current_status} to {to_status}."
        )

    job.current_status = to_status
    update_fields = ["current_status", "updated_at"]
    if reason:
        job.status_reason = reason
        update_fields.append("status_reason")
    job.save(update_fields=update_fields)
    return job


def assign_sample_permanent_identity(sample):
    """
    Assign missing permanent sample identity after payment confirmation.

    The operation is idempotent: existing codes are left unchanged.
    """
    update_fields = []
    if not sample.blind_alias_id:
        sample.blind_alias = BlindCode.objects.create(
            code=BlindCode.generate_unique_code()
        )
        update_fields.append("blind_alias")
    if not sample.sample_code:
        sample.sample_code = Sample.generate_sample_code()
        update_fields.append("sample_code")

    if update_fields:
        update_fields.append("updated_at")
        sample.save(update_fields=update_fields)

    return sample


def code_paid_job_samples(job):
    """
    Generate missing permanent identities for all samples on a paid job.

    Safe to call repeatedly. Already-coded samples are not overwritten.
    """
    with transaction.atomic():
        job = JobOrder.objects.select_for_update().get(pk=job.pk)
        samples = job.samples.select_for_update().order_by("created_at", "id")
        for sample in samples:
            assign_sample_permanent_identity(sample)

        if job.current_status == JobOrder.Status.PAYMENT_PENDING:
            transition_job(
                job,
                JobOrder.Status.RECEIVED,
                allowed_from=[JobOrder.Status.PAYMENT_PENDING],
            )

    return job


def financial_record_clears_payment_gate(financial_record):
    """Return whether payment is satisfied or explicitly waived."""
    return (
        financial_record.payment_status == FinancialRecord.PaymentStatus.PAID
        or (
            financial_record.payment_required is False
            and financial_record.waiver_approved_at is not None
        )
    )


def _previous_financial_record_cleared_gate(
    previous_status,
    previous_payment_required,
    previous_waiver_approved_at,
):
    return (
        previous_status == FinancialRecord.PaymentStatus.PAID
        or (
            previous_payment_required is False
            and previous_waiver_approved_at is not None
        )
    )


def handle_financial_record_saved(
    financial_record,
    previous_status,
    previous_payment_required=None,
    previous_waiver_approved_at=None,
):
    """
    Apply workflow side effects after a financial record save.

    Paid records and approved waivers both release permanent sample coding.
    """
    previous_cleared = _previous_financial_record_cleared_gate(
        previous_status,
        previous_payment_required,
        previous_waiver_approved_at,
    )
    if financial_record_clears_payment_gate(financial_record) and not previous_cleared:
        code_paid_job_samples(financial_record.job)


def start_preparation(preparation_record, user):
    """Start preparation and move the sample/job into the preparation stage."""
    if preparation_record.status != PreparationRecord.Status.PENDING:
        raise WorkflowTransitionError("Only pending preparation can be started.")

    with transaction.atomic():
        preparation_record = PreparationRecord.objects.select_for_update().select_related(
            "sample",
            "sample__job",
            "technician",
        ).get(pk=preparation_record.pk)

        if preparation_record.status != PreparationRecord.Status.PENDING:
            raise WorkflowTransitionError("Only pending preparation can be started.")

        if preparation_record.technician_id is None and getattr(user, "role_name", None) == "lab_technician":
            preparation_record.technician = user
        preparation_record.status = PreparationRecord.Status.IN_PROGRESS
        preparation_record.started_at = timezone.now()
        preparation_record.save(
            update_fields=["technician", "status", "started_at", "updated_at"]
        )

        sample = preparation_record.sample
        sample.sample_status = Sample.SampleStatus.IN_PREP
        sample.save(update_fields=["sample_status", "updated_at"])

        job = sample.job
        if job.current_status == JobOrder.Status.RECEIVED:
            transition_job(
                job,
                JobOrder.Status.IN_PREP,
                allowed_from=[JobOrder.Status.RECEIVED],
            )

    return preparation_record


def complete_preparation(
    preparation_record,
    *,
    user=None,
    preparation_data=None,
    notes=None,
):
    """Complete preparation and move the sample/job into the analysis queue."""
    if preparation_record.status != PreparationRecord.Status.IN_PROGRESS:
        raise WorkflowTransitionError("Only in-progress preparation can be completed.")

    with transaction.atomic():
        preparation_record = PreparationRecord.objects.select_for_update().select_related(
            "sample",
            "sample__job",
        ).get(pk=preparation_record.pk)

        if preparation_record.status != PreparationRecord.Status.IN_PROGRESS:
            raise WorkflowTransitionError("Only in-progress preparation can be completed.")
        if (
            user is not None
            and getattr(user, "role_name", None) == "lab_technician"
            and preparation_record.technician_id is not None
            and preparation_record.technician_id != user.id
        ):
            raise WorkflowTransitionError(
                "Only the assigned Lab Technician can complete this preparation."
            )

        if preparation_data is not None:
            preparation_record.preparation_data = preparation_data
        if notes is not None:
            preparation_record.notes = notes
        preparation_record.status = PreparationRecord.Status.COMPLETED
        preparation_record.completed_at = timezone.now()
        preparation_record.save(
            update_fields=[
                "preparation_data",
                "notes",
                "status",
                "completed_at",
                "updated_at",
            ]
        )

        sample = preparation_record.sample
        sample.sample_status = Sample.SampleStatus.PENDING_ANALYSIS
        sample.save(update_fields=["sample_status", "updated_at"])

        job = sample.job
        if (
            job.current_status == JobOrder.Status.IN_PREP
            and _all_job_preparations_completed(job)
        ):
            transition_job(
                job,
                JobOrder.Status.IN_ANALYSIS,
                allowed_from=[JobOrder.Status.IN_PREP],
            )

    return preparation_record


def submit_analysis_result(analysis_result, user):
    """Submit an analyst result for QC review."""
    if analysis_result.state not in {
        AnalysisResult.State.DRAFT,
        AnalysisResult.State.REJECTED,
    }:
        raise WorkflowTransitionError(
            "Only draft or rejected analysis results can be submitted."
        )
    if not analysis_result.value.strip():
        raise WorkflowTransitionError("Result value is required before submission.")

    with transaction.atomic():
        analysis_result = AnalysisResult.objects.select_for_update().select_related(
            "sample_test",
            "sample_test__sample",
            "sample_test__sample__job",
        ).get(pk=analysis_result.pk)

        if analysis_result.state not in {
            AnalysisResult.State.DRAFT,
            AnalysisResult.State.REJECTED,
        }:
            raise WorkflowTransitionError(
                "Only draft or rejected analysis results can be submitted."
            )
        if not analysis_result.value.strip():
            raise WorkflowTransitionError("Result value is required before submission.")

        if analysis_result.state == AnalysisResult.State.REJECTED:
            analysis_result.revision += 1
        if analysis_result.analyst_id is None:
            analysis_result.analyst = user
        analysis_result.state = AnalysisResult.State.SUBMITTED
        analysis_result.submitted_at = timezone.now()
        analysis_result.approved_at = None
        analysis_result.rejected_at = None
        analysis_result.save(
            update_fields=[
                "analyst",
                "state",
                "revision",
                "submitted_at",
                "approved_at",
                "rejected_at",
                "updated_at",
            ]
        )

        sample = analysis_result.sample_test.sample
        sample.sample_status = Sample.SampleStatus.IN_ANALYSIS
        sample.save(update_fields=["sample_status", "updated_at"])

        job = sample.job
        if (
            job.current_status == JobOrder.Status.IN_ANALYSIS
            and _all_job_results_submitted_or_approved(job)
        ):
            transition_job(
                job,
                JobOrder.Status.QC,
                allowed_from=[JobOrder.Status.IN_ANALYSIS],
            )

    return analysis_result


def _all_job_preparations_completed(job):
    samples = job.samples.prefetch_related("sample_tests").all()
    if not samples.exists():
        return False
    for sample in samples:
        if not sample.sample_tests.exists():
            return False
        try:
            preparation_record = sample.preparation_record
        except PreparationRecord.DoesNotExist:
            return False
        if preparation_record.status != PreparationRecord.Status.COMPLETED:
            return False
    return True


def _all_job_results_submitted_or_approved(job):
    samples = job.samples.prefetch_related("sample_tests").all()
    if not samples.exists():
        return False
    for sample in samples:
        sample_tests = sample.sample_tests.all()
        if not sample_tests.exists():
            return False
        for sample_test in sample_tests:
            try:
                result = sample_test.analysis_result
            except AnalysisResult.DoesNotExist:
                return False
            if result.state not in {
                AnalysisResult.State.SUBMITTED,
                AnalysisResult.State.APPROVED,
            }:
                return False
    return True


def approve_analysis_result(analysis_result, user, *, reason=""):
    """Approve a submitted result and advance sample/job when all work is done."""
    return _decide_analysis_result(
        analysis_result,
        user,
        decision=QCDecision.Decision.APPROVED,
        reason=reason,
    )


def reject_analysis_result(analysis_result, user, *, reason):
    """Reject a submitted result and return the work to analysis."""
    if not reason.strip():
        raise WorkflowTransitionError("A rejection reason is required.")
    return _decide_analysis_result(
        analysis_result,
        user,
        decision=QCDecision.Decision.REJECTED,
        reason=reason,
    )


def _decide_analysis_result(analysis_result, user, *, decision, reason=""):
    if analysis_result.state != AnalysisResult.State.SUBMITTED:
        raise WorkflowTransitionError("Only submitted analysis results can be reviewed.")

    with transaction.atomic():
        analysis_result = AnalysisResult.objects.select_for_update().select_related(
            "sample_test",
            "sample_test__sample",
            "sample_test__sample__job",
        ).get(pk=analysis_result.pk)

        if analysis_result.state != AnalysisResult.State.SUBMITTED:
            raise WorkflowTransitionError(
                "Only submitted analysis results can be reviewed."
            )

        QCDecision.objects.create(
            analysis_result=analysis_result,
            decision=decision,
            reason=reason,
            decided_by=user,
        )

        sample = analysis_result.sample_test.sample
        job = sample.job

        if decision == QCDecision.Decision.APPROVED:
            analysis_result.state = AnalysisResult.State.APPROVED
            analysis_result.approved_at = timezone.now()
            analysis_result.rejected_at = None
            analysis_result.save(
                update_fields=[
                    "state",
                    "approved_at",
                    "rejected_at",
                    "updated_at",
                ]
            )
            if _all_sample_results_approved(sample):
                sample.sample_status = Sample.SampleStatus.COMPLETED
                sample.save(update_fields=["sample_status", "updated_at"])
            if _all_job_results_approved(job) and job.current_status == JobOrder.Status.QC:
                transition_job(
                    job,
                    JobOrder.Status.COMPLETED,
                    allowed_from=[JobOrder.Status.QC],
                )
        else:
            analysis_result.state = AnalysisResult.State.REJECTED
            analysis_result.rejected_at = timezone.now()
            analysis_result.approved_at = None
            analysis_result.save(
                update_fields=[
                    "state",
                    "rejected_at",
                    "approved_at",
                    "updated_at",
                ]
            )
            sample.sample_status = Sample.SampleStatus.PENDING_ANALYSIS
            sample.save(update_fields=["sample_status", "updated_at"])
            if job.current_status == JobOrder.Status.QC:
                transition_job(
                    job,
                    JobOrder.Status.IN_ANALYSIS,
                    reason="QC returned result for correction.",
                    allowed_from=[JobOrder.Status.QC],
                )

    return analysis_result


def _all_sample_results_approved(sample):
    sample_tests = sample.sample_tests.all()
    if not sample_tests.exists():
        return False
    for sample_test in sample_tests:
        try:
            result = sample_test.analysis_result
        except AnalysisResult.DoesNotExist:
            return False
        if result.state != AnalysisResult.State.APPROVED:
            return False
    return True


def _all_job_results_approved(job):
    samples = job.samples.prefetch_related("sample_tests").all()
    if not samples.exists():
        return False
    for sample in samples:
        if not _all_sample_results_approved(sample):
            return False
    return True


def resolve_complaint(complaint, user, *, resolution):
    """Resolve a complaint/dispute with a written resolution."""
    if not resolution.strip():
        raise WorkflowTransitionError("A resolution is required.")
    if complaint.status in {
        ComplaintRecord.Status.RESOLVED,
        ComplaintRecord.Status.REJECTED,
    }:
        raise WorkflowTransitionError("Closed complaints cannot be changed.")

    complaint.status = ComplaintRecord.Status.RESOLVED
    complaint.resolution = resolution
    complaint.resolved_by = user
    complaint.resolved_at = timezone.now()
    complaint.save(
        update_fields=[
            "status",
            "resolution",
            "resolved_by",
            "resolved_at",
            "updated_at",
        ]
    )
    return complaint


def reject_complaint(complaint, user, *, resolution):
    """Reject a complaint/dispute with a written reason."""
    if not resolution.strip():
        raise WorkflowTransitionError("A rejection reason is required.")
    if complaint.status in {
        ComplaintRecord.Status.RESOLVED,
        ComplaintRecord.Status.REJECTED,
    }:
        raise WorkflowTransitionError("Closed complaints cannot be changed.")

    complaint.status = ComplaintRecord.Status.REJECTED
    complaint.resolution = resolution
    complaint.resolved_by = user
    complaint.resolved_at = timezone.now()
    complaint.save(
        update_fields=[
            "status",
            "resolution",
            "resolved_by",
            "resolved_at",
            "updated_at",
        ]
    )
    return complaint


def approve_discount_approval(discount_approval, user, *, review_note=""):
    """Approve a discount/free-test request and apply waiver when applicable."""
    if discount_approval.status != DiscountApproval.Status.PENDING:
        raise WorkflowTransitionError("Only pending discount approvals can be reviewed.")

    with transaction.atomic():
        discount_approval = DiscountApproval.objects.select_for_update().select_related(
            "job",
        ).get(pk=discount_approval.pk)
        if discount_approval.status != DiscountApproval.Status.PENDING:
            raise WorkflowTransitionError(
                "Only pending discount approvals can be reviewed."
            )

        discount_approval.status = DiscountApproval.Status.APPROVED
        discount_approval.reviewed_by = user
        discount_approval.reviewed_at = timezone.now()
        discount_approval.review_note = review_note
        discount_approval.save(
            update_fields=[
                "status",
                "reviewed_by",
                "reviewed_at",
                "review_note",
                "updated_at",
            ]
        )

        if discount_approval.discount_type == DiscountApproval.DiscountType.FREE_TEST:
            record, _ = FinancialRecord.objects.get_or_create(
                job=discount_approval.job,
                defaults={
                    "amount_expected": 0,
                    "amount_paid": 0,
                    "payment_status": FinancialRecord.PaymentStatus.PENDING,
                },
            )
            record.payment_required = False
            record.waiver_reason = (
                "Director-approved free test: "
                f"{discount_approval.reason}"
            )
            record.waiver_approved_by = user
            record.waiver_approved_at = timezone.now()
            record.save()

    return discount_approval


def reject_discount_approval(discount_approval, user, *, review_note):
    """Reject a discount/free-test request."""
    if not review_note.strip():
        raise WorkflowTransitionError("A rejection reason is required.")
    if discount_approval.status != DiscountApproval.Status.PENDING:
        raise WorkflowTransitionError("Only pending discount approvals can be reviewed.")

    discount_approval.status = DiscountApproval.Status.REJECTED
    discount_approval.reviewed_by = user
    discount_approval.reviewed_at = timezone.now()
    discount_approval.review_note = review_note
    discount_approval.save(
        update_fields=[
            "status",
            "reviewed_by",
            "reviewed_at",
            "review_note",
            "updated_at",
        ]
    )
    return discount_approval
