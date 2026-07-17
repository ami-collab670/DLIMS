# API Audit Tracker

**Last updated:** July 16, 2026  
**Scope:** All HTTP operations exposed by LSIMS backend routers under `/api/auth/`, `/api/accounts/`, `/api/laboratory/`, `/api/notifications/`.

**July 16, 2026 revision (client requests fix):** `GET /api/accounts/departments/` — read access opened to all authenticated users (`IsAdminOrReadOnly`). `POST /api/laboratory/jobs/` — external client self-service create + nested `samples` implemented (`ClientJobOrderCreateSerializer`). See [accounts.md](accounts.md) and [laboratory-jobs.md](laboratory-jobs.md).

| Column | Meaning |
|--------|---------|
| **File** | Audit document covering this endpoint |
| **FE audited** | Part 1 frontend trace complete |
| **BE traced** | Part 2 backend logic traced |
| **JSON verified** | Real response JSON compared field-by-field (not serializer inference only) |

---

## Auth — [auth.md](auth.md)

| File | Method | Path | FE audited | BE traced | JSON verified |
|------|--------|------|:----------:|:---------:|:-------------:|
| auth.md | POST | `/api/auth/register` | No (not called) | Yes | No |
| auth.md | POST | `/api/auth/register/` | Yes | Yes | No |
| auth.md | POST | `/api/auth/token/` | Yes | Yes | No |
| auth.md | POST | `/api/auth/token/refresh/` | Yes | Yes | No |
| auth.md | POST | `/api/auth/password-reset-request/` | Yes | Yes | No |
| auth.md | POST | `/api/auth/password-reset-confirm/` | Yes | Yes | No |

---

## Accounts — [accounts.md](accounts.md)

| File | Method | Path | FE audited | BE traced | JSON verified |
|------|--------|------|:----------:|:---------:|:-------------:|
| accounts.md | GET | `/api/accounts/analysts/` | Yes | Yes | Yes (empty `[]`) |
| accounts.md | GET | `/api/accounts/clients/` | Yes | Yes | Yes |
| accounts.md | GET | `/api/accounts/users/` | Yes | Yes | Yes |
| accounts.md | POST | `/api/accounts/users/` | Yes | Yes | Yes |
| accounts.md | GET | `/api/accounts/users/{id}/` | Yes | Yes | Yes |
| accounts.md | PUT | `/api/accounts/users/{id}/` | Yes (not called) | Yes | No |
| accounts.md | PATCH | `/api/accounts/users/{id}/` | Yes | Yes | Yes |
| accounts.md | DELETE | `/api/accounts/users/{id}/` | Yes | Yes | Yes |
| accounts.md | POST | `/api/accounts/users/{id}/change-password/` | Yes | Yes | No |
| accounts.md | GET | `/api/accounts/roles/` | Yes | Yes | No |
| accounts.md | POST | `/api/accounts/roles/` | Yes | Yes | No |
| accounts.md | GET | `/api/accounts/roles/{id}/` | Yes (not called) | Yes | No |
| accounts.md | PUT | `/api/accounts/roles/{id}/` | Yes (not called) | Yes | No |
| accounts.md | PATCH | `/api/accounts/roles/{id}/` | Yes | Yes | No |
| accounts.md | DELETE | `/api/accounts/roles/{id}/` | Yes | Yes | No |
| accounts.md | GET | `/api/accounts/departments/` | Yes | Yes | Yes |
| accounts.md | POST | `/api/accounts/departments/` | Yes | Yes | Yes |
| accounts.md | GET | `/api/accounts/departments/{id}/` | Yes (not called) | Yes | No |
| accounts.md | PUT | `/api/accounts/departments/{id}/` | Yes (not called) | Yes | No |
| accounts.md | PATCH | `/api/accounts/departments/{id}/` | Yes | Yes | Yes |
| accounts.md | DELETE | `/api/accounts/departments/{id}/` | Yes | Yes | Yes |
| accounts.md | GET | `/api/accounts/profile/` | Yes | Yes | Yes |
| accounts.md | PUT | `/api/accounts/profile/` | Yes (not called) | Yes | No |
| accounts.md | PATCH | `/api/accounts/profile/` | Yes | Yes | Yes |
| accounts.md | POST | `/api/accounts/profile/change-password/` | Yes | Yes | No |

