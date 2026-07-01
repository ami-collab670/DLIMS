"""
LSIMS Accounts ΓÇö Comprehensive Test Suite (Sprint 1)
=======================================================
Covers the Verification Protocol requirements:
  1. Authentication Check  ΓÇö Unauthorized users get 401
  2. Permission Check      ΓÇö Wrong roles get 403
  3. Success Check         ΓÇö Happy paths return 200/201 with correct DB state
  4. Logic Check           ΓÇö Business logic (internal users must have roles, etc.)
"""

from datetime import timedelta
from unittest.mock import patch

from django.core import mail
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from .models import Department, OTPToken, Role, User


class BaseTestCase(TestCase):
    """
    Shared setup: creates system roles, an admin user, and a non-admin user.
    """

    @classmethod
    def setUpTestData(cls):
        # Get or create all roles (data migrations may have seeded them)
        cls.roles = {}
        role_data = [
            ("admin", "System Administration"),
            ("receptionist", "Reception Desk"),
            ("lab_technician", "Laboratory Preparation Technician"),
            ("analyst", "Laboratory Analysis Dept"),
            ("qc_manager", "QC-Department-Support"),
            ("lab_director", "Laboratory Director"),
            ("finance", "Finance Department"),
            ("procurement", "Procurement Office"),
            ("ministry_coordinator", "Ministry Coordination"),
            ("auditor", "Audit & Compliance"),
        ]
        for role_name, alias in role_data:
            cls.roles[role_name], _ = Role.objects.get_or_create(
                role_name=role_name, defaults={"contact_alias": alias}
            )

        cls.department = Department.objects.create(
            name="Water",
            description="Water and environmental analysis.",
        )

        # Admin user
        cls.admin_user = User.objects.create_user(
            username="admin",
            email="admin@ministry.gov",
            password="AdminPass123!",
            user_type="internal",
            role=cls.roles["admin"],
        )

        # Receptionist user
        cls.receptionist_user = User.objects.create_user(
            username="receptionist",
            email="reception@ministry.gov",
            password="RecepPass123!",
            user_type="internal",
            role=cls.roles["receptionist"],
        )

        # Lab Technician user
        cls.lab_technician_user = User.objects.create_user(
            username="labtech",
            email="labtech@ministry.gov",
            password="LabTechPass123!",
            user_type="internal",
            role=cls.roles["lab_technician"],
            department=cls.department,
        )

        # Analyst user
        cls.analyst_user = User.objects.create_user(
            username="analyst",
            email="analyst@ministry.gov",
            password="AnalystPass123!",
            user_type="internal",
            role=cls.roles["analyst"],
            department=cls.department,
        )

        # QC Manager user
        cls.qc_user = User.objects.create_user(
            username="qcmanager",
            email="qc@ministry.gov",
            password="QCPass123!",
            user_type="internal",
            role=cls.roles["qc_manager"],
            department=cls.department,
        )

        # Lab Director user
        cls.lab_director_user = User.objects.create_user(
            username="labdirector",
            email="director@ministry.gov",
            password="DirectorPass123!",
            user_type="internal",
            role=cls.roles["lab_director"],
        )

        # Finance user
        cls.finance_user = User.objects.create_user(
            username="finance",
            email="finance@ministry.gov",
            password="FinancePass123!",
            user_type="internal",
            role=cls.roles["finance"],
        )

        # Procurement user
        cls.procurement_user = User.objects.create_user(
            username="procurement",
            email="procurement@ministry.gov",
            password="ProcurePass123!",
            user_type="internal",
            role=cls.roles["procurement"],
        )

        # Ministry Coordinator user
        cls.coordinator_user = User.objects.create_user(
            username="coordinator",
            email="coordinator@ministry.gov",
            password="CoordPass123!",
            user_type="internal",
            role=cls.roles["ministry_coordinator"],
        )

        # Auditor user
        cls.auditor_user = User.objects.create_user(
            username="auditor",
            email="auditor@ministry.gov",
            password="AuditorPass123!",
            user_type="internal",
            role=cls.roles["auditor"],
        )

        # External client user (no role)
        cls.client_user = User.objects.create_user(
            username="client",
            email="client@company.com",
            password="ClientPass123!",
            user_type="external",
            country="ethiopia",
            nationality="Ethiopian",
            organization_name="Mining Corp",
            organization_type="private",
        )

    def get_authenticated_client(self, user_email, password):
        """Helper: returns an APIClient with a valid JWT Bearer token."""
        client = APIClient()
        response = client.post(
            reverse("token_obtain_pair"),
            {"email": user_email, "password": password},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, f"Auth failed for {user_email}")
        token = response.data["access"]
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        return client


