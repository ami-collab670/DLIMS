\# 🏛️ LSIMS (Laboratory Sample Information Management System)

\*\*Master Blueprint \& Development Architecture\*\*



\## 1. Project Overview

LSIMS is an enterprise-grade API built for the Ministry of Mines to digitize the end-to-end mineral testing and certification process. The system acts as a high-integrity facilitation portal bridging external clients and internal laboratory workflows.



\*   \*\*Tech Stack:\*\* Python, Django, Django REST Framework (DRF), PostgreSQL.

\*   \*\*Methodology:\*\* Agile (Iterative sprints based on evolving draft requirements).

\*   \*\*Key Security/Compliance Features:\*\* 

&nbsp;   \*   Strict Role-Based Access Control (ISO separation-of-duties).

&nbsp;   \*   "Blind Analysis" (Analysts only see generated aliases, not client info).

&nbsp;   \*   Immutable Audit Trails (Every status change is permanently logged).

&nbsp;   \*   Automated Financial Locks (Results withheld until payment is confirmed).



---



\## 2. Sprint Roadmap (Agile Draft)

\*Note: This roadmap is based on draft requirements and is subject to change. Tasks will be executed incrementally.\*



\### 🟢 Sprint 1: Foundation (Auth \& RBAC)

\*\*Goal:\*\* Establish the Django project, database connections, custom user models, and strict permission classes for all 8 roles.

\*   \*\*Tasks:\*\*

&nbsp;   \*   Initialize Django project and configure PostgreSQL.

&nbsp;   \*   Implement `djangorestframework-simplejwt` for session management.

&nbsp;   \*   Create `Role` model (`id` UUID, `role\_name`, `contact\_alias`).

&nbsp;   \*   Create Custom `User` model linked to `Role`.

&nbsp;   \*   Build DRF Custom Permission classes for **all 8 roles** (per Inception Doc Section 2B):

&nbsp;       \*   `IsAdmin`

&nbsp;       \*   `IsReceptionist`

&nbsp;       \*   `IsAnalyst`

&nbsp;       \*   `IsQCManager`

&nbsp;       \*   `IsFinance`

&nbsp;       \*   `IsProcurement`

&nbsp;       \*   `IsMinistryCoordinator`

&nbsp;       \*   `IsAuditor`

&nbsp;   \*   Implement basic CRUD APIs for Users and Roles (Admin only).



\### 🔵 Sprint 2: Core Engine (Jobs, Samples \& Blind Aliasing)

\*\*Goal:\*\* Allow Receptionists to intake samples and generate secure aliases for Lab Analysts.

\*   \*\*Tasks:\*\*

&nbsp;   \*   Create `JobOrder` model (`id` UUID, `current\_status` Enum, `is\_cancelled` Boolean).

&nbsp;   \*   Create `BlindCode` model (`id` UUID PK, `code` CharField) — resolves the missing table gap in the client's draft.

&nbsp;   \*   Create `Sample` model (`id` UUID, `job` FK, `blind\_alias\_id` FK → `BlindCode`, `assigned\_analyst` FK, `sample\_status` Enum).

&nbsp;   \*   \*\*Business Logic:\*\* Write a Django `save()` method or Signal for `Sample` that auto-generates a unique `BlindCode` record and links it upon creation.

&nbsp;   \*   Create DRF ModelViewSets for Jobs and Samples.

&nbsp;   \*   Implement filtering: Analysts should only be able to fetch Samples assigned to them (and only see the `blind\_alias\_id`).



\### 🟣 Sprint 3: Workflow, State Machines \& Audit Trails

\*\*Goal:\*\* Track the lifecycle of a job and maintain an immutable, government-compliant log of all actions.

\*   \*\*Tasks:\*\*

&nbsp;   \*   Create `JobStatusHistory` model (`job` FK, `from\_status`, `to\_status`, `changed\_by` FK, `changed\_at` DateTime, `reason` Text).

&nbsp;   \*   Create `IncidentLog` model for exceptions (Lost, Damaged, Contaminated samples).

&nbsp;   \*   \*\*Business Logic:\*\* Implement Django Signals (`pre\_save`/`post\_save`) on the `JobOrder` model. If `current\_status` changes, automatically generate a `JobStatusHistory` record.

&nbsp;   \*   Build endpoints to safely transition job states (Draft -> Received -> In Prep -> Analysis -> QC -> Finance Hold -> Completed).



\### 🟠 Sprint 4: Finance, Billing \& Disputes

\*\*Goal:\*\* Tie financial records to Job Orders and enforce legal/payment safeguards.

\*   \*\*Tasks:\*\*

&nbsp;   \*   Create `FinancialRecord` model (`invoice\_no` PK, `job` OneToOne, `amount\_expected`, `amount\_paid`, `payment\_status` Enum).

&nbsp;   \*   Create `DisputeRecord` model to handle client challenges and legal freezing.

