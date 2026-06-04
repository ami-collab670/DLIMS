"""Model tests for the laboratory app."""

from decimal import Decimal

from django.db import IntegrityError

from laboratory.models import (
    BlindCode,
    FinancialRecord,
    JobOrder,
    Sample,
    SampleCodeSequence,
    SampleTest,
    TestCatalog,
)

from .base import BaseTestCase


class TestCatalogModelTests(BaseTestCase):
    """Tests for the TestCatalog model."""

    def test_create_test_catalog_entry(self):
        self.assertEqual(self.test_gold.test_name, "Gold Fire Assay")
        self.assertEqual(self.test_gold.test_code, "GFA-01")
        self.assertEqual(self.test_gold.price, Decimal("500.00"))
        self.assertTrue(self.test_gold.is_active)

    def test_test_catalog_str_representation(self):
        self.assertEqual(str(self.test_gold), "GFA-01 — Gold Fire Assay")

    def test_test_code_uniqueness(self):
        with self.assertRaises(IntegrityError):
            TestCatalog.objects.create(
                test_name="Duplicate Code Test",
                test_code="GFA-01",
                unit="ppm",
            )

    def test_test_name_uniqueness(self):
        with self.assertRaises(IntegrityError):
            TestCatalog.objects.create(
                test_name="Gold Fire Assay",
                test_code="UNIQUE-01",
                unit="ppm",
            )


class JobOrderModelTests(BaseTestCase):
    """Tests for the JobOrder model."""

    def test_create_job_order(self):
        job = self._create_job_order()
        self.assertIsNotNone(job.id)
        self.assertEqual(job.current_status, JobOrder.Status.PAYMENT_PENDING)
        self.assertEqual(job.priority, "normal")
        self.assertFalse(job.is_cancelled)

    def test_job_order_str_representation(self):
        job = self._create_job_order()
        self.assertIn("JOB-", str(job))
        self.assertIn("Payment Pending", str(job))


class BlindCodeModelTests(BaseTestCase):
    """Tests for the BlindCode model and auto-generation."""

    def test_generate_unique_code_format(self):
        code = BlindCode.generate_unique_code()
        self.assertTrue(code.startswith("BC-"))
        self.assertEqual(len(code), 9)

    def test_generate_unique_code_no_collision(self):
        codes = set()
        for _ in range(50):
            code = BlindCode.generate_unique_code()
            self.assertNotIn(code, codes, f"Collision detected: {code}")
            codes.add(code)
            BlindCode.objects.create(code=code)

    def test_blind_code_str_representation(self):
        bc = BlindCode.objects.create(code="BC-TEST01")
        self.assertEqual(str(bc), "BC-TEST01")


