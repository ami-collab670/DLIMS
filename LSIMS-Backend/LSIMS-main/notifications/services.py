"""Helpers for creating notifications from other apps (avoid circular imports in callers)."""

from __future__ import annotations

from typing import Any

from django.contrib.auth import get_user_model

from .models import Notification

User = get_user_model()


def create_notification_for_user(
    user_id,
    *,
    title: str,
    body: str,
    kind: str = Notification.Kind.INFO,
    metadata: dict[str, Any] | None = None,
) -> Notification:
    if not User.objects.filter(pk=user_id).exists():
        raise ValueError(f"Unknown user id={user_id}")
    return Notification.objects.create(
        recipient_id=user_id,
        title=title[:200],
        body=body,
        kind=kind,
        metadata=metadata or {},
    )
