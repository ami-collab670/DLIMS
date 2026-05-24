from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import JobOrder
from .workflow import sync_sample_statuses_from_job


@receiver(pre_save, sender=JobOrder)
def _cache_job_order_status(sender, instance, **kwargs):
    if instance.pk:
        try:
            instance._lsims_prev_status = (
                JobOrder.objects.only("current_status")
                .get(pk=instance.pk)
                .current_status
            )
        except JobOrder.DoesNotExist:
            instance._lsims_prev_status = None
    else:
        instance._lsims_prev_status = None


def _notify_client_about_job(instance: JobOrder, prev_status: str | None, created: bool) -> None:
    """Best-effort in-app notifications for external clients (ignores import/install errors)."""
    try:
        from notifications.models import Notification
        from notifications.services import create_notification_for_user
    except Exception:
        return

    cid = instance.client_id
    if not cid:
        return

    if created and instance.current_status == JobOrder.Status.PENDING_FINANCE:
        create_notification_for_user(
            cid,
            title="Request submitted",
            body=(
                "Your job request is pending finance review. "
                "We will notify you when the status changes."
            ),
            kind=Notification.Kind.JOB,
            metadata={
                "job_id": str(instance.id),
                "current_status": instance.current_status,
            },
        )
        return

    if prev_status is None or prev_status == instance.current_status:
        return

    if instance.current_status == JobOrder.Status.RECEIVED and prev_status in (
        JobOrder.Status.PENDING_FINANCE,
        JobOrder.Status.SUBMITTED,
    ):
        create_notification_for_user(
            cid,
            title="Job sent to the laboratory",
            body=(
                "Your request has been approved and is now in laboratory intake. "
                "Track it under My requests."
            ),
            kind=Notification.Kind.JOB,
            metadata={
                "job_id": str(instance.id),
                "current_status": instance.current_status,
                "previous_status": prev_status,
            },
        )
    elif instance.current_status == JobOrder.Status.FINANCE_HOLD:
        reason = (instance.status_reason or "").strip() or (
            "Your job has been placed on finance hold. See My requests for details."
        )
        create_notification_for_user(
            cid,
            title="Job on finance hold",
            body=reason[:2000],
            kind=Notification.Kind.ALERT,
            metadata={
                "job_id": str(instance.id),
                "current_status": instance.current_status,
                "previous_status": prev_status,
            },
        )


@receiver(post_save, sender=JobOrder)
def _sync_samples_when_job_status_changes(sender, instance, created, **kwargs):
    prev = getattr(instance, "_lsims_prev_status", None)
    if prev == instance.current_status:
        return
    sync_sample_statuses_from_job(instance)
    _notify_client_about_job(instance, prev, created)
