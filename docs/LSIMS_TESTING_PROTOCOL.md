# 🧪 LSIMS Testing & QA Protocol

**Objective:** Ensure 100% API reliability, strict Role-Based Access Control (RBAC) enforcement, and absolute defense against bad frontend payloads.

> **Relationship to master blueprint:** This document expands on the "Bulletproof Verification Protocol" defined in `LSIMS.md` (Section 3). That document defines the 3-step completion gate (Swagger → Tests → Git). This document defines the **specific test structure** to follow inside Step B (Automated Testing).

---

## 1. Setup: Test Class Conventions

All test files use Django's `TestCase` with DRF's `APIClient`. Do **not** use `APITestCase` (it resets the DB between tests, making `setUpTestData` ineffective).

```python
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
```

### Test Class Structure

Every feature's `tests.py` should be organized into these classes, in order:

```
BaseTestCase          — shared fixtures (roles, users, auth helper)
ModelTests            — pure model-level tests (no HTTP)
AuthenticationTests   — 401 checks (no token)
PermissionTests       — 403 checks (wrong role)
<Feature>HappyPathTests — 200/201 with DB state verification
BusinessLogicTests    — 400 validation and business rules
SignalAndSideEffectTests — Django Signal verification (Sprint 3+)
EdgeCaseTests         — 404s, type mismatches, boundary conditions
```

### Naming Conventions

Test methods must follow this pattern: `test_<subject>_<condition>_<expected_outcome>`

```python
# Good
def test_analyst_cannot_create_job_order(self):         # 403
def test_create_sample_with_valid_data(self):            # 201
def test_internal_user_requires_role(self):              # 400
def test_retrieve_nonexistent_sample_returns_404(self):  # 404

# Bad — too vague
def test_sample(self):
def test_create(self):
```

### Auth Helper

Every `BaseTestCase` must provide a `get_authenticated_client()` helper that obtains a real JWT token via the `/api/auth/token/` endpoint:

```python
def get_authenticated_client(self, email, password):
    client = APIClient()
    response = client.post(reverse("token_obtain_pair"), {"email": email, "password": password}, format="json")
    self.assertEqual(response.status_code, status.HTTP_200_OK, f"Auth failed for {email}")
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
    return client
```

---

## 2. The 5 Mandatory Test Categories

When asked to write tests for any Django app or feature in this project, every endpoint must be covered by all applicable categories below.

### A. Happy Path (200/201)

Test that the endpoint successfully performs its primary function with valid data.

- Verify the HTTP status code (`200 OK` or `201 Created`)
- **Verify the database state actually changed**, not just the response:

```python
def test_create_sample_with_valid_data(self):
    response = self.admin_client.post(reverse("sample-list"), {...}, format="json")
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertEqual(Sample.objects.count(), 1)              # DB check
    self.assertIsNotNone(Sample.objects.first().blind_alias) # side-effect check
```

### B. Authentication Defense (401)

Every endpoint must have a test for unauthenticated access (no Bearer token).

```python
def test_sample_list_unauthenticated(self):
    client = APIClient()  # no credentials
    response = client.get(reverse("sample-list"))
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
```

### C. RBAC / Permission Defense (403)

Identify which roles are NOT allowed on the endpoint. Write one test per disallowed role that matters — at minimum, do all roles that are obviously wrong.

```python
def test_analyst_cannot_create_job_order(self):
    client = self.get_authenticated_client("analyst@ministry.gov", "AnalystPass123!")
    response = client.post(reverse("joborder-list"), {...}, format="json")
    self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
```

### D. Edge Cases & Bad Payloads (400/404)

Cover all of these where applicable:

