"""
LSIMS Accounts — DRF Views
Admin-only CRUD for Roles and Users.
"""

from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from drf_spectacular.utils import extend_schema, extend_schema_view

from .models import Department, OTPToken, Role
from .permissions import IsAdmin
from .serializers import (
    DepartmentSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RoleSerializer,
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    ChangePasswordSerializer,
)

User = get_user_model()

PASSWORD_RESET_SUCCESS = (
    "If an active account exists for that email, a password reset OTP has been sent."
)


# ---------------------------------------------------------------------------
# Department ViewSet (Admin only)
# ---------------------------------------------------------------------------
@extend_schema_view(
    list=extend_schema(summary="List all departments", tags=["Departments"]),
    retrieve=extend_schema(summary="Get department details", tags=["Departments"]),
    create=extend_schema(summary="Create a new department", tags=["Departments"]),
    update=extend_schema(summary="Update a department", tags=["Departments"]),
    partial_update=extend_schema(summary="Partially update a department", tags=["Departments"]),
    destroy=extend_schema(summary="Delete a department", tags=["Departments"]),
)
class DepartmentViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for laboratory departments.
    Departments drive staff/test visibility for department-level isolation.
    """

    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    search_fields = ["name", "description"]


# ---------------------------------------------------------------------------
# Role ViewSet (Admin only)
# ---------------------------------------------------------------------------
@extend_schema_view(
    list=extend_schema(summary="List all roles", tags=["Roles"]),
    retrieve=extend_schema(summary="Get role details", tags=["Roles"]),
    create=extend_schema(summary="Create a new role", tags=["Roles"]),
    update=extend_schema(summary="Update a role", tags=["Roles"]),
    partial_update=extend_schema(summary="Partially update a role", tags=["Roles"]),
    destroy=extend_schema(summary="Delete a role", tags=["Roles"]),
)
class RoleViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for system Roles.
    Only accessible by Admin users.
    """

    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    search_fields = ["role_name", "contact_alias"]


# ---------------------------------------------------------------------------
# User ViewSet (Admin only)
# ---------------------------------------------------------------------------
@extend_schema_view(
    list=extend_schema(summary="List all users", tags=["Users"]),
    retrieve=extend_schema(summary="Get user details", tags=["Users"]),
    create=extend_schema(summary="Create a new user", tags=["Users"]),
    update=extend_schema(summary="Update a user", tags=["Users"]),
    partial_update=extend_schema(summary="Partially update a user", tags=["Users"]),
    destroy=extend_schema(summary="Deactivate a user", tags=["Users"]),
)
class UserViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for system Users.
    Only accessible by Admin users.
    Soft-deletes users (sets is_active=False) instead of hard deletes.
    """

    queryset = User.objects.select_related("role", "department").all()
    permission_classes = [IsAuthenticated, IsAdmin]
    filterset_fields = [
        "user_type",
        "role__role_name",
        "department",
        "country",
        "organization_type",
        "is_active",
    ]
    search_fields = [
        "email",
        "username",
        "first_name",
        "last_name",
        "organization_name",
        "department__name",
    ]

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        if self.action in ("update", "partial_update"):
            return UserUpdateSerializer
        if self.action == "change_password":
            return ChangePasswordSerializer
        return UserSerializer

    def destroy(self, request, *args, **kwargs):
        """Soft-delete: set is_active=False instead of removing from DB."""
        user = self.get_object()
        user.is_active = False
        user.save(update_fields=["is_active"])
        return Response(
            {"detail": f"User '{user.email}' has been deactivated."},
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Change a user's password",
        tags=["Users"],
        request=ChangePasswordSerializer,
        responses={200: {"description": "Password updated successfully."}},
    )
    @action(detail=True, methods=["post"], url_path="change-password")
    def change_password(self, request, pk=None):
        """Admin-initiated password reset for a specific user."""
        user = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user.set_password(serializer.validated_data["new_password"])
        user.save()
        return Response(
            {"detail": f"Password updated for '{user.email}'."},
            status=status.HTTP_200_OK,
        )


# ---------------------------------------------------------------------------
# Profile View (Authenticated user views own profile)
# ---------------------------------------------------------------------------
@extend_schema(tags=["Profile"])
class ProfileView(generics.RetrieveAPIView):
    """
    Returns the authenticated user's own profile.
    Any authenticated user can access this.
    """

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


# ---------------------------------------------------------------------------
# Password Reset Views (Public email OTP flow)
# ---------------------------------------------------------------------------
@extend_schema(
    summary="Request a password reset OTP",
    tags=["auth"],
    request=PasswordResetRequestSerializer,
    responses={200: {"description": PASSWORD_RESET_SUCCESS}},
)
class PasswordResetRequestView(APIView):
    """
    Public endpoint for requesting a password reset OTP.
    Always returns a generic success message to avoid email enumeration.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        user = User.objects.filter(email=email, is_active=True).first()

        if user is not None:
            OTPToken.objects.filter(user=user, is_used=False).update(
                is_used=True,
                used_at=timezone.now(),
            )
            _, code = OTPToken.create_for_user(user)
            send_mail(
                subject="LSIMS password reset OTP",
                message=(
                    "Your LSIMS password reset code is "
                    f"{code}. This code expires in 15 minutes."
                ),
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                recipient_list=[user.email],
                fail_silently=False,
            )

        return Response({"detail": PASSWORD_RESET_SUCCESS}, status=status.HTTP_200_OK)


@extend_schema(
    summary="Confirm a password reset OTP",
    tags=["auth"],
    request=PasswordResetConfirmSerializer,
    responses={200: {"description": "Password reset successfully."}},
)
class PasswordResetConfirmView(APIView):
    """Public endpoint for confirming an OTP and setting a new password."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"detail": "Password reset successfully."},
            status=status.HTTP_200_OK,
        )
