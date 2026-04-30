"""
LSIMS Laboratory — App Configuration
Sprint 2: Core Engine (Jobs, Samples & Blind Aliasing)
"""

from django.apps import AppConfig


class LaboratoryConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "laboratory"
    verbose_name = "Laboratory — Jobs, Samples & Blind Aliasing"
