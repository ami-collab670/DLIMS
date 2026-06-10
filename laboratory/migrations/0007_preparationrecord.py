from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import laboratory.models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("accounts", "0006_add_lab_technician_role"),
        ("laboratory", "0006_sprint4_entry_amendments"),
    ]

    operations = [
        migrations.CreateModel(
            name="PreparationRecord",
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
                (
                    "reference_code",
                    models.CharField(
                        default=laboratory.models.generate_preparation_reference,
                        help_text="Internal preparation reference code.",
                        max_length=32,
                        unique=True,
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("in_progress", "In Progress"),
                            ("completed", "Completed"),
                        ],
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("preparation_data", models.JSONField(blank=True, default=dict)),
                ("notes", models.TextField(blank=True, default="")),
                ("started_at", models.DateTimeField(blank=True, null=True)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="preparation_records_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "sample",
                    models.OneToOneField(
                        help_text="Paid/coded sample being prepared for analysis.",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="preparation_record",
                        to="laboratory.sample",
                    ),
                ),
                (
                    "technician",
                    models.ForeignKey(
                        blank=True,
                        help_text="Lab Technician assigned to preparation.",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="preparation_records",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Preparation Record",
                "verbose_name_plural": "Preparation Records",
                "db_table": "preparation_records",
                "ordering": ["-created_at"],
            },
        ),
    ]