&nbsp;   \*   \*\*Business Logic:\*\* Implement a Django Signal where if a `FinancialRecord`'s `payment\_status` becomes `Fully\_Paid`, it automatically updates the associated `JobOrder.current\_status` to `Completed` (releasing the results to the client).



\### 🔴 Sprint 5: Lab Analysis \& QC

\*\*Goal:\*\* Enable Analysts to submit results and QC Managers to review, approve, or return them.

\*   \*\*Tasks:\*\*

&nbsp;   \*   Create `AnalysisResult` model (`id` UUID PK, `result\_state` Enum \[Draft, Submitted, Returned, Approved\], `is\_latest` Boolean, `is\_frozen` Boolean).

&nbsp;   \*   Create `QCDecision` model (`id` UUID PK, `result\_id` FK → `AnalysisResult`, `decision` Enum \[Approved, Returned\], `returned\_reason` Text).

&nbsp;   \*   \*\*Business Logic:\*\* Implement workflows for result submission → QC review → approval/return cycle.

&nbsp;   \*   Implement filtering: Analysts see only their assigned results; QC Managers see all pending reviews.



\### ⚫ Sprint 6: Audit, Legal \& Compliance

\*\*Goal:\*\* Complete the compliance layer with full audit logging, payment verification, role history, and certificate versioning.

\*   \*\*Tasks:\*\*

&nbsp;   \*   Create `AuditLog` model (`id` UUID PK, `action\_type` VARCHAR \[DEMASK, LOGIN, DELETE, etc.\], `user\_id` FK).

&nbsp;   \*   Create `PaymentVerification` model (`id` UUID PK, `verified\_by` FK, `verified\_at` Timestamp).

&nbsp;   \*   Create `RoleChangeHistory` model (`id` UUID PK, `user\_id` FK, `new\_role\_id` FK).

&nbsp;   \*   Create `CertificateHistory` model (`id` UUID PK, `version\_no` Int, `is\_legal\_authority` Boolean, `change\_reason` Text).

&nbsp;   \*   \*\*Business Logic:\*\* Legal freezing — once `is\_legal\_authority` is set, the record becomes immutable.



---



\## 3. The "Bulletproof" Verification Protocol

\*To ensure high code quality and prevent regressions, EVERY completed task/feature must pass the following 3-step verification process before being merged into the main codebase.\*



\### A. Visual API Documentation (Swagger/OpenAPI)

\*   \*\*Tool:\*\* `drf-spectacular`.

\*   \*\*Rule:\*\* Every endpoint must be auto-documented and accessible via the Swagger UI (`/api/docs/`). 

\*   \*\*Action:\*\* Manually test the endpoint in the browser UI using a dummy JWT token to verify JSON request/response formats.



\### B. Automated Testing (Regression Shield)

\*   \*\*Tool:\*\* Django `APITestCase`.

\*   \*\*Rule:\*\* No endpoint or business logic is complete without unit tests.

\*   \*\*Action:\*\* For every new feature, AI must generate tests covering:

&nbsp;   1.  \*Authentication Check:\* Ensure unauthorized users receive `401 Unauthorized`.

&nbsp;   2.  \*Permission Check:\* Ensure the wrong role (e.g., Receptionist trying to approve QC) receives `403 Forbidden`.

&nbsp;   3.  \*Success Check:\* Ensure the happy path returns `200 OK` or `201 Created` with the correct database state.

&nbsp;   4.  \*Logic Check:\* Ensure Django Signals fire correctly (e.g., Audit logs are created).

\*   \*\*Command:\*\* `python manage.py test` must pass 100%.



\### C. Version Control (Save States)

\*   \*\*Tool:\*\* Git.

\*   \*\*Rule:\*\* The `main` branch must ALWAYS contain working, tested code.

\*   \*\*Action:\*\* 

&nbsp;   1. Check out a new branch for the sprint/feature: `git checkout -b sprint-1-auth`.

&nbsp;   2. Write code, run tests, verify in Swagger.

&nbsp;   3. Commit changes: `git commit -m "feat: implement RBAC and custom users"`.

&nbsp;   4. Merge to main ONLY when all tests pass. If the AI breaks the app, revert the branch and try again.



---



\## 4. Data Type Source of Truth

\*\*IMPORTANT:\*\* The tabular schema in Section 4 of the Inception Document (`lsims-inception-document.md`) is the **absolute source of truth** for all data types and column definitions. The visual ER diagram's data types (e.g., `country: integer`, `organizationname: int`) contain errors and must be **strictly ignored** when generating models.



---



\## 5. Instructions for AI Assistant

When reading this document:

1\.  Acknowledge you understand the architecture, tech stack, and verification protocol.

2\.  Do NOT generate the entire project at once.

3\.  Wait for the user to specify which Sprint and Task to execute.

4\.  When generating code, always output the necessary `models.py`, `views.py`, `serializers.py`, `urls.py`, and the corresponding `tests.py` to satisfy the Verification Protocol.