---

## Laboratory — Jobs — [laboratory-jobs.md](laboratory-jobs.md)

| File | Method | Path | FE audited | BE traced | JSON verified |
|------|--------|------|:----------:|:---------:|:-------------:|
| laboratory-jobs.md | GET | `/api/laboratory/jobs/` | Yes | Yes | No |
| laboratory-jobs.md | POST | `/api/laboratory/jobs/` | Yes | Yes | No |
| laboratory-jobs.md | GET | `/api/laboratory/jobs/{id}/` | Yes | Yes | No |
| laboratory-jobs.md | PUT | `/api/laboratory/jobs/{id}/` | Yes (not called) | Yes | No |
| laboratory-jobs.md | PATCH | `/api/laboratory/jobs/{id}/` | Yes | Yes | No |
| laboratory-jobs.md | DELETE | `/api/laboratory/jobs/{id}/` | Yes | Yes | No |
| laboratory-jobs.md | GET | `/api/laboratory/jobs/{id}/result-summary/` | Yes | Yes | No |

---

## Laboratory — Tests — [laboratory-tests.md](laboratory-tests.md)

| File | Method | Path | FE audited | BE traced | JSON verified |
|------|--------|------|:----------:|:---------:|:-------------:|
| laboratory-tests.md | GET | `/api/laboratory/tests/` | Yes | Yes | No |
| laboratory-tests.md | POST | `/api/laboratory/tests/` | Yes | Yes | No |
| laboratory-tests.md | GET | `/api/laboratory/tests/{id}/` | Yes (not called) | Yes | No |
| laboratory-tests.md | PUT | `/api/laboratory/tests/{id}/` | Yes (not called) | Yes | No |
| laboratory-tests.md | PATCH | `/api/laboratory/tests/{id}/` | Yes | Yes | No |
| laboratory-tests.md | DELETE | `/api/laboratory/tests/{id}/` | Yes | Yes | No |

---

## Laboratory — Samples — [laboratory-samples.md](laboratory-samples.md)

| File | Method | Path | FE audited | BE traced | JSON verified |
|------|--------|------|:----------:|:---------:|:-------------:|
| laboratory-samples.md | GET | `/api/laboratory/samples/` | Yes | Yes | No |
| laboratory-samples.md | POST | `/api/laboratory/samples/` | Yes | Yes | No |
| laboratory-samples.md | GET | `/api/laboratory/samples/{id}/` | Yes | Yes | No |
| laboratory-samples.md | PUT | `/api/laboratory/samples/{id}/` | Yes (not called) | Yes | No |
| laboratory-samples.md | PATCH | `/api/laboratory/samples/{id}/` | Yes | Yes | No |
| laboratory-samples.md | DELETE | `/api/laboratory/samples/{id}/` | Yes | Yes | No |
| laboratory-samples.md | POST | `/api/laboratory/samples/{id}/assign-analyst/` | Yes | Yes | No |
| laboratory-samples.md | GET | `/api/laboratory/sample-tests/` | Yes | Yes | No |
| laboratory-samples.md | POST | `/api/laboratory/sample-tests/` | Yes | Yes | No |
| laboratory-samples.md | GET | `/api/laboratory/sample-tests/{id}/` | Yes (not called) | Yes | No |
| laboratory-samples.md | PUT | `/api/laboratory/sample-tests/{id}/` | Yes (not called) | Yes | No |
| laboratory-samples.md | PATCH | `/api/laboratory/sample-tests/{id}/` | Yes (not called) | Yes | No |
| laboratory-samples.md | DELETE | `/api/laboratory/sample-tests/{id}/` | Yes | Yes | No |
| laboratory-samples.md | GET | `/api/laboratory/preparation-records/` | Yes | Yes | No |
| laboratory-samples.md | POST | `/api/laboratory/preparation-records/` | Yes | Yes | No |
| laboratory-samples.md | GET | `/api/laboratory/preparation-records/{id}/` | Yes (not called) | Yes | No |
| laboratory-samples.md | PUT | `/api/laboratory/preparation-records/{id}/` | Yes (not called) | Yes | No |
| laboratory-samples.md | PATCH | `/api/laboratory/preparation-records/{id}/` | Yes | Yes | No |
| laboratory-samples.md | DELETE | `/api/laboratory/preparation-records/{id}/` | Yes (not called) | Yes | No |
| laboratory-samples.md | POST | `/api/laboratory/preparation-records/{id}/start/` | Yes | Yes | No |
| laboratory-samples.md | POST | `/api/laboratory/preparation-records/{id}/complete/` | Yes | Yes | No |

