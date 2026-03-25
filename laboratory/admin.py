"""
LSIMS Laboratory — Django Admin Registration
Sprint 2: Core Engine (Jobs, Samples & Blind Aliasing)
"""

from django.contrib import admin
from .models import TestCatalog, JobOrder, BlindCode, Sample, SampleTest


@admin.register(TestCatalog)
class TestCatalogAdmin(admin.ModelAdmin):
    list_display = ["test_code", "test_name", "unit", "price", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["test_name", "test_code"]
    ordering = ["test_code"]


@admin.register(JobOrder)
class JobOrderAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "client",
        "current_status",
        "priority",
        "is_cancelled",
        "created_at",
    ]
    list_filter = ["current_status", "priority", "is_cancelled"]
    search_fields = ["description"]
    raw_id_fields = ["client", "submitted_by", "blocked_by_role"]
    ordering = ["-created_at"]


@admin.register(BlindCode)
class BlindCodeAdmin(admin.ModelAdmin):
    list_display = ["code", "created_at"]
    search_fields = ["code"]
    ordering = ["-created_at"]


@admin.register(Sample)
class SampleAdmin(admin.ModelAdmin):
    list_display = [
        "sample_code",
        "sample_name",
        "blind_alias",
        "sample_status",
        "assigned_analyst",
        "created_at",
    ]
    list_filter = ["sample_status"]
    search_fields = ["sample_code", "sample_name"]
    raw_id_fields = [
        "job",
        "blind_alias",
        "received_by",
        "submitted_by",
        "assigned_analyst",
    ]
    ordering = ["-created_at"]


@admin.register(SampleTest)
class SampleTestAdmin(admin.ModelAdmin):
    list_display = ["sample", "test", "created_at"]
    raw_id_fields = ["sample", "test"]
    ordering = ["-created_at"]
