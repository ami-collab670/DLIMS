# Laboratory Sample Information Management System (LSIMS) Inception document V0

## Ministry of Mines

### 1. Executive Summary
The proposed system is designed to digitize the end-to-end mineral testing and certification process. This platform acts as a high-integrity facilitation portal, bridging the gap between external clients and internal laboratory workflows. It specifically addresses "Blind Analysis" protocols, complex billing, and legal safeguards for dispute management and incident tracking.

### 2. User Roles & Authentication Architecture
**A. External Users (Clients/Private Organizations)**
* **Registration Profile:** Name, Email, Password, Phone, Organization Type, Nationality.
* **Session Management:** Secure Login/Logout with session tracking.

**B. Internal Users (Ministry Staff)**
* **Roles:** Admin, Receptionist, Lab Analyst, QC Manager, Finance Officer, Procurement Officer.
* **Role-Based Contact:** The system exposes a `contact_alias` (e.g., "QC-Department-Support") to clients rather than personal staff details.
* **Receptionist:** receives samples, hands proforma, registers requests, queues samples, prints labels, communicates with clients
* **Finance officer/Cashier:** generates proforma, manages invoices, confirms payments
* **Quality controller/Lab Manager:** verifies sample, assigns work, monitors workload, approves result, releases result
* **Lab Analyst:** performs tests, enters results, tracks inventory
* **Client (external):** submits sample, makes payment, tracks status, downloads released results & invoices/receipts
* **Ministry Requester/Coordinator:** tracks internal requests and delivers results
* **System Admin:** users, roles, configuration, backups
* **Auditor:** read-only audit, compliance checks

### 3. Functional requirements
1. The system shall maintain new analysis requests and register sample metadata (sample weight, date received, packaging, requested parameters,...)
2. The system shall assign a new `sample_code` for each intake
3. The system shall allow the receptionist to add requests to a queue
4. The system shall allow the receptionist to capture and anonymize requesters’ details
5. The system shall generate and print barcode/QR labels for each sample
6. The system shall track the status of submitted samples
7. The system shall create a work order per request or per sample (if multiple samples are delivered per request)
8. The system shall maintain test catalogs
9. The system shall allow test selection from the catalog
10. The system shall assign tests to analysts and set priority/target date
11. The system shall support results entry and attachment of associated files (instrument printouts, spreadsheets)
12. The system shall generate reports at various intervals and levels: temporal intake report, revenue report, workload by expert or dept report, turnaround report, …
13. The system shall generate and send invoices to clients
14. The system shall support manual payment confirmation (through slip scan) or integrate an automated payment system
15. The system shall maintain the payment status (requested, pending, in progress, paid) of samples
16. The system shall allow clients to receive invoices, make payments, and confirm payments
17. The system shall allow clients to view request status and download result reports
18. The system shall send notifications to clients and other users

Generally, the requirements are clustered into four groups: Must-haves (M), Should-haves (S), could-haves (C) and Non-haves (N)

**M**
* End-to-end sample lifecycle tracking with immutable audit trail
* Unique sample identification with barcode labeling
* Role-based access control aligned with ISO separation-of-duties
* Client portal for status tracking, invoices, and result downloads
* Work orders, test catalog, analyst assignment, and result entry
* Invoicing and payment status tracking
* Notifications (email/SMS) for key events

**S**
* Inventory & consumables tracking
* Equipment maintenance scheduling and logs
* SLA and turnaround-time dashboards
* File/image attachments for instrument outputs

**C**
* Advanced analytics, forecasting, and workload optimization
* External payment gateway integrations: could be N

**N**
* Full instrument/LIMS machine integration

### 4. System architecture
Modular software architecture to support scalability and extensibility while allowing components to be standalone. Main components include
* Web UI for users: Staff portal + Client portal
* Backend API: Domain modules and business logic
* Persistent data management: Relational Database (PostgreSQL) + SQLite
* Object Storage: Attachments, reports, scanned slips
* Messaging/Notification Service: Email/SMS (in-app notification and alerts)

### 5. Comprehensive Feature & Functionality Breakdown
**A. Job-Based Submission & Status Tracking**
* **Visibility:** Real-time status: Draft -> Submitted -> Received -> In Prep -> In Analysis -> QC -> Finance Hold -> Completed.
* **Blocker Transparency:** If a job is stalled, the system displays a `status_reason` (e.g., "Waiting for Prep") and the `blocked_by_role` (e.g., "Lab Technician").
* **Audit Trail:** Every status change is recorded to track exactly who moved a job between stages and why.

