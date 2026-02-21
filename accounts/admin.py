"""
LSIMS Accounts — Django Admin Registration
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Role, User


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ["role_name", "contact_alias", "id"]
    search_fields = ["role_name", "contact_alias"]


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["email", "username", "user_type", "role", "is_active", "date_joined"]
    list_filter = ["user_type", "role", "is_active"]
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
                ),
            },
        ),
    )
