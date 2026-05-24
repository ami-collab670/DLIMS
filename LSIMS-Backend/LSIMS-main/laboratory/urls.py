"""
LSIMS Laboratory — URL Routing
Sprint 2: Core Engine (Jobs, Samples & Blind Aliasing)
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TestCatalogViewSet,
    JobOrderViewSet,
    SampleViewSet,
    SampleTestViewSet,
)

router = DefaultRouter()
router.register(r"tests", TestCatalogViewSet, basename="testcatalog")
router.register(r"jobs", JobOrderViewSet, basename="joborder")
router.register(r"samples", SampleViewSet, basename="sample")
router.register(r"sample-tests", SampleTestViewSet, basename="sampletest")

urlpatterns = [
    path("", include(router.urls)),
]
