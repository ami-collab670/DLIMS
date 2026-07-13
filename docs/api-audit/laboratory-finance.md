# Laboratory Finance API Audit — `/api/laboratory/financial-records/`, `/discount-approvals/`

**Audited:** July 13, 2026  
**Swagger source:** Serializer field lists and ViewSet definitions in codebase (no invented response JSON)  
**Test coverage:** [LSIMS-Backend/LSIMS-main/laboratory/tests/test_happy_path.py](LSIMS-Backend/LSIMS-main/laboratory/tests/test_happy_path.py), [test_business_logic.py](LSIMS-Backend/LSIMS-main/laboratory/tests/test_business_logic.py), [test_support_workflows.py](LSIMS-Backend/LSIMS-main/laboratory/tests/test_support_workflows.py) — payment gate, waiver bypass, discount approval

---

## Table of Contents

- [Overview](#overview)
- [Part 1: Frontend Usage](#part-1-frontend-usage)
  - [GET /api/laboratory/financial-records/](#get-apilaboratoryfinancial-records)
  - [GET /api/laboratory/financial-records/{invoice_no}/](#get-apilaboratoryfinancial-recordsinvoice_no)
  - [POST /api/laboratory/financial-records/](#post-apilaboratoryfinancial-records)
  - [PUT /api/laboratory/financial-records/{invoice_no}/](#put-apilaboratoryfinancial-recordsinvoice_no)
  - [PATCH /api/laboratory/financial-records/{invoice_no}/](#patch-apilaboratoryfinancial-recordsinvoice_no)
  - [DELETE /api/laboratory/financial-records/{invoice_no}/](#delete-apilaboratoryfinancial-recordsinvoice_no)
  - [GET /api/laboratory/discount-approvals/](#get-apilaboratorydiscount-approvals)
  - [GET /api/laboratory/discount-approvals/{id}/](#get-apilaboratorydiscount-approvalsid)
  - [POST /api/laboratory/discount-approvals/](#post-apilaboratorydiscount-approvals)
  - [PATCH /api/laboratory/discount-approvals/{id}/](#patch-apilaboratorydiscount-approvalsid)
  - [DELETE /api/laboratory/discount-approvals/{id}/](#delete-apilaboratorydiscount-approvalsid)
  - [POST /api/laboratory/discount-approvals/{id}/approve/](#post-apilaboratorydiscount-approvalsidapprove)
  - [POST /api/laboratory/discount-approvals/{id}/reject/](#post-apilaboratorydiscount-approvalsidreject)
- [Part 2: Backend Logic](#part-2-backend-logic)
- [Consolidated Tables](#consolidated-tables)
- [Highest-Risk Findings](#highest-risk-findings)
- [Open Questions / Needs Manual Verification](#open-questions--needs-manual-verification)

---

## Overview

Financial records gate **permanent sample coding** and job progression from `pending_finance`. Finance/Admin create and update invoices (lookup by `invoice_no`). **Mark-paid** is implemented in the frontend as a PATCH setting `amount_paid = amount_expected` and `payment_status: "paid"` — the model then sets `paid_at` and triggers `handle_financial_record_saved` → `code_paid_job_samples`. Discount approvals are a separate director workflow: pending requests can be approved (free-test waivers update the linked financial record) or rejected.

This audit covers **14 HTTP operations** (10 backend-active; 4 blocked or dead in frontend).

| Method | Path | Description | Used in Frontend |
|--------|------|-------------|------------------|
| GET | `/api/laboratory/financial-records/` | Paginated invoice list | Yes |
| GET | `/api/laboratory/financial-records/{invoice_no}/` | Invoice detail | No (dead export) |
| POST | `/api/laboratory/financial-records/` | Create invoice for job | Yes |
| PUT | `/api/laboratory/financial-records/{invoice_no}/` | Full replace | No |
| PATCH | `/api/laboratory/financial-records/{invoice_no}/` | Partial update / mark-paid | Yes |
| DELETE | `/api/laboratory/financial-records/{invoice_no}/` | Delete record | No (dead export; **405** on backend) |
| GET | `/api/laboratory/discount-approvals/` | Paginated discount list | Yes |
| GET | `/api/laboratory/discount-approvals/{id}/` | Discount detail | No (dead export) |
| POST | `/api/laboratory/discount-approvals/` | Request discount | Yes |
| PATCH | `/api/laboratory/discount-approvals/{id}/` | Partial update | No (dead export; **405** on backend) |
| DELETE | `/api/laboratory/discount-approvals/{id}/` | Delete request | No (dead export; **405** on backend) |
| POST | `/api/laboratory/discount-approvals/{id}/approve/` | Director approve | Yes |
| POST | `/api/laboratory/discount-approvals/{id}/reject/` | Director reject | Yes |
| — | Mark-paid (PATCH composite) | `amount_paid=amount_expected`, `payment_status=paid` | Yes |

---

## Part 1: Frontend Usage

Shared types — [LSIMS-Frontend/src/types/laboratory.ts](LSIMS-Frontend/src/types/laboratory.ts):

- **`FinancialRecord`**, **`PaymentStatus`**
- **`DiscountApproval`**, **`DiscountType`**, **`DiscountApprovalStatus`**
- **`DrfPaginated<T>`**

API layers:

- [financial-records-api.ts](LSIMS-Frontend/src/features/laboratory/financial-records-api.ts)
- [discount-approvals-api.ts](LSIMS-Frontend/src/features/laboratory/discount-approvals-api.ts)

Pages / sections:

- [StaffFinancePage.tsx](LSIMS-Frontend/src/pages/staff/lims-extensions/finance/StaffFinancePage.tsx) — tabs for invoices + discounts
- [finance-invoices-section.tsx](LSIMS-Frontend/src/pages/staff/lims-extensions/finance/finance-invoices-section.tsx) — invoice CRUD, mark-paid
- [finance-discounts-section.tsx](LSIMS-Frontend/src/pages/staff/lims-extensions/finance/finance-discounts-section.tsx) — request + approve/reject
- [staff-job-detail-panel.tsx](LSIMS-Frontend/src/pages/staff/laboratory/jobs/staff-job-detail-panel.tsx) — read invoices by job

---

### `GET /api/laboratory/financial-records/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `financial-records-api.ts` | API layer | `fetchFinancialRecords` |
| `finance-invoices-section.tsx` | Invoice table | `fetchFinancialRecords({ page: 1 })` |
| `staff-job-detail-panel.tsx` | Job finance panel | `fetchFinancialRecords({ job: job.id })` |

**3. Frontend-expected types**

```113:128:LSIMS-Frontend/src/types/laboratory.ts
export type FinancialRecord = {
  invoice_no: string;
  job: string;
  job_client_email?: string;
  job_status?: string;
  amount_expected: string;
  amount_paid: string;
  payment_status: PaymentStatus;
  paid_at: string | null;
  payment_required: boolean;
  waiver_reason: string;
  waiver_approved_by: string | null;
  waiver_approved_at: string | null;
  created_at: string;
  updated_at: string;
};
```

**4. Field comparison vs. backend serializer**

| Field | Verdict | Notes |
|-------|---------|-------|
| `invoice_no` (PK) | OK | Lookup field |
| `job`, amounts, `payment_status`, waiver fields, timestamps | OK | Direct model |
| `job_client_email`, `job_status` | OK | Computed read-only |
| `count`, `next`, `previous` (pagination) | OK | Standard DRF |

**5. Fallback/default values found**

- `data?.results ?? []`, `invoiceByJob` map built from page-1 results only.

**6. Error handling**

- `isError` + destructive message on finance invoices section.

**7. Business rules / validation in frontend**

- Filter by `job` on job detail panel.
- Finance section uses page-1 only.

---

### `GET /api/laboratory/financial-records/{invoice_no}/`

**1. Called in frontend?** No — `fetchFinancialRecord` never imported.

---

### `POST /api/laboratory/financial-records/`

**1. Called in frontend?** Yes — `finance-invoices-section.tsx` via `createFinancialRecord`.

**3. Frontend-expected types**

Request: `{ job, amount_expected?, amount_paid?, payment_status? }`. Response: `FinancialRecord`.

**4. Field comparison**

| Field | Verdict | Notes |
|-------|---------|-------|
| `job` | OK | Required FK |
| `amount_expected` | OK | FE sends optional string |
| `invoice_no` | OK | Auto-generated PK (read-only) |
| Waiver fields | OK | Read-only; not settable on direct create |

**7. Business rules / validation in frontend**

- Create form requires job ID; `amount_expected` optional in UI.
- `invalidateFinanceWorkflowQueries` runs on success (jobs, samples, dashboard caches).

---

### `PUT /api/laboratory/financial-records/{invoice_no}/`

**1. Called in frontend?** No

**2–7.** Backend allows PUT (`http_method_names` includes `put`); no FE wrapper calls it. PATCH used instead.

---

### `PATCH /api/laboratory/financial-records/{invoice_no}/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `finance-invoices-section.tsx` | Edit dialog | `patchFinancialRecord` |
| `finance-invoices-section.tsx` | Mark paid button | `patchFinancialRecord` (mark-paid) |

**3. Frontend-expected types**

Partial: `{ amount_expected?, amount_paid?, payment_status? }`.

**4. Field comparison**

| Field | Verdict | Notes |
|-------|---------|-------|
| Writable amounts/status | OK | Serializer allows patch |
| `paid_at` | OK | Read-only; set by model `save()` when status→paid |
| Waiver fields | OK | Read-only on serializer |

**7. Business rules / validation in frontend — mark-paid workflow**

```173:178:LSIMS-Frontend/src/pages/staff/lims-extensions/finance/finance-invoices-section.tsx
  const markPaidMut = useMutation({
    mutationFn: (record: FinancialRecord) =>
      patchFinancialRecord(record.invoice_no, {
        amount_paid: record.amount_expected,
        payment_status: "paid",
      }),
```

- Sets **`amount_paid` equal to `amount_expected`** (not a separate backend action).
- Success toast: "Invoice marked paid — job advances to laboratory intake."
- Backend `FinancialRecord.save()` sets `paid_at` when `payment_status == paid` and calls `handle_financial_record_saved` to code samples.

```903:918:LSIMS-Backend/LSIMS-main/laboratory/models.py
        if self.payment_status == self.PaymentStatus.PAID and self.paid_at is None:
            self.paid_at = timezone.now()
        if self.payment_status != self.PaymentStatus.PAID:
            self.paid_at = None
        # ...
            handle_financial_record_saved(self, previous_status, ...)
```

---

### `DELETE /api/laboratory/financial-records/{invoice_no}/`

**1. Called in frontend?** No — `deleteFinancialRecord` never imported. Backend `http_method_names` excludes `delete` (**405**).

---

### `GET /api/laboratory/discount-approvals/`

**1. Called in frontend?** Yes — `finance-discounts-section.tsx` with `status: "pending"`.

**3. Frontend-expected types**

```216:230:LSIMS-Frontend/src/types/laboratory.ts
export type DiscountApproval = {
  id: string;
  job: string;
  discount_type: DiscountType;
  percentage: string | null;
  amount: string | null;
  reason: string;
  status: DiscountApprovalStatus;
  requested_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string;
  created_at: string;
  updated_at: string;
};
```

**4. Field comparison**

| Field | Verdict | Notes |
|-------|---------|-------|
| Core fields | OK | Match serializer |
| `job_client_email` | MISSING FROM FE type | Backend sends; UNUSED BY FRONTEND |
| `requested_by_email`, `reviewed_by_email` | MISSING FROM FE type | Backend sends; UNUSED BY FRONTEND |

---

### `GET /api/laboratory/discount-approvals/{id}/`

**1. Called in frontend?** No — `fetchDiscountApproval` never imported.

---

### `POST /api/laboratory/discount-approvals/`

**1. Called in frontend?** Yes — `finance-discounts-section.tsx` when `canRequestDiscountApproval`.

**3. Frontend-expected types**

Request: `{ job, discount_type, percentage?, amount?, reason }`.

**7. Business rules / validation in frontend**

```131:134:LSIMS-Frontend/src/pages/staff/lims-extensions/finance/finance-discounts-section.tsx
                if (!requestJob.trim() || requestReason.trim().length < 3) {
                  toast.error("Job ID and reason are required.");
                  return;
```

- Percentage sent only for `discount_type === "percentage"`; amount for `fixed_amount`; both null for `free_test`.

---

### `PATCH /api/laboratory/discount-approvals/{id}/`

**1. Called in frontend?** No — `patchDiscountApproval` never imported. Backend `http_method_names` = `["get", "post", "head", "options"]` — **405**.

---

### `DELETE /api/laboratory/discount-approvals/{id}/`

**1. Called in frontend?** No — `deleteDiscountApproval` never imported. **405** on backend.

---

### `POST /api/laboratory/discount-approvals/{id}/approve/`

**1. Called in frontend?** Yes — `finance-discounts-section.tsx` when `canApproveDiscountApproval`.

**3. Frontend-expected types**

Request: `{ review_note?: string }`. Response: `DiscountApproval` with `status: "approved"`.

**7. Business rules**

- Only `pending` → `approved` on backend.
- `free_test` approval sets `payment_required=False` on linked `FinancialRecord` and waiver metadata (clears payment gate without mark-paid).

```563:579:LSIMS-Backend/LSIMS-main/laboratory/services/workflow.py
        if discount_approval.discount_type == DiscountApproval.DiscountType.FREE_TEST:
            record, _ = FinancialRecord.objects.get_or_create(job=discount_approval.job, ...)
            record.payment_required = False
            record.waiver_reason = "Director-approved free test: " + discount_approval.reason
            record.waiver_approved_by = user
            record.waiver_approved_at = timezone.now()
            record.save()
```

---

### `POST /api/laboratory/discount-approvals/{id}/reject/`

**1. Called in frontend?** Yes — `finance-discounts-section.tsx`.

**4. Field comparison**

| Field | Verdict | Notes |
|-------|---------|-------|
| `review_note` | MISMATCH RISK | FE optional; backend **requires** non-blank on reject |

```584:587:LSIMS-Backend/LSIMS-main/laboratory/services/workflow.py
def reject_discount_approval(discount_approval, user, *, review_note):
    if not review_note.strip():
        raise WorkflowTransitionError("A rejection reason is required.")
```

---

## Part 2: Backend Logic

Routing: [LSIMS-Backend/LSIMS-main/laboratory/urls.py](LSIMS-Backend/LSIMS-main/laboratory/urls.py)

| Path | View |
|------|------|
| `financial-records/` | `FinancialRecordViewSet` (`lookup_field = "invoice_no"`) |
| `discount-approvals/` | `DiscountApprovalViewSet` |

---

### Financial records — Backend Trace

**8. Response construction**

- **Serializer:** `FinancialRecordSerializer` — waiver fields read-only; amounts validated non-negative.
- **Visibility:** `financial_records_visible_to` — clients see own jobs; admin/finance/receptionist see all.

```57:70:LSIMS-Backend/LSIMS-main/laboratory/policies.py
def financial_records_visible_to(user, queryset=None):
    if is_external_client(user):
        return queryset.filter(job__client=user)
    if get_role_name(user) in {"admin", "finance", "receptionist"}:
        return queryset
    return queryset.none()
```

**9. Error messages**

| Message/Shape | Trigger | Enforced In | FE Displays? |
|---------------|---------|-------------|--------------|
| 403 | Non finance/admin write | `check_permissions` | Yes |
| `amount_expected` / `amount_paid` negative | Validation | Serializer | Yes |
| Payment gate side effect | First transition to paid/waived | `handle_financial_record_saved` | Indirect (toast) |

**10. State machine**

| Transition | Rule |
|------------|------|
| Create | Invoice for job; default `payment_status=pending` |
| Mark-paid (PATCH) | `payment_status=paid`, `amount_paid` set; `paid_at` auto-set |
| Waiver | `payment_required=false` + `waiver_approved_at` (via discount approve or direct save — direct waiver fields read-only on API) |
| Gate cleared | `paid` OR (`payment_required=false` AND `waiver_approved_at` set) → `code_paid_job_samples` |

```116:124:LSIMS-Backend/LSIMS-main/laboratory/services/workflow.py
def financial_record_clears_payment_gate(financial_record):
    return (
        financial_record.payment_status == PAID
        or (financial_record.payment_required is False and financial_record.waiver_approved_at is not None)
    )
```

**11. Permissions**

| Action | Roles |
|--------|-------|
| GET | Admin, finance, receptionist; clients (own jobs) |
| POST/PUT/PATCH | Admin, finance |

---

### Discount approvals — Backend Trace

**8. Response construction**

- **Serializer:** `DiscountApprovalSerializer` — status/review fields read-only; type-specific validation on create.
- **Immutable after create:** `job`, `discount_type`, `percentage`, `amount` cannot PATCH.

**9. Error messages**

| Message/Shape | Trigger | Enforced In | FE Displays? |
|---------------|---------|-------------|--------------|
| Percentage 0–100 | percentage type | Serializer | Yes |
| Fixed amount > 0 | fixed_amount type | Serializer | Yes |
| Only pending can be reviewed | approve/reject | `workflow.py` | Yes |
| Rejection reason required | Empty review_note on reject | `reject_discount_approval` | Sometimes |

**10. State machine**

| Transition | Rule |
|------------|------|
| Create | `status=pending`; `requested_by` auto-set |
| approve | `pending` → `approved`; free_test applies waiver on financial record |
| reject | `pending` → `rejected`; requires review_note |

**11. Permissions**

| Action | Roles |
|--------|-------|
| GET | admin, finance, receptionist, lab_director, auditor |
| POST create | admin, finance, receptionist |
| approve/reject | admin, lab_director |
| Other writes | admin, finance (blocked for PATCH anyway) |

---

## Consolidated Tables

### Field-Level Summary

| Endpoint | Field Name | Frontend Expects | Backend Sends | Match? | Risk if Ignored |
|----------|------------|------------------|---------------|--------|-----------------|
| GET financial-records/* | `job_client_email`, `job_status` | optional | present | OK | Display |
| PATCH mark-paid | `amount_paid` | = `amount_expected` | saved as sent | OK | **High** — gate |
| PATCH mark-paid | `paid_at` | read in type | auto on save | OK | Audit |
| GET discount-approvals/* | `job_client_email` | not in type | present | MISSING FROM FE type | Low |
| POST discount reject | `review_note` | optional | required | MISMATCH | 400 |

### Backend Logic Summary

| Endpoint | Error / Rule | Trigger | Enforced In | FE Displays? |
|----------|-------------|---------|-------------|--------------|
| PATCH financial (paid) | Sample coding | Gate newly cleared | `handle_financial_record_saved` | Toast only |
| POST discount approve (free_test) | Waiver on invoice | free_test type | `approve_discount_approval` | Toast |
| POST discount reject | Rejection reason required | Empty note | workflow | Sometimes |
| DELETE financial/discount | 405 | http_method_names | ViewSet | N/A |

### Final Summary

| Endpoint | Method | Used in FE | Where | Response Match | Rule Traced | Notes |
|----------|--------|------------|-------|----------------|-------------|-------|
| `/financial-records/` | GET | Yes | Finance, job detail | Yes | Yes | Page-1 on finance page |
| `/financial-records/{invoice_no}/` | GET | No | Dead export | N/A | Yes | |
| `/financial-records/` | POST | Yes | Finance invoices | Yes | Yes | |
| `/financial-records/{invoice_no}/` | PUT | No | — | N/A | Yes | PATCH preferred |
| `/financial-records/{invoice_no}/` | PATCH | Yes | Edit + mark-paid | Yes | Yes | mark-paid sets both amounts |
| `/financial-records/{invoice_no}/` | DELETE | No | Dead | N/A | Blocked | 405 |
| `/discount-approvals/` | GET | Yes | Finance discounts | Yes | Yes | pending filter |
| `/discount-approvals/{id}/` | GET | No | Dead | N/A | Yes | |
| `/discount-approvals/` | POST | Yes | Request form | Yes | Yes | |
| `/discount-approvals/{id}/` | PATCH | No | Dead | N/A | Blocked | 405 |
| `/discount-approvals/{id}/` | DELETE | No | Dead | N/A | Blocked | 405 |
| `/discount-approvals/{id}/approve/` | POST | Yes | Director review | Yes | Yes | free_test waiver |
| `/discount-approvals/{id}/reject/` | POST | Yes | Director review | Partial | Yes | Note required |

---

## Highest-Risk Findings

1. **Mark-paid is PATCH-only** — No dedicated action; FE must send both `amount_paid` and `payment_status: paid`. Partial updates that set status without amount may underpay on record.
2. **Discount reject allows empty review note in UI** — Backend requires non-blank `review_note` (same pattern as QC reject).
3. **Waiver fields read-only on financial API** — Cannot waive via PATCH; must use discount approve (`free_test`) or admin path — FE documents this correctly on `StaffFinancePage`.
4. **Page-1 invoice list** — Jobs beyond first page of financial records missing from finance table (job detail uses `job` filter — safe).
5. **Dead exports** — `fetchFinancialRecord`, `deleteFinancialRecord`, `fetchDiscountApproval`, `patchDiscountApproval`, `deleteDiscountApproval`.
6. **Clients read-only** — External users see invoices but cannot mark-paid from staff UI (by design); verify client portal expectations.
7. **`invalidateFinanceWorkflowQueries` breadth** — Mark-paid invalidates many caches; failure mid-patch could leave stale job status in some views until refresh.

---

## Open Questions / Needs Manual Verification

- Whether partial payment (`payment_status: partial`) is used in production or only pending/paid.
- Exact job status transition when payment gate clears (tested in happy path — confirm FE job lists reflect without manual refresh).
- Whether discount `percentage` / `fixed_amount` approval should adjust `amount_expected` on invoice (currently only `free_test` mutates financial record).
- Client-facing invoice visibility — do clients need mark-paid or view-only?
- DELETE in Swagger for financial records — intentional omission from `http_method_names`?