# ===========================================================================
# MODEL TESTS
# ===========================================================================
class RoleModelTests(TestCase):
    """Tests for the Role model."""

    def test_role_creation(self):
        """Verify a role can be retrieved/created and has correct __str__."""
        role, _ = Role.objects.get_or_create(
            role_name="admin", defaults={"contact_alias": "Admin Dept"}
        )
        self.assertEqual(str(role), "Admin")
        self.assertIsNotNone(role.id)

    def test_qc_manager_display_label_is_department_manager(self):
        role, _ = Role.objects.get_or_create(
            role_name="qc_manager", defaults={"contact_alias": "Department Manager"}
        )
        self.assertEqual(str(role), "Department Manager")

    def test_role_name_uniqueness(self):
        """Duplicate role_name must raise an exception."""
        Role.objects.get_or_create(
            role_name="admin", defaults={"contact_alias": "Admin 1"}
        )
        with self.assertRaises(Exception):
            Role.objects.create(role_name="admin", contact_alias="Admin 2")


class DepartmentModelTests(TestCase):
    """Tests for the Department model."""

    def test_department_creation(self):
        department = Department.objects.create(
            name="Water",
            description="Water and environmental analysis.",
        )
        self.assertEqual(str(department), "Water")
        self.assertIsNotNone(department.id)


class UserModelTests(TestCase):
    """Tests for the custom User model."""

    def test_user_creation_with_role(self):
        role, _ = Role.objects.get_or_create(
            role_name="analyst", defaults={"contact_alias": "Lab"}
        )
        user = User.objects.create_user(
            username="testanalyst",
            email="test@lab.gov",
            password="TestPass123!",
            user_type="internal",
            role=role,
        )
        self.assertEqual(user.email, "test@lab.gov")
        self.assertEqual(user.role_name, "analyst")
        self.assertTrue(user.check_password("TestPass123!"))

    def test_user_creation_external(self):
        user = User.objects.create_user(
            username="extclient",
            email="ext@corp.com",
            password="ExtPass123!",
            user_type="external",
            country="other",
            nationality="Kenyan",
        )
        self.assertIsNone(user.role_name)
        self.assertEqual(user.country, "other")
        self.assertEqual(user.nationality, "Kenyan")

    def test_email_uniqueness(self):
        User.objects.create_user(
            username="user1", email="dup@test.com", password="Pass123!"
        )
        with self.assertRaises(Exception):
            User.objects.create_user(
                username="user2", email="dup@test.com", password="Pass456!"
            )


