"""Tests for Sprint 4 analysis, calibration, and QC workflow."""

from django.urls import reverse
from rest_framework import status

from laboratory.models import (
    AnalysisResult,
    CalibrationRecord,
    JobOrder,
    PreparationRecord,
    QCDecision,
    Sample,
)
from laboratory.services.workflow import complete_preparation, start_preparation

from .base import BaseTestCase


class AnalysisQCWorkflowTests(BaseTestCase):
    """Verify the prepared-sample analysis and QC flow."""

    def _create_prepared_assignment(
        self,
        *,
        test=None,
        analyst=None,
        technician=None,
    ):
        test = test or self.test_silver
        analyst = analyst or self.analyst_user
        technician = technician or self.lab_technician_user
        sample = self._create_coded_sample(analyst=analyst)
        sample_test = self._assign_test(sample, test)
        record = PreparationRecord.objects.create(
            sample=sample,
            technician=technician,
        )
        record = start_preparation(record, technician)
        complete_preparation(record, preparation_data={"method": "standard prep"})
        sample.refresh_from_db()
        return sample, sample_test

    def _create_submitted_result(self):
        sample, sample_test = self._create_prepared_assignment()
        client = self.get_authenticated_client(
            "analyst_lab@ministry.gov",
            "AnalystPass123!",
        )
        create_response = client.post(
            reverse("analysisresult-list"),
            {
                "sample_test": str(sample_test.id),
                "value": "12.50",
                "unit": "ppm",
                "method": "ICP-OES",
                "remarks": "Within expected range.",
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        result = AnalysisResult.objects.get(id=create_response.data["id"])
        submit_response = client.post(reverse("analysisresult-submit", args=[result.id]))
        self.assertEqual(submit_response.status_code, status.HTTP_200_OK)
        result.refresh_from_db()
        sample.refresh_from_db()
        return sample, sample_test, result

    def test_assigned_analyst_can_create_draft_result_after_preparation(self):
        sample, sample_test = self._create_prepared_assignment()
        client = self.get_authenticated_client(
            "analyst_lab@ministry.gov",
            "AnalystPass123!",
        )

        response = client.post(
            reverse("analysisresult-list"),
            {
                "sample_test": str(sample_test.id),
                "value": "12.50",
                "unit": "ppm",
                "method": "ICP-OES",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        result = AnalysisResult.objects.get(id=response.data["id"])
        self.assertEqual(result.sample_test, sample_test)
        self.assertEqual(result.analyst, self.analyst_user)
        self.assertEqual(result.state, AnalysisResult.State.DRAFT)
        self.assertEqual(sample.sample_status, Sample.SampleStatus.IN_ANALYSIS)

    def test_result_entry_requires_completed_preparation(self):
        sample = self._create_coded_sample(analyst=self.analyst_user)
        sample_test = self._assign_test(sample, self.test_silver)
        client = self.get_authenticated_client(
            "analyst_lab@ministry.gov",
            "AnalystPass123!",
        )

        response = client.post(
            reverse("analysisresult-list"),
            {"sample_test": str(sample_test.id), "value": "12.50"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("sample_test", response.data)

    def test_unassigned_analyst_cannot_create_result(self):
        _, sample_test = self._create_prepared_assignment(analyst=self.analyst_user_2)
        client = self.get_authenticated_client(
            "analyst_lab@ministry.gov",
            "AnalystPass123!",
        )

        response = client.post(
            reverse("analysisresult-list"),
            {"sample_test": str(sample_test.id), "value": "12.50"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("sample_test", response.data)

    def test_analyst_can_add_calibration_to_draft_result(self):
        _, sample_test = self._create_prepared_assignment()
        result = AnalysisResult.objects.create(
            sample_test=sample_test,
            analyst=self.analyst_user,
            value="12.50",
        )
        client = self.get_authenticated_client(
            "analyst_lab@ministry.gov",
            "AnalystPass123!",
        )

        response = client.post(
            reverse("calibrationrecord-list"),
            {
                "analysis_result": str(result.id),
                "instrument_name": "ICP-OES-1",
                "calibration_reference": "CAL-2026-001",
                "calibration_data": {"standard": "STD-A"},
                "notes": "Calibration accepted.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        calibration = CalibrationRecord.objects.get(id=response.data["id"])
        self.assertEqual(calibration.recorded_by, self.analyst_user)
        self.assertEqual(calibration.analysis_result, result)

    def test_analyst_submit_moves_result_to_qc(self):
        sample, _, result = self._create_submitted_result()

        result.refresh_from_db()
        sample.refresh_from_db()
        sample.job.refresh_from_db()
        self.assertEqual(result.state, AnalysisResult.State.SUBMITTED)
        self.assertIsNotNone(result.submitted_at)
        self.assertEqual(sample.sample_status, Sample.SampleStatus.IN_ANALYSIS)
        self.assertEqual(sample.job.current_status, JobOrder.Status.QC)

    def test_job_moves_to_qc_only_after_all_results_are_submitted(self):
        job = self._create_job_order(client_user=self.client_user)
        sample_one = self._create_sample(job=job, analyst=self.analyst_user)
        sample_two = self._create_sample(job=job, analyst=self.analyst_user)
        self._mark_job_paid(job)
        sample_one.refresh_from_db()
        sample_two.refresh_from_db()
        sample_test_one = self._assign_test(sample_one, self.test_silver)
        sample_test_two = self._assign_test(sample_two, self.test_silver)
        prep_one = start_preparation(
            PreparationRecord.objects.create(
                sample=sample_one,
                technician=self.lab_technician_user,
            ),
            self.lab_technician_user,
        )
        complete_preparation(prep_one, preparation_data={"method": "prep one"})
        job.refresh_from_db()
        self.assertEqual(job.current_status, JobOrder.Status.IN_PREP)
        prep_two = start_preparation(
            PreparationRecord.objects.create(
                sample=sample_two,
                technician=self.lab_technician_user,
            ),
            self.lab_technician_user,
        )
        complete_preparation(prep_two, preparation_data={"method": "prep two"})
        job.refresh_from_db()
        self.assertEqual(job.current_status, JobOrder.Status.IN_ANALYSIS)

        client = self.get_authenticated_client(
            "analyst_lab@ministry.gov",
            "AnalystPass123!",
        )
        first_response = client.post(
            reverse("analysisresult-list"),
            {"sample_test": str(sample_test_one.id), "value": "11.10"},
            format="json",
        )
        second_response = client.post(
            reverse("analysisresult-list"),
            {"sample_test": str(sample_test_two.id), "value": "22.20"},
            format="json",
        )
        self.assertEqual(first_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second_response.status_code, status.HTTP_201_CREATED)

        first_submit = client.post(
            reverse("analysisresult-submit", args=[first_response.data["id"]])
        )
        self.assertEqual(first_submit.status_code, status.HTTP_200_OK)
        job.refresh_from_db()
        self.assertEqual(job.current_status, JobOrder.Status.IN_ANALYSIS)

        second_submit = client.post(
            reverse("analysisresult-submit", args=[second_response.data["id"]])
        )
        self.assertEqual(second_submit.status_code, status.HTTP_200_OK)
        job.refresh_from_db()
        self.assertEqual(job.current_status, JobOrder.Status.QC)

    def test_submitted_result_cannot_be_edited(self):
        _, _, result = self._create_submitted_result()
        client = self.get_authenticated_client(
            "analyst_lab@ministry.gov",
            "AnalystPass123!",
        )

        response = client.patch(
            reverse("analysisresult-detail", args=[result.id]),
            {"value": "99.99"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("state", response.data)

    def test_draft_result_sample_test_cannot_be_changed(self):
        _, sample_test = self._create_prepared_assignment()
        _, other_sample_test = self._create_prepared_assignment()
        result = AnalysisResult.objects.create(
            sample_test=sample_test,
            analyst=self.analyst_user,
            value="12.50",
        )
        client = self.get_authenticated_client(
            "analyst_lab@ministry.gov",
            "AnalystPass123!",
        )

        response = client.patch(
            reverse("analysisresult-detail", args=[result.id]),
            {"sample_test": str(other_sample_test.id)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("sample_test", response.data)
        result.refresh_from_db()
        self.assertEqual(result.sample_test, sample_test)

    def test_calibration_cannot_be_added_after_result_submission(self):
        _, _, result = self._create_submitted_result()
        client = self.get_authenticated_client(
            "analyst_lab@ministry.gov",
            "AnalystPass123!",
        )

        response = client.post(
            reverse("calibrationrecord-list"),
            {
                "analysis_result": str(result.id),
                "instrument_name": "ICP-OES-1",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("analysis_result", response.data)

    def test_analysis_results_cannot_be_deleted_through_generic_route(self):
        _, sample_test = self._create_prepared_assignment()
        result = AnalysisResult.objects.create(
            sample_test=sample_test,
            analyst=self.analyst_user,
            value="12.50",
        )
        client = self.get_authenticated_client("admin_lab@ministry.gov", "AdminPass123!")

        response = client.delete(reverse("analysisresult-detail", args=[result.id]))

        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertTrue(AnalysisResult.objects.filter(id=result.id).exists())

    def test_calibration_records_cannot_be_deleted_through_generic_route(self):
        _, sample_test = self._create_prepared_assignment()
        result = AnalysisResult.objects.create(
            sample_test=sample_test,
            analyst=self.analyst_user,
            value="12.50",
        )
        calibration = CalibrationRecord.objects.create(
            analysis_result=result,
            instrument_name="ICP-OES-1",
            recorded_by=self.analyst_user,
        )
        client = self.get_authenticated_client("admin_lab@ministry.gov", "AdminPass123!")

        response = client.delete(
            reverse("calibrationrecord-detail", args=[calibration.id])
        )

        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertTrue(CalibrationRecord.objects.filter(id=calibration.id).exists())

    def test_department_manager_approves_submitted_result(self):
        sample, _, result = self._create_submitted_result()
        client = self.get_authenticated_client("qc_lab@ministry.gov", "QCPass123!")

        response = client.post(
            reverse("analysisresult-approve", args=[result.id]),
            {"reason": "Reviewed and accepted."},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        result.refresh_from_db()
        sample.refresh_from_db()
        sample.job.refresh_from_db()
        self.assertEqual(result.state, AnalysisResult.State.APPROVED)
        self.assertIsNotNone(result.approved_at)
        self.assertEqual(sample.sample_status, Sample.SampleStatus.COMPLETED)
        self.assertEqual(sample.job.current_status, JobOrder.Status.COMPLETED)
        self.assertTrue(
            QCDecision.objects.filter(
                analysis_result=result,
                decision=QCDecision.Decision.APPROVED,
                decided_by=self.qc_user,
            ).exists()
        )

    def test_department_manager_rejects_submitted_result_with_reason(self):
        sample, _, result = self._create_submitted_result()
        client = self.get_authenticated_client("qc_lab@ministry.gov", "QCPass123!")

        response = client.post(
            reverse("analysisresult-reject", args=[result.id]),
            {"reason": "Calibration evidence missing."},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        result.refresh_from_db()
        sample.refresh_from_db()
        sample.job.refresh_from_db()
        self.assertEqual(result.state, AnalysisResult.State.REJECTED)
        self.assertIsNotNone(result.rejected_at)
        self.assertEqual(sample.sample_status, Sample.SampleStatus.IN_ANALYSIS)
        self.assertEqual(sample.job.current_status, JobOrder.Status.IN_ANALYSIS)
        self.assertTrue(
            QCDecision.objects.filter(
                analysis_result=result,
                decision=QCDecision.Decision.REJECTED,
                decided_by=self.qc_user,
            ).exists()
        )

    def test_reject_requires_reason(self):
        _, _, result = self._create_submitted_result()
        client = self.get_authenticated_client("qc_lab@ministry.gov", "QCPass123!")

        response = client.post(
            reverse("analysisresult-reject", args=[result.id]),
            {"reason": ""},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("state", response.data)

    def test_analyst_can_resubmit_rejected_result(self):
        _, _, result = self._create_submitted_result()
        qc_client = self.get_authenticated_client("qc_lab@ministry.gov", "QCPass123!")
        qc_client.post(
            reverse("analysisresult-reject", args=[result.id]),
            {"reason": "Needs correction."},
            format="json",
        )
        analyst_client = self.get_authenticated_client(
            "analyst_lab@ministry.gov",
            "AnalystPass123!",
        )
        patch_response = analyst_client.patch(
            reverse("analysisresult-detail", args=[result.id]),
            {"value": "13.20", "remarks": "Corrected after QC return."},
            format="json",
        )
        self.assertEqual(patch_response.status_code, status.HTTP_200_OK)

        submit_response = analyst_client.post(
            reverse("analysisresult-submit", args=[result.id])
        )

        self.assertEqual(submit_response.status_code, status.HTTP_200_OK)
        result.refresh_from_db()
        self.assertEqual(result.state, AnalysisResult.State.SUBMITTED)
        self.assertEqual(result.revision, 2)
        self.assertEqual(result.value, "13.20")

    def test_department_manager_cannot_review_other_department_result(self):
        _, sample_test = self._create_prepared_assignment(
            test=self.test_gold,
            analyst=self.analyst_user_2,
            technician=self.lab_technician_user_2,
        )
        result = AnalysisResult.objects.create(
            sample_test=sample_test,
            analyst=self.analyst_user_2,
            state=AnalysisResult.State.SUBMITTED,
            value="5.00",
        )
        client = self.get_authenticated_client("qc_lab@ministry.gov", "QCPass123!")

        response = client.post(
            reverse("analysisresult-approve", args=[result.id]),
            {"reason": "Should not be allowed."},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_client_cannot_see_internal_analysis_results(self):
        self._create_submitted_result()
        client = self.get_authenticated_client("client_lab@minerals.com", "ClientPass123!")

        response = client.get(reverse("analysisresult-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 0)

    def test_job_result_summary_compiles_result_counts(self):
        sample, _, result = self._create_submitted_result()
        client = self.get_authenticated_client("admin_lab@ministry.gov", "AdminPass123!")

        response = client.get(reverse("joborder-result-summary", args=[sample.job.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["job"], str(sample.job.id))
        self.assertEqual(response.data["total_tests"], 1)
        self.assertEqual(response.data["submitted"], 1)
        self.assertEqual(response.data["approved"], 0)
        self.assertEqual(response.data["results"][0]["id"], str(result.id))