class SampleModelTests(BaseTestCase):
    """Tests for the Sample model — auto-generation and relationships."""

    def test_sample_does_not_auto_generate_blind_code_before_payment(self):
        sample = self._create_sample()
        self.assertIsNone(sample.blind_alias)

    def test_sample_does_not_auto_generate_sample_code_before_payment(self):
        sample = self._create_sample()
        self.assertIsNone(sample.sample_code)

    def test_payment_generates_blind_code_and_sample_code(self):
        job = self._create_job_order()
        sample = self._create_sample(job=job)

        self._mark_job_paid(job)

        sample.refresh_from_db()
        job.refresh_from_db()
        self.assertTrue(sample.sample_code.startswith("SMP-"))
        self.assertIn("2026", sample.sample_code)
        self.assertIsNotNone(sample.blind_alias)
        self.assertTrue(sample.blind_alias.code.startswith("BC-"))
        self.assertEqual(job.current_status, JobOrder.Status.RECEIVED)

    def test_sample_code_is_sequential(self):
        job = self._create_job_order()
        s1 = self._create_sample(job=job)
        s2 = self._create_sample(job=job)
        self._mark_job_paid(job)
        s1.refresh_from_db()
        s2.refresh_from_db()
        num1 = int(s1.sample_code.split("-")[-1])
        num2 = int(s2.sample_code.split("-")[-1])
        self.assertEqual(num2, num1 + 1)

    def test_sample_code_sequence_tracks_allocated_number(self):
        job = self._create_job_order()
        self._create_sample(job=job)
        self._mark_job_paid(job)
        sequence = SampleCodeSequence.objects.get(year=2026)
        self.assertEqual(sequence.last_number, 1)

    def test_sample_code_not_reused_after_latest_sample_deleted(self):
        job = self._create_job_order()
        sample = self._create_sample(job=job)
        self._mark_job_paid(job)
        sample.refresh_from_db()
        sample.delete()

        replacement_job = self._create_job_order()
        replacement = self._create_sample(job=replacement_job)
        self._mark_job_paid(replacement_job)
        replacement.refresh_from_db()

        self.assertTrue(replacement.sample_code.endswith("0002"))

    def test_sample_code_sequence_bootstraps_from_existing_samples(self):
        job = self._create_job_order()
        self._create_sample(job=job)
        self._mark_job_paid(job)
        SampleCodeSequence.objects.all().delete()

        replacement_job = self._create_job_order()
        replacement = self._create_sample(job=replacement_job)
        self._mark_job_paid(replacement_job)
        replacement.refresh_from_db()

        self.assertTrue(replacement.sample_code.endswith("0002"))
        sequence = SampleCodeSequence.objects.get(year=2026)
        self.assertEqual(sequence.last_number, 2)

    def test_sample_code_sequence_bootstraps_numeric_max_suffix(self):
        job = self._create_job_order()
        sample = self._create_sample(job=job)
        self._mark_job_paid(job)
        sample.refresh_from_db()
        sample.sample_code = "SMP-2026-10000"
        sample.save(update_fields=["sample_code"])
        SampleCodeSequence.objects.all().delete()

        replacement_job = self._create_job_order()
        replacement = self._create_sample(job=replacement_job)
        self._mark_job_paid(replacement_job)
        replacement.refresh_from_db()

        self.assertEqual(replacement.sample_code, "SMP-2026-10001")
        sequence = SampleCodeSequence.objects.get(year=2026)
        self.assertEqual(sequence.last_number, 10001)

    def test_sample_str_representation(self):
        sample = self._create_sample()
        self.assertIn("PENDING-CODE", str(sample))
        self.assertIn("Test Quartz Sample", str(sample))

    def test_sample_blind_alias_is_unique(self):
        job = self._create_job_order()
        s1 = self._create_sample(job=job)
        s2 = self._create_sample(job=job)
        self._mark_job_paid(job)
        s1.refresh_from_db()
        s2.refresh_from_db()
        self.assertNotEqual(s1.blind_alias.code, s2.blind_alias.code)

    def test_payment_coding_is_idempotent(self):
        job = self._create_job_order()
        sample = self._create_sample(job=job)
        record = self._mark_job_paid(job)
        sample.refresh_from_db()
        original_sample_code = sample.sample_code
        original_blind_alias_id = sample.blind_alias_id

        record.save()
        sample.refresh_from_db()

        self.assertEqual(sample.sample_code, original_sample_code)
        self.assertEqual(sample.blind_alias_id, original_blind_alias_id)

    def test_existing_coded_sample_is_not_overwritten(self):
        job = self._create_job_order()
        sample = self._create_sample(job=job)
        existing_alias = BlindCode.objects.create(code="BC-LEGACY")
        sample.blind_alias = existing_alias
        sample.sample_code = "SMP-2026-0099"
        sample.save(update_fields=["blind_alias", "sample_code"])

        self._mark_job_paid(job)
        sample.refresh_from_db()

        self.assertEqual(sample.blind_alias, existing_alias)
        self.assertEqual(sample.sample_code, "SMP-2026-0099")

    def test_sample_added_after_paid_job_is_coded(self):
        job = self._create_job_order()
        self._mark_job_paid(job)

        sample = self._create_sample(job=job)
        sample.refresh_from_db()

        self.assertIsNotNone(sample.blind_alias)
        self.assertTrue(sample.sample_code.startswith("SMP-"))


class FinancialRecordModelTests(BaseTestCase):
    """Tests for FinancialRecord payment-gate behavior."""

    def test_create_financial_record_pending(self):
        job = self._create_job_order()
        record = self._create_financial_record(job=job)

        self.assertTrue(record.invoice_no.startswith("INV-"))
        self.assertEqual(record.payment_status, FinancialRecord.PaymentStatus.PENDING)
        self.assertIsNone(record.paid_at)

    def test_paid_financial_record_sets_paid_at(self):
        job = self._create_job_order()
        record = self._create_financial_record(
            job=job,
            payment_status=FinancialRecord.PaymentStatus.PAID,
            amount_paid=Decimal("500.00"),
        )

        self.assertIsNotNone(record.paid_at)

    def test_waived_financial_record_sets_approval_time_and_codes_samples(self):
        job = self._create_job_order()
        sample = self._create_sample(job=job)
        record = FinancialRecord.objects.create(
            job=job,
            amount_expected=Decimal("500.00"),
            amount_paid=Decimal("0.00"),
            payment_status=FinancialRecord.PaymentStatus.PENDING,
            payment_required=False,
            waiver_reason="Director-approved waiver.",
            waiver_approved_by=self.finance_user,
        )

        sample.refresh_from_db()
        job.refresh_from_db()
        self.assertIsNotNone(record.waiver_approved_at)
        self.assertTrue(sample.sample_code.startswith("SMP-"))
        self.assertIsNotNone(sample.blind_alias)
        self.assertEqual(job.current_status, JobOrder.Status.RECEIVED)


class SampleTestModelTests(BaseTestCase):
    """Tests for the SampleTest junction model."""

    def test_create_sample_test_assignment(self):
        sample = self._create_sample()
        st = SampleTest.objects.create(sample=sample, test=self.test_gold)
        self.assertEqual(st.sample, sample)
        self.assertEqual(st.test, self.test_gold)

    def test_duplicate_sample_test_raises_error(self):
        sample = self._create_sample()
        SampleTest.objects.create(sample=sample, test=self.test_gold)
        with self.assertRaises(IntegrityError):
            SampleTest.objects.create(sample=sample, test=self.test_gold)
