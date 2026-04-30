"""
Shared fixtures and helpers for laboratory tests.
"""

from decimal import Decimal

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import Role, User
from laboratory.models import JobOrder, TestCatalog, Sample


class BaseTestCase(TestCase):
    """
    Shared setup for all laboratory tests.
    Creates roles, users (admin, receptionist, analyst, client, finance),
    and provides a JWT-based authentication helper.
    """

    @classmethod
    def setUpTestData(cls):
        """Create shared test fixtures (roles, users, test catalog entries)."""
        cls.admin_role = Role.objects.get(role_name="admin")
        cls.receptionist_role = Role.objects.get(role_name="receptionist")
        cls.analyst_role = Role.objects.get(role_name="analyst")
        cls.qc_role = Role.objects.get(role_name="qc_manager")
        cls.finance_role = Role.objects.get(role_name="finance")
        cls.auditor_role = Role.objects.get(role_name="auditor")

        cls.admin_user = User.objects.create_user(
            username="admin_lab",
            email="admin_lab@ministry.gov",
            password="AdminPass123!",
            user_type="internal",
            role=cls.admin_role,
        )
        cls.receptionist_user = User.objects.create_user(
            username="receptionist_lab",
            email="receptionist_lab@ministry.gov",
            password="ReceptionistPass123!",
            user_type="internal",
            role=cls.receptionist_role,
        )
        cls.analyst_user = User.objects.create_user(
            username="analyst_lab",
            email="analyst_lab@ministry.gov",
            password="AnalystPass123!",
            user_type="internal",
            role=cls.analyst_role,
        )
        cls.analyst_user_2 = User.objects.create_user(
            username="analyst_lab_2",
            email="analyst_lab_2@ministry.gov",
            password="AnalystPass123!",
            user_type="internal",
            role=cls.analyst_role,
        )
        cls.qc_user = User.objects.create_user(
            username="qc_lab",
            email="qc_lab@ministry.gov",
            password="QCPass123!",
            user_type="internal",
            role=cls.qc_role,
        )
        cls.finance_user = User.objects.create_user(
            username="finance_lab",
            email="finance_lab@ministry.gov",
            password="FinancePass123!",
            user_type="internal",
            role=cls.finance_role,
        )
        cls.auditor_user = User.objects.create_user(
            username="auditor_lab",
            email="auditor_lab@ministry.gov",
            password="AuditorPass123!",
            user_type="internal",
            role=cls.auditor_role,
        )
        cls.external_superuser = User.objects.create_superuser(
            username="external_superuser_lab",
            email="external_superuser_lab@ministry.gov",
            password="SuperuserPass123!",
        )

        cls.client_user = User.objects.create_user(
            username="client_lab",
            email="client_lab@minerals.com",
            password="ClientPass123!",
            user_type="external",
        )
        cls.client_user_2 = User.objects.create_user(
            username="client_lab_2",
            email="client_lab_2@minerals.com",
            password="ClientPass123!",
            user_type="external",
        )

        cls.test_gold = TestCatalog.objects.create(
            test_name="Gold Fire Assay",
            test_code="GFA-01",
            description="Fire assay for gold content determination.",
            unit="ppm",
            price=Decimal("500.00"),
        )
        cls.test_silver = TestCatalog.objects.create(
            test_name="Silver Analysis",
            test_code="SLV-01",
            description="Atomic absorption for silver content.",
            unit="ppm",
            price=Decimal("350.00"),
        )
        cls.test_inactive = TestCatalog.objects.create(
            test_name="Deprecated Test",
            test_code="DEP-01",
            description="This test is no longer offered.",
            unit="mg/kg",
            price=Decimal("100.00"),
            is_active=False,
        )

    def get_authenticated_client(self, email, password):
        """Obtain a real JWT token and return an authenticated APIClient."""
        client = APIClient()
        response = client.post(
            reverse("token_obtain_pair"),
            {"email": email, "password": password},
            format="json",
        )
        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            f"Auth failed for {email}: {response.data}",
        )
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
        return client

    def _create_job_order(self, client_user=None, submitted_by=None):
        """Helper to create a JobOrder directly in the DB."""
        return JobOrder.objects.create(
            client=client_user or self.client_user,
            submitted_by=submitted_by or self.receptionist_user,
            current_status=JobOrder.Status.RECEIVED,
            priority=JobOrder.Priority.NORMAL,
            description="Test job order",
        )

    def _create_sample(self, job=None, analyst=None):
        """Helper to create a Sample directly in the DB (triggers auto-generation)."""
        return Sample.objects.create(
            job=job or self._create_job_order(),
            sample_name="Test Quartz Sample",
            sample_weight=Decimal("150.500"),
            packaging_type="Sealed Bag",
            received_by=self.receptionist_user,
            submitted_by=self.client_user,
            assigned_analyst=analyst,
        )
