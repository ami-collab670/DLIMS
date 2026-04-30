"""
LSIMS Accounts — Django Admin Registration
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Department, OTPToken, Role, User


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ["name", "created_at", "updated_at"]
    search_fields = ["name", "description"]
    ordering = ["name"]


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ["role_name", "contact_alias", "id"]
    search_fields = ["role_name", "contact_alias"]


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = [
        "email",
        "username",
        "user_type",
        "role",
        "department",
        "is_active",
        "date_joined",
    ]
    list_filter = ["user_type", "role", "department", "is_active"]
    search_fields = ["email", "username", "first_name", "last_name"]
    ordering = ["-date_joined"]

    fieldsets = BaseUserAdmin.fieldsets + (
        (
            "LSIMS Fields",
            {
                "fields": (
                    "phone",
                    "user_type",
                    "role",
                    "department",
                    "country",
                    "nationality",
                    "organization_name",
                    "organization_type",
                ),
            },
        ),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        (
            "LSIMS Fields",
            {
                "fields": (
                    "email",
                    "phone",
                    "user_type",
                    "role",
                    "department",
                    "country",
                    "nationality",
                    "organization_name",
                    "organization_type",
                ),
            },
        ),
    )


@admin.register(OTPToken)
class OTPTokenAdmin(admin.ModelAdmin):
    list_display = ["user", "created_at", "expires_at", "is_used", "used_at"]
    list_filter = ["is_used", "created_at", "expires_at"]
    search_fields = ["user__email", "user__username"]
    readonly_fields = ["id", "user", "code_hash", "created_at", "expires_at", "is_used", "used_at"]
    ordering = ["-created_at"]
