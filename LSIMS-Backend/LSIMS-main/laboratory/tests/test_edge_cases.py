"""Edge-case and regression tests for the laboratory app."""

import uuid

from django.urls import reverse
from rest_framework import status

from laboratory.models import JobOrder, Sample

from .base import BaseTestCase


class EdgeCaseTests(BaseTestCase):
    """Tests for edge cases, bad payloads, and boundary conditions."""

    def test_external_superuser_can_update_unowned_job(self):
        job = self._create_job_order(client_user=self.client_user)
        client = self.get_authenticated_client(
            "external_superuser_lab@ministry.gov", "SuperuserPass123!"
        )
        response = client.patch(
            reverse("joborder-detail", args=[job.id]),
            {"priority": JobOrder.Priority.CRITICAL},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        job.refresh_from_db()
        self.assertEqual(job.priority, JobOrder.Priority.CRITICAL)

    def test_external_superuser_can_update_unowned_sample(self):
        sample = self._create_sample()
        client = self.get_authenticated_client(
            "external_superuser_lab@ministry.gov", "SuperuserPass123!"
        )
        response = client.patch(
            reverse("sample-detail", args=[sample.id]),
            {
                "status_sync_with_job": False,
                "sample_status": Sample.SampleStatus.SUBMITTED,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        sample.refresh_from_db()
        self.assertEqual(sample.sample_status, Sample.SampleStatus.SUBMITTED)

    def test_retrieve_nonexistent_job_returns_404(self):
        client = self.get_authenticated_client("admin_lab@ministry.gov", "AdminPass123!")
        response = client.get(reverse("joborder-detail", args=[uuid.uuid4()]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_nonexistent_sample_returns_404(self):
        client = self.get_authenticated_client("admin_lab@ministry.gov", "AdminPass123!")
        response = client.get(reverse("sample-detail", args=[uuid.uuid4()]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_nonexistent_test_returns_404(self):
        client = self.get_authenticated_client("admin_lab@ministry.gov", "AdminPass123!")
        response = client.get(reverse("testcatalog-detail", args=[uuid.uuid4()]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_job_with_invalid_client_uuid(self):
        client = self.get_authenticated_client(
            "receptionist_lab@ministry.gov", "ReceptionistPass123!"
        )
        response = client.post(
            reverse("joborder-list"),
            {"client": str(uuid.uuid4()), "priority": "normal"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_sample_with_invalid_job_uuid(self):
        client = self.get_authenticated_client(
            "receptionist_lab@ministry.gov", "ReceptionistPass123!"
        )
        response = client.post(
            reverse("sample-list"),
            {
                "job": str(uuid.uuid4()),
                "sample_name": "Bad Job Sample",
                "submitted_by": str(self.client_user.id),
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_sample_missing_required_fields(self):
        client = self.get_authenticated_client(
            "receptionist_lab@ministry.gov", "ReceptionistPass123!"
        )
        response = client.post(reverse("sample-list"), {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_client_cannot_see_other_clients_jobs(self):
        self._create_job_order(client_user=self.client_user_2)
        client = self.get_authenticated_client("client_lab@minerals.com", "ClientPass123!")
        response = client.get(reverse("joborder-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 0)

    def test_analyst_cannot_see_unassigned_sample_by_id(self):
        sample = self._create_sample(analyst=self.analyst_user_2)
        client = self.get_authenticated_client("analyst_lab@ministry.gov", "AnalystPass123!")
        response = client.get(reverse("sample-detail", args=[sample.id]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_filter_tests_by_active_status(self):
        client = self.get_authenticated_client("admin_lab@ministry.gov", "AdminPass123!")
        response = client.get(reverse("testcatalog-list"), {"is_active": "true"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 2)

    def test_filter_jobs_by_status(self):
        self._create_job_order()
        client = self.get_authenticated_client("admin_lab@ministry.gov", "AdminPass123!")
        response = client.get(reverse("joborder-list"), {"current_status": "received"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data["count"], 1)

    def test_client_sees_own_samples_via_job(self):
        job = self._create_job_order(client_user=self.client_user)
        self._create_sample(job=job)
        client = self.get_authenticated_client("client_lab@minerals.com", "ClientPass123!")
        response = client.get(reverse("sample-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_client_cannot_see_other_clients_samples(self):
        job = self._create_job_order(client_user=self.client_user_2)
        self._create_sample(job=job)
        client = self.get_authenticated_client("client_lab@minerals.com", "ClientPass123!")
        response = client.get(reverse("sample-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 0)
