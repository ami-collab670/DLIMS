from django.utils import timezone
from rest_framework import serializers

from accounts.fields import UserIdentityField

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    is_read = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "title",
            "body",
            "kind",
            "metadata",
            "read_at",
            "is_read",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "title",
            "body",
            "kind",
            "metadata",
            "read_at",
            "is_read",
            "created_at",
        ]

    def get_is_read(self, obj: Notification) -> bool:
        return obj.read_at is not None


class NotificationPartialUpdateSerializer(serializers.ModelSerializer):
    """PATCH: toggle read state via boolean ``read``."""

    read = serializers.BooleanField(write_only=True, required=False)

    class Meta:
        model = Notification
        fields = ["read"]

    def update(self, instance, validated_data):
        read = validated_data.pop("read", None)
        if read is True:
            instance.read_at = timezone.now()
        elif read is False:
            instance.read_at = None
        instance.save(update_fields=["read_at"])
        return instance


class NotificationCreateSerializer(serializers.ModelSerializer):
    """Staff: send a notification to a specific user (``recipient`` = email or legacy UUID)."""

    recipient = UserIdentityField()

    class Meta:
        model = Notification
        fields = ["recipient", "title", "body", "kind", "metadata"]

    def validate_title(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Title is required.")
        return value

    def validate_body(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Body is required.")
        return value