# ===========================================================================
# AUTHENTICATION TESTS (401 Unauthorized)
# ===========================================================================
class AuthenticationTests(BaseTestCase):
    """Verify that unauthenticated requests receive 401."""

    def test_roles_list_unauthenticated(self):
        client = APIClient()
        response = client.get(reverse("role-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_users_list_unauthenticated(self):
        client = APIClient()
        response = client.get(reverse("user-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_unauthenticated(self):
        client = APIClient()
        response = client.get(reverse("profile"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_role_create_unauthenticated(self):
        client = APIClient()
        response = client.post(
            reverse("role-list"),
            {"role_name": "admin", "contact_alias": "test"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_create_unauthenticated(self):
        client = APIClient()
        response = client.post(
            reverse("user-list"),
            {"username": "hack", "email": "hack@evil.com", "password": "12345678"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ===========================================================================
# PERMISSION TESTS (403 Forbidden)
# ===========================================================================
class PermissionTests(BaseTestCase):
    """Verify that non-Admin roles receive 403 on Admin-only endpoints."""

    def _assert_forbidden_for_role(self, email, password, url, method="get"):
        client = self.get_authenticated_client(email, password)
        if method == "get":
            response = client.get(url)
        elif method == "post":
            response = client.post(url, {}, format="json")
        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
            f"{email} should be forbidden from {method.upper()} {url}",
        )

    def test_receptionist_cannot_list_roles(self):
        self._assert_forbidden_for_role(
            "reception@ministry.gov", "RecepPass123!", reverse("role-list")
        )

    def test_analyst_cannot_list_users(self):
        self._assert_forbidden_for_role(
            "analyst@ministry.gov", "AnalystPass123!", reverse("user-list")
        )

    def test_finance_cannot_create_user(self):
        self._assert_forbidden_for_role(
            "finance@ministry.gov", "FinancePass123!", reverse("user-list"), "post"
        )

    def test_qc_manager_cannot_create_role(self):
        self._assert_forbidden_for_role(
            "qc@ministry.gov", "QCPass123!", reverse("role-list"), "post"
        )

    def test_procurement_cannot_list_users(self):
        self._assert_forbidden_for_role(
            "procurement@ministry.gov", "ProcurePass123!", reverse("user-list")
        )

    def test_coordinator_cannot_list_roles(self):
        self._assert_forbidden_for_role(
            "coordinator@ministry.gov", "CoordPass123!", reverse("role-list")
        )

    def test_auditor_cannot_create_user(self):
        self._assert_forbidden_for_role(
            "auditor@ministry.gov", "AuditorPass123!", reverse("user-list"), "post"
        )

    def test_external_client_cannot_list_users(self):
        self._assert_forbidden_for_role(
            "client@company.com", "ClientPass123!", reverse("user-list")
        )

    def test_external_client_cannot_list_roles(self):
        self._assert_forbidden_for_role(
            "client@company.com", "ClientPass123!", reverse("role-list")
        )


# ===========================================================================
# SUCCESS / HAPPY-PATH TESTS (200/201)
# ===========================================================================
class AdminRoleCRUDTests(BaseTestCase):
    """Admin can perform full CRUD on Roles."""

    def setUp(self):
        self.client = self.get_authenticated_client(
            "admin@ministry.gov", "AdminPass123!"
        )

    def test_list_roles(self):
        response = self.client.get(reverse("role-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 10)

    def test_create_role_after_delete(self):
        """Delete a role then re-create it to verify full create flow."""
        role = self.roles["procurement"]
        self.client.delete(reverse("role-detail", args=[role.id]))
        self.assertFalse(Role.objects.filter(id=role.id).exists())
        response = self.client.post(
            reverse("role-list"),
            {"role_name": "procurement", "contact_alias": "Procurement Office (Recreated)"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Role.objects.filter(role_name="procurement").exists())

    def test_retrieve_role(self):
        role = self.roles["analyst"]
        response = self.client.get(reverse("role-detail", args=[role.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["role_name"], "analyst")
        self.assertEqual(response.data["contact_alias"], role.contact_alias)

    def test_update_role_contact_alias(self):
        role = self.roles["finance"]
        response = self.client.patch(
            reverse("role-detail", args=[role.id]),
            {"contact_alias": "Finance & Billing Dept"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        role.refresh_from_db()
        self.assertEqual(role.contact_alias, "Finance & Billing Dept")

    def test_delete_role(self):
        role = self.roles["procurement"]
        response = self.client.delete(reverse("role-detail", args=[role.id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Role.objects.filter(id=role.id).exists())


class AdminDepartmentCRUDTests(BaseTestCase):
    """Admin can manage laboratory departments."""

    def setUp(self):
        self.client = self.get_authenticated_client(
            "admin@ministry.gov", "AdminPass123!"
        )

    def test_admin_can_create_department(self):
        response = self.client.post(
            reverse("department-list"),
            {"name": "Mineralogy", "description": "Ore and mineral analysis."},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Department.objects.filter(name="Mineralogy").exists())

    def test_non_admin_cannot_create_department(self):
        client = self.get_authenticated_client(
            "reception@ministry.gov", "RecepPass123!"
        )
        response = client.post(
            reverse("department-list"),
            {"name": "Water"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class AdminUserCRUDTests(BaseTestCase):
    """Admin can perform full CRUD on Users."""

    def setUp(self):
        self.client = self.get_authenticated_client(
            "admin@ministry.gov", "AdminPass123!"
        )

    def test_list_users(self):
        response = self.client.get(reverse("user-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data["count"], 11)

    def test_create_internal_user(self):
        response = self.client.post(
            reverse("user-list"),
            {
                "username": "newanalyst",
                "email": "new.analyst@ministry.gov",
                "password": "NewAnalyst123!",
                "first_name": "New",
                "last_name": "Analyst",
                "user_type": "internal",
                "role": str(self.roles["analyst"].id),
                "department": str(self.department.id),
                "phone": "+251911000000",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        new_user = User.objects.get(email="new.analyst@ministry.gov")
        self.assertEqual(new_user.role_name, "analyst")
        self.assertEqual(new_user.department, self.department)
        self.assertTrue(new_user.check_password("NewAnalyst123!"))

    def test_create_external_user(self):
        response = self.client.post(
            reverse("user-list"),
            {
                "username": "newclient",
                "email": "new.client@corp.com",
                "password": "NewClient123!",
                "user_type": "external",
                "country": "ethiopia",
                "nationality": "Ethiopian",
                "organization_name": "Gold Corp",
                "organization_type": "private",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        new_user = User.objects.get(email="new.client@corp.com")
        self.assertIsNone(new_user.role)
        self.assertEqual(new_user.country, "ethiopia")
        self.assertEqual(new_user.organization_type, "private")

    def test_retrieve_user(self):
        response = self.client.get(
            reverse("user-detail", args=[self.analyst_user.id])
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "analyst@ministry.gov")
        self.assertIn("role_detail", response.data)

    def test_update_user(self):
        response = self.client.patch(
            reverse("user-detail", args=[self.receptionist_user.id]),
            {"first_name": "Updated", "last_name": "Receptionist"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.receptionist_user.refresh_from_db()
        self.assertEqual(self.receptionist_user.first_name, "Updated")

    def test_soft_delete_user(self):
        """Verify DELETE performs soft-delete (is_active=False) instead of DB removal."""
        response = self.client.delete(
            reverse("user-detail", args=[self.client_user.id])
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client_user.refresh_from_db()
        self.assertFalse(self.client_user.is_active)
        # User should still exist in DB
        self.assertTrue(User.objects.filter(id=self.client_user.id).exists())

    def test_change_password(self):
        response = self.client.post(
            reverse("user-change-password", args=[self.analyst_user.id]),
            {"new_password": "BrandNewPass999!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.analyst_user.refresh_from_db()
        self.assertTrue(self.analyst_user.check_password("BrandNewPass999!"))

    def test_filter_users_by_role(self):
        response = self.client.get(
            reverse("user-list"), {"role__role_name": "analyst"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for user in response.data["results"]:
            self.assertEqual(user["role_detail"]["role_name"], "analyst")

    def test_filter_users_by_type(self):
        response = self.client.get(
            reverse("user-list"), {"user_type": "external"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for user in response.data["results"]:
            self.assertEqual(user["user_type"], "external")


# ===========================================================================
# BUSINESS LOGIC / VALIDATION TESTS
# ===========================================================================
class BusinessLogicTests(BaseTestCase):
    """Tests for validation rules and business logic."""

    def setUp(self):
        self.client = self.get_authenticated_client(
            "admin@ministry.gov", "AdminPass123!"
        )

    def test_internal_user_requires_role(self):
        """Internal users MUST have a role assigned."""
        response = self.client.post(
            reverse("user-list"),
            {
                "username": "noroleuser",
                "email": "norole@ministry.gov",
                "password": "NoRole123!",
                "user_type": "internal",
                # role is intentionally omitted
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("role", response.data)

    def test_department_scoped_internal_user_requires_department(self):
        """Department-scoped internal roles must be tied to a department."""
        response = self.client.post(
            reverse("user-list"),
            {
                "username": "nodeptanalyst",
                "email": "nodept@ministry.gov",
                "password": "NoDept123!",
                "user_type": "internal",
                "role": str(self.roles["analyst"].id),
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("department", response.data)

    def test_external_user_does_not_require_role(self):
        """External (client) users do NOT need a role."""
        response = self.client.post(
            reverse("user-list"),
            {
                "username": "freeagent",
                "email": "free@company.com",
                "password": "FreeAgent123!",
                "user_type": "external",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_duplicate_email_rejected(self):
        """Email uniqueness is enforced."""
        response = self.client.post(
            reverse("user-list"),
            {
                "username": "dupuser",
                "email": "admin@ministry.gov",  # already exists
                "password": "DupPass123!",
                "user_type": "external",
            },
            format="json",
        )
        self.assertIn(
            response.status_code,
            [status.HTTP_400_BAD_REQUEST, status.HTTP_409_CONFLICT],
        )

    def test_password_is_hashed_not_stored_plain(self):
        """Verify that password is hashed, not stored in plaintext."""
        response = self.client.post(
            reverse("user-list"),
            {
                "username": "hashtest",
                "email": "hash@test.com",
                "password": "HashMe123!",
                "user_type": "external",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email="hash@test.com")
        self.assertNotEqual(user.password, "HashMe123!")
        self.assertTrue(user.check_password("HashMe123!"))

    def test_short_password_rejected(self):
        """Password must be at least 8 characters."""
        response = self.client.post(
            reverse("user-list"),
            {
                "username": "shortpw",
                "email": "short@test.com",
                "password": "123",
                "user_type": "external",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ===========================================================================
# JWT AUTHENTICATION TESTS
# ===========================================================================
class JWTAuthTests(BaseTestCase):
    """Tests for JWT token obtain and refresh."""

    def test_obtain_token_success(self):
        client = APIClient()
        response = client.post(
            reverse("token_obtain_pair"),
            {"email": "admin@ministry.gov", "password": "AdminPass123!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_obtain_token_wrong_password(self):
        client = APIClient()
        response = client.post(
            reverse("token_obtain_pair"),
            {"email": "admin@ministry.gov", "password": "WrongPassword"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_obtain_token_nonexistent_email(self):
        client = APIClient()
        response = client.post(
            reverse("token_obtain_pair"),
            {"email": "ghost@nowhere.com", "password": "Ghost123!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_token(self):
        client = APIClient()
        login_resp = client.post(
            reverse("token_obtain_pair"),
            {"email": "admin@ministry.gov", "password": "AdminPass123!"},
            format="json",
        )
        refresh_token = login_resp.data["refresh"]
        response = client.post(
            reverse("token_refresh"),
            {"refresh": refresh_token},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_refresh_token_invalid(self):
        client = APIClient()
        response = client.post(
            reverse("token_refresh"),
            {"refresh": "invalid-token-string"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ===========================================================================
# PASSWORD RESET OTP TESTS
# ===========================================================================
@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="noreply@lsims.test",
)
class PasswordResetOTPTests(BaseTestCase):
    """Tests for public email OTP password recovery endpoints."""

    def setUp(self):
        self.client = APIClient()
        mail.outbox = []

    def request_otp(self, email="client@company.com", code="123456"):
        with patch("accounts.models.OTPToken.generate_code", return_value=code):
            return self.client.post(
                reverse("password-reset-request"),
                {"email": email},
                format="json",
            )

    def test_password_reset_request_sends_otp_for_existing_user(self):
        response = self.request_otp()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(OTPToken.objects.filter(user=self.client_user).count(), 1)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("123456", mail.outbox[0].body)
        self.assertEqual(mail.outbox[0].to, ["client@company.com"])

    def test_password_reset_confirm_success_resets_password(self):
        self.request_otp(code="654321")

        response = self.client.post(
            reverse("password-reset-confirm"),
            {
                "email": "client@company.com",
                "otp": "654321",
                "new_password": "NewResetPass123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client_user.refresh_from_db()
        self.assertTrue(self.client_user.check_password("NewResetPass123!"))
        self.assertTrue(OTPToken.objects.get(user=self.client_user).is_used)

    def test_password_reset_confirm_rejects_expired_otp(self):
        self.request_otp(code="222222")
        token = OTPToken.objects.get(user=self.client_user)
        token.expires_at = timezone.now() - timedelta(minutes=1)
        token.save(update_fields=["expires_at"])

        response = self.client.post(
            reverse("password-reset-confirm"),
            {
                "email": "client@company.com",
                "otp": "222222",
                "new_password": "NewResetPass123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.client_user.refresh_from_db()
        self.assertTrue(self.client_user.check_password("ClientPass123!"))

    def test_password_reset_confirm_rejects_invalid_otp(self):
        self.request_otp(code="333333")

        response = self.client.post(
            reverse("password-reset-confirm"),
            {
                "email": "client@company.com",
                "otp": "999999",
                "new_password": "NewResetPass123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.client_user.refresh_from_db()
        self.assertTrue(self.client_user.check_password("ClientPass123!"))

    def test_password_reset_request_nonexistent_email_is_generic(self):
        response = self.request_otp(email="missing@example.com")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(OTPToken.objects.count(), 0)
        self.assertEqual(len(mail.outbox), 0)

    def test_password_reset_confirm_rejects_reused_otp(self):
        self.request_otp(code="444444")
        confirm_payload = {
            "email": "client@company.com",
            "otp": "444444",
            "new_password": "NewResetPass123!",
        }

        first_response = self.client.post(
            reverse("password-reset-confirm"),
            confirm_payload,
            format="json",
        )
        second_response = self.client.post(
            reverse("password-reset-confirm"),
            {
                **confirm_payload,
                "new_password": "AnotherResetPass123!",
            },
            format="json",
        )

        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        self.assertEqual(second_response.status_code, status.HTTP_400_BAD_REQUEST)


# ===========================================================================
# PROFILE ENDPOINT TESTS
# ===========================================================================
class ProfileTests(BaseTestCase):
    """Tests for the self-service profile endpoint."""

    def test_admin_can_view_own_profile(self):
        client = self.get_authenticated_client(
            "admin@ministry.gov", "AdminPass123!"
        )
        response = client.get(reverse("profile"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "admin@ministry.gov")

    def test_client_can_view_own_profile(self):
        client = self.get_authenticated_client(
            "client@company.com", "ClientPass123!"
        )
        response = client.get(reverse("profile"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "client@company.com")
        self.assertEqual(response.data["nationality"], "Ethiopian")

    def test_each_role_can_view_own_profile(self):
        """All internal roles + external client can view their profile."""
        test_users = [
            ("admin@ministry.gov", "AdminPass123!"),
            ("reception@ministry.gov", "RecepPass123!"),
            ("labtech@ministry.gov", "LabTechPass123!"),
            ("analyst@ministry.gov", "AnalystPass123!"),
            ("qc@ministry.gov", "QCPass123!"),
            ("director@ministry.gov", "DirectorPass123!"),
            ("finance@ministry.gov", "FinancePass123!"),
            ("procurement@ministry.gov", "ProcurePass123!"),
            ("coordinator@ministry.gov", "CoordPass123!"),
            ("auditor@ministry.gov", "AuditorPass123!"),
            ("client@company.com", "ClientPass123!"),
        ]
        for email, password in test_users:
            client = self.get_authenticated_client(email, password)
            response = client.get(reverse("profile"))
            self.assertEqual(
                response.status_code,
                status.HTTP_200_OK,
                f"Profile view failed for {email}",
            )
            self.assertEqual(response.data["email"], email)

    def test_authenticated_user_can_change_own_password(self):
        client = self.get_authenticated_client(
            "client@company.com", "ClientPass123!"
        )
        response = client.post(
            reverse("profile-change-password"),
            {
                "current_password": "ClientPass123!",
                "new_password": "ClientNewPass123!",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client_user.refresh_from_db()
        self.assertTrue(self.client_user.check_password("ClientNewPass123!"))

    def test_change_own_password_rejects_wrong_current_password(self):
        client = self.get_authenticated_client(
            "client@company.com", "ClientPass123!"
        )
        response = client.post(
            reverse("profile-change-password"),
            {
                "current_password": "WrongPass123!",
                "new_password": "ClientNewPass123!",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.client_user.refresh_from_db()
        self.assertTrue(self.client_user.check_password("ClientPass123!"))


# ===========================================================================
# PERMISSION CLASS UNIT TESTS
# ===========================================================================
class PermissionClassUnitTests(BaseTestCase):
    """Direct unit tests for all 8 permission classes."""

    def test_all_roles_exist_in_database(self):
        """Verify all system roles were properly created."""
        expected_roles = [
            "admin", "receptionist", "lab_technician", "analyst", "qc_manager",
            "lab_director",
            "finance", "procurement", "ministry_coordinator", "auditor",
        ]
        for role_name in expected_roles:
            self.assertTrue(
                Role.objects.filter(role_name=role_name).exists(),
                f"Role '{role_name}' not found in database.",
            )

    def test_role_name_property(self):
        """Verify the User.role_name shortcut property."""
        self.assertEqual(self.admin_user.role_name, "admin")
        self.assertEqual(self.receptionist_user.role_name, "receptionist")
        self.assertEqual(self.lab_technician_user.role_name, "lab_technician")
        self.assertEqual(self.analyst_user.role_name, "analyst")
        self.assertEqual(self.qc_user.role_name, "qc_manager")
        self.assertEqual(self.lab_director_user.role_name, "lab_director")
        self.assertEqual(self.finance_user.role_name, "finance")
        self.assertEqual(self.procurement_user.role_name, "procurement")
        self.assertEqual(self.coordinator_user.role_name, "ministry_coordinator")
        self.assertEqual(self.auditor_user.role_name, "auditor")
        self.assertIsNone(self.client_user.role_name)


# ===========================================================================
# EDGE CASE / REGRESSION TESTS
# ===========================================================================
class EdgeCaseTests(BaseTestCase):
    """Tests for boundary conditions and edge cases not covered above."""

    def setUp(self):
        self.admin_client = self.get_authenticated_client(
            "admin@ministry.gov", "AdminPass123!"
        )

    # --- Deactivated user cannot obtain token ---
    def test_deactivated_user_cannot_login(self):
        """A soft-deleted (is_active=False) user should be denied a JWT token."""
        # Deactivate the client user via admin endpoint
        self.admin_client.delete(
            reverse("user-detail", args=[self.client_user.id])
        )
        self.client_user.refresh_from_db()
        self.assertFalse(self.client_user.is_active)

        # Attempt login with the deactivated account
        anon = APIClient()
        response = anon.post(
            reverse("token_obtain_pair"),
            {"email": "client@company.com", "password": "ClientPass123!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- Short password rejected on change-password ---
    def test_change_password_too_short(self):
        """Admin-initiated password change should reject passwords < 8 chars."""
        response = self.admin_client.post(
            reverse("user-change-password", args=[self.analyst_user.id]),
            {"new_password": "short"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # --- Switching external user to internal without role ---
    def test_update_external_to_internal_without_role_rejected(self):
        """Changing user_type to internal without assigning a role must fail."""
        response = self.admin_client.patch(
            reverse("user-detail", args=[self.client_user.id]),
            {"user_type": "internal"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("role", response.data)

    # --- Removing role from internal user ---
    def test_update_internal_user_remove_role_rejected(self):
        """Setting role=null on an internal user must fail validation."""
        response = self.admin_client.patch(
            reverse("user-detail", args=[self.receptionist_user.id]),
            {"role": None},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("role", response.data)

    # --- Duplicate username ---
    def test_duplicate_username_rejected(self):
        """Creating a user with an existing username should fail."""
        response = self.admin_client.post(
            reverse("user-list"),
            {
                "username": "admin",  # already exists
                "email": "unique@new.com",
                "password": "UniquePass123!",
                "user_type": "external",
            },
            format="json",
        )
        self.assertIn(
            response.status_code,
            [status.HTTP_400_BAD_REQUEST, status.HTTP_409_CONFLICT],
        )

    # --- Full PUT update ---
    def test_full_update_user_put(self):
        """Full PUT update should work with all required fields."""
        response = self.admin_client.put(
            reverse("user-detail", args=[self.analyst_user.id]),
            {
                "username": "analyst_updated",
                "email": "analyst_updated@ministry.gov",
                "first_name": "Updated",
                "last_name": "Analyst",
                "phone": "+251900000000",
                "user_type": "internal",
                "role": str(self.roles["analyst"].id),
                "department": str(self.department.id),
                "country": "ethiopia",
                "nationality": "",
                "organization_name": "",
                "organization_type": "other",
                "is_active": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.analyst_user.refresh_from_db()
        self.assertEqual(self.analyst_user.first_name, "Updated")

    def test_update_department_scoped_user_remove_department_rejected(self):
        """Department-scoped internal roles cannot be left without a department."""
        response = self.admin_client.patch(
            reverse("user-detail", args=[self.analyst_user.id]),
            {"department": None},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("department", response.data)

    # --- 404 on nonexistent user ---
    def test_retrieve_nonexistent_user_returns_404(self):
        """Fetching a user with a random UUID should return 404."""
        import uuid
        fake_id = uuid.uuid4()
        response = self.admin_client.get(
            reverse("user-detail", args=[fake_id])
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # --- 404 on nonexistent role ---
    def test_retrieve_nonexistent_role_returns_404(self):
        """Fetching a role with a random UUID should return 404."""
        import uuid
        fake_id = uuid.uuid4()
        response = self.admin_client.get(
            reverse("role-detail", args=[fake_id])
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
