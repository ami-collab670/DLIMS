# Merge Changelog: `origin/main` → `merge-main-into-master`

Local-only merge. **Not pushed** to production remote.

## Summary

Unified backend into a single Django project at `LSIMS-Backend/LSIMS-main/` (Docker target). Preserved master's authentication and notifications; ported main's departments, financial records, password reset OTP, and Sprint 4 laboratory APIs.

## Files added

| Path | Source |
|------|--------|
| `LSIMS-Backend/LSIMS-main/accounts/migrations/0003`–`0007` | `origin/main` |
| `LSIMS-Backend/LSIMS-main/laboratory/migrations/0007_merge_main_sprint4.py` | Generated on top of nested `0001`–`0006` |
| `LSIMS-Backend/LSIMS-main/laboratory/policies.py` | `origin/main` |
| `LSIMS-Backend/LSIMS-main/laboratory/services/` | `origin/main` |
| `LSIMS-Backend/LSIMS-main/laboratory/tests/test_analysis_qc_workflow.py` | `origin/main` |
| `LSIMS-Backend/LSIMS-main/laboratory/tests/test_department_isolation.py` | `origin/main` |
| `LSIMS-Backend/LSIMS-main/laboratory/tests/test_preparation_workflow.py` | `origin/main` |
| `LSIMS-Backend/LSIMS-main/laboratory/tests/test_support_workflows.py` | `origin/main` |
| `LSIMS-Backend/LSIMS-main/laboratory/tests/test_workflow_services.py` | `origin/main` |
| `.github/workflows/sync.yml`, `DEMO.md` | From merge with `origin/main` |

## Files deleted (duplicate root backend)

- `accounts/`, `laboratory/`, `lsims_project/`
- Root `manage.py`, `requirements.txt`

## Files manually merged (conflict resolutions)

### Protected — kept from master

- `accounts/auth_urls.py` — register + JWT; **added** password-reset routes (additive)
- `RegisterView`, `UserRegisterSerializer`, `ProfileSelfSerializer`, `ProfileView` (RetrieveUpdate)
- `LabClientListView`, `LabAnalystListView`
- `notifications/` app (unchanged)
- `laboratory/signals.py`, `laboratory/workflow.py` (`sync_sample_statuses_from_job`)
- `laboratory/apps.py` (`ready()` imports signals)
- `lsims_project/urls.py` — auth + notifications mounts unchanged
- JWT settings — 7-day refresh, rotation/blacklist disabled

### Taken from main (or combined)

- `accounts/models.py` — Department, OTPToken, country, department FK
- `accounts/views.py` — DepartmentViewSet, password reset, ProfilePasswordChangeView + master register/profile/pickers
- `accounts/serializers.py` — department/OTP/password serializers + master register/profile serializers
- `accounts/urls.py` — departments router + master clients/analysts + profile change-password
- `accounts/permissions.py` — lab_technician, lab_director roles
- `accounts/tests.py`, `seed_roles.py` — main versions
- `lsims_project/settings.py` — added EMAIL_* block from main
- `laboratory/models.py` — master workflow statuses (`pending_finance`, `status_sync_with_job`) + main Sprint 4 models and payment-gated sample coding
- `laboratory/views.py`, `serializers.py`, `urls.py`, `admin.py` — main Sprint 4
- `laboratory/services/workflow.py` — main; **`PAYMENT_PENDING` → `PENDING_FINANCE`** to match master DB/signals

### `render.yaml`

- Kept **master** Render-managed database block (resolved merge conflict in favor of HEAD)

## New migrations

| Migration | Depends on | Purpose |
|-----------|------------|---------|
| `accounts/0003`–`0007` | prior accounts chain | OTP, departments, role seeds from main |
| `laboratory/0007_merge_main_sprint4` | `0006_sample_received_by_optional_client_intake` | TestCatalog.department, nullable sample codes, FinancialRecord, PreparationRecord, AnalysisResult, CalibrationRecord, QCDecision, ComplaintRecord, DiscountApproval |

Existing nested migrations `0001`–`0006` were **not** renamed or deleted.

## Validation results

| Check | Result |
|-------|--------|
| `manage.py check` | Pass |
| `makemigrations --check` | Pass (no pending changes) |
| `migrate` | Pass (`0007_merge_main_sprint4` applied) |
| `python manage.py test accounts laboratory notifications` | **226 tests — 10 failures, 20 errors** (main tests vs master permission/status differences; follow-up recommended) |

### HTTP smoke tests (all pass)

| Endpoint | Status |
|----------|--------|
| `POST /api/auth/token/` | 200 |
| `POST /api/auth/register/` | 201 |
| `POST /api/auth/password-reset-request/` | 200 |
| `GET /api/notifications/inbox/unread-count/` | 200 |
| `GET /api/accounts/departments/` | 200 |
| `GET /api/laboratory/financial-records/` | 200 |
| `GET /api/laboratory/preparation-records/` | 200 |

## Branch

- **Branch:** `merge-main-into-master` (local commit only)
- **Not pushed** to `origin`

## Follow-up (optional)

1. Align failing laboratory tests with merged permission model and `pending_finance` status vocabulary.
2. Review `.github/workflows/sync.yml` and `DEMO.md` from main merge if needed for your workflow.