---

## Laboratory — Results & QC — [laboratory-results-qc.md](laboratory-results-qc.md)

| File | Method | Path | FE audited | BE traced | JSON verified |
|------|--------|------|:----------:|:---------:|:-------------:|
| laboratory-results-qc.md | GET | `/api/laboratory/analysis-results/` | Yes | Yes | No |
| laboratory-results-qc.md | POST | `/api/laboratory/analysis-results/` | Yes | Yes | No |
| laboratory-results-qc.md | GET | `/api/laboratory/analysis-results/{id}/` | Yes (not called) | Yes | No |
| laboratory-results-qc.md | PUT | `/api/laboratory/analysis-results/{id}/` | Yes (not called) | Yes | No |
| laboratory-results-qc.md | PATCH | `/api/laboratory/analysis-results/{id}/` | Yes | Yes | No |
| laboratory-results-qc.md | DELETE | `/api/laboratory/analysis-results/{id}/` | Yes (not called) | Yes | No |
| laboratory-results-qc.md | POST | `/api/laboratory/analysis-results/{id}/submit/` | Yes | Yes | No |
| laboratory-results-qc.md | POST | `/api/laboratory/analysis-results/{id}/approve/` | Yes | Yes | No |
| laboratory-results-qc.md | POST | `/api/laboratory/analysis-results/{id}/reject/` | Yes | Yes | No |
| laboratory-results-qc.md | GET | `/api/laboratory/qc-decisions/` | Yes | Yes | No |
| laboratory-results-qc.md | GET | `/api/laboratory/qc-decisions/{id}/` | Yes (not called) | Yes | No |
| laboratory-results-qc.md | GET | `/api/laboratory/calibration-records/` | Yes | Yes | No |
| laboratory-results-qc.md | POST | `/api/laboratory/calibration-records/` | Yes | Yes | No |
| laboratory-results-qc.md | GET | `/api/laboratory/calibration-records/{id}/` | Yes (not called) | Yes | No |
| laboratory-results-qc.md | PUT | `/api/laboratory/calibration-records/{id}/` | Yes (not called) | Yes | No |
| laboratory-results-qc.md | PATCH | `/api/laboratory/calibration-records/{id}/` | Yes | Yes | No |
| laboratory-results-qc.md | DELETE | `/api/laboratory/calibration-records/{id}/` | Yes (not called) | Yes | No |

---

## Laboratory — Finance — [laboratory-finance.md](laboratory-finance.md)

