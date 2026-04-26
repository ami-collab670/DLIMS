"""
LSIMS Laboratory — Django Admin Registration
Sprint 2: Core Engine (Jobs, Samples & Blind Aliasing)
"""

from django.contrib import admin
from .models import FinancialRecord, TestCatalog, JobOrder, BlindCode, Sample, SampleTest


@admin.register(TestCatalog)
class TestCatalogAdmin(admin.ModelAdmin):
    list_display = ["test_code", "test_name", "department", "unit", "price", "is_active"]
    list_filter = ["department", "is_active"]
    search_fields = ["test_name", "test_code", "department__name"]
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


@admin.register(FinancialRecord)
class FinancialRecordAdmin(admin.ModelAdmin):
    list_display = [
        "invoice_no",
        "job",
        "amount_expected",
        "amount_paid",
        "payment_status",
        "paid_at",
        "created_at",
    ]
    list_filter = ["payment_status", "created_at", "paid_at"]
    search_fields = ["invoice_no", "job__description", "job__client__email"]
    raw_id_fields = ["job"]
    readonly_fields = ["invoice_no", "paid_at", "created_at", "updated_at"]
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
        "received_by",
        "submitted_by",
        "assigned_analyst",
    ]
    readonly_fields = ["blind_alias", "sample_code", "created_at", "updated_at"]
    ordering = ["-created_at"]


@admin.register(SampleTest)
class SampleTestAdmin(admin.ModelAdmin):
    list_display = ["sample", "test", "created_at"]
    raw_id_fields = ["sample", "test"]
    ordering = ["-created_at"]
