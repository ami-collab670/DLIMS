# pyright: reportIncompatibleMethodOverride=false

"""
LSIMS Accounts ΓÇö DRF Permission Classes
8 role-based permission classes per the expanded RBAC blueprint.
"""

from typing import Any

from rest_framework.permissions import BasePermission


class _RolePermission(BasePermission):
    """
    Base class for role-based permissions.
    Subclasses define `required_role` to match against user.role.role_name.
    """

    required_role: str = ""

    def has_permission(self, request: Any, view: Any) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return bool(
            hasattr(request.user, "role")
            and request.user.role is not None
            and request.user.role.role_name == self.required_role
        )


class IsAdmin(_RolePermission):
    """Grants access to Admin users."""

    required_role = "admin"
    message = "Admin access required."


class IsReceptionist(_RolePermission):
    """Grants access to Receptionists."""

    required_role = "receptionist"
    message = "Receptionist access required."


class IsLabTechnician(_RolePermission):
    """Grants access to Lab Technicians."""

    required_role = "lab_technician"
    message = "Lab Technician access required."


class IsAnalyst(_RolePermission):
    """Grants access to Lab Analysts."""

    required_role = "analyst"
    message = "Lab Analyst access required."


class IsQCManager(_RolePermission):
    """Grants access to Department Managers."""

    required_role = "qc_manager"
    message = "Department Manager access required."


class IsLabDirector(_RolePermission):
    """Grants access to Lab Directors."""

    required_role = "lab_director"
    message = "Lab Director access required."


class IsFinance(_RolePermission):
    """Grants access to Finance Officers."""

    required_role = "finance"
    message = "Finance Officer access required."


class IsProcurement(_RolePermission):
    """Grants access to Procurement Officers."""

    required_role = "procurement"
    message = "Procurement Officer access required."


class IsMinistryCoordinator(_RolePermission):
    """Grants access to Ministry Requesters/Coordinators."""

    required_role = "ministry_coordinator"
    message = "Ministry Coordinator access required."


class IsAuditor(_RolePermission):
    """Grants access to Auditors (read-only compliance)."""

    required_role = "auditor"
    message = "Auditor access required."


class IsAdminOrReadOnly(BasePermission):
    """
    Full access for Admins. Read-only for everyone else who is authenticated.
    """

    def has_permission(self, request: Any, view: Any) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        return bool(
            hasattr(request.user, "role")
            and request.user.role is not None
            and request.user.role.role_name == "admin"
        )


class IsAdminOrReceptionist(BasePermission):
    """
    Grants access to Admin and Receptionist users.
    Intended for write paths that should remain limited to intake/admin staff.
    """

    message = "Admin or Receptionist access required."

    def has_permission(self, request: Any, view: Any) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        role_name = getattr(request.user, "role_name", None)
        return role_name in {"admin", "receptionist"}
