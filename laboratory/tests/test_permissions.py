"""Permission tests for laboratory endpoints."""

from django.urls import reverse
from rest_framework import status

from .base import BaseTestCase


class PermissionTests(BaseTestCase):
    """Verify that roles cannot perform actions outside their scope."""

    def test_analyst_cannot_create_job_order(self):
        client = self.get_authenticated_client("analyst_lab@ministry.gov", "AnalystPass123!")
        response = client.post(
            reverse("joborder-list"),
            {"client": str(self.client_user.id), "priority": "normal"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_client_cannot_create_job_order(self):
        client = self.get_authenticated_client("client_lab@minerals.com", "ClientPass123!")
        response = client.post(
            reverse("joborder-list"),
            {"client": str(self.client_user.id), "priority": "normal"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_finance_cannot_create_job_order(self):
        client = self.get_authenticated_client("finance_lab@ministry.gov", "FinancePass123!")
        response = client.post(
            reverse("joborder-list"),
            {"client": str(self.client_user.id), "priority": "normal"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_cannot_create_job_order(self):
        client = self.get_authenticated_client("admin_lab@ministry.gov", "AdminPass123!")
        response = client.post(
            reverse("joborder-list"),
            {"client": str(self.client_user.id), "priority": "normal"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_analyst_cannot_create_sample(self):
        client = self.get_authenticated_client("analyst_lab@ministry.gov", "AnalystPass123!")
        job = self._create_job_order()
        response = client.post(
            reverse("sample-list"),
            {
                "job": str(job.id),
                "sample_name": "Unauthorized Sample",
                "submitted_by": str(self.client_user.id),
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_client_cannot_create_sample(self):
        client = self.get_authenticated_client("client_lab@minerals.com", "ClientPass123!")
        job = self._create_job_order()
        response = client.post(
            reverse("sample-list"),
            {
                "job": str(job.id),
                "sample_name": "Unauthorized Sample",
                "submitted_by": str(self.client_user.id),
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_cannot_create_sample(self):
        client = self.get_authenticated_client("admin_lab@ministry.gov", "AdminPass123!")
        job = self._create_job_order()
        response = client.post(
            reverse("sample-list"),
            {
                "job": str(job.id),
                "sample_name": "Admin Intake Blocked",
                "submitted_by": str(self.client_user.id),
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_receptionist_cannot_create_test_catalog(self):
        client = self.get_authenticated_client(
            "receptionist_lab@ministry.gov", "ReceptionistPass123!"
        )
        response = client.post(
            reverse("testcatalog-list"),
            {"test_name": "New Test", "test_code": "NT-01", "unit": "ppm", "price": "100.00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_analyst_cannot_create_test_catalog(self):
        client = self.get_authenticated_client("analyst_lab@ministry.gov", "AnalystPass123!")
        response = client.post(
            reverse("testcatalog-list"),
            {"test_name": "New Test", "test_code": "NT-01", "unit": "ppm", "price": "100.00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_analyst_cannot_assign_sample_test(self):
        client = self.get_authenticated_client("analyst_lab@ministry.gov", "AnalystPass123!")
        sample = self._create_sample(analyst=self.analyst_user)
        response = client.post(
            reverse("sampletest-list"),
            {"sample": str(sample.id), "test": str(self.test_gold.id)},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_client_cannot_update_job_order(self):
        client = self.get_authenticated_client("client_lab@minerals.com", "ClientPass123!")
        job = self._create_job_order()
        response = client.patch(
            reverse("joborder-detail", args=[job.id]),
            {"priority": "urgent"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
