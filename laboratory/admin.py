"""
LSIMS Laboratory — Django Admin Registration
Sprint 2: Core Engine (Jobs, Samples & Blind Aliasing)
"""

from django.contrib import admin
from .models import (
    FinancialRecord,
    TestCatalog,
    JobOrder,
    AnalysisResult,
    BlindCode,
    CalibrationRecord,
    ComplaintRecord,
    DiscountApproval,
    PreparationRecord,
    QCDecision,
    Sample,
    SampleTest,
)


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
        "payment_required",
        "waiver_approved_by",
        "paid_at",
        "created_at",
    ]
    list_filter = ["payment_status", "payment_required", "created_at", "paid_at"]
    search_fields = ["invoice_no", "job__description", "job__client__email"]
    raw_id_fields = ["job", "waiver_approved_by"]
    readonly_fields = [
        "invoice_no",
        "paid_at",
        "waiver_approved_at",
        "created_at",
        "updated_at",
    ]
    ordering = ["-created_at"]


@admin.register(PreparationRecord)
class PreparationRecordAdmin(admin.ModelAdmin):
    list_display = [
        "reference_code",
        "sample",
        "technician",
        "status",
        "started_at",
        "completed_at",
        "created_at",
    ]
    list_filter = ["status", "started_at", "completed_at", "created_at"]
    search_fields = ["reference_code", "sample__sample_code", "sample__sample_name"]
    raw_id_fields = ["sample", "technician", "created_by"]
    readonly_fields = [
        "reference_code",
        "started_at",
        "completed_at",
        "created_at",
        "updated_at",
    ]
    ordering = ["-created_at"]


@admin.register(AnalysisResult)
class AnalysisResultAdmin(admin.ModelAdmin):
    list_display = [
        "sample_test",
        "analyst",
        "state",
        "revision",
        "submitted_at",
        "approved_at",
        "updated_at",
    ]
    list_filter = ["state", "submitted_at", "approved_at", "created_at"]
    search_fields = [
        "sample_test__sample__sample_code",
        "sample_test__test__test_code",
        "analyst__email",
    ]
    raw_id_fields = ["sample_test", "analyst"]
    readonly_fields = [
        "submitted_at",
        "approved_at",
        "rejected_at",
        "created_at",
        "updated_at",
    ]
    ordering = ["-created_at"]


@admin.register(CalibrationRecord)
class CalibrationRecordAdmin(admin.ModelAdmin):
    list_display = [
        "instrument_name",
        "analysis_result",
        "calibration_reference",
        "calibration_date",
        "recorded_by",
        "created_at",
    ]
    list_filter = ["calibration_date", "created_at"]
    search_fields = [
        "instrument_name",
        "calibration_reference",
        "analysis_result__sample_test__sample__sample_code",
    ]
    raw_id_fields = ["analysis_result", "recorded_by"]
    readonly_fields = ["created_at", "updated_at"]
    ordering = ["-created_at"]


@admin.register(QCDecision)
class QCDecisionAdmin(admin.ModelAdmin):
    list_display = ["analysis_result", "decision", "decided_by", "decided_at"]
    list_filter = ["decision", "decided_at"]
    search_fields = [
        "analysis_result__sample_test__sample__sample_code",
        "decided_by__email",
        "reason",
    ]
    raw_id_fields = ["analysis_result", "decided_by"]
    readonly_fields = ["decided_at"]
    ordering = ["-decided_at"]


@admin.register(ComplaintRecord)
class ComplaintRecordAdmin(admin.ModelAdmin):
    list_display = [
        "client",
        "category",
        "status",
        "job",
        "sample",
        "resolved_by",
        "resolved_at",
        "created_at",
    ]
    list_filter = ["category", "status", "resolved_at", "created_at"]
    search_fields = [
        "client__email",
        "description",
        "resolution",
        "job__description",
        "sample__sample_code",
    ]
    raw_id_fields = ["client", "job", "sample", "created_by", "resolved_by"]
    readonly_fields = ["resolved_at", "created_at", "updated_at"]
    ordering = ["-created_at"]


@admin.register(DiscountApproval)
class DiscountApprovalAdmin(admin.ModelAdmin):
    list_display = [
        "job",
        "discount_type",
        "status",
        "requested_by",
        "reviewed_by",
        "reviewed_at",
        "created_at",
    ]
    list_filter = ["discount_type", "status", "reviewed_at", "created_at"]
    search_fields = ["job__description", "job__client__email", "reason", "review_note"]
    raw_id_fields = ["job", "requested_by", "reviewed_by"]
    readonly_fields = ["reviewed_at", "created_at", "updated_at"]
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
