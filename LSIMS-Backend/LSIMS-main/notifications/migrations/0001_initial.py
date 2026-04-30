import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Notification",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("title", models.CharField(max_length=200)),
                ("body", models.TextField()),
                (
                    "kind",
                    models.CharField(
                        choices=[
                            ("info", "Info"),
                            ("alert", "Alert"),
                            ("job", "Job update"),
                            ("message", "Message"),
                            ("system", "System"),
                        ],
                        default="info",
                        max_length=20,
                    ),
                ),
                ("read_at", models.DateTimeField(blank=True, null=True)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "recipient",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notifications",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "notifications_inbox",
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="notification",
            index=models.Index(
                fields=["recipient", "created_at"],
                name="notif_rcpt_created",
            ),
        ),
        migrations.AddIndex(
            model_name="notification",
            index=models.Index(
                fields=["recipient", "read_at"],
                name="notif_rcpt_read",
            ),
        ),
    ]
