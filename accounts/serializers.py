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
            "date_joined",
        ]
        read_only_fields = ["id", "date_joined"]


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
