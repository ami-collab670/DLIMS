from django.db import migrations, models


def seed_lab_technician_role(apps, schema_editor):
    Role = apps.get_model("accounts", "Role")
    Role.objects.update_or_create(
        role_name="lab_technician",
        defaults={"contact_alias": "Laboratory Preparation Technician"},
    )


def remove_lab_technician_role(apps, schema_editor):
    Role = apps.get_model("accounts", "Role")
    Role.objects.filter(role_name="lab_technician").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0005_department_manager_label"),
    ]

    operations = [
        migrations.AlterField(
            model_name="role",
            name="role_name",
            field=models.CharField(
                choices=[
                    ("admin", "Admin"),
                    ("receptionist", "Receptionist"),
                    ("lab_technician", "Lab Technician"),
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
        migrations.RunPython(seed_lab_technician_role, remove_lab_technician_role),
    ]
