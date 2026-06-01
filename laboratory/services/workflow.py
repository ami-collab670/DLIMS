"""
Laboratory workflow services.

This module owns workflow side effects such as payment-triggered permanent
coding and job status movement. Keeping these operations here makes the next
workflow stages easier to audit and test.
"""

from django.db import transaction

from laboratory.models import BlindCode, FinancialRecord, JobOrder, Sample


class WorkflowTransitionError(ValueError):
    """Raised when a requested workflow transition is not allowed."""


VALID_JOB_TRANSITIONS = {
    (JobOrder.Status.PAYMENT_PENDING, JobOrder.Status.RECEIVED),
    (JobOrder.Status.RECEIVED, JobOrder.Status.IN_PREP),
    (JobOrder.Status.IN_PREP, JobOrder.Status.IN_ANALYSIS),
    (JobOrder.Status.IN_ANALYSIS, JobOrder.Status.QC),
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


def handle_financial_record_saved(financial_record, previous_status):
    """
    Apply workflow side effects after a financial record save.

    A transition into `paid` is the trigger for permanent sample coding.
    """
    if (
        financial_record.payment_status == FinancialRecord.PaymentStatus.PAID
        and previous_status != FinancialRecord.PaymentStatus.PAID
    ):
        code_paid_job_samples(financial_record.job)

