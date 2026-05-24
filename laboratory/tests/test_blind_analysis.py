"""Blind-analysis protocol tests."""

from django.urls import reverse
from rest_framework import status

from .base import BaseTestCase


class BlindAnalysisTests(BaseTestCase):
    """
    Verify the blind analysis protocol:
    - Analysts see ONLY blind_alias_code and technical metadata.
    - Analysts CANNOT see client info, sample name, or job client.
    - Analysts only see samples assigned to them.
    """

    def test_analyst_sees_only_blind_alias(self):
        sample = self._create_coded_sample(analyst=self.analyst_user)
        self._assign_test(sample, self.test_silver)
        client = self.get_authenticated_client("analyst_lab@ministry.gov", "AnalystPass123!")
        response = client.get(reverse("sample-detail", args=[sample.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertIn("blind_alias_id", data)
        self.assertEqual(data["blind_alias_id"], str(sample.blind_alias_id))
        self.assertIn("blind_alias_code", data)
        self.assertTrue(data["blind_alias_code"].startswith("BC-"))
        self.assertIn("sample_weight", data)
        self.assertIn("packaging_type", data)
        self.assertIn("sample_status", data)
        self.assertNotIn("sample_name", data)
        self.assertNotIn("job", data)
        self.assertNotIn("submitted_by", data)
        self.assertNotIn("received_by", data)
        self.assertNotIn("assigned_analyst", data)
        self.assertNotIn("submitted_by_email", data)

    def test_analyst_sees_only_assigned_samples(self):
        job = self._create_job_order()
        assigned_to_water = self._create_sample(job=job, analyst=self.analyst_user)
        assigned_to_mineralogy = self._create_sample(job=job, analyst=self.analyst_user_2)
        unassigned = self._create_sample(job=job, analyst=None)
        self._assign_test(assigned_to_water, self.test_silver)
        self._assign_test(assigned_to_mineralogy, self.test_gold)
        self._assign_test(unassigned, self.test_silver)

        client = self.get_authenticated_client("analyst_lab@ministry.gov", "AnalystPass123!")
        response = client.get(reverse("sample-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_admin_sees_full_sample_detail(self):
        sample = self._create_coded_sample(analyst=self.analyst_user)
        client = self.get_authenticated_client("admin_lab@ministry.gov", "AdminPass123!")
        response = client.get(reverse("sample-detail", args=[sample.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertIn("sample_name", data)
        self.assertIn("job", data)
        self.assertIn("submitted_by", data)
        self.assertIn("received_by", data)
        self.assertIn("blind_alias_code", data)
        self.assertIn("submitted_by_email", data)

    def test_receptionist_sees_full_sample_detail(self):
        sample = self._create_sample()
        client = self.get_authenticated_client(
            "receptionist_lab@ministry.gov", "ReceptionistPass123!"
        )
        response = client.get(reverse("sample-detail", args=[sample.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("sample_name", response.data)
        self.assertIn("submitted_by", response.data)
