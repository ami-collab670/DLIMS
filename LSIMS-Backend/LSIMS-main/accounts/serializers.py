"""
LSIMS Accounts — DRF Serializers
Handles Role CRUD, User CRUD (Admin), registration, and profile updates.
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import Department, OTPToken, Role

User = get_user_model()
DEPARTMENT_REQUIRED_ROLE_NAMES = {"analyst", "lab_technician", "qc_manager"}


def _validate_internal_role_and_department(attrs, instance=None):
    """Validate internal role and department requirements for user writes."""
    user_type = attrs.get(
        "user_type",
        instance.user_type if instance is not None else User.UserType.EXTERNAL,
    )
    role = attrs.get("role", instance.role if instance is not None else None)
    department = attrs.get(
        "department",
        instance.department if instance is not None else None,
    )

    if user_type == User.UserType.INTERNAL and role is None:
        raise serializers.ValidationError(
            {"role": "Internal users must be assigned a role."}
        )

    role_name = getattr(role, "role_name", None)
    if (
        user_type == User.UserType.INTERNAL
        and role_name in DEPARTMENT_REQUIRED_ROLE_NAMES
        and department is None
    ):
        raise serializers.ValidationError(
            {
                "department": (
                    "Department is required for Lab Analysts and "
                    "Lab Technicians and Department Managers."
                )
            }
        )

    return attrs


class DepartmentSerializer(serializers.ModelSerializer):
    """Laboratory department/section used for access isolation."""

    class Meta:
        model = Department
        fields = ["id", "name", "description", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class RoleSerializer(serializers.ModelSerializer):
    """Full Role serializer for Admin CRUD."""

    class Meta:
        model = Role
        fields = ["id", "role_name", "contact_alias"]
        read_only_fields = ["id"]


class RoleListSerializer(serializers.ModelSerializer):
    """Lightweight Role representation for nested displays."""

    display_name = serializers.CharField(source="get_role_name_display", read_only=True)

    class Meta:
        model = Role
        fields = ["id", "role_name", "display_name", "contact_alias"]
        read_only_fields = fields


class UserSerializer(serializers.ModelSerializer):
    """Full User serializer for Admin read/list views."""

    role_detail = RoleListSerializer(source="role", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "user_type",
            "role",
            "role_detail",
            "department",
            "country",
            "nationality",
            "organization_name",
            "organization_type",
            "is_active",
            "is_superuser",
            "date_joined",
        ]
        read_only_fields = ["id", "date_joined", "is_superuser"]


class ProfileSelfSerializer(serializers.ModelSerializer):
    """
    Authenticated user's own profile — read/update safe fields only.
    Identity, role, and account status are read-only.
    """

    role_detail = RoleListSerializer(source="role", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "user_type",
            "role",
            "role_detail",
            "department",
            "country",
            "nationality",
            "organization_name",
            "organization_type",
            "is_active",
            "is_superuser",
            "date_joined",
        ]
        read_only_fields = [
            "id",
            "username",
            "email",
            "user_type",
            "role",
            "role_detail",
            "department",
            "country",
            "is_active",
            "is_superuser",
            "date_joined",
        ]


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new users (Admin only)."""

    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "phone",
            "user_type",
            "role",
            "department",
            "country",
            "nationality",
            "organization_name",
            "organization_type",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        return _validate_internal_role_and_department(attrs)

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating existing users (Admin only)."""

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "user_type",
            "role",
            "department",
            "country",
            "nationality",
            "organization_name",
            "organization_type",
            "is_active",
        ]

    def validate(self, attrs):
        return _validate_internal_role_and_department(attrs, self.instance)


class ChangePasswordSerializer(serializers.Serializer):
    """For Admin-initiated password resets."""

    new_password = serializers.CharField(write_only=True, min_length=8)

    def update(self, instance, validated_data):
        instance.set_password(validated_data["new_password"])
        instance.save()
        return instance


class SelfChangePasswordSerializer(serializers.Serializer):
    """Authenticated self-service password change."""

    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate_new_password(self, value):
        validate_password(value, self.context["request"].user)
        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    """Request an email OTP for password reset."""

    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Confirm an email OTP and set a new password."""

    default_error = "Invalid or expired OTP."

    email = serializers.EmailField()
    otp = serializers.CharField(min_length=6, max_length=6)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_otp(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("OTP must be a 6-digit code.")
        return value

    def validate_new_password(self, value):
        validate_password(value)
        return value

    def validate(self, attrs):
        user = User.objects.filter(email=attrs["email"], is_active=True).first()
        if user is None:
            raise serializers.ValidationError({"otp": self.default_error})

        token = (
            OTPToken.objects.filter(user=user, is_used=False)
            .order_by("-created_at")
            .first()
        )
        if token is None or token.is_expired() or not token.matches(attrs["otp"]):
            raise serializers.ValidationError({"otp": self.default_error})

        attrs["user"] = user
        attrs["token"] = token
        return attrs

    def save(self, **kwargs):
        user = self.validated_data["user"]
        token = self.validated_data["token"]
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        token.mark_used()
        return user


class UserRegisterSerializer(serializers.ModelSerializer):
    """
    Public registration for external (client) accounts.
    Username is set to the email so the account satisfies AbstractUser constraints.
    """

    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            "email",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
            "phone",
            "nationality",
            "organization_name",
            "organization_type",
        ]

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        email = validated_data.pop("email").strip().lower()
        user = User(
            username=email,
            email=email,
            user_type=User.UserType.EXTERNAL,
            **validated_data,
        )
        user.set_password(password)
        user.save()
        return user
