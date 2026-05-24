from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import IsAdminOrReceptionist

from .models import Notification
from .serializers import (
    NotificationCreateSerializer,
    NotificationPartialUpdateSerializer,
    NotificationSerializer,
)


@extend_schema_view(
    list=extend_schema(summary="List my notifications", tags=["Notifications"]),
    retrieve=extend_schema(summary="Get notification", tags=["Notifications"]),
    create=extend_schema(summary="Send notification (admin/receptionist)", tags=["Notifications"]),
    partial_update=extend_schema(summary="Mark read/unread", tags=["Notifications"]),
    destroy=extend_schema(summary="Delete notification", tags=["Notifications"]),
)
class NotificationViewSet(viewsets.ModelViewSet):
    """
    Users see and manage only their own inbox.
    Creating notifications is limited to admin/receptionist (e.g. messaging a client).
    """

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["kind"]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_permissions(self):
        if self.action == "create":
            return [IsAuthenticated(), IsAdminOrReceptionist()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = Notification.objects.filter(recipient=self.request.user)
        unread = self.request.query_params.get("unread")
        if unread == "1":
            qs = qs.filter(read_at__isnull=True)
        elif unread == "0":
            qs = qs.filter(read_at__isnull=False)
        return qs

    def get_serializer_class(self):
        if self.action == "create":
            return NotificationCreateSerializer
        if self.action in ("partial_update", "update"):
            return NotificationPartialUpdateSerializer
        return NotificationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        instance = serializer.instance
        out = NotificationSerializer(instance, context=self.get_serializer_context())
        headers = self.get_success_headers(out.data)
        return Response(out.data, status=status.HTTP_201_CREATED, headers=headers)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        ser = NotificationPartialUpdateSerializer(
            instance,
            data=request.data,
            partial=True,
            context=self.get_serializer_context(),
        )
        ser.is_valid(raise_exception=True)
        ser.save()
        instance.refresh_from_db()
        return Response(
            NotificationSerializer(instance, context=self.get_serializer_context()).data,
        )

    @extend_schema(
        responses={200: {"type": "object", "properties": {"count": {"type": "integer"}}}},
        tags=["Notifications"],
    )
    @action(detail=False, methods=["get"], url_path="unread-count")
    def unread_count(self, request):
        n = Notification.objects.filter(
            recipient=request.user,
            read_at__isnull=True,
        ).count()
        return Response({"count": n})

    @extend_schema(
        request=None,
        responses={200: {"type": "object", "properties": {"updated": {"type": "integer"}}}},
        tags=["Notifications"],
    )
    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request):
        updated = Notification.objects.filter(
            recipient=request.user,
            read_at__isnull=True,
        ).update(read_at=timezone.now())
        return Response({"updated": updated}, status=status.HTTP_200_OK)

    @extend_schema(
        request=None,
        responses={200: {"type": "object", "properties": {"updated": {"type": "integer"}}}},
        tags=["Notifications"],
    )
    @action(detail=False, methods=["post"], url_path="mark-all-unread")
    def mark_all_unread(self, request):
        updated = Notification.objects.filter(
            recipient=request.user,
            read_at__isnull=False,
        ).update(read_at=None)
        return Response({"updated": updated}, status=status.HTTP_200_OK)
