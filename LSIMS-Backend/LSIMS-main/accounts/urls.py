"""
LSIMS Accounts — URL routing
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    DepartmentViewSet,
    LabAnalystListView,
    LabClientListView,
    ProfilePasswordChangeView,
    ProfileView,
    RoleViewSet,
    UserViewSet,
)

router = DefaultRouter()
router.register(r"departments", DepartmentViewSet, basename="department")
router.register(r"roles", RoleViewSet, basename="role")
router.register(r"users", UserViewSet, basename="user")

urlpatterns = [
    path("clients/", LabClientListView.as_view(), name="lab-client-list"),
    path("analysts/", LabAnalystListView.as_view(), name="lab-analyst-list"),
    path("", include(router.urls)),
    path("profile/", ProfileView.as_view(), name="profile"),
    path(
        "profile/change-password/",
        ProfilePasswordChangeView.as_view(),
        name="profile-change-password",
    ),
]