**B. Anti-Corruption & Blind Analysis**
* **Blind Alias System:** Analysts only see system-generated codes, not sample details. This means the system needs to generate a unique sample identifier in each step of the workflow and link it to the original identity for traceability
* **Demasking Protocols:** Only authorized roles can "De-mask" a sample. Every event is logged in `demask_log` with a justification.

**C. Exception Handling & Legal Safeguards**
* **Incident Management:** Formal logging of lost, contaminated, or damaged samples with explicit mapping to financial impacts (refunds/credits).
* **Job Cancellation:** Authorized mid-process cancellation with reason-tracking.
* **Dispute Workflow:** External clients can formally dispute results or entire jobs; this freezes the record and triggers a review.
* **Legal Freezing:** Once marked "Legal Authority," data is frozen against back-end modification.

**D. Finance & Billing Automation**
* **Reconciliation:** Tracks "Amount Expected" vs "Amount Paid." Supports partial payments.
* **Automated Unlock:** Results transition from `Finance Hold` to `Completed` automatically once payment is committed.

### 4. Comprehensive Database Schema Design
*(Note: Section numbering kept as original)*

#### 4.1 Authentication & RBAC

**Table: `user_roles`**
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Unique Role ID. |
| `role_name` | VARCHAR | Analyst, Finance, etc. |
| `contact_alias` | VARCHAR | Public-facing title (e.g., "Finance Dept"). |

**Table: `role_change_history`**
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Log ID. |
| `user_id` | UUID (FK) | Affected user. |
| `new_role_id` | UUID (FK) | Prevents conflicts (Analyst + Finance). |

#### 4.2 Job Tracking & Incidents

**Table: `job_orders`**
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Unique Job ID. |
| `current_status` | ENUM | Workflow stage. |
| `status_reason` | TEXT | Explanation of current delay. |
| `blocked_by_role` | UUID (FK) | Role responsible for next action. |
| `is_cancelled` | BOOLEAN | Cancellation flag. |

**Table: `job_status_history`**
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Log ID. |
| `job_id` | UUID (FK) | Reference to job. |
| `from_status` | ENUM | Previous state. |
| `to_status` | ENUM | New state. |
| `changed_by` | UUID (FK) | User who moved the job. |
| `changed_at` | TIMESTAMP | Time of transition. |
| `reason` | TEXT | Note on why status changed. |

**Table: `incident_log`**
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Incident ID. |
| `sample_id` | UUID (FK) | Affected sample. |
| `incident_type` | ENUM | Lost, Damaged, Contaminated. |
| `action_taken` | TEXT | Refund, Re-test, or Note. |
| `financial_impact` | ENUM | Refund, Credit, No_Change. |

#### 4.3 Laboratory & Preparation (Analyst/QC View)

**Table: `blind_codes`**
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Unique Blind Code ID. |
| `code` | VARCHAR | Auto-generated anonymous identifier string. |

**Table: `samples`**
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Internal ID. |
| `blind_alias_id` | UUID (FK) | Linked to `blind_codes`. |
| `assigned_analyst_id` | UUID (FK) | Current analyst. |
| `assigned_at` | TIMESTAMP | When assignment was made. |
| `reassigned_reason` | TEXT | Why the analyst was changed. |
| `sample_status` | ENUM | Pending, In-Prep, Ready-for-Analysis. |

**Table: `analysis_results`**
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Result ID. |
| `result_state` | ENUM | Draft, Submitted, Returned, Approved. |
| `is_latest` | BOOLEAN | Flag for multiple raw data uploads. |
| `is_frozen` | BOOLEAN | Legal lock after issuance. |

**Table: `qc_decisions`**
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Decision ID. |
| `result_id` | UUID (FK) | Linked result. |
| `decision` | ENUM | Approved, Returned (Retest). |
| `returned_reason` | TEXT | Specific feedback for the analyst. |

#### 4.4 Finance, Billing & Audit

**Table: `financial_records`**
| Column | Type | Description |
| :--- | :--- | :--- |
| `invoice_no` | VARCHAR (PK) | Reference code. |
| `amount_expected` | DECIMAL | (Tests + Prep) * Priority. |
| `amount_paid` | DECIMAL | Running total of verified payments. |
| `payment_status` | ENUM | Unpaid, Partial, Fully_Paid. |

**Table: `payment_verifications`**
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Verification ID. |
| `verified_by` | UUID (FK) | Finance Officer ID. |
| `verified_at` | TIMESTAMP | Time of verification. |

**Table: `audit_logs`**
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Log ID. |
| `action_type` | VARCHAR | DEMASK, LOGIN, DELETE, etc. |
| `user_id` | UUID (FK) | Who performed the action. |

#### 4.5 Versioning & Disputes

