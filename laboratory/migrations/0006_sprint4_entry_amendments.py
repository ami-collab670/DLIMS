from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def map_critical_priority_to_urgent(apps, schema_editor):
    JobOrder = apps.get_model("laboratory", "JobOrder")
    JobOrder.objects.filter(priority="critical").update(priority="urgent")


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("laboratory", "0005_testcatalog_department"),
    ]

    operations = [
        migrations.RunPython(
            map_critical_priority_to_urgent,
            migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name="joborder",
            name="priority",
            field=models.CharField(
                choices=[("normal", "Normal"), ("urgent", "Urgent")],
                default="normal",
                help_text="Processing priority level.",
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="financialrecord",
            name="payment_required",
            field=models.BooleanField(
                default=True,
                help_text="When false, an approved waiver bypasses the payment gate.",
            ),
        ),
        migrations.AddField(
            model_name="financialrecord",
            name="waiver_approved_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="financialrecord",
            name="waiver_approved_by",
            field=models.ForeignKey(
                blank=True,
                help_text="User who approved the payment waiver.",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="financial_waivers_approved",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="financialrecord",
            name="waiver_reason",
            field=models.TextField(
                blank=True,
                default="",
                help_text="Reason payment was waived for this job.",
            ),
        ),
    ]
