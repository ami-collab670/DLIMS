import uuid

from django.conf import settings
from django.db import models


class Notification(models.Model):
    """
    In-app notification delivered to a single user. Extensible via ``kind`` and ``metadata``.
    ``read_at`` null means unread.
    """

    class Kind(models.TextChoices):
        INFO = "info", "Info"
        ALERT = "alert", "Alert"
        JOB = "job", "Job update"
        MESSAGE = "message", "Message"
        SYSTEM = "system", "System"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    title = models.CharField(max_length=200)
    body = models.TextField()
    kind = models.CharField(
        max_length=20,
        choices=Kind.choices,
        default=Kind.INFO,
    )
    read_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(blank=True, default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications_inbox"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "created_at"], name="notif_rcpt_created"),
            models.Index(fields=["recipient", "read_at"], name="notif_rcpt_read"),
        ]

    def __str__(self):
        return f"{self.title} → {self.recipient_id}"
