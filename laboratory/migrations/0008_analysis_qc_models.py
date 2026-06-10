from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("laboratory", "0007_preparationrecord"),
    ]

    operations = [
        migrations.CreateModel(
            name="AnalysisResult",
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
                    "state",
                    models.CharField(
                        choices=[
                            ("draft", "Draft"),
                            ("submitted", "Submitted for QC"),
                            ("rejected", "Rejected"),
                            ("approved", "Approved"),
                        ],
                        default="draft",
                        max_length=20,
                    ),
                ),
                ("value", models.TextField(blank=True, default="")),
                ("unit", models.CharField(blank=True, default="", max_length=50)),
                ("method", models.CharField(blank=True, default="", max_length=200)),
                ("remarks", models.TextField(blank=True, default="")),
                ("revision", models.PositiveIntegerField(default=1)),
                ("submitted_at", models.DateTimeField(blank=True, null=True)),
                ("approved_at", models.DateTimeField(blank=True, null=True)),
                ("rejected_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "analyst",
                    models.ForeignKey(
                        blank=True,
                        help_text="Analyst responsible for this result.",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="analysis_results",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "sample_test",
                    models.OneToOneField(
                        help_text="Sample test this result satisfies.",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="analysis_result",
                        to="laboratory.sampletest",
                    ),
                ),
            ],
            options={
                "verbose_name": "Analysis Result",
                "verbose_name_plural": "Analysis Results",
                "db_table": "analysis_results",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="CalibrationRecord",
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
                ("instrument_name", models.CharField(max_length=200)),
                ("calibration_reference", models.CharField(blank=True, default="", max_length=200)),
                ("calibration_date", models.DateField(blank=True, null=True)),
                ("calibration_data", models.JSONField(blank=True, default=dict)),
                ("notes", models.TextField(blank=True, default="")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "analysis_result",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="calibration_records",
                        to="laboratory.analysisresult",
                    ),
                ),
                (
                    "recorded_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="calibration_records",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Calibration Record",
                "verbose_name_plural": "Calibration Records",
                "db_table": "calibration_records",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="QCDecision",
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
                    "decision",
                    models.CharField(
                        choices=[("approved", "Approved"), ("rejected", "Rejected")],
                        max_length=20,
                    ),
                ),
                ("reason", models.TextField(blank=True, default="")),
                ("decided_at", models.DateTimeField(auto_now_add=True)),
                (
                    "analysis_result",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="qc_decisions",
                        to="laboratory.analysisresult",
                    ),
                ),
                (
                    "decided_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="qc_decisions",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "QC Decision",
                "verbose_name_plural": "QC Decisions",
                "db_table": "qc_decisions",
                "ordering": ["-decided_at"],
            },
        ),
    ]
