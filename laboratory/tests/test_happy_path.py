"""Happy-path tests for laboratory endpoints."""

from decimal import Decimal

from django.urls import reverse
from rest_framework import status

from laboratory.models import FinancialRecord, JobOrder, Sample, SampleTest, TestCatalog

from .base import BaseTestCase


class TestCatalogHappyPathTests(BaseTestCase):
    """Happy path tests for the TestCatalog endpoints."""

    def test_admin_can_list_tests(self):
        client = self.get_authenticated_client("admin_lab@ministry.gov", "AdminPass123!")
        response = client.get(reverse("testcatalog-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 3)

    def test_admin_can_create_test(self):
        client = self.get_authenticated_client("admin_lab@ministry.gov", "AdminPass123!")
        response = client.post(
            reverse("testcatalog-list"),
            {
                "test_name": "Copper Analysis",
                "test_code": "CU-01",
                "description": "Copper content via ICP-OES.",
                "unit": "%",
                "price": "250.00",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(TestCatalog.objects.filter(test_code="CU-01").exists())

    def test_receptionist_can_read_tests(self):
        client = self.get_authenticated_client(
            "receptionist_lab@ministry.gov", "ReceptionistPass123!"
        )
        response = client.get(reverse("testcatalog-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_analyst_can_read_tests(self):
        client = self.get_authenticated_client("analyst_lab@ministry.gov", "AnalystPass123!")
        response = client.get(reverse("testcatalog-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_can_update_test(self):
        client = self.get_authenticated_client("admin_lab@ministry.gov", "AdminPass123!")
        response = client.patch(
            reverse("testcatalog-detail", args=[self.test_gold.id]),
            {"price": "600.00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.test_gold.refresh_from_db()
        self.assertEqual(self.test_gold.price, Decimal("600.00"))

    def test_admin_can_delete_test(self):
        client = self.get_authenticated_client("admin_lab@ministry.gov", "AdminPass123!")
        response = client.delete(reverse("testcatalog-detail", args=[self.test_inactive.id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(TestCatalog.objects.filter(id=self.test_inactive.id).exists())

    def test_test_catalog_search_filters_results(self):
        client = self.get_authenticated_client("admin_lab@ministry.gov", "AdminPass123!")
        response = client.get(reverse("testcatalog-list"), {"search": "Silver"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["test_code"], "SLV-01")


class JobOrderHappyPathTests(BaseTestCase):
    """Happy path tests for the JobOrder endpoints."""

    def test_receptionist_can_create_job_order(self):
        client = self.get_authenticated_client(
            "receptionist_lab@ministry.gov", "ReceptionistPass123!"
        )
        response = client.post(
            reverse("joborder-list"),
            {
                "client": str(self.client_user.id),
                "priority": "urgent",
                "description": "Urgent mineral analysis needed",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        job = JobOrder.objects.get(id=response.data["id"])
        self.assertEqual(job.client, self.client_user)
        self.assertEqual(job.submitted_by, self.receptionist_user)
        self.assertEqual(job.current_status, JobOrder.Status.PAYMENT_PENDING)

    def test_receptionist_can_list_all_jobs(self):
        self._create_job_order(client_user=self.client_user)
        self._create_job_order(client_user=self.client_user_2)
        client = self.get_authenticated_client(
            "receptionist_lab@ministry.gov", "ReceptionistPass123!"
        )
        response = client.get(reverse("joborder-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 2)

    def test_client_sees_only_own_jobs(self):
        self._create_job_order(client_user=self.client_user)
        self._create_job_order(client_user=self.client_user_2)
        client = self.get_authenticated_client("client_lab@minerals.com", "ClientPass123!")
        response = client.get(reverse("joborder-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_admin_can_update_job_order(self):
        client = self.get_authenticated_client("admin_lab@ministry.gov", "AdminPass123!")
        job = self._create_job_order()
        response = client.patch(
            reverse("joborder-detail", args=[job.id]),
            {"priority": "urgent"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        job.refresh_from_db()
        self.assertEqual(job.priority, "urgent")

    def test_delete_job_order_soft_cancels(self):
        client = self.get_authenticated_client("admin_lab@ministry.gov", "AdminPass123!")
        job = self._create_job_order()
        response = client.delete(reverse("joborder-detail", args=[job.id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        job.refresh_from_db()
        self.assertTrue(job.is_cancelled)
        self.assertTrue(JobOrder.objects.filter(id=job.id).exists())


class SampleHappyPathTests(BaseTestCase):
    """Happy path tests for the Sample endpoints."""

    def test_receptionist_can_create_sample(self):
        client = self.get_authenticated_client(
            "receptionist_lab@ministry.gov", "ReceptionistPass123!"
        )
        job = self._create_job_order()
        response = client.post(
            reverse("sample-list"),
            {
                "job": str(job.id),
                "sample_name": "Iron Ore Sample Alpha",
                "sample_weight": "250.500",
                "packaging_type": "Sealed Container",
                "submitted_by": str(self.client_user.id),
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        sample = Sample.objects.get(id=response.data["id"])
        self.assertIsNone(sample.sample_code)
        self.assertIsNone(sample.blind_alias)
        self.assertEqual(sample.received_by, self.receptionist_user)
        self.assertEqual(sample.submitted_by, self.client_user)
        self.assertEqual(sample.sample_status, "registered")

    def test_payment_confirmation_codes_samples(self):
        client = self.get_authenticated_client("finance_lab@ministry.gov", "FinancePass123!")
        job = self._create_job_order()
        sample = self._create_sample(job=job)

        response = client.post(
            reverse("financialrecord-list"),
            {
                "job": str(job.id),
                "amount_expected": "500.00",
                "amount_paid": "500.00",
                "payment_status": FinancialRecord.PaymentStatus.PAID,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        sample.refresh_from_db()
        job.refresh_from_db()
        self.assertTrue(sample.sample_code.startswith("SMP-"))
        self.assertIsNotNone(sample.blind_alias)
        self.assertTrue(sample.blind_alias.code.startswith("BC-"))
        self.assertEqual(job.current_status, JobOrder.Status.RECEIVED)

    def test_payment_waiver_codes_samples(self):
        client = self.get_authenticated_client("finance_lab@ministry.gov", "FinancePass123!")
        job = self._create_job_order()
        sample = self._create_sample(job=job)

        response = client.post(
            reverse("financialrecord-list"),
            {
                "job": str(job.id),
                "amount_expected": "500.00",
                "amount_paid": "0.00",
                "payment_status": FinancialRecord.PaymentStatus.PENDING,
                "payment_required": False,
                "waiver_reason": "Director-approved demonstration waiver.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        record = FinancialRecord.objects.get(invoice_no=response.data["invoice_no"])
        sample.refresh_from_db()
        job.refresh_from_db()
        self.assertTrue(sample.sample_code.startswith("SMP-"))
        self.assertIsNotNone(sample.blind_alias)
        self.assertEqual(job.current_status, JobOrder.Status.RECEIVED)
        self.assertEqual(record.waiver_approved_by, self.finance_user)
        self.assertIsNotNone(record.waiver_approved_at)

    def test_admin_can_list_all_samples(self):
        self._create_sample()
        client = self.get_authenticated_client("admin_lab@ministry.gov", "AdminPass123!")
        response = client.get(reverse("sample-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data["count"], 1)

    def test_receptionist_can_update_sample(self):
        client = self.get_authenticated_client(
            "receptionist_lab@ministry.gov", "ReceptionistPass123!"
        )
        sample = self._create_sample()
        response = client.patch(
            reverse("sample-detail", args=[sample.id]),
            {"sample_status": "in_queue"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        sample.refresh_from_db()
        self.assertEqual(sample.sample_status, "in_queue")


class SampleTestHappyPathTests(BaseTestCase):
    """Happy path tests for the SampleTest (test assignment) endpoints."""

    def test_receptionist_can_assign_test_to_sample(self):
        client = self.get_authenticated_client(
            "receptionist_lab@ministry.gov", "ReceptionistPass123!"
        )
        sample = self._create_sample()
        response = client.post(
            reverse("sampletest-list"),
            {"sample": str(sample.id), "test": str(self.test_gold.id)},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(SampleTest.objects.filter(sample=sample, test=self.test_gold).exists())

    def test_admin_can_assign_test_to_sample(self):
        client = self.get_authenticated_client("admin_lab@ministry.gov", "AdminPass123!")
        sample = self._create_sample()
        response = client.post(
            reverse("sampletest-list"),
            {"sample": str(sample.id), "test": str(self.test_silver.id)},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_receptionist_can_remove_test_assignment(self):
        client = self.get_authenticated_client(
            "receptionist_lab@ministry.gov", "ReceptionistPass123!"
        )
        sample = self._create_sample()
        st = SampleTest.objects.create(sample=sample, test=self.test_gold)
        response = client.delete(reverse("sampletest-detail", args=[st.id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(SampleTest.objects.filter(id=st.id).exists())
