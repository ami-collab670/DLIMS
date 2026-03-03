# 🏛️ LSIMS (Laboratory Sample Information Management System)

**Master Blueprint & Development Architecture**

## 1. Project Overview

LSIMS is an enterprise-grade API built for the Ministry of Mines to digitize the end-to-end mineral testing and certification process. The system acts as a high-integrity facilitation portal bridging external clients and internal laboratory workflows.

*   **Tech Stack:** Python, Django, Django REST Framework (DRF), PostgreSQL.
*   **Methodology:** Agile (Iterative sprints based on evolving draft requirements).
*   **Key Security/Compliance Features:** 
    *   Strict Role-Based Access Control (ISO separation-of-duties).
    *   "Blind Analysis" (Analysts only see generated aliases, not client info).
    *   Immutable Audit Trails (Every status change is permanently logged).
    *   Automated Financial Locks (Results withheld until payment is confirmed).

---

## 2. Sprint Roadmap (Revised)

*Note: This roadmap follows the real-world workflow dependency chain. Each sprint builds on the previous one. Revised 2026-02-24 to correct sprint ordering and integrate missing features from the Inception Document.*

**Dependency Chain:** Auth -> Jobs/Samples -> Analysis/QC -> Workflow/Audit -> Finance -> Compliance

### [COMPLETE] Sprint 1: Foundation (Auth & RBAC)

**Goal:** Establish the Django project, database connections, custom user models, and strict permission classes for all 8 roles.

**Status:** All 56 tests passing. Last updated 2026-02-24.

*   **Deliverables:**
    *   Django project initialized with DRF, SimpleJWT, drf-spectacular, django-filter.
    *   `Role` model with 8 system roles and `contact_alias`.
    *   Custom `User` model (UUID PK, email login, internal/external types).
    *   8 DRF permission classes (`IsAdmin`, `IsReceptionist`, `IsAnalyst`, `IsQCManager`, `IsFinance`, `IsProcurement`, `IsMinistryCoordinator`, `IsAuditor`).
    *   Admin-only CRUD for Users and Roles, self-service profile endpoint.
    *   JWT authentication endpoints, Swagger/ReDoc documentation.
    *   Environment-variable-driven security settings (`SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`) with `.env.example`.
    *   56 automated tests covering auth, permissions, CRUD, business logic, JWT, profiles, and edge cases.

*   **Report:** `docs/sprint-1-report.md`

### Sprint 2: Core Engine (Jobs, Samples & Blind Aliasing)

**Goal:** Allow Receptionists to intake samples and generate secure aliases for Lab Analysts.

