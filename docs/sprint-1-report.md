# Sprint 1 Report: Foundation (Auth & RBAC)

**Date Completed:** 2026-03-03
**Last Updated:** 2026-03-04 (post-review hardening)
**Status:** COMPLETE -- All verifications passed.

---

## 1. Objective

Establish the Django project, database connections, custom user models, JWT authentication, and strict role-based access control (RBAC) for all 8 system roles defined in the LSIMS Inception Document (Section 2B).

---

## 2. Tech Stack

| Component             | Technology                          |
|-----------------------|-------------------------------------|
| Language              | Python 3.13                         |
| Framework             | Django 6.0.2                        |
| API Layer             | Django REST Framework (DRF) 3.16    |
| Authentication        | djangorestframework-simplejwt 5.5   |
| API Documentation     | drf-spectacular (OpenAPI / Swagger) |
| Filtering             | django-filter                       |
| Database (Dev)        | SQLite                              |
| Database (Production) | PostgreSQL (configured, not active) |

---

## 3. Files Created

### Project Configuration

| File                              | Purpose                                                    |
|-----------------------------------|------------------------------------------------------------|
| `lsims_project/settings.py`      | Django settings with DRF, JWT, Spectacular, env-var security |
| `lsims_project/urls.py`          | Root URL config: JWT endpoints, Swagger docs, accounts API |
| `manage.py`                       | Django management script (auto-generated)                  |

### Accounts App (`accounts/`)

| File                | Purpose                                                          |
|---------------------|------------------------------------------------------------------|
| `models.py`         | Role model (8 roles) and custom User model (UUID PK, email login)|
| `permissions.py`    | 8 role-based DRF permission classes + IsAdminOrReadOnly          |
| `serializers.py`    | Serializers for Role CRUD, User CRUD, password change            |
| `views.py`          | Admin-only ViewSets for Roles/Users, ProfileView                 |
| `urls.py`           | DRF router registration and profile endpoint                     |
| `admin.py`          | Django admin registration for Role and User                      |
| `apps.py`           | App configuration                                                |
| `tests.py`          | Comprehensive test suite (56 tests)                              |

### Environment

| File              | Purpose                                              |
|-------------------|------------------------------------------------------|
| `.env.example`    | Reference for required environment variables          |

### Database

| File                                  | Purpose              |
|---------------------------------------|-----------------------|
| `accounts/migrations/0001_initial.py` | Initial migration     |
| `db.sqlite3`                          | Development database  |

---

## 4. Models Implemented

### Role (`user_roles` table)

| Field          | Type                | Notes                                      |
|----------------|---------------------|--------------------------------------------|
| `id`           | UUID (PK)           | Auto-generated, non-editable               |
| `role_name`    | CharField (unique)  | Constrained to 8 TextChoices values        |
| `contact_alias`| CharField           | Public-facing title shown to clients       |

**8 Defined Roles:**
- admin, receptionist, analyst, qc_manager, finance, procurement, ministry_coordinator, auditor

### User (`users` table)

| Field               | Type            | Notes                                     |
|----------------------|-----------------|-------------------------------------------|
| `id`                 | UUID (PK)       | Auto-generated, non-editable              |
| `email`              | EmailField      | Unique, used as USERNAME_FIELD for login   |
| `username`           | CharField       | Required but secondary to email            |
| `phone`              | CharField       | Optional                                  |
| `user_type`          | CharField       | "internal" or "external"                  |
| `role`               | FK -> Role      | Required for internal users, null for external |
| `nationality`        | CharField       | External client field                     |
| `organization_name`  | CharField       | External client field                     |
| `organization_type`  | CharField       | External client field                     |

Inherits from Django AbstractUser: first_name, last_name, password, is_active, is_staff, is_superuser, date_joined, last_login.

---

## 5. Permission Classes

All permissions extend a base `_RolePermission` class that checks `request.user.role.role_name` against a `required_role` string. Superusers bypass all checks.

| Class                  | Grants Access To            |
|------------------------|-----------------------------|
| `IsAdmin`              | Admin users                 |
| `IsReceptionist`       | Receptionists               |
| `IsAnalyst`            | Lab Analysts                |
| `IsQCManager`          | QC Managers                 |
| `IsFinance`            | Finance Officers            |
| `IsProcurement`        | Procurement Officers        |
| `IsMinistryCoordinator`| Ministry Coordinators       |
| `IsAuditor`            | Auditors                    |
| `IsAdminOrReadOnly`    | Admin (write), all (read)   |

---

## 6. API Endpoints

### Authentication

| Method | URL                          | Description          | Auth Required |
|--------|------------------------------|----------------------|---------------|
| POST   | `/api/auth/token/`           | Obtain JWT token     | No            |
| POST   | `/api/auth/token/refresh/`   | Refresh JWT token    | No            |

### Roles (Admin Only)

| Method | URL                              | Description         |
|--------|----------------------------------|---------------------|
| GET    | `/api/accounts/roles/`           | List all roles      |
| POST   | `/api/accounts/roles/`           | Create a role       |
| GET    | `/api/accounts/roles/{id}/`      | Retrieve a role     |
| PUT    | `/api/accounts/roles/{id}/`      | Full update a role  |
| PATCH  | `/api/accounts/roles/{id}/`      | Partial update      |
| DELETE | `/api/accounts/roles/{id}/`      | Delete a role       |

### Users (Admin Only)

