"""Tests for Sprint 4 complaint, discount, and priority support workflows."""

from datetime import timedelta
from decimal import Decimal

from django.urls import reverse
from django.utils import timezone
from rest_framework import status

from laboratory.models import (
    ComplaintRecord,
    DiscountApproval,
    FinancialRecord,
    JobOrder,
)

from .base import BaseTestCase


class SupportWorkflowTests(BaseTestCase):
    """Verify support workflows outside the core prep/analysis/QC path."""

    def test_client_can_create_complaint_for_own_job(self):
        job = self._create_job_order(client_user=self.client_user)
        client = self.get_authenticated_client(
            "client_lab@minerals.com",
            "ClientPass123!",
        )

        response = client.post(
            reverse("complaint-list"),
            {
                "job": str(job.id),
                "category": ComplaintRecord.Category.PAYMENT,
                "description": "Payment receipt was not reflected.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        complaint = ComplaintRecord.objects.get(id=response.data["id"])
        self.assertEqual(complaint.client, self.client_user)
        self.assertEqual(complaint.created_by, self.client_user)
        self.assertEqual(complaint.status, ComplaintRecord.Status.OPEN)

    def test_client_cannot_create_complaint_for_other_client_job(self):
        job = self._create_job_order(client_user=self.client_user_2)
        client = self.get_authenticated_client(
            "client_lab@minerals.com",
            "ClientPass123!",
        )

        response = client.post(
            reverse("complaint-list"),
            {
                "job": str(job.id),
                "category": ComplaintRecord.Category.SAMPLE,
                "description": "This should not be accepted.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("job", response.data)

    def test_lab_director_can_resolve_complaint(self):
        complaint = ComplaintRecord.objects.create(
            client=self.client_user,
            job=self._create_job_order(client_user=self.client_user),
            category=ComplaintRecord.Category.RESULT,
            description="Result clarification requested.",
            created_by=self.client_user,
        )
        client = self.get_authenticated_client(
            "lab_director_lab@ministry.gov",
            "DirectorPass123!",
        )

        response = client.post(
            reverse("complaint-resolve", args=[complaint.id]),
            {"resolution": "Reviewed and explained to client."},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        complaint.refresh_from_db()
        self.assertEqual(complaint.status, ComplaintRecord.Status.RESOLVED)
        self.assertEqual(complaint.resolved_by, self.lab_director_user)
        self.assertIsNotNone(complaint.resolved_at)

    def test_finance_can_request_free_test_and_director_approval_releases_samples(self):
        job = self._create_job_order(client_user=self.client_user)
        sample = self._create_sample(job=job)
        self._assign_test(sample, self.test_silver)
        finance_client = self.get_authenticated_client(
            "finance_lab@ministry.gov",
            "FinancePass123!",
        )

        create_response = finance_client.post(
            reverse("discountapproval-list"),
            {
                "job": str(job.id),
                "discount_type": DiscountApproval.DiscountType.FREE_TEST,
                "reason": "Director-approved public-interest testing.",
            },
            format="json",
        )

        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        approval = DiscountApproval.objects.get(id=create_response.data["id"])
        director_client = self.get_authenticated_client(
            "lab_director_lab@ministry.gov",
            "DirectorPass123!",
        )
        approve_response = director_client.post(
            reverse("discountapproval-approve", args=[approval.id]),
            {"review_note": "Approved as free test."},
            format="json",
        )

        self.assertEqual(approve_response.status_code, status.HTTP_200_OK)
        approval.refresh_from_db()
        sample.refresh_from_db()
        job.refresh_from_db()
        record = FinancialRecord.objects.get(job=job)
        self.assertEqual(approval.status, DiscountApproval.Status.APPROVED)
        self.assertEqual(approval.reviewed_by, self.lab_director_user)
        self.assertFalse(record.payment_required)
        self.assertEqual(record.waiver_approved_by, self.lab_director_user)
        self.assertTrue(sample.sample_code.startswith("SMP-"))
        self.assertIsNotNone(sample.blind_alias)
        self.assertEqual(job.current_status, JobOrder.Status.RECEIVED)

    def test_finance_cannot_approve_discount_request(self):
        approval = DiscountApproval.objects.create(
            job=self._create_job_order(client_user=self.client_user),
            discount_type=DiscountApproval.DiscountType.FIXED_AMOUNT,
            amount=Decimal("100.00"),
            reason="Finance request needs director review.",
            requested_by=self.finance_user,
        )
        client = self.get_authenticated_client(
            "finance_lab@ministry.gov",
            "FinancePass123!",
        )

        response = client.post(
            reverse("discountapproval-approve", args=[approval.id]),
            {"review_note": "Finance should not approve."},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_discount_approval_request_cannot_be_patched_or_deleted(self):
        approval = DiscountApproval.objects.create(
            job=self._create_job_order(client_user=self.client_user),
            discount_type=DiscountApproval.DiscountType.FIXED_AMOUNT,
            amount=Decimal("100.00"),
            reason="Finance request needs director review.",
            requested_by=self.finance_user,
        )
        client = self.get_authenticated_client(
            "finance_lab@ministry.gov",
            "FinancePass123!",
        )

        patch_response = client.patch(
            reverse("discountapproval-detail", args=[approval.id]),
            {"amount": "250.00"},
            format="json",
        )
        delete_response = client.delete(
            reverse("discountapproval-detail", args=[approval.id])
        )

        self.assertEqual(patch_response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(delete_response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        approval.refresh_from_db()
        self.assertEqual(approval.amount, Decimal("100.00"))

    def test_complaint_cannot_be_patched_or_deleted_after_creation(self):
        complaint = ComplaintRecord.objects.create(
            client=self.client_user,
            job=self._create_job_order(client_user=self.client_user),
            category=ComplaintRecord.Category.RESULT,
            description="Result clarification requested.",
            created_by=self.client_user,
        )
        client = self.get_authenticated_client(
            "receptionist_lab@ministry.gov",
            "ReceptionistPass123!",
        )

        patch_response = client.patch(
            reverse("complaint-detail", args=[complaint.id]),
            {"client": str(self.client_user_2.id)},
            format="json",
        )
        delete_response = client.delete(reverse("complaint-detail", args=[complaint.id]))

        self.assertEqual(patch_response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertEqual(delete_response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertTrue(ComplaintRecord.objects.filter(id=complaint.id).exists())

    def test_priority_alerts_include_old_active_normal_jobs(self):
        job = self._create_job_order(client_user=self.client_user)
        self._create_sample(job=job)
        JobOrder.objects.filter(pk=job.pk).update(
            created_at=timezone.now() - timedelta(days=9)
        )
        client = self.get_authenticated_client("admin_lab@ministry.gov", "AdminPass123!")

        response = client.get(reverse("priorityalert-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["job"], str(job.id))
        self.assertEqual(response.data[0]["priority"], JobOrder.Priority.NORMAL)
        self.assertGreaterEqual(response.data[0]["age_days"], 9)

    def test_client_cannot_view_priority_alerts(self):
        client = self.get_authenticated_client(
            "client_lab@minerals.com",
            "ClientPass123!",
        )

        response = client.get(reverse("priorityalert-list"))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
