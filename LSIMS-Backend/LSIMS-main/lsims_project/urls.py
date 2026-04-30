"""
LSIMS Project — Root URL Configuration
Includes JWT auth endpoints, Swagger docs, and accounts API.
"""

from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    # Django Admin
    path("admin/", admin.site.urls),
    # JWT + registration: /api/auth/register/, /api/auth/token/, etc.
    path("api/auth/", include("accounts.auth_urls")),
    # Accounts API (Roles, Users, Profile)
    path("api/accounts/", include("accounts.urls")),
    # Laboratory API (Tests, Jobs, Samples, Sample Tests)
    path("api/laboratory/", include("laboratory.urls")),
    # In-app notifications inbox
    path("api/notifications/", include("notifications.urls")),
    # API Documentation (Swagger / ReDoc)
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]
