from django.db import migrations, models


def seed_lab_director_role(apps, schema_editor):
    Role = apps.get_model("accounts", "Role")
    Role.objects.update_or_create(
        role_name="lab_director",
        defaults={"contact_alias": "Laboratory Director"},
    )


def remove_lab_director_role(apps, schema_editor):
    Role = apps.get_model("accounts", "Role")
    Role.objects.filter(role_name="lab_director").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0006_add_lab_technician_role"),
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
                    ("lab_director", "Lab Director"),
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
        migrations.RunPython(seed_lab_director_role, remove_lab_director_role),
    ]
