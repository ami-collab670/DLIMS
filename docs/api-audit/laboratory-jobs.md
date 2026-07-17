# Laboratory Jobs API Audit — `/api/laboratory/jobs/`

**Audited:** July 13, 2026  
**Revised:** July 16, 2026 — client self-service POST + nested `samples`; `JobOrderViewSet.create` returns `JobOrderSerializer`  
**Swagger source:** Code-traced from [LSIMS-Backend/LSIMS-main/laboratory/views.py](LSIMS-Backend/LSIMS-main/laboratory/views.py) (`JobOrderViewSet`) and [LSIMS-Backend/LSIMS-main/laboratory/serializers.py](LSIMS-Backend/LSIMS-main/laboratory/serializers.py) — no user-provided JSON fixtures  
**Test coverage:** [LSIMS-Backend/LSIMS-main/laboratory/tests/test_happy_path.py](LSIMS-Backend/LSIMS-main/laboratory/tests/test_happy_path.py), [test_permissions.py](LSIMS-Backend/LSIMS-main/laboratory/tests/test_permissions.py), [test_edge_cases.py](LSIMS-Backend/LSIMS-main/laboratory/tests/test_edge_cases.py), [test_business_logic.py](LSIMS-Backend/LSIMS-main/laboratory/tests/test_business_logic.py), [test_analysis_qc_workflow.py](LSIMS-Backend/LSIMS-main/laboratory/tests/test_analysis_qc_workflow.py). Client self-service create tests verified passing July 16, 2026.

---

## Table of Contents

