"""Permission tests for laboratory endpoints."""

from django.urls import reverse
from rest_framework import status

from laboratory.models import JobOrder

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

    def test_client_can_create_self_service_job_request(self):
        client = self.get_authenticated_client("client_lab@minerals.com", "ClientPass123!")
        response = client.post(
            reverse("joborder-list"),
            {
                "description": "Client-submitted request: assay batch Q1.",
                "priority": "normal",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        job = JobOrder.objects.get(id=response.data["id"])
        self.assertEqual(job.client_id, self.client_user.id)
        self.assertEqual(job.submitted_by_id, self.client_user.id)
        self.assertEqual(job.current_status, JobOrder.Status.PENDING_FINANCE)

    def test_client_can_create_self_service_job_with_multiple_samples(self):
        client = self.get_authenticated_client("client_lab@minerals.com", "ClientPass123!")
        response = client.post(
            reverse("joborder-list"),
            {
                "description": "Client request with two pre-registered sample lines.",
                "priority": "normal",
                "samples": [
                    {"sample_name": "Core A"},
                    {"sample_name": "Core B", "notes": "Rush handling."},
                ],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["sample_count"], 2)
        job = JobOrder.objects.get(id=response.data["id"])
        self.assertEqual(job.samples.count(), 2)
        samples = list(job.samples.order_by("sample_name"))
        self.assertEqual(samples[0].sample_name, "Core A")
        self.assertEqual(samples[1].notes, "Rush handling.")
        self.assertIsNone(samples[0].received_by_id)
        self.assertEqual(samples[0].submitted_by_id, self.client_user.id)
        self.assertEqual(samples[0].sample_status, JobOrder.Status.PENDING_FINANCE)

    def test_client_cannot_use_receptionist_job_intake_payload(self):
        """Receptionist-style bodies without a client description are rejected (400)."""
        client = self.get_authenticated_client("client_lab@minerals.com", "ClientPass123!")
        response = client.post(
            reverse("joborder-list"),
            {"client": str(self.client_user.id), "priority": "normal"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

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
