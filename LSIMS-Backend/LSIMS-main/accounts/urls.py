"""
LSIMS Accounts — URL routing
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LabAnalystListView,
    LabClientListView,
    RoleViewSet,
    UserViewSet,
    ProfileView,
)

router = DefaultRouter()
router.register(r"roles", RoleViewSet, basename="role")
router.register(r"users", UserViewSet, basename="user")

urlpatterns = [
    path("clients/", LabClientListView.as_view(), name="lab-client-list"),
    path("analysts/", LabAnalystListView.as_view(), name="lab-analyst-list"),
    path("", include(router.urls)),
    path("profile/", ProfileView.as_view(), name="profile"),
]
