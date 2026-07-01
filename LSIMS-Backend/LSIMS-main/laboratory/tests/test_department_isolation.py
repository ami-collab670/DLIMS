"""Department-level visibility tests for Sprint 3."""

from django.urls import reverse
from rest_framework import status

from laboratory.models import TestCatalog

from .base import BaseTestCase


class DepartmentIsolationTests(BaseTestCase):
    """Verify analyst/QC visibility is constrained by department-owned tests."""

    def test_water_analyst_cannot_retrieve_mineralogy_sample(self):
        sample = self._create_sample(analyst=self.analyst_user)
        self._assign_test(sample, self.test_gold)

        client = self.get_authenticated_client("analyst_lab@ministry.gov", "AnalystPass123!")
        response = client.get(reverse("sample-detail", args=[sample.id]))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_water_analyst_list_excludes_mineralogy_samples(self):
        water_sample = self._create_sample(analyst=self.analyst_user)
        mineralogy_sample = self._create_sample(analyst=self.analyst_user)
        self._assign_test(water_sample, self.test_silver)
        self._assign_test(mineralogy_sample, self.test_gold)

        client = self.get_authenticated_client("analyst_lab@ministry.gov", "AnalystPass123!")
        response = client.get(reverse("sample-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["id"], str(water_sample.id))

    def test_analyst_sample_detail_hides_other_department_test_assignments(self):
        sample = self._create_sample(analyst=self.analyst_user)
        self._assign_test(sample, self.test_silver)
        self._assign_test(sample, self.test_gold)

        client = self.get_authenticated_client("analyst_lab@ministry.gov", "AnalystPass123!")
        response = client.get(reverse("sample-detail", args=[sample.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["sample_tests"]), 1)
        self.assertEqual(response.data["sample_tests"][0]["test_code"], "SLV-01")

    def test_sample_test_list_is_department_scoped_for_analyst(self):
        water_sample = self._create_sample(analyst=self.analyst_user)
        mineralogy_sample = self._create_sample(analyst=self.analyst_user)
        water_assignment = self._assign_test(water_sample, self.test_silver)
        self._assign_test(mineralogy_sample, self.test_gold)

        client = self.get_authenticated_client("analyst_lab@ministry.gov", "AnalystPass123!")
        response = client.get(reverse("sampletest-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["id"], str(water_assignment.id))

    def test_qc_manager_sees_only_department_samples(self):
        water_sample = self._create_sample()
        mineralogy_sample = self._create_sample()
        self._assign_test(water_sample, self.test_silver)
        self._assign_test(mineralogy_sample, self.test_gold)

        client = self.get_authenticated_client("qc_lab@ministry.gov", "QCPass123!")
        response = client.get(reverse("sample-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["id"], str(water_sample.id))

    def test_analyst_test_catalog_is_department_scoped(self):
        client = self.get_authenticated_client("analyst_lab@ministry.gov", "AnalystPass123!")
        response = client.get(reverse("testcatalog-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["test_code"], "SLV-01")

    def test_department_manager_can_create_test_for_own_department(self):
        client = self.get_authenticated_client("qc_lab@ministry.gov", "QCPass123!")
        response = client.post(
            reverse("testcatalog-list"),
            {
                "test_name": "Water Hardness",
                "test_code": "HARD-01",
                "unit": "mg/L",
                "price": "125.00",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        test = TestCatalog.objects.get(test_code="HARD-01")
        self.assertEqual(test.department, self.department_water)

    def test_department_manager_cannot_create_test_for_other_department(self):
        client = self.get_authenticated_client("qc_lab@ministry.gov", "QCPass123!")
        response = client.post(
            reverse("testcatalog-list"),
            {
                "test_name": "Other Department Test",
                "test_code": "OTHER-01",
                "unit": "ppm",
                "price": "125.00",
                "department": str(self.department_mineralogy.id),
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("department", response.data)

    def test_department_manager_can_update_own_department_test(self):
        client = self.get_authenticated_client("qc_lab@ministry.gov", "QCPass123!")
        response = client.patch(
            reverse("testcatalog-detail", args=[self.test_silver.id]),
            {"price": "400.00"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.test_silver.refresh_from_db()
        self.assertEqual(str(self.test_silver.price), "400.00")

    def test_department_manager_cannot_update_other_department_test(self):
        client = self.get_authenticated_client("qc_lab@ministry.gov", "QCPass123!")
        response = client.patch(
            reverse("testcatalog-detail", args=[self.test_gold.id]),
            {"price": "650.00"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_department_manager_can_assign_own_department_analyst(self):
        sample = self._create_sample()
        self._assign_test(sample, self.test_silver)
        client = self.get_authenticated_client("qc_lab@ministry.gov", "QCPass123!")

        response = client.post(
            reverse("sample-assign-analyst", args=[sample.id]),
            {
                "assigned_analyst": str(self.analyst_user.id),
                "reassigned_reason": "Workload balancing",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        sample.refresh_from_db()
        self.assertEqual(sample.assigned_analyst, self.analyst_user)
        self.assertIsNotNone(sample.assigned_at)
        self.assertEqual(sample.reassigned_reason, "Workload balancing")

    def test_department_manager_cannot_assign_other_department_analyst(self):
        sample = self._create_sample()
        self._assign_test(sample, self.test_silver)
        client = self.get_authenticated_client("qc_lab@ministry.gov", "QCPass123!")

        response = client.post(
            reverse("sample-assign-analyst", args=[sample.id]),
            {"assigned_analyst": str(self.analyst_user_2.id)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("assigned_analyst", response.data)

    def test_department_manager_cannot_assign_other_department_sample(self):
        sample = self._create_sample()
        self._assign_test(sample, self.test_gold)
        client = self.get_authenticated_client("qc_lab@ministry.gov", "QCPass123!")

        response = client.post(
            reverse("sample-assign-analyst", args=[sample.id]),
            {"assigned_analyst": str(self.analyst_user.id)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_analyst_cannot_assign_sample_to_self(self):
        sample = self._create_sample()
        self._assign_test(sample, self.test_silver)
        client = self.get_authenticated_client("analyst_lab@ministry.gov", "AnalystPass123!")

        response = client.post(
            reverse("sample-assign-analyst", args=[sample.id]),
            {"assigned_analyst": str(self.analyst_user.id)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_department_scoped_user_without_department_sees_no_samples(self):
        self.analyst_user.department = None
        self.analyst_user.save(update_fields=["department"])
        sample = self._create_sample(analyst=self.analyst_user)
        self._assign_test(sample, self.test_silver)

        client = self.get_authenticated_client("analyst_lab@ministry.gov", "AnalystPass123!")
        response = client.get(reverse("sample-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 0)
