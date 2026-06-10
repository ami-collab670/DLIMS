"""
Shared fixtures and helpers for laboratory tests.
"""

from decimal import Decimal

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import Department, Role, User
from laboratory.models import FinancialRecord, JobOrder, TestCatalog, Sample, SampleTest


class BaseTestCase(TestCase):
    """
    Shared setup for all laboratory tests.
    Creates roles, users (admin, receptionist, analyst, client, finance),
    and provides a JWT-based authentication helper.
    """

    @classmethod
    def setUpTestData(cls):
        """Create shared test fixtures (roles, users, test catalog entries)."""
        cls.admin_role = Role.objects.get(role_name="admin")
        cls.receptionist_role = Role.objects.get(role_name="receptionist")
        cls.lab_technician_role = Role.objects.get(role_name="lab_technician")
        cls.analyst_role = Role.objects.get(role_name="analyst")
        cls.qc_role = Role.objects.get(role_name="qc_manager")
        cls.lab_director_role = Role.objects.get(role_name="lab_director")
        cls.finance_role = Role.objects.get(role_name="finance")
        cls.auditor_role = Role.objects.get(role_name="auditor")

        cls.department_water = Department.objects.create(
            name="Water",
            description="Water and environmental analysis section.",
        )
        cls.department_mineralogy = Department.objects.create(
            name="Mineralogy",
            description="Mineralogy and ore analysis section.",
        )

        cls.admin_user = User.objects.create_user(
            username="admin_lab",
            email="admin_lab@ministry.gov",
            password="AdminPass123!",
            user_type="internal",
            role=cls.admin_role,
        )
        cls.receptionist_user = User.objects.create_user(
            username="receptionist_lab",
            email="receptionist_lab@ministry.gov",
            password="ReceptionistPass123!",
            user_type="internal",
            role=cls.receptionist_role,
        )
        cls.lab_technician_user = User.objects.create_user(
            username="lab_technician_lab",
            email="lab_technician_lab@ministry.gov",
            password="LabTechPass123!",
            user_type="internal",
            role=cls.lab_technician_role,
            department=cls.department_water,
        )
        cls.lab_technician_user_2 = User.objects.create_user(
            username="lab_technician_lab_2",
            email="lab_technician_lab_2@ministry.gov",
            password="LabTechPass123!",
            user_type="internal",
            role=cls.lab_technician_role,
            department=cls.department_mineralogy,
        )
        cls.analyst_user = User.objects.create_user(
            username="analyst_lab",
            email="analyst_lab@ministry.gov",
            password="AnalystPass123!",
            user_type="internal",
            role=cls.analyst_role,
            department=cls.department_water,
        )
        cls.analyst_user_2 = User.objects.create_user(
            username="analyst_lab_2",
            email="analyst_lab_2@ministry.gov",
            password="AnalystPass123!",
            user_type="internal",
            role=cls.analyst_role,
            department=cls.department_mineralogy,
        )
        cls.qc_user = User.objects.create_user(
            username="qc_lab",
            email="qc_lab@ministry.gov",
            password="QCPass123!",
            user_type="internal",
            role=cls.qc_role,
            department=cls.department_water,
        )
        cls.lab_director_user = User.objects.create_user(
            username="lab_director_lab",
            email="lab_director_lab@ministry.gov",
            password="DirectorPass123!",
            user_type="internal",
            role=cls.lab_director_role,
        )
        cls.finance_user = User.objects.create_user(
            username="finance_lab",
            email="finance_lab@ministry.gov",
            password="FinancePass123!",
            user_type="internal",
            role=cls.finance_role,
        )
        cls.auditor_user = User.objects.create_user(
            username="auditor_lab",
            email="auditor_lab@ministry.gov",
            password="AuditorPass123!",
            user_type="internal",
            role=cls.auditor_role,
        )
        cls.external_superuser = User.objects.create_superuser(
            username="external_superuser_lab",
            email="external_superuser_lab@ministry.gov",
            password="SuperuserPass123!",
        )

        cls.client_user = User.objects.create_user(
            username="client_lab",
            email="client_lab@minerals.com",
            password="ClientPass123!",
            user_type="external",
        )
        cls.client_user_2 = User.objects.create_user(
            username="client_lab_2",
            email="client_lab_2@minerals.com",
            password="ClientPass123!",
            user_type="external",
        )

        cls.test_gold = TestCatalog.objects.create(
            test_name="Gold Fire Assay",
            test_code="GFA-01",
            description="Fire assay for gold content determination.",
            unit="ppm",
            price=Decimal("500.00"),
            department=cls.department_mineralogy,
        )
        cls.test_silver = TestCatalog.objects.create(
            test_name="Silver Analysis",
            test_code="SLV-01",
            description="Atomic absorption for silver content.",
            unit="ppm",
            price=Decimal("350.00"),
            department=cls.department_water,
        )
        cls.test_inactive = TestCatalog.objects.create(
            test_name="Deprecated Test",
            test_code="DEP-01",
            description="This test is no longer offered.",
            unit="mg/kg",
            price=Decimal("100.00"),
            is_active=False,
            department=cls.department_mineralogy,
        )

    def get_authenticated_client(self, email, password):
        """Obtain a real JWT token and return an authenticated APIClient."""
        client = APIClient()
        response = client.post(
            reverse("token_obtain_pair"),
            {"email": email, "password": password},
            format="json",
        )
        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            f"Auth failed for {email}: {response.data}",
        )
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
        return client

    def _create_job_order(self, client_user=None, submitted_by=None):
        """Helper to create a JobOrder directly in the DB."""
        return JobOrder.objects.create(
            client=client_user or self.client_user,
            submitted_by=submitted_by or self.receptionist_user,
            current_status=JobOrder.Status.PAYMENT_PENDING,
            priority=JobOrder.Priority.NORMAL,
            description="Test job order",
        )

    def _create_sample(self, job=None, analyst=None):
        """Helper to create a Sample directly in the DB (triggers auto-generation)."""
        return Sample.objects.create(
            job=job or self._create_job_order(),
            sample_name="Test Quartz Sample",
            sample_weight=Decimal("150.500"),
            packaging_type="Sealed Bag",
            received_by=self.receptionist_user,
            submitted_by=self.client_user,
            assigned_analyst=analyst,
        )

    def _create_financial_record(
        self,
        job=None,
        payment_status=FinancialRecord.PaymentStatus.PENDING,
        amount_expected=Decimal("500.00"),
        amount_paid=Decimal("0.00"),
    ):
        """Helper to create a FinancialRecord directly in the DB."""
        return FinancialRecord.objects.create(
            job=job or self._create_job_order(),
            amount_expected=amount_expected,
            amount_paid=amount_paid,
            payment_status=payment_status,
        )

    def _mark_job_paid(self, job):
        """Helper to mark a job paid, triggering permanent sample coding."""
        amount_expected = Decimal("500.00")
        record, _ = FinancialRecord.objects.get_or_create(
            job=job,
            defaults={
                "amount_expected": amount_expected,
                "amount_paid": amount_expected,
            },
        )
        record.amount_expected = amount_expected
        record.amount_paid = amount_expected
        record.payment_status = FinancialRecord.PaymentStatus.PAID
        record.save()
        return record

    def _create_coded_sample(self, job=None, analyst=None):
        """Create a sample and mark its job paid so permanent identity exists."""
        job = job or self._create_job_order()
        sample = self._create_sample(job=job, analyst=analyst)
        self._mark_job_paid(job)
        sample.refresh_from_db()
        return sample

    def _assign_test(self, sample, test=None):
        """Assign an active catalog test to a sample."""
        return SampleTest.objects.create(sample=sample, test=test or self.test_silver)
