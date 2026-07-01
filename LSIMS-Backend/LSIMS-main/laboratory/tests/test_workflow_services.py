"""
Tests for explicit laboratory workflow services.
"""

from laboratory.models import JobOrder
from laboratory.services.workflow import (
    WorkflowTransitionError,
    code_paid_job_samples,
    transition_job,
)
from laboratory.tests.base import BaseTestCase


class WorkflowServiceTests(BaseTestCase):
    def test_code_paid_job_samples_assigns_identity_and_advances_job(self):
        job = self._create_job_order()
        sample = self._create_sample(job=job)

        code_paid_job_samples(job)

        sample.refresh_from_db()
        job.refresh_from_db()

        self.assertIsNotNone(sample.sample_code)
        self.assertIsNotNone(sample.blind_alias)
        self.assertEqual(job.current_status, JobOrder.Status.RECEIVED)

    def test_code_paid_job_samples_is_idempotent(self):
        sample = self._create_coded_sample()
        original_sample_code = sample.sample_code
        original_blind_alias_id = sample.blind_alias_id

        code_paid_job_samples(sample.job)

        sample.refresh_from_db()
        self.assertEqual(sample.sample_code, original_sample_code)
        self.assertEqual(sample.blind_alias_id, original_blind_alias_id)

    def test_transition_job_rejects_invalid_jump(self):
        job = self._create_job_order()

        with self.assertRaises(WorkflowTransitionError):
            transition_job(job, JobOrder.Status.QC)

        job.refresh_from_db()
        self.assertEqual(job.current_status, JobOrder.Status.PENDING_FINANCE)

    def test_transition_job_accepts_valid_payment_to_received_step(self):
        job = self._create_job_order()

        transition_job(job, JobOrder.Status.RECEIVED)

        job.refresh_from_db()
        self.assertEqual(job.current_status, JobOrder.Status.RECEIVED)