| File | Method | Path | FE audited | BE traced | JSON verified |
|------|--------|------|:----------:|:---------:|:-------------:|
| laboratory-finance.md | GET | `/api/laboratory/financial-records/` | Yes | Yes | No |
| laboratory-finance.md | POST | `/api/laboratory/financial-records/` | Yes | Yes | No |
| laboratory-finance.md | GET | `/api/laboratory/financial-records/{invoice_no}/` | Yes (not called) | Yes | No |
| laboratory-finance.md | PUT | `/api/laboratory/financial-records/{invoice_no}/` | Yes (not called) | Yes | No |
| laboratory-finance.md | PATCH | `/api/laboratory/financial-records/{invoice_no}/` | Yes | Yes | No |
| laboratory-finance.md | DELETE | `/api/laboratory/financial-records/{invoice_no}/` | Yes (not called) | Yes | No |
| laboratory-finance.md | GET | `/api/laboratory/discount-approvals/` | Yes | Yes | No |
| laboratory-finance.md | POST | `/api/laboratory/discount-approvals/` | Yes | Yes | No |
| laboratory-finance.md | GET | `/api/laboratory/discount-approvals/{id}/` | Yes (not called) | Yes | No |
| laboratory-finance.md | PUT | `/api/laboratory/discount-approvals/{id}/` | Yes (not called) | Yes | No |
| laboratory-finance.md | PATCH | `/api/laboratory/discount-approvals/{id}/` | Yes (not called) | Yes | No |
| laboratory-finance.md | DELETE | `/api/laboratory/discount-approvals/{id}/` | Yes (not called) | Yes | No |
| laboratory-finance.md | POST | `/api/laboratory/discount-approvals/{id}/approve/` | Yes | Yes | No |
| laboratory-finance.md | POST | `/api/laboratory/discount-approvals/{id}/reject/` | Yes | Yes | No |

---

## Laboratory — Compliance & Alerts — [laboratory-compliance-alerts.md](laboratory-compliance-alerts.md)

| File | Method | Path | FE audited | BE traced | JSON verified |
|------|--------|------|:----------:|:---------:|:-------------:|
| laboratory-compliance-alerts.md | GET | `/api/laboratory/complaints/` | Yes | Yes | No |
| laboratory-compliance-alerts.md | POST | `/api/laboratory/complaints/` | Yes | Yes | No |
| laboratory-compliance-alerts.md | GET | `/api/laboratory/complaints/{id}/` | Yes (not called) | Yes | No |
| laboratory-compliance-alerts.md | PUT | `/api/laboratory/complaints/{id}/` | Yes (not called) | Yes | No |
| laboratory-compliance-alerts.md | PATCH | `/api/laboratory/complaints/{id}/` | Yes | Yes | No |
| laboratory-compliance-alerts.md | DELETE | `/api/laboratory/complaints/{id}/` | Yes (not called) | Yes | No |
| laboratory-compliance-alerts.md | POST | `/api/laboratory/complaints/{id}/resolve/` | Yes | Yes | No |
| laboratory-compliance-alerts.md | POST | `/api/laboratory/complaints/{id}/reject/` | Yes | Yes | No |
| laboratory-compliance-alerts.md | GET | `/api/laboratory/priority-alerts/` | Yes | Yes | No |

---

## Notifications — [notifications.md](notifications.md)

| File | Method | Path | FE audited | BE traced | JSON verified |
|------|--------|------|:----------:|:---------:|:-------------:|
| notifications.md | GET | `/api/notifications/inbox/` | Yes | Yes | No |
| notifications.md | POST | `/api/notifications/inbox/` | Yes | Yes | No |
| notifications.md | GET | `/api/notifications/inbox/{id}/` | Yes (not called) | Yes | No |
| notifications.md | PATCH | `/api/notifications/inbox/{id}/` | Yes | Yes | No |
| notifications.md | DELETE | `/api/notifications/inbox/{id}/` | Yes | Yes | No |
| notifications.md | GET | `/api/notifications/inbox/unread-count/` | Yes | Yes | No |
| notifications.md | POST | `/api/notifications/inbox/mark-all-read/` | Yes | Yes | No |
| notifications.md | POST | `/api/notifications/inbox/mark-all-unread/` | Yes | Yes | No |

---

## Totals

| Category | Endpoints |
|----------|-----------|
| Auth | 6 |
| Accounts | 25 |
| Laboratory — Jobs | 7 |
| Laboratory — Tests | 6 |
| Laboratory — Samples | 21 |
| Laboratory — Results & QC | 17 |
| Laboratory — Finance | 14 |
| Laboratory — Compliance & Alerts | 9 |
| Notifications | 8 |
| **Grand total** | **113** |
