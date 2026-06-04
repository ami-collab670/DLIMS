"""Business-logic tests for laboratory endpoints."""

from django.urls import reverse
from rest_framework import status

from laboratory.models import FinancialRecord, JobOrder

from .base import BaseTestCase


class BusinessLogicTests(BaseTestCase):
    """Tests for validation rules and business logic enforcement."""

    def test_job_order_requires_external_client(self):
        client = self.get_authenticated_client(
            "receptionist_lab@ministry.gov", "ReceptionistPass123!"
        )
        response = client.post(
            reverse("joborder-list"),
            {
                "client": str(self.analyst_user.id),
                "priority": "normal",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_job_order_rejects_deactivated_client(self):
        self.client_user_2.is_active = False
        self.client_user_2.save()
        client = self.get_authenticated_client(
            "receptionist_lab@ministry.gov", "ReceptionistPass123!"
        )
        response = client.post(
            reverse("joborder-list"),
            {
                "client": str(self.client_user_2.id),
                "priority": "normal",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.client_user_2.is_active = True
        self.client_user_2.save()

    def test_job_order_rejects_non_payment_pending_initial_status(self):
        client = self.get_authenticated_client(
            "receptionist_lab@ministry.gov", "ReceptionistPass123!"
        )
        response = client.post(
            reverse("joborder-list"),
            {
                "client": str(self.client_user.id),
                "current_status": JobOrder.Status.COMPLETED,
                "priority": "normal",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("current_status", response.data)

    def test_job_order_rejects_removed_critical_priority(self):
        client = self.get_authenticated_client(
            "receptionist_lab@ministry.gov", "ReceptionistPass123!"
        )
        response = client.post(
            reverse("joborder-list"),
            {
                "client": str(self.client_user.id),
                "priority": "critical",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("priority", response.data)

    def test_sample_requires_matching_job_client(self):
        client = self.get_authenticated_client(
            "receptionist_lab@ministry.gov", "ReceptionistPass123!"
        )
        job = self._create_job_order(client_user=self.client_user)
        response = client.post(
            reverse("sample-list"),
            {
                "job": str(job.id),
                "sample_name": "Mismatched Sample",
                "submitted_by": str(self.client_user_2.id),
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("submitted_by", response.data)

    def test_sample_requires_external_submitter(self):
        client = self.get_authenticated_client(
            "receptionist_lab@ministry.gov", "ReceptionistPass123!"
        )
        job = self._create_job_order(client_user=self.client_user)
        response = client.post(
            reverse("sample-list"),
            {
                "job": str(job.id),
                "sample_name": "Internal Submitter Sample",
                "submitted_by": str(self.receptionist_user.id),
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("submitted_by", response.data)

    def test_sample_rejects_non_analyst_assignment(self):
        client = self.get_authenticated_client(
            "receptionist_lab@ministry.gov", "ReceptionistPass123!"
        )
        job = self._create_job_order(client_user=self.client_user)
        response = client.post(
            reverse("sample-list"),
            {
                "job": str(job.id),
                "sample_name": "Wrong Assignment Sample",
                "submitted_by": str(self.client_user.id),
                "assigned_analyst": str(self.finance_user.id),
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("assigned_analyst", response.data)

    def test_sample_update_rejects_non_analyst_assignment(self):
        client = self.get_authenticated_client(
            "receptionist_lab@ministry.gov", "ReceptionistPass123!"
        )
        sample = self._create_sample()
        response = client.patch(
            reverse("sample-detail", args=[sample.id]),
            {"assigned_analyst": str(self.qc_user.id)},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("assigned_analyst", response.data)

    def test_payment_waiver_requires_reason(self):
        client = self.get_authenticated_client("finance_lab@ministry.gov", "FinancePass123!")
        job = self._create_job_order()

        response = client.post(
            reverse("financialrecord-list"),
            {
                "job": str(job.id),
                "amount_expected": "500.00",
                "amount_paid": "0.00",
                "payment_status": FinancialRecord.PaymentStatus.PENDING,
                "payment_required": False,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("waiver_reason", response.data)

    def test_duplicate_sample_test_assignment_rejected(self):
        client = self.get_authenticated_client("admin_lab@ministry.gov", "AdminPass123!")
        sample = self._create_sample()
        client.post(
            reverse("sampletest-list"),
            {"sample": str(sample.id), "test": str(self.test_gold.id)},
            format="json",
        )
        response = client.post(
            reverse("sampletest-list"),
            {"sample": str(sample.id), "test": str(self.test_gold.id)},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_inactive_test_cannot_be_assigned(self):
        client = self.get_authenticated_client("admin_lab@ministry.gov", "AdminPass123!")
        sample = self._create_sample()
        response = client.post(
            reverse("sampletest-list"),
            {"sample": str(sample.id), "test": str(self.test_inactive.id)},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
