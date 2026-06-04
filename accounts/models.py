"""
LSIMS Accounts — Models
Implements Role and Custom User models per Sprint 1 blueprint.
"""

import uuid
import secrets
from datetime import timedelta
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.hashers import check_password, make_password
from django.db import models
from django.utils import timezone


class Department(models.Model):
    """
    Laboratory department or section used for work-queue/data isolation.
    Examples: Mineralogy, Water, Geochemistry.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=120, unique=True)
    description = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "departments"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Role(models.Model):
    """
    Defines the 8 system roles per Inception Document Section 2B.
    Each role carries a public-facing `contact_alias` to shield staff identities.
    """

    class RoleName(models.TextChoices):
        ADMIN = "admin", "Admin"
        RECEPTIONIST = "receptionist", "Receptionist"
        ANALYST = "analyst", "Lab Analyst"
        QC_MANAGER = "qc_manager", "Department Manager"
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

    class Country(models.TextChoices):
        ETHIOPIA = "ethiopia", "Ethiopia"
        OTHER = "other", "Other"

    class OrganizationType(models.TextChoices):
        GOVERNMENT = "government", "Government"
        PRIVATE = "private", "Private"
        UNIVERSITY = "university", "University"
        INDIVIDUAL = "individual", "Individual"
        NGO = "ngo", "NGO"
        OTHER = "other", "Other"

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
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
        help_text="Department/section this staff user belongs to.",
    )

    # External client-specific fields
    country = models.CharField(
        max_length=20,
        choices=Country.choices,
        default=Country.ETHIOPIA,
        help_text="Country associated with this user or client profile.",
    )
    nationality = models.CharField(max_length=100, blank=True, default="")
    organization_name = models.CharField(max_length=255, blank=True, default="")
    organization_type = models.CharField(
        max_length=30,
        choices=OrganizationType.choices,
        blank=True,
        default=OrganizationType.OTHER,
    )

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


class OTPToken(models.Model):
    """
    Short-lived, single-use password reset OTP.
    The code is stored hashed so a database read cannot reveal usable OTPs.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="otp_tokens",
    )
    code_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "otp_tokens"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Password reset OTP for {self.user.email}"

    @staticmethod
    def generate_code():
        """Return a zero-padded 6-digit OTP code."""
        return f"{secrets.randbelow(1_000_000):06d}"

    @classmethod
    def create_for_user(cls, user):
        code = cls.generate_code()
        token = cls.objects.create(
            user=user,
            code_hash=make_password(code),
            expires_at=timezone.now() + timedelta(minutes=15),
        )
        return token, code

    def is_expired(self):
        return timezone.now() >= self.expires_at

    def matches(self, code):
        return check_password(code, self.code_hash)

    def mark_used(self):
        self.is_used = True
        self.used_at = timezone.now()
        self.save(update_fields=["is_used", "used_at"])
