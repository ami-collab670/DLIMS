from django.db import migrations, models


def update_qc_manager_alias(apps, schema_editor):
    Role = apps.get_model("accounts", "Role")
    Role.objects.filter(
        role_name="qc_manager",
        contact_alias__in=["QC-Department-Support", "QC Manager"],
    ).update(contact_alias="Department Manager")


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0004_department_user_department"),
    ]

    operations = [
        migrations.AlterField(
            model_name="role",
            name="role_name",
            field=models.CharField(
                choices=[
                    ("admin", "Admin"),
                    ("receptionist", "Receptionist"),
                    ("analyst", "Lab Analyst"),
                    ("qc_manager", "Department Manager"),
                    ("finance", "Finance Officer"),
                    ("procurement", "Procurement Officer"),
                    ("ministry_coordinator", "Ministry Requester/Coordinator"),
                    ("auditor", "Auditor"),
                ],
                help_text="System role identifier.",
                max_length=30,
                unique=True,
            ),
        ),
        migrations.RunPython(update_qc_manager_alias, migrations.RunPython.noop),
    ]
