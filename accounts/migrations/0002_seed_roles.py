"""
Data migration: Seed the 8 system roles defined in the LSIMS Inception Document.
Runs automatically during `python manage.py migrate`.
Uses update_or_create so it's safe to run multiple times (idempotent).
"""

from django.db import migrations


# The 8 system roles with their public-facing contact aliases
ROLES = [
    ("admin", "System Administrator"),
    ("receptionist", "Reception & Sample Intake"),
    ("analyst", "Laboratory Analyst"),
    ("qc_manager", "Quality Control Manager"),
    ("finance", "Finance & Billing Officer"),
    ("procurement", "Procurement Officer"),
    ("ministry_coordinator", "Ministry Requester / Coordinator"),
    ("auditor", "Compliance Auditor"),
]


def seed_roles(apps, schema_editor):
    """Create (or update) all 8 system roles."""
    Role = apps.get_model("accounts", "Role")
    for role_name, contact_alias in ROLES:
        Role.objects.update_or_create(
            role_name=role_name,
            defaults={"contact_alias": contact_alias},
        )


def reverse_seed(apps, schema_editor):
    """Remove seeded roles (only used if rolling back this migration)."""
    Role = apps.get_model("accounts", "Role")
    role_names = [r[0] for r in ROLES]
    Role.objects.filter(role_name__in=role_names).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_roles, reverse_seed),
    ]
