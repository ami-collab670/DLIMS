"""
LSIMS Accounts — DRF Views
Admin CRUD, registration, profile, and password reset flows.
"""

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Department, OTPToken, Role
from .permissions import IsAdmin, IsAdminOrReceptionist
from .serializers import (
    ChangePasswordSerializer,
    DepartmentSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    ProfileSelfSerializer,
    RoleSerializer,
    SelfChangePasswordSerializer,
    UserCreateSerializer,
    UserRegisterSerializer,
    UserSerializer,
    UserUpdateSerializer,
)

User = get_user_model()

PASSWORD_RESET_SUCCESS = (
    "If an active account exists for that email, a password reset OTP has been sent."
)


@extend_schema_view(
    list=extend_schema(summary="List all departments", tags=["Departments"]),
    retrieve=extend_schema(summary="Get department details", tags=["Departments"]),
    create=extend_schema(summary="Create a new department", tags=["Departments"]),
    update=extend_schema(summary="Update a department", tags=["Departments"]),
    partial_update=extend_schema(summary="Partially update a department", tags=["Departments"]),
    destroy=extend_schema(summary="Delete a department", tags=["Departments"]),
)
class DepartmentViewSet(viewsets.ModelViewSet):
    """CRUD operations for laboratory departments."""

    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    search_fields = ["name", "description"]


@extend_schema_view(
    list=extend_schema(summary="List all roles", tags=["Roles"]),
    retrieve=extend_schema(summary="Get role details", tags=["Roles"]),
    create=extend_schema(summary="Create a new role", tags=["Roles"]),
    update=extend_schema(summary="Update a role", tags=["Roles"]),
    partial_update=extend_schema(summary="Partially update a role", tags=["Roles"]),
    destroy=extend_schema(summary="Delete a role", tags=["Roles"]),
)
class RoleViewSet(viewsets.ModelViewSet):
    """CRUD operations for system Roles."""

    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    search_fields = ["role_name", "contact_alias"]


@extend_schema_view(
    list=extend_schema(summary="List all users", tags=["Users"]),
    retrieve=extend_schema(summary="Get user details", tags=["Users"]),
    create=extend_schema(summary="Create a new user", tags=["Users"]),
    update=extend_schema(summary="Update a user", tags=["Users"]),
    partial_update=extend_schema(summary="Partially update a user", tags=["Users"]),
    destroy=extend_schema(summary="Deactivate a user", tags=["Users"]),
)
class UserViewSet(viewsets.ModelViewSet):
    """CRUD operations for system Users."""

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
        user = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user.set_password(serializer.validated_data["new_password"])
        user.save()
        return Response(
            {"detail": f"Password updated for '{user.email}'."},
            status=status.HTTP_200_OK,
        )


@extend_schema_view(
    get=extend_schema(tags=["Profile"], summary="Get my profile"),
    put=extend_schema(tags=["Profile"], summary="Replace my profile (editable fields)"),
    patch=extend_schema(tags=["Profile"], summary="Update my profile"),
)
class ProfileView(generics.RetrieveUpdateAPIView):
    """Returns and updates the authenticated user's own profile."""

    serializer_class = ProfileSelfSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "put", "patch", "head", "options"]

    def get_object(self):
        return self.request.user


@extend_schema(
    summary="Change the authenticated user's password",
    tags=["Profile"],
    request=SelfChangePasswordSerializer,
    responses={200: {"description": "Password changed successfully."}},
)
class ProfilePasswordChangeView(APIView):
    """Authenticated endpoint for users changing their own password."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SelfChangePasswordSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"detail": "Password changed successfully."},
            status=status.HTTP_200_OK,
        )


@extend_schema(
    summary="List active lab analysts (for sample assignment)",
    tags=["Users"],
)
class LabAnalystListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReceptionist]
    pagination_class = None

    def get_queryset(self):
        return (
            User.objects.filter(
                user_type="internal",
                is_active=True,
                role__role_name="analyst",
            )
            .select_related("role")
            .order_by("email")
        )


@extend_schema(
    summary="List active external clients (job & sample intake)",
    tags=["Users"],
)
class LabClientListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReceptionist]
    pagination_class = None

    def get_queryset(self):
        return (
            User.objects.filter(user_type="external", is_active=True)
            .select_related("role")
            .order_by("email")
        )


@extend_schema(
    summary="Register a new external (client) account",
    tags=["Authentication"],
    request=UserRegisterSerializer,
)
class RegisterView(generics.CreateAPIView):
    """Create a new external user and return JWT tokens."""

    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        payload = {
            "user": UserSerializer(user).data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }
        return Response(payload, status=status.HTTP_201_CREATED)


@extend_schema(
    summary="Request a password reset OTP",
    tags=["auth"],
    request=PasswordResetRequestSerializer,
    responses={200: {"description": PASSWORD_RESET_SUCCESS}},
)
class PasswordResetRequestView(APIView):
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
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"detail": "Password reset successfully."},
            status=status.HTTP_200_OK,
        )
