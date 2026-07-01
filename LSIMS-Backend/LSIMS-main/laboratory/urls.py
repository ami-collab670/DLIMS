"""
LSIMS Laboratory ΓÇö URL Routing
Sprint 2: Core Engine (Jobs, Samples & Blind Aliasing)
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AnalysisResultViewSet,
    CalibrationRecordViewSet,
    ComplaintRecordViewSet,
    DiscountApprovalViewSet,
    FinancialRecordViewSet,
    TestCatalogViewSet,
    JobOrderViewSet,
    PreparationRecordViewSet,
    PriorityAlertViewSet,
    QCDecisionViewSet,
    SampleViewSet,
    SampleTestViewSet,
)

router = DefaultRouter()
router.register(r"tests", TestCatalogViewSet, basename="testcatalog")
router.register(r"jobs", JobOrderViewSet, basename="joborder")
router.register(r"samples", SampleViewSet, basename="sample")
router.register(r"sample-tests", SampleTestViewSet, basename="sampletest")
router.register(
    r"preparation-records",
    PreparationRecordViewSet,
    basename="preparationrecord",
)
router.register(r"analysis-results", AnalysisResultViewSet, basename="analysisresult")
router.register(
    r"calibration-records",
    CalibrationRecordViewSet,
    basename="calibrationrecord",
)
router.register(r"qc-decisions", QCDecisionViewSet, basename="qcdecision")
router.register(r"complaints", ComplaintRecordViewSet, basename="complaint")
router.register(
    r"discount-approvals",
    DiscountApprovalViewSet,
    basename="discountapproval",
)
router.register(r"priority-alerts", PriorityAlertViewSet, basename="priorityalert")
router.register(r"financial-records", FinancialRecordViewSet, basename="financialrecord")

urlpatterns = [
    path("", include(router.urls)),
]
