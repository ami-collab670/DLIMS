from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["title", "recipient", "kind", "read_at", "created_at"]
    list_filter = ["kind", "read_at", "created_at"]
    search_fields = ["title", "body", "recipient__email"]
    readonly_fields = ["id", "created_at"]
    date_hierarchy = "created_at"