**Table: `certificate_history`**
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Record ID. |
| `version_no` | INT | v1, v2, etc. |
| `is_legal_authority` | BOOLEAN | Current valid version flag. |
| `change_reason` | TEXT | Why it was modified. |

**Table: `dispute_records`**
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Dispute ID. |
| `job_id` | UUID (FK) | Link to job being challenged. |
| `sample_id` | UUID (FK) | Specific sample challenged (optional). |
| `cert_version_id` | UUID (FK) | Specific certificate version disputed. |
| `outcome` | TEXT | Resolution details. |

**Draft DB schema**
*(Diagram present in original document)*

### 5. Implementation Roadmap
* **Discovery (1–2 weeks):** confirm workflows, roles, forms, test catalog, document templates
* **Design (1 week):** finalize architecture, DB schema, security model
* **Build (4–8 weeks):** core modules (requests, samples, tests, billing, portal)
* **Testing (2 weeks):** UAT + security tests (location confidentiality)
* **Pilot (2–4 weeks):** one lab section + selected clients

### 6. Interfaces & Outputs (V0)

**Screens (minimum)**
* Login + Role-based navigation
* Request registration (external/internal)
* Sample intake + label printing
* Work order/test assignment
* Analyst workspace (assigned tests)
* Result entry + attachments
* Review/approval queue
* Invoice view + payment confirmation
* Client/ministry portal (tracking + downloads)
* Reports dashboard
* Admin: users/roles + test catalog + price list

**Documents Generated**
* Invoice PDF
* Payment receipt/confirmation PDF (optional)
* Result report PDF (signed/approved)
* Chain-of-custody form (optional PDF)

### Visual Draft DB Schema (Logical Model Transcription)

*(Note: The following entities and enums are transcribed directly from the visual Logical Data Model diagram. Where there are discrepancies in data types between this diagram and the tabular schema in Section 4, the tabular schema in Section 4 should be treated as the **absolute source of truth** for database generation. Data types in the visual diagram (e.g., `country: integer`, `organizationname: int`, `submissiondate: int`) are known to be incorrect and must be strictly ignored).*

**Enumerations (Enums):**
*   **`usertype`**: internal, external
*   **`userrole`**: receptionist, qc, analyst, manager, financeofficer
*   **`paymentstatus`**: pending, paid, issued
*   **`samplestatus`**: inqueue, inprep, pending, sentolab
*   **`requeststatus`**: approved, rejected, assigned
*   **`auditaction`**: demask, delete, login
*   **`resultstate`**: draft, submitted, returned, approved

**Entities & Attributes:**

*   **user** (Base Entity)
    *   `name`: String {bag}
    *   `email`: String
    *   `password`: String
    *   `phone`: String
    *   `type`: usertype

*   **internaluser** (Extends user)
    *   `id`: String
    *   `role`: userrole

*   **customer** (Extends user)
    *   `nationality`: String
    *   `country`: integer
    *   `organizationname`: int
    *   `organizationtype`: int

*   **sample**
    *   `id`: String
    *   `name`: String
    *   `testname`: String
    *   `code`: String
    *   `submissiondate`: int
    *   `submittedby`: String
    *   `receivedby`: String
    *   `collectiondate`: int
    *   `status`: samplestatus
    *   `assignedto`: int

*   **analysisrequest** (Equivalent to job_orders)
    *   `id`: String
    *   `sampe`: String
    *   `testtype`: int
    *   `assignedto`: int
    *   `assigneddate`: int
    *   `status`: requeststatus
    *   `totalfee`: int
    *   `priority`: int
    *   `approvedby`: int
    *   `description`: String

*   **invoice**
    *   `invoiceno`: String
    *   `amount`: Real
    *   `paymentstatus`: paymentstatus

*   **paymentverification**
    *   `id`: String
    *   `verifiedat`: int
    *   `verifiedby`: String
    *   `invoice`: int

*   **result**
    *   `id`: String
    *   `islatest`: Boolean
    *   `state`: resultstate
    *   `sample`: int
    *   `test`: int
    *   `value`: int
    *   `unit`: int
    *   `note`: int
    *   `submittedby`: int
    *   `submissiondate`: int
    *   `approvedby`: int
    *   `approvaldate`: int

*   **qcdecisions**
    *   `id`: String
    *   `resultid`: int
    *   `samplecode`: String
    *   `decision`: int
    *   `date`: int

*   **auditlog**
    *   `id`: String
    *   `action`: auditaction
    *   `userid`: int

*   **disputelog**
    *   `id`: String
    *   `jobid`: String
    *   `sampleid`: int
    *   `decision`: String