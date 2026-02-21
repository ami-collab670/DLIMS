"""
LSIMS Accounts — Models
Implements Role and Custom User models per Sprint 1 blueprint.
"""

import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.Model):
    """
    Defines the 8 system roles per Inception Document Section 2B.
    Each role carries a public-facing `contact_alias` to shield staff identities.
    """

    class RoleName(models.TextChoices):
        ADMIN = "admin", "Admin"
        RECEPTIONIST = "receptionist", "Receptionist"
        ANALYST = "analyst", "Lab Analyst"
        QC_MANAGER = "qc_manager", "QC Manager"
        FINANCE = "finance", "Finance Officer"
        PROCUREMENT = "procurement", "Procurement Officer"
        MINISTRY_COORDINATOR = "ministry_coordinator", "Ministry Requester/Coordinator"
        AUDITOR = "auditor", "Auditor"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role_name = models.CharField(
        max_length=30,
        choices=RoleName.choices,
        unique=True,
        help_text="System role identifier.",
    )
    contact_alias = models.CharField(
        max_length=100,
        help_text="Public-facing title shown to clients (e.g. 'QC-Department-Support').",
    )

    class Meta:
        db_table = "user_roles"
        ordering = ["role_name"]

    def __str__(self):
        return self.get_role_name_display()


class User(AbstractUser):
    """
    Custom User model linked to a Role via ForeignKey.
    Extends Django's AbstractUser for JWT-based authentication.
    """

    class UserType(models.TextChoices):
        INTERNAL = "internal", "Internal (Ministry Staff)"
        EXTERNAL = "external", "External (Client)"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, default="")
    user_type = models.CharField(
        max_length=10,
        choices=UserType.choices,
        default=UserType.EXTERNAL,
        help_text="Internal (ministry staff) or External (client).",
    )
    role = models.ForeignKey(
        Role,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
        help_text="Assigned role. Required for internal users.",
    )

    # External client-specific fields
    nationality = models.CharField(max_length=100, blank=True, default="")
    organization_name = models.CharField(max_length=255, blank=True, default="")
    organization_type = models.CharField(max_length=100, blank=True, default="")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        db_table = "users"
        ordering = ["-date_joined"]

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.email})"

    @property
    def role_name(self):
        """Shortcut to get the role_name string."""
        return self.role.role_name if self.role else None
