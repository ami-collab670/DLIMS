"""
LSIMS Accounts — DRF Serializers
Handles Role CRUD, User CRUD (Admin), and User Registration.
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Role

User = get_user_model()


# ---------------------------------------------------------------------------
# Role Serializers
# ---------------------------------------------------------------------------
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


# ---------------------------------------------------------------------------
# User Serializers
# ---------------------------------------------------------------------------
class UserSerializer(serializers.ModelSerializer):
    """
    Full User serializer for Admin read/list views.
    Exposes role details inline.
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
            "is_active",
            "is_superuser",
            "date_joined",
        ]


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new users (Admin only).
    Accepts a password and hashes it properly.
    """
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
            "nationality",
            "organization_name",
            "organization_type",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        """Ensure internal users have a role assigned."""
        user_type = attrs.get("user_type", "external")
        role = attrs.get("role")
        if user_type == "internal" and role is None:
            raise serializers.ValidationError(
                {"role": "Internal users must be assigned a role."}
            )
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating existing users (Admin only).
    Password updates are handled separately.
    """

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
            "nationality",
            "organization_name",
            "organization_type",
            "is_active",
        ]

    def validate(self, attrs):
        """Ensure internal users have a role assigned."""
        user_type = attrs.get("user_type", self.instance.user_type if self.instance else "external")
        role = attrs.get("role", self.instance.role if self.instance else None)
        if user_type == "internal" and role is None:
            raise serializers.ValidationError(
                {"role": "Internal users must be assigned a role."}
            )
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    """For Admin-initiated password resets."""
    new_password = serializers.CharField(write_only=True, min_length=8)

    def update(self, instance, validated_data):
        instance.set_password(validated_data["new_password"])
        instance.save()
        return instance


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