- [Overview](#overview)
- [Part 1: Frontend Usage](#part-1-frontend-usage)
  - [GET /api/laboratory/jobs/](#get-apilaboratoryjobs)
  - [POST /api/laboratory/jobs/](#post-apilaboratoryjobs)
  - [GET /api/laboratory/jobs/{id}/](#get-apilaboratoryjobsid)
  - [PUT /api/laboratory/jobs/{id}/](#put-apilaboratoryjobsid)
  - [PATCH /api/laboratory/jobs/{id}/](#patch-apilaboratoryjobsid)
  - [DELETE /api/laboratory/jobs/{id}/](#delete-apilaboratoryjobsid)
  - [GET /api/laboratory/jobs/{id}/result-summary/](#get-apilaboratoryjobsidresult-summary)
- [Part 2: Backend Logic](#part-2-backend-logic)
- [Consolidated Tables](#consolidated-tables)
- [Highest-Risk Findings](#highest-risk-findings)
- [Open Questions / Needs Manual Verification](#open-questions--needs-manual-verification)

---

## Overview

The Jobs API manages client analysis requests (`JobOrder`) from finance-pending intake through laboratory workflow completion. **Receptionists** create jobs on behalf of clients (staff intake). **External clients** submit self-service requests via the same `POST` path using `ClientJobOrderCreateSerializer` (body: `{ description, priority, samples? }`). **Admin/Receptionist** can PATCH metadata and soft-cancel via DELETE. **Workflow status**, **role holds**, and **cancellation fields** are read-only on PATCH — transitions happen via finance, preparation, analysis, and QC services.

This audit covers **7 HTTP operations** on `/api/laboratory/jobs/` (including the `result-summary` action).

| Method | Path | Description | Used in Frontend |
|--------|------|-------------|------------------|
| GET | `/api/laboratory/jobs/` | Paginated job list | Yes |
| POST | `/api/laboratory/jobs/` | Create job (staff intake or client self-service) | Yes |
| GET | `/api/laboratory/jobs/{id}/` | Job detail | Yes |
| PUT | `/api/laboratory/jobs/{id}/` | Full replace | No |
| PATCH | `/api/laboratory/jobs/{id}/` | Partial metadata update | Yes |
| DELETE | `/api/laboratory/jobs/{id}/` | Soft-cancel job | Yes |
| GET | `/api/laboratory/jobs/{id}/result-summary/` | Compiled analysis result summary | Yes |

---

## Part 1: Frontend Usage

Shared types and API module:

- **`JobOrder`**, **`JobResultSummary`**, **`DrfPaginated<T>`** — [LSIMS-Frontend/src/types/laboratory.ts](LSIMS-Frontend/src/types/laboratory.ts)
- **`CreateStaffJobBody`**, **`CreateClientJobRequestBody`**, **`PatchJobBody`** — [LSIMS-Frontend/src/features/jobs/api.ts](LSIMS-Frontend/src/features/jobs/api.ts)
- **`clientJobRequestSchema`** — [LSIMS-Frontend/src/schemas/job-request.ts](LSIMS-Frontend/src/schemas/job-request.ts)

---

### `GET /api/laboratory/jobs/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/jobs/api.ts` | API layer | `fetchJobOrders` |
| `LSIMS-Frontend/src/pages/staff/laboratory/jobs/staff-jobs-section.tsx` | Staff jobs table | `fetchJobOrders` |
| `LSIMS-Frontend/src/pages/client/requests/client-requests-section.tsx` | Client requests table | `fetchJobOrders` |
| `LSIMS-Frontend/src/pages/client/dashboard-home/ClientDashboardHome.tsx` | Client dashboard | `fetchJobOrders({ page: 1, is_cancelled: false })` |
| `LSIMS-Frontend/src/pages/client/results/ClientResultsPage.tsx` | Results context | `fetchJobOrders` |
| `LSIMS-Frontend/src/pages/staff/dashboard-home/staff-dashboard-stats-grid.tsx` | Stats | `fetchJobOrders({ page: 1 })` |
| `LSIMS-Frontend/src/pages/staff/dashboard-home/staff-dashboard-recent-jobs.tsx` | Recent jobs | `fetchJobOrders({ page: 1 })` |
| `LSIMS-Frontend/src/pages/staff/dashboard-home/staff-dashboard-job-pipeline.tsx` | Pipeline counts | `fetchJobOrders` (per status) |
| `LSIMS-Frontend/src/pages/staff/dashboard-home/staff-dashboard-attention-queue.tsx` | Attention queue | `fetchJobOrders({ current_status: "submitted" })` |
| `LSIMS-Frontend/src/pages/staff/lims-extensions/finance/finance-invoices-section.tsx` | Finance job pickers | `fetchJobOrders` (pending_finance + legacy submitted) |
| `LSIMS-Frontend/src/pages/staff/lims-extensions/qc/StaffQcPage.tsx` | QC job filter | `fetchJobOrders` |
| `LSIMS-Frontend/src/pages/staff/lims-extensions/reports/StaffReportsPage.tsx` | Reports | `fetchJobOrders` |
| `LSIMS-Frontend/src/pages/staff/lims-extensions/scheduling/StaffSchedulingPage.tsx` | Scheduling | `fetchJobOrders` |
| `LSIMS-Frontend/src/pages/staff/samples/new-sample-form.tsx` | Legacy sample form job picker | `fetchJobOrders({ page: 1 })` |
| `LSIMS-Frontend/src/pages/staff/analyst/register-sample-form.tsx` | Analyst intake job picker | `fetchJobOrders({ page: 1 })` |

**3. Frontend-expected types**

```typescript
// laboratory.ts — list item shape
export type JobOrder = {
  id: string;
  client: string;           // typed as client email
  client_name: string;
  submitted_by: string;     // typed as submitter email
  current_status: JobOrderStatus;
  status_reason: string;
  blocked_by_role: string | null;
  is_cancelled: boolean;
  cancellation_reason: string;
  priority: JobPriority;
  description: string;
  sample_count: number;
  created_at: string;
  updated_at: string;
};

// api.ts — query params
export type JobOrderListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  current_status?: string;
  priority?: string;
  is_cancelled?: boolean;
  ordering?: string;  // e.g. `-created_at`, `client__email`, `sample_count`
};
```

**4. Field comparison vs. real response JSON**

Backend list uses `JobOrderSerializer` on paginated queryset. No user-provided JSON — fields inferred from serializer + tests.

| Field | Verdict | Notes |
|-------|---------|-------|
| `count` | OK | Pagination |
| `next` | OK | UNUSED BY FRONTEND (most callers) |
| `previous` | OK | UNUSED BY FRONTEND |
| `results[].id` | OK | UUID string |
| `results[].client` | **MISMATCH** | FE types as email; serializer FK defaults to **UUID pk** — unclear - needs manual check |
| `results[].client_email` | MISSING FROM FRONTEND type | Backend sends read-only email — FE ignores, uses `client` instead |
| `results[].client_name` | OK | `SerializerMethodField` — used in staff table |
| `results[].submitted_by` | **MISMATCH** | FE types as email; backend FK likely **UUID** — unclear - needs manual check |
| `results[].submitted_by_email` | MISSING FROM FRONTEND type | Backend sends — UNUSED BY FRONTEND |
| `results[].current_status` | OK | Badge components |
| `results[].status_reason` | OK | Detail panels (when non-empty) |
| `results[].blocked_by_role` | OK | Role UUID; resolved to label in staff detail via `fetchRoles` |
| `results[].is_cancelled` | OK | Staff table "Cancelled" label |
| `results[].cancellation_reason` | OK | Staff detail (read-only display) |
| `results[].priority` | OK | Badge components |
| `results[].description` | OK | Search target on backend |
| `results[].sample_count` | OK | `SerializerMethodField` count |
| `results[].created_at` | OK | Table date column |
| `results[].updated_at` | OK | Client detail "Last updated" |

**5. Fallback/default values found**

- Staff/client tables: `listData?.results` with empty-state UI when length 0.
- Finance `fetchAwaitingFinanceJobs` merges `pending_finance` + legacy `submitted` page-1 only.
- Dashboard widgets fetch `page: 1` only — jobs beyond page 1 invisible in pickers/stats.

**6. Error handling**

- `StaffJobsSection` / `ClientRequestsSection`: `isError` + `getApiErrorMessage` on list query.
- Dashboard/finance pickers: mostly silent or generic empty states on failure.

**7. Business rules / validation in frontend**

Staff list sends server-side filters and sort:

```62:72:LSIMS-Frontend/src/pages/staff/laboratory/jobs/staff-jobs-section.tsx
  const listParams = useMemo(() => {
    const p: Parameters<typeof fetchJobOrders>[0] = {
      page,
      page_size: pageSize,
      ordering: toOrderingParam(sort),
    };
    if (debouncedSearch) p.search = debouncedSearch;
    if (statusFilter) p.current_status = statusFilter;
    if (priorityFilter) p.priority = priorityFilter;
    return p;
  }, [page, pageSize, debouncedSearch, statusFilter, priorityFilter, sort]);
```

Sort keys include `client__email` and `sample_count` ([job-order-list-sort.ts](LSIMS-Frontend/src/features/jobs/job-order-list-sort.ts)) — backend has **no `OrderingFilter`** in `DEFAULT_FILTER_BACKENDS` (settings.py); `ordering` param likely **ignored**.

Client list defaults to active jobs only:

```73:74:LSIMS-Frontend/src/pages/client/requests/client-requests-section.tsx
    if (cancelledFilter === "active") p.is_cancelled = false;
    if (cancelledFilter === "cancelled") p.is_cancelled = true;
```

---

### `POST /api/laboratory/jobs/`

**1. Called in frontend?** Yes (two distinct flows)

**2. Call sites**

| File | Component/Context | Function(s) | Body shape |
|------|-------------------|-------------|------------|
| `LSIMS-Frontend/src/features/jobs/api.ts` | API layer | `createStaffJob`, `createClientJobRequest` | Staff vs client |
| `LSIMS-Frontend/src/pages/staff/laboratory/jobs/staff-job-intake-form.tsx` | `StaffJobIntakeForm` | `createStaffJob` | Receptionist intake |
| `LSIMS-Frontend/src/features/jobs/client-new-job-request-form.tsx` | `ClientNewJobRequestForm` | `createClientJobRequest` | Client self-service wizard |
| `LSIMS-Frontend/src/pages/client/requests/ClientRequestsPage.tsx` | Page shell | via `ClientNewJobRequestForm` | Client self-service |

**3. Frontend-expected types**

**Staff intake (receptionist):**

```typescript
export type CreateStaffJobBody = {
  client: string;  // comment: "Client account email (API accepts legacy user UUID as well)"
  current_status?: "pending_finance" | "received";
  priority: string;
  description: string;
};
```

**Client self-service:**

```typescript
export type CreateClientJobRequestBody = {
  description: string;
  priority: string;
  samples?: CreateClientJobRequestSample[];  // optional pre-registered sample rows
};
```

**4. Field comparison vs. real POST JSON**

| Field | Staff FE sends | Client FE sends | Backend serializer | Verdict |
|-------|----------------|-----------------|-------------------|---------|
| `client` | Client **email** from picker | Omitted (self) | `JobOrderCreateSerializer` — required FK (`PrimaryKeyRelatedField` — UUID in tests) | **MISMATCH (staff only)** — FE sends email; `UserIdentityField` exists in accounts but **not wired** to job serializers |
| `current_status` | `"pending_finance"` (optional) | Omitted | Staff: `setdefault` → `pending_finance` in `JobOrderCreateSerializer.create`; client: always `pending_finance` in `ClientJobOrderCreateSerializer` | OK (July 16, 2026) |
| `priority` | `"normal"` / `"urgent"` | same | Model choices `normal`, `urgent` (tests reject `critical`) | OK |
| `description` | Trimmed text (min 3 chars client-side) | Rich wizard text (min 10 via zod) | Both serializers accept `TextField` — no min length in serializer | OK |
| `samples` | Not sent | Array of `{ sample_name, notes?, packaging_type? }` | `ClientJobOrderCreateSerializer.samples` — nested `ClientJobSampleIntakeSerializer` | OK (July 16, 2026) |
| Response `sample_count` | Not read on create | Not read on create | `JobOrderViewSet.create` returns **`JobOrderSerializer`** (includes `sample_count`) | OK — tests assert; FE ignores on create |

**5. Fallback/default values found**

- Staff intake: `priority` defaults `"normal"`; `current_status` always `"pending_finance"`.
- Client wizard: `priority` defaults `"normal"` via react-hook-form; samples built from wizard state.

**6. Error handling**

- Both flows: `onError: toast.error(getApiErrorMessage(e))` on mutation.

**7. Business rules / validation in frontend**

**Staff intake** — client email as FK value, description min 3 chars:

```47:56:LSIMS-Frontend/src/pages/staff/laboratory/jobs/staff-job-intake-form.tsx
        if (!clientEmail || description.trim().length < 3) {
          toast.error("Select a client and enter a description.");
          return;
        }
        mut.mutate({
          client: clientEmail,
          current_status: "pending_finance",
          priority,
          description: description.trim(),
        });
```

Client picker uses email as `<option value>` (same pattern as accounts clients picker):

```78:80:LSIMS-Frontend/src/pages/staff/laboratory/jobs/staff-job-intake-form.tsx
            {clients.map((c) => (
              <option key={c.id} value={c.email}>
                {c.email} — {c.first_name} {c.last_name}
```

**Client self-service** — zod schema + wizard validation; builds long structured `description` and optional `samples` payload:

```446:455:LSIMS-Frontend/src/features/jobs/client-new-job-request-form.tsx
    const parsed = clientJobRequestSchema.safeParse({
      description,
      priority,
      samples: samplesPayload,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid request.");
      return;
    }
    mutate(parsed.data);
```

`clientJobRequestSchema` requires description ≥ 10 chars; samples optional (max 50); priority enum `normal` | `urgent`.

---

### `GET /api/laboratory/jobs/{id}/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/jobs/api.ts` | API layer | `fetchJobOrder` |
| `LSIMS-Frontend/src/pages/staff/laboratory/jobs/staff-jobs-section.tsx` | Detail panel loader | `fetchJobOrder` |
| `LSIMS-Frontend/src/pages/client/requests/client-requests-section.tsx` | Client detail loader | `fetchJobOrder` |

**3. Frontend-expected types**

Single `JobOrder` (same as list row).

**4. Field comparison**

Same table as list `results[]` — all `JobOrderSerializer` fields. Staff detail reads: `id`, `client`, `client_name`, `current_status`, `status_reason`, `sample_count`, `blocked_by_role`, `cancellation_reason`, `priority`, `description`, `is_cancelled`. Client detail reads subset (no blocked_by_role editing).

**5. Fallback/default values found**

- Both sections fall back to **list row** when detail fetch pending: `displayJob = detailJob ?? listData?.results.find(...)`.
- Detail fetch failure: staff shows "Could not load job."; client similar.

**6. Error handling**

- `isError` on detail query surfaced in panel shell; list-row fallback may mask stale data.

**7. Business rules / validation in frontend**

- Job opened via `?job=<uuid>` search param on staff and client pages.

---

### `PUT /api/laboratory/jobs/{id}/`

**1. Called in frontend?** No

**2. Call sites** — None. Updates use `patchJobOrder` only.

**3–7.** N/A — endpoint not wired in frontend. Backend exposes PUT via `ModelViewSet` with `JobOrderSerializer` (same read-only PATCH fields apply).

---

### `PATCH /api/laboratory/jobs/{id}/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/jobs/api.ts` | API layer | `patchJobOrder` |
| `LSIMS-Frontend/src/pages/staff/laboratory/jobs/staff-job-detail-panel.tsx` | `StaffJobDetailPanel` | `patchJobOrder` |

**3. Frontend-expected types**

```typescript
export type PatchJobBody = Partial<{
  client: string;
  current_status: string;
  status_reason: string;
  blocked_by_role: string | null;
  priority: string;
  description: string;
  is_cancelled: boolean;
  cancellation_reason: string;
}>;
```

**4. Field comparison**

| Field | FE sends | Backend writable | Verdict |
|-------|----------|------------------|---------|
| `priority` | Yes | Yes | OK |
| `description` | Yes | Yes | OK |
| `client` | Not sent from UI | Yes (FK) | UNUSED BY FRONTEND |
| `current_status` | Not sent | **read_only** | OK — UI documents read-only |
| `status_reason` | Not sent | **read_only** | OK |
| `blocked_by_role` | Not sent | **read_only** | OK |
| `is_cancelled` | Not sent | **read_only** | OK — cancel uses DELETE |
| `cancellation_reason` | Not sent | **read_only** | OK |

```211:221:LSIMS-Backend/LSIMS-main/laboratory/serializers.py
        read_only_fields = [
            "id",
            "submitted_by",
            "current_status",
            "status_reason",
            "blocked_by_role",
            "is_cancelled",
            "cancellation_reason",
            "created_at",
            "updated_at",
        ]
```

**5. Fallback/default values found**

- Panel local state initialized from `job.priority` / `job.description` on `job` change.

**6. Error handling**

- `onError: toast.error(getApiErrorMessage(e))` on patch mutation.

**7. Business rules / validation in frontend**

Staff detail **only patches priority + description**; explicitly avoids workflow/cancel fields:

```157:160:LSIMS-Frontend/src/pages/staff/laboratory/jobs/staff-job-detail-panel.tsx
          <p className="text-xs text-muted-foreground">
            Workflow status, role holds, and cancellation reason are read-only on PATCH. Finance
            clears jobs via invoices; cancel uses DELETE only.
          </p>
```

```57:62:LSIMS-Frontend/src/pages/staff/laboratory/jobs/staff-job-detail-panel.tsx
  const patchMut = useMutation({
    mutationFn: () =>
      patchJobOrder(job.id, {
        priority,
        description: desc,
      }),
```

`manageJobs` gate from `canManageJobsAndSamples` — admin/receptionist/superuser only ([StaffLaboratoryPage.tsx](LSIMS-Frontend/src/pages/staff/laboratory/StaffLaboratoryPage.tsx)).

---

### `DELETE /api/laboratory/jobs/{id}/`

**1. Called in frontend?** Yes (soft-cancel)

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/jobs/api.ts` | API layer | `softCancelJobOrder`, `cancelJobOrder` |
| `LSIMS-Frontend/src/pages/staff/laboratory/jobs/staff-job-detail-panel.tsx` | Cancel confirm | `cancelJobOrder` |

**3. Frontend-expected types**

`void` — no response body parsed. `CancelJobOrderOptions.cancellation_reason` exists but **not sent** (documented in API comment).

**4. Field comparison**

| Aspect | Verdict | Notes |
|--------|---------|-------|
| Response body | OK (empty) | Backend returns **204 No Content** per happy-path test |
| `cancellation_reason` on DELETE | N/A | FE `_options` ignored; backend `perform_destroy` only sets `is_cancelled=True` |

**5. Fallback/default values found**

- None.

**6. Error handling**

- `onError: toast.error(getApiErrorMessage(e))`.

**7. Business rules / validation in frontend**

- Two-step confirm UI; no reason field (matches read-only `cancellation_reason` on PATCH):

```205:207:LSIMS-Frontend/src/pages/staff/laboratory/jobs/staff-job-detail-panel.tsx
              <p className="text-sm">
                Soft-cancel this job via DELETE? Cancellation reason cannot be sent on PATCH.
              </p>
```

---

### `GET /api/laboratory/jobs/{id}/result-summary/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/jobs/api.ts` | API layer | `fetchJobResultSummary` |
| `LSIMS-Frontend/src/pages/staff/lims-extensions/results/StaffResultsPage.tsx` | Job lookup widget | `fetchJobResultSummary` |

**3. Frontend-expected types**

```typescript
export type JobResultSummary = {
  job: string;
  job_status: string;
  total_tests: number;
  draft: number;
  submitted: number;
  rejected: number;
  approved: number;
  results: AnalysisResult[];
};
```

**4. Field comparison vs. backend `ResultSummarySerializer`**

| Field | Verdict | Notes |
|-------|---------|-------|
| `job` | OK | UUID string (test assertion) |
| `job_status` | OK | Current job `current_status` |
| `total_tests` | OK | Role-dependent count logic in view |
| `draft` | OK | Count by `AnalysisResult.State` |
| `submitted` | OK | Same |
| `rejected` | OK | Same |
| `approved` | OK | Same |
| `results[]` | unclear - needs manual check | Nested `AnalysisResultSerializer` — FE displays subset on results page |

**5. Fallback/default values found**

- Query `enabled: Boolean(lookupJobId)` — no fetch until user submits job ID.

**6. Error handling**

- `isError: summaryError` on results page; `getApiErrorMessage` in places.

**7. Business rules / validation in frontend**

- Staff-only LIMS extension page; clients blocked at backend (`user_type == "external"` → 403).

---

## Part 2: Backend Logic

Routing: [LSIMS-Backend/LSIMS-main/laboratory/urls.py](LSIMS-Backend/LSIMS-main/laboratory/urls.py) — `router.register(r"jobs", JobOrderViewSet, basename="joborder")`.

| Path | View |
|------|------|
| `jobs/` | `JobOrderViewSet` (list, create) |
| `jobs/{id}/` | `JobOrderViewSet` (retrieve, update, partial_update, destroy) |
| `jobs/{id}/result-summary/` | `JobOrderViewSet.result_summary` (GET action) |

---

### `GET /api/laboratory/jobs/` — Backend Trace

**8. Response construction**

- **View:** `JobOrderViewSet` — `filterset_fields = ["current_status", "priority", "is_cancelled"]`, `search_fields = ["description"]`.
- **Serializer:** `JobOrderSerializer` (read).
- **Queryset:**

```234:247:LSIMS-Backend/LSIMS-main/laboratory/views.py
    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return JobOrder.objects.none()

        base_qs = JobOrder.objects.select_related(
            "client", "submitted_by", "blocked_by_role"
        ).prefetch_related("samples", "samples__sample_tests__test")
        return jobs_visible_to(self.request.user, base_qs)
```

- **Visibility** ([policies.py](LSIMS-Backend/LSIMS-main/laboratory/policies.py)): external clients → own jobs only; analysts/qc → department-scoped via samples; admin/receptionist/finance/others → broader access.
- **Pagination:** `PageNumberPagination`, `PAGE_SIZE=20`.
- **Computed fields:** `client_name`, `sample_count`; read-only emails `client_email`, `submitted_by_email`.

**9. Error messages**

| Message/Shape | Trigger | Enforced In | FE Displays? |
|---------------|---------|-------------|--------------|
| 401 | Unauthenticated | `IsAuthenticated` | Yes (list pages) |
| 403 | N/A for GET | — | — |

**10. State machine** — N/A (read-only list).

**11. Permissions**

| Action | Roles | Object check |
|--------|-------|--------------|
| GET list | All authenticated | `jobs_visible_to` queryset filter |

---

### `POST /api/laboratory/jobs/` — Backend Trace

**8. Response construction**

- **Serializer selection (July 16, 2026):** `get_serializer_class` returns `ClientJobOrderCreateSerializer` when `request.user.user_type == "external"`, else `JobOrderCreateSerializer` for receptionist staff intake.
- **Staff create:** `JobOrderCreateSerializer` — fields: `id`, `client`, `submitted_by`, `current_status`, `priority`, `description`. `submitted_by` auto-set; `current_status` defaults to `pending_finance` if omitted.
- **Client create:** `ClientJobOrderCreateSerializer` — fields: `description`, `priority`, optional nested `samples[]`. Sets `client`/`submitted_by` to `request.user`, `current_status=pending_finance`. Creates pre-intake `Sample` rows (`received_by=null`, `sample_status=pending_finance`).
- **Response:** `JobOrderViewSet.create` override returns **`JobOrderSerializer`** (full shape incl. `sample_count`).

**Staff vs client POST bodies:**

| Caller | Required body | Backend behavior |
|--------|---------------|------------------|
| Receptionist | `{ client, priority, description?, current_status? }` | `JobOrderCreateSerializer`; `client` as user UUID in tests |
| External client | `{ description, priority, samples? }` — no `client` field | `ClientJobOrderCreateSerializer`; 201 with `client`/`submitted_by` = self; nested `samples` create pre-intake rows |

**9. Error messages**

| Message/Shape | Trigger | Enforced In | FE Displays? |
|---------------|---------|-------------|--------------|
| `{"detail": "Only Receptionists can create job orders."}` | Non-receptionist, non-external POST (admin/finance/analyst) | `JobOrderViewSet.check_permissions` | Yes (toast) |
| `{"client": ["Self-service clients cannot use receptionist intake fields."]}` | External client sends `client` field | `ClientJobOrderCreateSerializer.validate` | Yes |
| `{"client": ["Job orders can only be created for external (client) users."]}` | Internal user as client (staff intake) | `JobOrderCreateSerializer.validate_client` | Yes |
| `{"client": ["Cannot create a job order for a deactivated user."]}` | Inactive client | same | Yes |
| `{"current_status": ["New job orders must start in the 'pending_finance' state."]}` | Wrong initial status on staff intake | `validate_current_status` | Yes |
| `{"priority": [...]}` | Invalid choice (e.g. `critical`) | Model/serializer | Yes |
| 400 invalid client UUID | Bad `client` pk | DRF FK validation | Yes |

**10. State machine**

| Transition | Rule |
|------------|------|
| (create) → `pending_finance` | Default for both staff (via `setdefault`) and client self-service |

**11. Permissions**

| Action | Roles |
|--------|-------|
| POST create (staff intake) | `receptionist` (+ superuser) |
| POST create (self-service) | `external` client users |
| POST create denied | `admin`, `finance`, `analyst`, other internal roles → 403 |

**Implementation note (July 16, 2026):** Prior drift between tests/frontend and views is **resolved**. `test_client_can_create_self_service_job_request`, `test_client_can_create_self_service_job_with_multiple_samples`, and `test_client_cannot_use_receptionist_job_intake_payload` pass against current code.

---

### `GET /api/laboratory/jobs/{id}/` — Backend Trace

**8. Response construction**

- Same `JobOrderSerializer` on `get_object()` after `jobs_visible_to` filter (404 if not visible).

**9. Error messages**

| Message/Shape | Trigger | Enforced In | FE Displays? |
|---------------|---------|-------------|--------------|
| 404 | Not found or not visible | Queryset + `get_object` | Yes (detail panel) |

**10. State machine** — N/A.

**11. Permissions**

| Action | Roles |
|--------|-------|
| GET detail | All authenticated | Object via `jobs_visible_to` |

---

### `PUT /api/laboratory/jobs/{id}/` — Backend Trace

**8. Response construction**

- **Serializer:** `JobOrderSerializer` — writable: `client`, `priority`, `description` only (read-only workflow/cancel fields).
- Full PUT requires all non-read-only fields.

**9–11.** Same permission and PATCH read-only rules as partial update. Not used by frontend.

---

### `PATCH /api/laboratory/jobs/{id}/` — Backend Trace

**8. Response construction**

- **Serializer:** `JobOrderSerializer` partial update.
- **Read-only on PATCH (silently ignored):** `current_status`, `status_reason`, `blocked_by_role`, `is_cancelled`, `cancellation_reason` — confirmed by test:

```44:62:LSIMS-Backend/LSIMS-main/laboratory/tests/test_edge_cases.py
    def test_generic_job_patch_cannot_change_workflow_status(self):
        job = self._create_job_order(client_user=self.client_user)
        client = self.get_authenticated_client("admin_lab@ministry.gov", "AdminPass123!")

        response = client.patch(
            reverse("joborder-detail", args=[job.id]),
            {
                "current_status": JobOrder.Status.COMPLETED,
                "status_reason": "Attempted direct workflow jump.",
                "description": "Allowed metadata update.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        job.refresh_from_db()
        self.assertEqual(job.current_status, JobOrder.Status.PENDING_FINANCE)
        self.assertEqual(job.status_reason, "")
        self.assertEqual(job.description, "Allowed metadata update.")
```

- **`client` field:** default FK field — email write would fail unless `UserIdentityField` added; unclear - needs manual check.

**9. Error messages**

| Message/Shape | Trigger | Enforced In | FE Displays? |
|---------------|---------|-------------|--------------|
| `{"detail": "Only Admin or Receptionist can modify job orders."}` | Non-admin/receptionist PATCH | `check_permissions` | Yes |
| 403 client PATCH | External client | test_permissions | N/A (FE has no client PATCH) |

**10. State machine**

Workflow transitions are **not** available via job PATCH. Status changes occur through:

- `transition_job()` in [services/workflow.py](LSIMS-Backend/LSIMS-main/laboratory/services/workflow.py) — e.g. finance payment → `received`, prep → `in_prep`, analysis → `in_analysis`, QC → `qc`/`completed`.
- `VALID_JOB_TRANSITIONS` map (pending_finance→received, received→in_prep, in_prep→in_analysis, in_analysis→qc, qc→in_analysis|completed).
- Job `post_save` signal syncs sample statuses and sends client notifications ([signals.py](LSIMS-Backend/LSIMS-main/laboratory/signals.py)).

| PATCH attempt | Result |
|---------------|--------|
| `current_status` | Ignored (stays prior) |
| `blocked_by_role` | Ignored |
| `is_cancelled` / `cancellation_reason` | Ignored — use DELETE |
| `priority`, `description`, `client` | Applied if permitted |

**11. Permissions**

| Action | Roles |
|--------|-------|
| PATCH | Admin, receptionist (+ superuser) |
| PATCH | Client → 403 (tested) |

---

### `DELETE /api/laboratory/jobs/{id}/` — Backend Trace

**8. Response construction**

- **Soft cancel** — not a hard delete:

```275:278:LSIMS-Backend/LSIMS-main/laboratory/views.py
    def perform_destroy(self, instance):
        instance.is_cancelled = True
        instance.save(update_fields=["is_cancelled"])
```

- Returns **204 No Content** (happy-path test). `cancellation_reason` **not** set.

**9. Error messages**

| Message/Shape | Trigger | Enforced In | FE Displays? |
|---------------|---------|-------------|--------------|
| `{"detail": "Only Admin or Receptionist can modify job orders."}` | Wrong role | `check_permissions` | Yes |

**10. State machine**

| Transition | Rule |
|------------|------|
| Active → cancelled | `is_cancelled=True` via DELETE only |
| Cancelled → active | No API path traced |

**11. Permissions**

| Action | Roles |
|--------|-------|
| DELETE (soft-cancel) | Admin, receptionist (+ superuser) |

---

### `GET /api/laboratory/jobs/{id}/result-summary/` — Backend Trace

**8. Response construction**

- **Action:** `result_summary` on `JobOrderViewSet`.
- **Serializer:** `ResultSummarySerializer` with nested `AnalysisResultSerializer(many=True)`.
- **Payload built in view** — counts by result state; `total_tests` uses all `SampleTest` count for non-analyst roles, else visible results count.

```286:323:LSIMS-Backend/LSIMS-main/laboratory/views.py
    def result_summary(self, request, pk=None):
        role_name = getattr(request.user, "role_name", None)
        if getattr(request.user, "user_type", None) == "external":
            self.permission_denied(
                request,
                message="Client-facing result release is not available in this workflow step.",
            )

        job = self.get_object()
        results_qs = analysis_results_visible_to(
            request.user,
            AnalysisResult.objects.filter(sample_test__sample__job=job).select_related(
                "sample_test",
                "sample_test__sample",
                "sample_test__test",
                "analyst",
            ),
        )
        # ... counts ...
        serializer = ResultSummarySerializer(payload, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)
```

**9. Error messages**

| Message/Shape | Trigger | Enforced In | FE Displays? |
|---------------|---------|-------------|--------------|
| `{"detail": "Client-facing result release is not available in this workflow step."}` | External client | `result_summary` | No client UI |
| 404 | Job not visible | `get_object` | Yes |

**10. State machine** — N/A (read-only aggregate).

**11. Permissions**

| Action | Roles |
|--------|-------|
| GET result-summary | Internal roles (not external clients) | Job must pass `jobs_visible_to` |

---

## Consolidated Tables

### Field-Level Summary (all endpoints)

| Endpoint | Field Name | Frontend Expects | Backend Sends | Computed or Direct? | Match? | Risk if Ignored |
|----------|------------|------------------|---------------|---------------------|--------|-----------------|
| GET jobs/* | `id` | string UUID | UUID | Direct | OK | Keys, routing |
| GET jobs/* | `client` | email string | UUID pk (likely) | Direct FK | **MISMATCH** | Wrong client display if `client_name` empty |
| GET jobs/* | `client_email` | not in type | email | Direct | MISSING FROM FE | Low if `client` fixed |
| GET jobs/* | `client_name` | string | string | Computed | OK | Table display |
| GET jobs/* | `submitted_by` | email string | UUID pk (likely) | Direct FK | **MISMATCH** | Low (mostly unused) |
| GET jobs/* | `submitted_by_email` | not in type | email | Direct | MISSING FROM FE | Low |
| GET jobs/* | `current_status` | enum | same | Direct | OK | Workflow UI |
| GET jobs/* | `status_reason` | string | string | Direct | OK | Hold explanations |
| GET jobs/* | `blocked_by_role` | string\|null | Role UUID | Direct FK | OK | Resolved via roles API |
| GET jobs/* | `is_cancelled` | boolean | boolean | Direct | OK | Cancelled badge |
| GET jobs/* | `cancellation_reason` | string | string | Direct | OK | Display only |
| GET jobs/* | `priority` | enum | enum | Direct | OK | Badges + PATCH |
| GET jobs/* | `description` | string | string | Direct | OK | Search |
| GET jobs/* | `sample_count` | number | number | Computed | OK | Table column |
| GET jobs/* | `created_at` / `updated_at` | ISO string | datetime | Direct | OK | Sort/display |
| POST jobs/ (staff) | `client` | email | UUID FK expected | Write FK | **MISMATCH** | **High** — intake 400 |
| POST jobs/ (client) | `samples` | array | `ClientJobOrderCreateSerializer.samples` | Nested create | OK | Pre-intake sample rows (July 16, 2026) |
| PATCH jobs/{id} | workflow fields | in type, not sent | read_only | Serializer | OK | Correct FE discipline |
| DELETE jobs/{id} | body | void | 204 empty | View | OK | — |
| GET result-summary | counts + results | typed | typed | Mixed | unclear | QC/results UI |

### Backend Logic Summary

| Endpoint | Error Message / Rule | Triggering Condition | Enforced In | Frontend Displays It? |
|----------|---------------------|----------------------|-------------|----------------------|
| POST jobs/ | Only Receptionists can create job orders | Non-receptionist, non-external create | `JobOrderViewSet.check_permissions` | Yes |
| POST jobs/ | Self-service clients cannot use receptionist intake fields | External client sends `client` | `ClientJobOrderCreateSerializer.validate` | Yes |
| POST jobs/ | Job orders can only be created for external users | Internal `client` | `JobOrderCreateSerializer` | Yes |
| POST jobs/ | Cannot create for deactivated user | inactive client | same | Yes |
| POST jobs/ | Must start in pending_finance | wrong `current_status` | `validate_current_status` | Yes |
| POST jobs/ | priority invalid (e.g. critical removed) | bad priority | model/serializer | Yes |
| PATCH jobs/{id} | Only Admin or Receptionist can modify | wrong role | `check_permissions` | Yes |
| PATCH jobs/{id} | Workflow fields silently ignored | `current_status` etc. | `read_only_fields` | N/A (FE doesn't send) |
| DELETE jobs/{id} | Soft cancel only | DELETE | `perform_destroy` | Yes |
| GET result-summary | Client-facing result release not available | external user | `result_summary` | N/A |
| GET jobs/ | Queryset scoped by role | all reads | `jobs_visible_to` | Partial (404/empty) |

### Final Summary

| Endpoint | Method | Used in Frontend | Where Used | Response Match | Backend Rule Traced | Notes |
|----------|--------|------------------|------------|----------------|---------------------|-------|
| `/api/laboratory/jobs/` | GET | Yes | Staff/client tables, dashboards, finance, LIMS | Partial | Yes | `ordering` likely ignored; page-1 only in widgets |
| `/api/laboratory/jobs/` | POST (staff) | Yes | `StaffJobIntakeForm` | Partial | Yes | Email `client`; receptionist-only |
| `/api/laboratory/jobs/` | POST (client) | Yes | `ClientNewJobRequestForm` | Yes | Yes | `ClientJobOrderCreateSerializer`; nested `samples`; 201 → `JobOrderSerializer` |
| `/api/laboratory/jobs/{id}/` | GET | Yes | Staff + client detail panels | Partial | Yes | List-row fallback on detail fail |
| `/api/laboratory/jobs/{id}/` | PUT | No | — | N/A | Yes | PATCH used |
| `/api/laboratory/jobs/{id}/` | PATCH | Yes | `StaffJobDetailPanel` | Yes | Yes | Only priority + description |
| `/api/laboratory/jobs/{id}/` | DELETE | Yes | Staff cancel confirm | Yes | Yes | 204; no cancellation_reason |
| `/api/laboratory/jobs/{id}/result-summary/` | GET | Yes | `StaffResultsPage` | unclear | Yes | Clients 403 |

---

## Highest-Risk Findings

1. ~~**Client self-service POST blocked by view permissions**~~ — **Resolved July 16, 2026:** external clients can POST via `ClientJobOrderCreateSerializer`.
2. ~~**Nested `samples` on client POST not in serializer**~~ — **Resolved July 16, 2026:** nested intake samples created with `received_by=null`.
3. **Staff intake sends client email, backend FK expects UUID** — `UserIdentityField` exists in [accounts/fields.py](LSIMS-Backend/LSIMS-main/accounts/fields.py) but is **not** used on `JobOrder` serializers; receptionist intake may 400 on `client` unless manual check proves otherwise.
4. **`client` / `submitted_by` read shape mismatch** — Frontend `JobOrder` types both as email strings; serializer exposes separate `*_email` fields and FK pks on `client`/`submitted_by`. UI uses `client_name \|\| client` — may show UUID.
5. **PATCH workflow/cancel fields correctly read-only** — Aligns with FE, but `PatchJobBody` still lists writable `is_cancelled` / `current_status` — dead type surface; cancellation via DELETE sets no `cancellation_reason`.
6. **`ordering` query param sent, not supported** — Staff/client tables send `ordering` (incl. `sample_count`, `client__email`); `DEFAULT_FILTER_BACKENDS` lacks `OrderingFilter` — sort UI may not affect server results.
7. **Dashboard/finance job pickers page-1 only** — Jobs beyond first page missing from finance invoice picker and dashboard stats.
8. **External clients cannot use result-summary** — Backend 403; no client results summary UI (by design for now).

---

## Open Questions / Needs Manual Verification

- Real JSON: does `client` on GET return UUID or email? Compare live response to `client_email` field.
- Does staff intake with `client: "<email>"` succeed or 400 without `UserIdentityField` on `JobOrderCreateSerializer`?
- Does `ordering=sample_count` or `client__email` silently fail or error on list endpoint?
- Should DELETE soft-cancel accept `cancellation_reason` (model help_text says required when cancelled)?
- Whether `submitted` status filter in finance/dashboard is legacy-only or still created by any path.
- Live `result-summary` nested `results[]` field set vs frontend `AnalysisResult` type.
- Confirm external superuser PATCH behavior in production (edge-case test allows unowned job PATCH).
