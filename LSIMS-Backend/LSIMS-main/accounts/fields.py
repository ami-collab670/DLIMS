"""
DRF fields for referencing users by email (primary) or legacy UUID pk.
"""

from __future__ import annotations

import uuid

from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserIdentityField(serializers.Field):
    """
    Writable: user email (case-insensitive) or UUID primary key.
    Read: always the user's email address (or null).
    """

    default_error_messages = {
        "invalid": "No matching user for this email or id.",
        "required": "This field is required.",
    }

    def __init__(self, **kwargs):
        self.allow_null = kwargs.pop("allow_null", False)
        super().__init__(**kwargs)

    def to_internal_value(self, data):
        if data is None or data == "":
            if self.allow_null:
                return None
            self.fail("required")
        s = str(data).strip()
        if not s:
            if self.allow_null:
                return None
            self.fail("required")
        if "@" in s:
            u = User.objects.filter(email__iexact=s).first()
            if not u:
                self.fail("invalid")
            return u
        try:
            uuid.UUID(s)
        except ValueError:
            self.fail("invalid")
        u = User.objects.filter(pk=s).first()
        if not u:
            self.fail("invalid")
        return u

    def to_representation(self, value):
        if value is None:
            return None
        if hasattr(value, "email"):
            return value.email
        return str(value)
