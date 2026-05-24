import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("laboratory", "0005_job_pending_finance"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterField(
            model_name="sample",
            name="received_by",
            field=models.ForeignKey(
                blank=True,
                help_text=(
                    "Receptionist who physically received this sample at the lab. "
                    "Null when the row was created from a client self-service request "
                    "before intake (staff may set this at receipt)."
                ),
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="samples_received",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