*   **Models:**
    *   `TestCatalog` -- master list of available analysis tests with pricing (Inception Req #8-9).
    *   `JobOrder` (`id` UUID, `client` FK, `current_status` Enum, `status_reason` Text, `blocked_by_role` FK, `is_cancelled` Boolean).
    *   `BlindCode` (`id` UUID PK, `code` CharField) -- resolves the missing table gap in the client's draft.
    *   `Sample` (`id` UUID, `job` FK, `blind_alias_id` FK -> `BlindCode`, `assigned_analyst` FK, `sample_status` Enum). Enriched with metadata fields: `sample_name`, `sample_weight`, `packaging_type`, `collection_date`, `received_by` FK, `submitted_by` FK (Inception Req #1).

*   **Business Logic:**
    *   Auto-generate a unique `BlindCode` record and link it to the `Sample` upon creation (Django `save()` override or Signal).
    *   Receptionist-only intake: only Receptionists can create JobOrders and register Samples.

*   **API:**
    *   DRF ModelViewSets for TestCatalog (Admin/read-only for others), Jobs (Receptionist creates, Admin manages), and Samples.
    *   Analyst filtering: Analysts can only fetch Samples assigned to them and only see the `blind_alias_id`, not client info.

*   **Deferred:** Barcode/QR label generation (Inception Req #5) -- deferred to post-MVP as it requires a frontend or PDF generation library.

### Sprint 3: Lab Analysis & QC

**Goal:** Enable Analysts to submit results and QC Managers to review, approve, or return them. This must come before Finance because the payment gate depends on approved results.

*   **Models:**
    *   `AnalysisResult` (`id` UUID PK, `sample` FK, `test` FK -> `TestCatalog`, `result_state` Enum [Draft, Submitted, Returned, Approved], `is_latest` Boolean, `is_frozen` Boolean, `value` Text, `unit` VARCHAR, `note` Text, `submitted_by` FK, `submission_date` DateTime, `approved_by` FK, `approval_date` DateTime).
    *   `QCDecision` (`id` UUID PK, `result_id` FK -> `AnalysisResult`, `decision` Enum [Approved, Returned], `returned_reason` Text, `decided_by` FK, `decided_at` DateTime).
    *   `DemaskLog` (`id` UUID PK, `sample` FK, `demasked_by` FK, `demasked_at` Timestamp, `justification` Text) -- logs every instance of revealing the true identity behind a blind code (Inception Doc Section 5B).

*   **Business Logic:**
    *   Result submission -> QC review -> approval/return cycle.
    *   Only the assigned Analyst can submit results for their samples.
    *   QC Managers see all pending reviews; Analysts see only their own results.
    *   Demasking: only authorized roles (QC Manager, Admin) can de-mask a sample. Every event is logged in `DemaskLog`.

*   **File Attachments (Inception Req #11):**
    *   Support file uploads (instrument printouts, spreadsheets) linked to `AnalysisResult`. Use Django `FileField` with object storage configuration.

### Sprint 4: Workflow State Machine & Audit Trails

**Goal:** Formalize the job lifecycle with validated state transitions and maintain an immutable, government-compliant log of all actions.

*   **Models:**
    *   `JobStatusHistory` (`id` UUID PK, `job` FK, `from_status` Enum, `to_status` Enum, `changed_by` FK, `changed_at` DateTime, `reason` Text).
    *   `IncidentLog` (`id` UUID PK, `sample_id` FK, `incident_type` Enum [Lost, Damaged, Contaminated], `action_taken` Text, `financial_impact` Enum [Refund, Credit, No_Change], `logged_by` FK, `logged_at` DateTime).
    *   `AuditLog` (`id` UUID PK, `action_type` VARCHAR [DEMASK, LOGIN, DELETE, STATUS_CHANGE, etc.], `user_id` FK, `target_model` VARCHAR, `target_id` UUID, `metadata` JSONField, `timestamp` DateTime) -- cross-cutting audit log that records actions across all models.

*   **Business Logic:**
    *   Django Signal on `JobOrder`: if `current_status` changes, automatically create a `JobStatusHistory` record. No direct field editing -- all transitions go through validated endpoints.
    *   State transition validation: enforce the allowed sequence (Draft -> Received -> In Prep -> In Analysis -> QC -> Finance Hold -> Completed). Reject invalid jumps.
    *   Job cancellation: only Admin/Receptionist can cancel, with a mandatory `reason` field.
    *   `AuditLog` middleware or Signal integration: automatically capture key actions (login, delete, status change, demask) system-wide.

*   **API:**
    *   Dedicated state-transition endpoint (`POST /jobs/{id}/transition/`) instead of raw PATCH on `current_status`.
    *   Incident reporting endpoint (Receptionist/Admin).
    *   Audit log read-only endpoint (Auditor/Admin).

### Sprint 5: Finance, Billing & Disputes

**Goal:** Tie financial records to Job Orders and enforce payment-gated result release.

*   **Models:**
    *   `FinancialRecord` (`invoice_no` VARCHAR PK, `job` OneToOne FK, `amount_expected` Decimal, `amount_paid` Decimal, `payment_status` Enum [Unpaid, Partial, Fully_Paid], `generated_by` FK, `generated_at` DateTime).
    *   `PaymentVerification` (`id` UUID PK, `financial_record` FK, `amount_verified` Decimal, `verified_by` FK, `verified_at` Timestamp, `slip_scan` FileField).
    *   `DisputeRecord` (`id` UUID PK, `job_id` FK, `sample_id` FK nullable, `cert_version_id` FK nullable, `raised_by` FK, `raised_at` DateTime, `outcome` Text, `is_frozen` Boolean).

*   **Business Logic:**
    *   When `FinancialRecord.payment_status` becomes `Fully_Paid`, automatically transition the associated `JobOrder.current_status` to `Completed` (releasing results to the client).
    *   Partial payment tracking: `amount_paid` is a running total of verified `PaymentVerification` records.
    *   Dispute workflow: when a dispute is raised, `is_frozen = True` freezes the job record and triggers a review. Only Admin can resolve.
    *   Finance role can generate invoices and verify payments. Clients can view their invoices.

*   **API:**
    *   Invoice generation endpoint (Finance).
    *   Payment verification endpoint (Finance).
    *   Dispute creation (Client) and resolution (Admin) endpoints.

### Sprint 6: Compliance, Certificates & Notifications

**Goal:** Complete the compliance layer and add communication capabilities.

*   **Models:**
    *   `RoleChangeHistory` (`id` UUID PK, `user_id` FK, `old_role_id` FK nullable, `new_role_id` FK, `changed_by` FK, `changed_at` DateTime, `reason` Text).
    *   `CertificateHistory` (`id` UUID PK, `job` FK, `version_no` Int, `is_legal_authority` Boolean, `change_reason` Text, `issued_by` FK, `issued_at` DateTime, `document` FileField).

*   **Business Logic:**
    *   Legal freezing: once `is_legal_authority` is set on a `CertificateHistory` record, it becomes immutable. No updates or deletes allowed.
    *   Role change tracking: Django Signal on `User.role` changes automatically creates a `RoleChangeHistory` record.
    *   Certificate versioning: each re-issue creates a new version record. Only the latest `is_legal_authority = True` version is the active certificate.

*   **Notifications (Inception Req #18):**
    *   In-app notification model (`Notification`: `id`, `recipient` FK, `message` Text, `is_read` Boolean, `created_at`).
    *   Email/SMS integration for key events: job status changes, payment confirmations, result approvals. (Implementation depends on available email/SMS provider.)

*   **Reports Dashboard (Inception Section 6):**
    *   Read-only aggregate endpoints for: intake volume by period, revenue summaries, workload by analyst/department, turnaround time metrics.
    *   Accessible by Admin, Finance, QC Manager, Auditor.

### Post-MVP Backlog

Features identified in the Inception Document but deferred beyond Sprint 6:

*   Barcode/QR label generation and printing (Req #5).
*   Client self-registration portal.
*   PDF generation for invoices, receipts, and result reports (Section 6 Outputs).
*   Equipment maintenance scheduling and logs (Should-have).
*   Inventory and consumables tracking (Should-have).
*   SLA and turnaround-time dashboards with alerts (Should-have).
*   Advanced analytics, forecasting, and workload optimization (Could-have).
*   External payment gateway integration (Could-have / Non-have).
*   Rate limiting and throttling on auth endpoints.
*   PostgreSQL migration for production deployment.

---

## 3. The "Bulletproof" Verification Protocol

*To ensure high code quality and prevent regressions, EVERY completed task/feature must pass the following 3-step verification process before being merged into the main codebase.*

### A. Visual API Documentation (Swagger/OpenAPI)

*   **Tool:** `drf-spectacular`.
*   **Rule:** Every endpoint must be auto-documented and accessible via the Swagger UI (`/api/docs/`). 
*   **Action:** Manually test the endpoint in the browser UI using a dummy JWT token to verify JSON request/response formats.

### B. Automated Testing (Regression Shield)

*   **Tool:** Django `TestCase` + DRF `APIClient`.
*   **Rule:** No endpoint or business logic is complete without unit tests.
*   **Detailed structure:** See `docs/LSIMS_TESTING_PROTOCOL.md` for the full 5-category test structure, naming conventions, and code examples.
*   **Action:** For every new feature, tests must cover all 5 categories:
    1.  *Happy Path (200/201):* Success with DB state verification.
    2.  *Authentication (401):* No token → blocked.
    3.  *Permission (403):* Wrong role → blocked.
    4.  *Edge Cases (400/404):* Bad payloads, missing fields, nonexistent IDs.
    5.  *Signals (Side-effects):* Verify Django Signals fired and records were created.

*   **Command:** `.\venv\Scripts\python manage.py test accounts -v 2` must pass 100%.

### C. Version Control (Save States)

*   **Tool:** Git.
*   **Rule:** The `main` branch must ALWAYS contain working, tested code.
*   **Action:** 
    1. Check out a new branch for the sprint/feature: `git checkout -b sprint-1-auth`.
    2. Write code, run tests, verify in Swagger.
    3. Commit changes: `git commit -m "feat: implement RBAC and custom users"`.
    4. Merge to main ONLY when all tests pass. If the AI breaks the app, revert the branch and try again.

---

## 4. Data Type Source of Truth

**IMPORTANT:** The tabular schema in Section 4 of the Inception Document (`lsims-inception-document.md`) is the **absolute source of truth** for all data types and column definitions. The visual ER diagram's data types (e.g., `country: integer`, `organizationname: int`) contain errors and must be **strictly ignored** when generating models.

---

## 5. Instructions for AI Assistant

When reading this document:

1.  Acknowledge you understand the architecture, tech stack, and verification protocol.
2.  Do NOT generate the entire project at once.
3.  Wait for the user to specify which Sprint and Task to execute.
4.  When generating code, always output the necessary `models.py`, `views.py`, `serializers.py`, `urls.py`, and the corresponding `tests.py` to satisfy the Verification Protocol.