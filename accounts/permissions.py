"""
LSIMS Accounts — DRF Permission Classes
8 role-based permission classes per the expanded RBAC blueprint.
"""

from rest_framework.permissions import BasePermission


class _RolePermission(BasePermission):
    """
    Base class for role-based permissions.
    Subclasses define `required_role` to match against user.role.role_name.
    """

    required_role: str = ""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        # Superusers / Django admins always have access
        if request.user.is_superuser:
            return True
        return (
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


class IsAnalyst(_RolePermission):
    """Grants access to Lab Analysts."""
    required_role = "analyst"
    message = "Lab Analyst access required."


class IsQCManager(_RolePermission):
    """Grants access to QC Managers."""
    required_role = "qc_manager"
    message = "QC Manager access required."


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
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        return (
            hasattr(request.user, "role")
            and request.user.role is not None
            and request.user.role.role_name == "admin"
        )
