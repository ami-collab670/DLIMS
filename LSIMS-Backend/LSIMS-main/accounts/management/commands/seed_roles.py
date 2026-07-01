"""
Management command to seed the 8 mandatory system roles.
Usage: python manage.py seed_roles

Safe to run multiple times ΓÇö uses get_or_create to avoid duplicates.
"""

from django.core.management.base import BaseCommand
from accounts.models import Role


class Command(BaseCommand):
    help = "Seeds the database with the 8 mandatory system roles"

    def handle(self, *args, **options):
        roles_to_create = [
            ("admin", "System Administrator"),
            ("receptionist", "Reception & Sample Intake"),
            ("lab_technician", "Laboratory Preparation Technician"),
            ("analyst", "Laboratory Analyst"),
            ("qc_manager", "Department Manager"),
            ("lab_director", "Laboratory Director"),
            ("finance", "Finance & Billing Officer"),
            ("procurement", "Procurement Officer"),
            ("ministry_coordinator", "Ministry Requester / Coordinator"),
            ("auditor", "Compliance Auditor"),
        ]

        created_count = 0
        for role_name, alias in roles_to_create:
            role, created = Role.objects.get_or_create(
                role_name=role_name,
                defaults={"contact_alias": alias},
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f"  Γ£ô Created role: {role_name}")
                )
            else:
                self.stdout.write(f"  ┬╖ Already exists: {role_name}")

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone. {created_count} new roles created, "
                f"{len(roles_to_create) - created_count} already existed."
            )
        )