| Pattern | What to test |
|---|---|
| **Missing required fields** | Omit a required JSON field, expect `400` |
| **Invalid data types** | Send a string where a UUID is expected, expect `400` |
| **Invalid state transitions** | Try an illegal business transition (e.g., pay a Draft invoice), expect `400` |
| **Not found** | Use a random `uuid.uuid4()` as an ID, expect `404` |
| **Soft-deleted resource** | Deactivated users should be denied JWT tokens (`401`) |
| **Type-switching without role** | Changing `user_type` to `internal` without a `role` must fail (`400`) |
| **Constraint violations** | Duplicate unique fields (email, username) must fail (`400`) |

```python
def test_retrieve_nonexistent_sample_returns_404(self):
    import uuid
    response = self.admin_client.get(reverse("sample-detail", args=[uuid.uuid4()]))
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
```

### E. Signal & Side-Effect Verification *(Sprint 3+)*

If a model has a Django Signal attached (e.g., auto-generating a `BlindCode` on sample creation, or writing a `JobStatusHistory` row on status change), the test **must** query the database to verify the side-effect occurred independently of the response.

```python
def test_job_status_change_creates_history_record(self):
    response = self.receptionist_client.post(reverse("job-transition", args=[self.job.id]), {"to_status": "received"}, format="json")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    # Verify the signal fired and the audit record exists
    self.assertTrue(JobStatusHistory.objects.filter(job=self.job, to_status="received").exists())
```

---

## 3. Soft-Delete Convention

This project uses soft-delete (setting `is_active=False`) rather than hard deletes for Users. The DELETE endpoint returns `200 OK` with a confirmation message — **not** `204 No Content`. This is an intentional design decision (see Sprint 1 report, Key Design Decision #2).

Tests for soft-delete must verify **both**:
1. The record still exists in the database
2. `is_active` is now `False`

```python
def test_soft_delete_user(self):
    response = self.admin_client.delete(reverse("user-detail", args=[self.client_user.id]))
    self.assertEqual(response.status_code, status.HTTP_200_OK)   # NOT 204
    self.client_user.refresh_from_db()
    self.assertFalse(self.client_user.is_active)
    self.assertTrue(User.objects.filter(id=self.client_user.id).exists())
```

---

## 4. Developer's Manual Testing Checklist

*Note to AI: After generating code and tests, always output this checklist for the developer to execute manually.*

The developer must verify the following after every sprint feature:

- [ ] **Run the test suite:** `.\venv\Scripts\python manage.py test accounts -v 2` — must show `OK` with zero failures.
- [ ] **Swagger UI (`/api/docs/`):** Open the browser, authorize with a test JWT (`/api/auth/token/`), and manually execute a `GET` and `POST` to the new endpoint. Verify the schema renders correctly and request/response shapes are correct.
- [ ] **Django Admin (`/admin/`):** Log in and verify new models appear with proper `__str__` representations and that foreign keys are clickable links.
- [ ] **Bad payload test:** Send a deliberately malformed JSON payload via Swagger (e.g., missing a required field, wrong UUID format) and verify the error messages are human-readable for the frontend team.
- [ ] **Schema validation:** Run `.\venv\Scripts\python manage.py spectacular --validate --fail-on-warn` — must pass with no warnings.

---

## 5. Current Test Coverage Baseline

*As of Sprint 1 post-review hardening (2026-02-24):*

| Category | Count | Class |
|---|---|---|
| Model Tests | 5 | `RoleModelTests`, `UserModelTests` |
| Authentication (401) | 5 | `AuthenticationTests` |
| Permission (403) | 9 | `PermissionTests` |
| Happy Path / Admin CRUD | 14 | `AdminRoleCRUDTests`, `AdminUserCRUDTests` |
| Business Logic (400) | 5 | `BusinessLogicTests` |
| JWT Auth | 5 | `JWTAuthTests` |
| Profile | 3 | `ProfileTests` |
| Permission Unit Tests | 2 | `PermissionClassUnitTests` |
| Edge Cases | 8 | `EdgeCaseTests` |
| **Total** | **56** | — |

All 56 tests pass. This is the regression baseline. Any new sprint must not reduce this count or introduce failures.