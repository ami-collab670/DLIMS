"""Department-level visibility tests for Sprint 3."""

from django.urls import reverse
from rest_framework import status

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

    def test_department_scoped_user_without_department_sees_no_samples(self):
        self.analyst_user.department = None
        self.analyst_user.save(update_fields=["department"])
        sample = self._create_sample(analyst=self.analyst_user)
        self._assign_test(sample, self.test_silver)

        client = self.get_authenticated_client("analyst_lab@ministry.gov", "AnalystPass123!")
        response = client.get(reverse("sample-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 0)
