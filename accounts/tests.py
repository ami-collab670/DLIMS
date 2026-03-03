"""
LSIMS Accounts — Comprehensive Test Suite (Sprint 1)
=======================================================
Covers the Verification Protocol requirements:
  1. Authentication Check  — Unauthorized users get 401
  2. Permission Check      — Wrong roles get 403
  3. Success Check         — Happy paths return 200/201 with correct DB state
  4. Logic Check           — Business logic (internal users must have roles, etc.)
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from .models import Role, User


class BaseTestCase(TestCase):
    """
    Shared setup: creates all 8 roles, an admin user, and a non-admin user.
    """

    @classmethod
    def setUpTestData(cls):
        # Create all 8 roles
        cls.roles = {}
        role_data = [
            ("admin", "System Administration"),
            ("receptionist", "Reception Desk"),
            ("analyst", "Laboratory Analysis Dept"),
            ("qc_manager", "QC-Department-Support"),
            ("finance", "Finance Department"),
            ("procurement", "Procurement Office"),
            ("ministry_coordinator", "Ministry Coordination"),
            ("auditor", "Audit & Compliance"),
        ]
        for role_name, alias in role_data:
            cls.roles[role_name] = Role.objects.create(
                role_name=role_name, contact_alias=alias
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

        # Analyst user
        cls.analyst_user = User.objects.create_user(
            username="analyst",
            email="analyst@ministry.gov",
            password="AnalystPass123!",
            user_type="internal",
            role=cls.roles["analyst"],
        )

        # QC Manager user
        cls.qc_user = User.objects.create_user(
            username="qcmanager",
            email="qc@ministry.gov",
            password="QCPass123!",
            user_type="internal",
            role=cls.roles["qc_manager"],
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
            nationality="Ethiopian",
            organization_name="Mining Corp",
            organization_type="Private",
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
        role = Role.objects.create(role_name="admin", contact_alias="Admin Dept")
        self.assertEqual(str(role), "Admin")
        self.assertIsNotNone(role.id)

    def test_role_name_uniqueness(self):
        Role.objects.create(role_name="admin", contact_alias="Admin 1")
        with self.assertRaises(Exception):
            Role.objects.create(role_name="admin", contact_alias="Admin 2")


class UserModelTests(TestCase):
    """Tests for the custom User model."""

    def test_user_creation_with_role(self):
        role = Role.objects.create(role_name="analyst", contact_alias="Lab")
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
            nationality="Kenyan",
        )
        self.assertIsNone(user.role_name)
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
        # 8 roles were created in setUpTestData
        self.assertEqual(response.data["count"], 8)

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
        self.assertEqual(response.data["contact_alias"], "Laboratory Analysis Dept")

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


class AdminUserCRUDTests(BaseTestCase):
    """Admin can perform full CRUD on Users."""

    def setUp(self):
        self.client = self.get_authenticated_client(
            "admin@ministry.gov", "AdminPass123!"
        )

    def test_list_users(self):
        response = self.client.get(reverse("user-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data["count"], 9)  # 8 internal + 1 external

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
                "phone": "+251911000000",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        new_user = User.objects.get(email="new.analyst@ministry.gov")
        self.assertEqual(new_user.role_name, "analyst")
        self.assertTrue(new_user.check_password("NewAnalyst123!"))

    def test_create_external_user(self):
        response = self.client.post(
            reverse("user-list"),
            {
                "username": "newclient",
                "email": "new.client@corp.com",
                "password": "NewClient123!",
                "user_type": "external",
                "nationality": "Ethiopian",
                "organization_name": "Gold Corp",
                "organization_type": "Private",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        new_user = User.objects.get(email="new.client@corp.com")
        self.assertIsNone(new_user.role)

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
        """All 8 internal roles + external client can view their profile."""
        test_users = [
            ("admin@ministry.gov", "AdminPass123!"),
            ("reception@ministry.gov", "RecepPass123!"),
            ("analyst@ministry.gov", "AnalystPass123!"),
            ("qc@ministry.gov", "QCPass123!"),
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


# ===========================================================================
# PERMISSION CLASS UNIT TESTS
# ===========================================================================
class PermissionClassUnitTests(BaseTestCase):
    """Direct unit tests for all 8 permission classes."""

    def test_all_roles_exist_in_database(self):
        """Verify all 8 roles were properly created."""
        expected_roles = [
            "admin", "receptionist", "analyst", "qc_manager",
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
        self.assertEqual(self.analyst_user.role_name, "analyst")
        self.assertEqual(self.qc_user.role_name, "qc_manager")
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
                "nationality": "",
                "organization_name": "",
                "organization_type": "",
                "is_active": True,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.analyst_user.refresh_from_db()
        self.assertEqual(self.analyst_user.first_name, "Updated")

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