| Method | URL                                          | Description            |
|--------|----------------------------------------------|------------------------|
| GET    | `/api/accounts/users/`                       | List all users         |
| POST   | `/api/accounts/users/`                       | Create a user          |
| GET    | `/api/accounts/users/{id}/`                  | Retrieve a user        |
| PUT    | `/api/accounts/users/{id}/`                  | Full update a user     |
| PATCH  | `/api/accounts/users/{id}/`                  | Partial update         |
| DELETE | `/api/accounts/users/{id}/`                  | Soft-delete (deactivate)|
| POST   | `/api/accounts/users/{id}/change-password/`  | Admin password reset   |

### Profile (Any Authenticated User)

| Method | URL                          | Description              |
|--------|------------------------------|--------------------------|
| GET    | `/api/accounts/profile/`     | View own profile         |

### Documentation

| Method | URL              | Description        |
|--------|------------------|--------------------|
| GET    | `/api/docs/`     | Swagger UI         |
| GET    | `/api/redoc/`    | ReDoc              |
| GET    | `/api/schema/`   | Raw OpenAPI schema |

---

## 7. Key Design Decisions

1. **Email as login field.** `USERNAME_FIELD = "email"` so JWT tokens are obtained using email + password, not username.

2. **Soft-delete for users.** The DELETE endpoint sets `is_active = False` rather than removing the record from the database. This preserves audit trail integrity for future compliance requirements.

3. **Role as ForeignKey, not field.** Roles are a separate table (`user_roles`) rather than a simple CharField on the User model. This allows roles to carry metadata (like `contact_alias`) and is extensible for future permission hierarchies.

4. **Internal users must have a role.** Validation in both `UserCreateSerializer` and `UserUpdateSerializer` enforces this. External (client) users do not require a role.

5. **Passwords are always hashed.** The `UserCreateSerializer.create()` method uses `user.set_password()` rather than storing plaintext. This is explicitly tested.

6. **SQLite for development.** PostgreSQL configuration is present but commented out in settings. Switching is a single config change.

7. **Environment-driven security settings.** `SECRET_KEY`, `DEBUG`, and `ALLOWED_HOSTS` are loaded from environment variables. In development, safe defaults are used automatically. In production (`DEBUG=False`), a missing `SECRET_KEY` will crash the app at startup rather than silently using an insecure value.

---

## 8. Verification Results

### A. Automated Tests (56/56 Passed)

| Test Category           | Count | What Was Verified                                           |
|-------------------------|-------|-------------------------------------------------------------|
| Model Tests             | 5     | Role creation, uniqueness, User creation, email uniqueness  |
| Authentication (401)    | 5     | Unauthenticated requests blocked on all endpoints           |
| Permission (403)        | 9     | All non-admin roles blocked from admin-only endpoints       |
| Admin CRUD (200/201)    | 14    | Role and User CRUD, soft-delete, password change, filtering |
| Business Logic (400)    | 5     | Internal role requirement, email uniqueness, password rules |
| JWT Auth                | 5     | Token obtain, wrong password, refresh, invalid refresh      |
| Profile                 | 3     | All 9 user types can view own profile                       |
| Permission Unit Tests   | 2     | All 8 roles exist, role_name property works correctly       |
| Edge Cases              | 8     | Deactivated login, short password change, type switching, duplicate username, PUT update, 404s |

Command: `.\venv\Scripts\python manage.py test accounts -v 2`

### B. Swagger UI Manual Testing (Passed)

Manually verified in the browser:
- JWT token obtain and Swagger authorization
- Role creation (all 8 roles)
- User creation (internal with role, external without role)
- Permission blocking (analyst cannot access admin endpoints)
- Profile view (analyst can view own profile)
- Validation (internal user without role returns 400)

### C. Schema Validation (Passed)

Command: `.\venv\Scripts\python manage.py spectacular --validate --fail-on-warn`

---

## 9. Dependencies Installed

```
django
djangorestframework
djangorestframework-simplejwt
drf-spectacular
psycopg2-binary
django-filter
gunicorn
whitenoise
dj-database-url
django-cors-headers
```

Virtual environment: `.\venv\`
Full pinned versions: `requirements.txt`

---

## 10. Staging Deployment

| Component | Details |
|---|---|
| **Platform** | Render.com (Free tier) |
| **Live URL** | `https://lsims-api-staging.onrender.com` |
| **Swagger UI** | `https://lsims-api-staging.onrender.com/api/docs/` |
| **Database** | PostgreSQL (Render managed) |
| **WSGI Server** | Gunicorn |
| **Static Files** | WhiteNoise (compressed + cached) |
| **CORS** | `CORS_ALLOW_ALL_ORIGINS = True` (temporary for frontend testing) |
| **Build Script** | `build.sh` — installs deps, collectstatic, migrate |
| **Blueprint** | `render.yaml` — Infrastructure-as-Code for one-click deploy |

---

## 11. Known Limitations / Future Work

- CORS is set to allow all origins (temporary for frontend testing, must be restricted before production).
- No client self-registration endpoint yet (clients are created by Admin).
- No email/SMS notification system yet.
- No rate limiting or throttling on auth endpoints.

---

## 12. What Comes Next

| Sprint | Focus                              | Key Models                                          |
|--------|------------------------------------|-----------------------------------------------------|
| 2      | Core Engine (Jobs & Samples)       | TestCatalog, JobOrder, BlindCode, Sample             |
| 3      | Lab Analysis & QC                  | AnalysisResult, QCDecision, DemaskLog                |
| 4      | Workflow & Audit Trails            | JobStatusHistory, IncidentLog, AuditLog              |
| 5      | Finance & Billing                  | FinancialRecord, PaymentVerification, DisputeRecord  |
| 6      | Compliance, Certificates & Notifs  | RoleChangeHistory, CertificateHistory, Notifications |
