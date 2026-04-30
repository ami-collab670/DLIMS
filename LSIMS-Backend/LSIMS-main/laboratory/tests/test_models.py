"""Model tests for the laboratory app."""

from decimal import Decimal

from django.db import IntegrityError

from laboratory.models import (
    BlindCode,
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
        self.assertEqual(job.current_status, "received")
        self.assertEqual(job.priority, "normal")
        self.assertFalse(job.is_cancelled)

    def test_job_order_str_representation(self):
        job = self._create_job_order()
        self.assertIn("JOB-", str(job))
        self.assertIn("Received", str(job))


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

    def test_sample_auto_generates_blind_code(self):
        sample = self._create_sample()
        self.assertIsNotNone(sample.blind_alias)
        self.assertTrue(sample.blind_alias.code.startswith("BC-"))

    def test_sample_auto_generates_sample_code(self):
        sample = self._create_sample()
        self.assertTrue(sample.sample_code.startswith("SMP-"))
        self.assertIn("2026", sample.sample_code)

    def test_sample_code_is_sequential(self):
        job = self._create_job_order()
        s1 = self._create_sample(job=job)
        s2 = self._create_sample(job=job)
        num1 = int(s1.sample_code.split("-")[-1])
        num2 = int(s2.sample_code.split("-")[-1])
        self.assertEqual(num2, num1 + 1)

    def test_sample_code_sequence_tracks_allocated_number(self):
        self._create_sample()
        sequence = SampleCodeSequence.objects.get(year=2026)
        self.assertEqual(sequence.last_number, 1)

    def test_sample_code_not_reused_after_latest_sample_deleted(self):
        sample = self._create_sample()
        sample.delete()
        replacement = self._create_sample()
        self.assertTrue(replacement.sample_code.endswith("0002"))

    def test_sample_code_sequence_bootstraps_from_existing_samples(self):
        self._create_sample()
        SampleCodeSequence.objects.all().delete()

        replacement = self._create_sample()

        self.assertTrue(replacement.sample_code.endswith("0002"))
        sequence = SampleCodeSequence.objects.get(year=2026)
        self.assertEqual(sequence.last_number, 2)

    def test_sample_code_sequence_bootstraps_numeric_max_suffix(self):
        sample = self._create_sample()
        sample.sample_code = "SMP-2026-10000"
        sample.save(update_fields=["sample_code"])
        SampleCodeSequence.objects.all().delete()

        replacement = self._create_sample()

        self.assertEqual(replacement.sample_code, "SMP-2026-10001")
        sequence = SampleCodeSequence.objects.get(year=2026)
        self.assertEqual(sequence.last_number, 10001)

    def test_sample_str_representation(self):
        sample = self._create_sample()
        self.assertIn("SMP-", str(sample))
        self.assertIn("Test Quartz Sample", str(sample))

    def test_sample_blind_alias_is_unique(self):
        job = self._create_job_order()
        s1 = self._create_sample(job=job)
        s2 = self._create_sample(job=job)
        self.assertNotEqual(s1.blind_alias.code, s2.blind_alias.code)


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
