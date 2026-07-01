"""Tests for Sprint 4 preparation workflow."""

from django.urls import reverse
from rest_framework import status

from accounts.models import User
from laboratory.models import JobOrder, PreparationRecord, Sample

from .base import BaseTestCase


class PreparationWorkflowTests(BaseTestCase):
    """Verify paid/coded samples can move through preparation safely."""

    def _create_water_coded_sample(self):
        sample = self._create_coded_sample()
        self._assign_test(sample, self.test_silver)
        return sample

    def _create_mineralogy_coded_sample(self):
        sample = self._create_coded_sample()
        self._assign_test(sample, self.test_gold)
        return sample

    def test_receptionist_can_create_preparation_record_for_paid_sample(self):
        sample = self._create_water_coded_sample()
        client = self.get_authenticated_client(
            "receptionist_lab@ministry.gov",
            "ReceptionistPass123!",
        )

        response = client.post(
            reverse("preparationrecord-list"),
            {
                "sample": str(sample.id),
                "technician": str(self.lab_technician_user.id),
                "notes": "Prepare for water chemistry analysis.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        record = PreparationRecord.objects.get(id=response.data["id"])
        self.assertEqual(record.sample, sample)
        self.assertEqual(record.technician, self.lab_technician_user)
        self.assertEqual(record.status, PreparationRecord.Status.PENDING)
        self.assertEqual(record.created_by, self.receptionist_user)
        self.assertTrue(record.reference_code.startswith("PREP-"))

    def test_preparation_record_rejects_unpaid_uncoded_sample(self):
        sample = self._create_sample()
        self._assign_test(sample, self.test_silver)
        client = self.get_authenticated_client(
            "receptionist_lab@ministry.gov",
            "ReceptionistPass123!",
        )

        response = client.post(
            reverse("preparationrecord-list"),
            {"sample": str(sample.id)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("sample", response.data)

    def test_lab_technician_cannot_create_preparation_record(self):
        sample = self._create_water_coded_sample()
        client = self.get_authenticated_client(
            "lab_technician_lab@ministry.gov",
            "LabTechPass123!",
        )

        response = client.post(
            reverse("preparationrecord-list"),
            {"sample": str(sample.id)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_department_manager_can_create_own_department_preparation_record(self):
        sample = self._create_water_coded_sample()
        client = self.get_authenticated_client("qc_lab@ministry.gov", "QCPass123!")

        response = client.post(
            reverse("preparationrecord-list"),
            {"sample": str(sample.id)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_department_manager_cannot_create_other_department_preparation_record(self):
        sample = self._create_mineralogy_coded_sample()
        client = self.get_authenticated_client("qc_lab@ministry.gov", "QCPass123!")

        response = client.post(
            reverse("preparationrecord-list"),
            {"sample": str(sample.id)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("sample", response.data)

    def test_lab_technician_sees_only_own_department_preparation_records(self):
        water_sample = self._create_water_coded_sample()
        mineralogy_sample = self._create_mineralogy_coded_sample()
        water_record = PreparationRecord.objects.create(sample=water_sample)
        PreparationRecord.objects.create(sample=mineralogy_sample)
        client = self.get_authenticated_client(
            "lab_technician_lab@ministry.gov",
            "LabTechPass123!",
        )

        response = client.get(reverse("preparationrecord-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["id"], str(water_record.id))

    def test_lab_technician_cannot_retrieve_other_department_preparation_record(self):
        mineralogy_sample = self._create_mineralogy_coded_sample()
        record = PreparationRecord.objects.create(sample=mineralogy_sample)
        client = self.get_authenticated_client(
            "lab_technician_lab@ministry.gov",
            "LabTechPass123!",
        )

        response = client.get(reverse("preparationrecord-detail", args=[record.id]))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_lab_technician_can_start_preparation(self):
        sample = self._create_water_coded_sample()
        record = PreparationRecord.objects.create(sample=sample)
        client = self.get_authenticated_client(
            "lab_technician_lab@ministry.gov",
            "LabTechPass123!",
        )

        response = client.post(reverse("preparationrecord-start", args=[record.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        record.refresh_from_db()
        sample.refresh_from_db()
        sample.job.refresh_from_db()
        self.assertEqual(record.status, PreparationRecord.Status.IN_PROGRESS)
        self.assertEqual(record.technician, self.lab_technician_user)
        self.assertIsNotNone(record.started_at)
        self.assertEqual(sample.sample_status, Sample.SampleStatus.IN_PREP)
        self.assertEqual(sample.job.current_status, JobOrder.Status.IN_PREP)

    def test_lab_technician_can_complete_preparation(self):
        sample = self._create_water_coded_sample()
        record = PreparationRecord.objects.create(
            sample=sample,
            technician=self.lab_technician_user,
        )
        client = self.get_authenticated_client(
            "lab_technician_lab@ministry.gov",
            "LabTechPass123!",
        )
        client.post(reverse("preparationrecord-start", args=[record.id]))

        response = client.post(
            reverse("preparationrecord-complete", args=[record.id]),
            {
                "preparation_data": {"method": "Crushing and homogenization"},
                "notes": "Ready for analysis.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        record.refresh_from_db()
        sample.refresh_from_db()
        sample.job.refresh_from_db()
        self.assertEqual(record.status, PreparationRecord.Status.COMPLETED)
        self.assertEqual(
            record.preparation_data,
            {"method": "Crushing and homogenization"},
        )
        self.assertEqual(record.notes, "Ready for analysis.")
        self.assertIsNotNone(record.completed_at)
        self.assertEqual(sample.sample_status, Sample.SampleStatus.PENDING_ANALYSIS)
        self.assertEqual(sample.job.current_status, JobOrder.Status.IN_ANALYSIS)

    def test_unassigned_lab_technician_cannot_complete_assigned_preparation(self):
        sample = self._create_water_coded_sample()
        other_technician = User.objects.create_user(
            username="lab_technician_same_department",
            email="lab_technician_same_department@ministry.gov",
            password="LabTechPass123!",
            user_type="internal",
            role=self.lab_technician_role,
            department=self.department_water,
        )
        record = PreparationRecord.objects.create(
            sample=sample,
            technician=self.lab_technician_user,
        )
        client = self.get_authenticated_client(
            "lab_technician_lab@ministry.gov",
            "LabTechPass123!",
        )
        client.post(reverse("preparationrecord-start", args=[record.id]))
        other_client = self.get_authenticated_client(
            other_technician.email,
            "LabTechPass123!",
        )

        response = other_client.post(
            reverse("preparationrecord-complete", args=[record.id]),
            {"notes": "Trying to complete somebody else's assigned work."},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("status", response.data)
        record.refresh_from_db()
        self.assertEqual(record.status, PreparationRecord.Status.IN_PROGRESS)

    def test_preparation_records_cannot_be_deleted_through_generic_route(self):
        sample = self._create_water_coded_sample()
        record = PreparationRecord.objects.create(sample=sample)
        client = self.get_authenticated_client("admin_lab@ministry.gov", "AdminPass123!")

        response = client.delete(reverse("preparationrecord-detail", args=[record.id]))

        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertTrue(PreparationRecord.objects.filter(id=record.id).exists())

    def test_complete_pending_preparation_is_rejected(self):
        sample = self._create_water_coded_sample()
        record = PreparationRecord.objects.create(
            sample=sample,
            technician=self.lab_technician_user,
        )
        client = self.get_authenticated_client(
            "lab_technician_lab@ministry.gov",
            "LabTechPass123!",
        )

        response = client.post(
            reverse("preparationrecord-complete", args=[record.id]),
            {},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("status", response.data)
