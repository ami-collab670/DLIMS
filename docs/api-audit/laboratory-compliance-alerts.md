# Laboratory Compliance & Alerts API Audit — `/api/laboratory/complaints/`, `/priority-alerts/`

**Audited:** July 13, 2026  
**Swagger source:** Serializer field lists and ViewSet definitions in codebase (no invented response JSON)  
**Test coverage:** [LSIMS-Backend/LSIMS-main/laboratory/tests/test_support_workflows.py](LSIMS-Backend/LSIMS-main/laboratory/tests/test_support_workflows.py) — complaint create/resolve paths

---

## Table of Contents

- [Overview](#overview)
- [Part 1: Frontend Usage](#part-1-frontend-usage)
  - [GET /api/laboratory/complaints/](#get-apilaboratorycomplaints)
  - [GET /api/laboratory/complaints/{id}/](#get-apilaboratorycomplaintsid)
  - [POST /api/laboratory/complaints/](#post-apilaboratorycomplaints)
  - [PATCH /api/laboratory/complaints/{id}/](#patch-apilaboratorycomplaintsid)
  - [DELETE /api/laboratory/complaints/{id}/](#delete-apilaboratorycomplaintsid)
  - [POST /api/laboratory/complaints/{id}/resolve/](#post-apilaboratorycomplaintsidresolve)
  - [POST /api/laboratory/complaints/{id}/reject/](#post-apilaboratorycomplaintsidreject)
  - [GET /api/laboratory/priority-alerts/](#get-apilaboratorypriority-alerts)
- [Part 2: Backend Logic](#part-2-backend-logic)
- [Consolidated Tables](#consolidated-tables)
- [Highest-Risk Findings](#highest-risk-findings)
- [Open Questions / Needs Manual Verification](#open-questions--needs-manual-verification)

---

## Overview

Complaints handle client and staff dispute logging with **resolve/reject** close actions (resolution text required). Clients create complaints against their jobs; staff (admin/receptionist/lab director) close them. **Priority alerts** are a **non-paginated** computed list of normal-priority jobs active >7 days — read-only monitoring for scheduling/dashboard roles.

This audit covers **9 HTTP operations** (6 backend-active complaints + 1 priority list; 2 dead complaint exports).

| Method | Path | Description | Used in Frontend |
|--------|------|-------------|------------------|
| GET | `/api/laboratory/complaints/` | Paginated complaint list | Yes |
| GET | `/api/laboratory/complaints/{id}/` | Complaint detail | No (dead export) |
| POST | `/api/laboratory/complaints/` | Create complaint | Yes |
| PATCH | `/api/laboratory/complaints/{id}/` | Partial update | No (dead export; **405** on backend) |
| DELETE | `/api/laboratory/complaints/{id}/` | Delete complaint | No (dead export; **405** on backend) |
| POST | `/api/laboratory/complaints/{id}/resolve/` | Resolve with resolution | Yes |
| POST | `/api/laboratory/complaints/{id}/reject/` | Reject with reason | Yes |
| GET | `/api/laboratory/priority-alerts/` | Non-paginated alert array | Yes |

---

## Part 1: Frontend Usage

Shared types — [LSIMS-Frontend/src/types/laboratory.ts](LSIMS-Frontend/src/types/laboratory.ts):

- **`ComplaintRecord`**, **`ComplaintCategory`**, **`ComplaintStatus`**
- **`PriorityAlert`**

API layers:

- [complaints-api.ts](LSIMS-Frontend/src/features/laboratory/complaints-api.ts)
- [priority-alerts-api.ts](LSIMS-Frontend/src/features/laboratory/priority-alerts-api.ts)

Pages:

- [StaffCompliancePage.tsx](LSIMS-Frontend/src/pages/staff/lims-extensions/compliance/StaffCompliancePage.tsx) — list, create, resolve/reject
- [client-job-detail-panel.tsx](LSIMS-Frontend/src/pages/client/requests/client-job-detail-panel.tsx) — client create
- [staff-dashboard-priority-alerts.tsx](LSIMS-Frontend/src/pages/staff/dashboard-home/staff-dashboard-priority-alerts.tsx) — dashboard widget
- [staff-scheduling-priority-alerts.tsx](LSIMS-Frontend/src/pages/staff/lims-extensions/scheduling/staff-scheduling-priority-alerts.tsx) — scheduling page

---

### `GET /api/laboratory/complaints/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `complaints-api.ts` | API layer | `fetchComplaints` |
| `StaffCompliancePage.tsx` | Main table | `fetchComplaints({ page: 1 })` |

**3. Frontend-expected types**

```197:214:LSIMS-Frontend/src/types/laboratory.ts
export type ComplaintRecord = {
  id: string;
  client: string;
  client_email?: string;
  job: string | null;
  sample: string | null;
  category: ComplaintCategory;
  description: string;
  status: ComplaintStatus;
  resolution: string;
  created_by: string | null;
  created_by_email?: string | null;
  resolved_by: string | null;
  resolved_by_email?: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};
```

**4. Field comparison vs. backend serializer**

| Field | Verdict | Notes |
|-------|---------|-------|
| `id`, `client`, `job`, `sample`, `category`, `description` | OK | Direct |
| `status`, `resolution`, `resolved_by`, `resolved_at` | OK | Read-only until resolve/reject |
| `client_email`, `created_by_email`, `resolved_by_email` | OK | Computed |
| Pagination wrapper | OK | `DrfPaginated<ComplaintRecord>` |

**5. Fallback/default values found**

- `rows = data?.results ?? []` for client-side table sort/search.

**6. Error handling**

- `isError` → "Could not load complaints."

**7. Business rules / validation in frontend**

- Client-side sort/search on loaded page-1 rows only (`useClientSideTableList`).
- No server-side status filter in UI despite API supporting `status` query param.

---

### `GET /api/laboratory/complaints/{id}/`

**1. Called in frontend?** No — `fetchComplaint` never imported.

---

### `POST /api/laboratory/complaints/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `StaffCompliancePage.tsx` | Staff log form | `createComplaint` |
| `client-job-detail-panel.tsx` | Client dispute | `createComplaint` |

**3. Frontend-expected types**

Request: `{ client?, job?, sample?, category?, description }`.

**4. Field comparison**

| Field | Verdict | Notes |
|-------|---------|-------|
| `description` | OK | Required in serializer |
| `client` | OK | Auto-set for external users |
| `status` | OK | Defaults `open` (read-only in response) |

**7. Business rules / validation in frontend**

Staff form:

```148:151:LSIMS-Frontend/src/pages/staff/lims-extensions/compliance/StaffCompliancePage.tsx
            if (!form.description.trim()) {
              toast.error("Description is required.");
              return;
```

Client form sends `job` from selected job context; category + description required client-side.

---

### `PATCH /api/laboratory/complaints/{id}/`

**1. Called in frontend?** No — `patchComplaint` never imported.

**2–7.** Backend `http_method_names` = `["get", "post", "head", "options"]` — **405**. Swagger documents PATCH but it is disabled.

---

### `DELETE /api/laboratory/complaints/{id}/`

**1. Called in frontend?** No — `deleteComplaint` never imported. **405** on backend.

---

### `POST /api/laboratory/complaints/{id}/resolve/`

**1. Called in frontend?** Yes — `StaffCompliancePage.tsx` via `resolveComplaint`.

**3. Frontend-expected types**

Request: `{ resolution: string }` (required in API signature). Response: `ComplaintRecord` with `status: "resolved"`.

**4. Field comparison**

| Field | Verdict | Notes |
|-------|---------|-------|
| `resolution` | OK | Maps to `ComplaintResolveSerializer.resolution` |
| `status` | OK | Set to `resolved` |
| `resolved_by`, `resolved_at` | OK | Set by workflow |

**7. Business rules / validation in frontend**

- Resolution textarea required implicitly (empty string sent if blank — backend rejects).

```483:486:LSIMS-Backend/LSIMS-main/laboratory/services/workflow.py
def resolve_complaint(complaint, user, *, resolution):
    if not resolution.strip():
        raise WorkflowTransitionError("A resolution is required.")
```

---

### `POST /api/laboratory/complaints/{id}/reject/`

**1. Called in frontend?** Yes — `StaffCompliancePage.tsx` via `rejectComplaint`.

**3. Frontend-expected types**

Same payload as resolve: `{ resolution: string }` — used as rejection reason. Response: `status: "rejected"`.

**4. Field comparison**

| Field | Verdict | Notes |
|-------|---------|-------|
| `resolution` (reject reason) | OK | Same serializer field name for both actions |

```509:512:LSIMS-Backend/LSIMS-main/laboratory/services/workflow.py
def reject_complaint(complaint, user, *, resolution):
    if not resolution.strip():
        raise WorkflowTransitionError("A rejection reason is required.")
```

**7. Business rules**

- Closed complaints (`resolved`/`rejected`) cannot be changed again.

---

### `GET /api/laboratory/priority-alerts/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `priority-alerts-api.ts` | API layer | `fetchPriorityAlerts` |
| `staff-dashboard-priority-alerts.tsx` | Dashboard widget | `fetchPriorityAlerts` |
| `staff-scheduling-priority-alerts.tsx` | Scheduling section | `fetchPriorityAlerts` |

**3. Frontend-expected types**

**Non-paginated** `PriorityAlert[]` (plain array, not `DrfPaginated`):

```232:239:LSIMS-Frontend/src/types/laboratory.ts
export type PriorityAlert = {
  job: string;
  priority: string;
  current_status: string;
  age_days: number;
  sample_count: number;
  reason: string;
};
```

```6:8:LSIMS-Frontend/src/features/laboratory/priority-alerts-api.ts
export async function fetchPriorityAlerts(): Promise<PriorityAlert[]> {
  const { data } = await apiClient.get<PriorityAlert[]>(BASE);
  return data;
```

**4. Field comparison vs. backend serializer**

| Field | Verdict | Notes |
|-------|---------|-------|
| `job`, `priority`, `current_status`, `age_days`, `sample_count`, `reason` | OK | Match `PriorityAlertSerializer` |
| Pagination | OK | None — `ViewSet.list` returns raw array |

**5. Fallback/default values found**

- Dashboard: `data: alerts = []`; returns `null` component on error (silent).
- Scheduling: similar empty defaults.

**6. Error handling**

- Dashboard: `isError` → render `null` (no error message).
- Scheduling section: loading/error states vary.

**7. Business rules / validation in frontend**

- Dashboard shows first 5 alerts; link to `/staff/scheduling`.
- Read-only — no mutations.

---

## Part 2: Backend Logic

Routing: [LSIMS-Backend/LSIMS-main/laboratory/urls.py](LSIMS-Backend/LSIMS-main/laboratory/urls.py)

| Path | View |
|------|------|
| `complaints/` | `ComplaintRecordViewSet` |
| `priority-alerts/` | `PriorityAlertViewSet` (ViewSet, list only) |

---

### Complaints — Backend Trace

**8. Response construction**

- **Serializer:** `ComplaintRecordSerializer` — ownership fields immutable after create; `created_by` auto-set.
- **Filters:** `status`, `category`, `client`, `job`, `sample`; search on description, resolution, client email.
- **Resolve/reject:** `ComplaintResolveSerializer` with required `resolution` field.

```821:857:LSIMS-Backend/LSIMS-main/laboratory/serializers.py
class ComplaintRecordSerializer(serializers.ModelSerializer):
    client_email = serializers.EmailField(source="client.email", read_only=True)
    # status, resolution, resolved_by, resolved_at read-only
    extra_kwargs = {"client": {"required": False}}
```

**9. Error messages**

| Message/Shape | Trigger | Enforced In | FE Displays? |
|---------------|---------|-------------|--------------|
| `{"status": "A resolution is required."}` | Empty resolve | `resolve_complaint` | Yes |
| `{"status": "A rejection reason is required."}` | Empty reject | `reject_complaint` | Yes |
| `{"status": "Closed complaints cannot be changed."}` | Re-close | workflow | Yes |
| `{"client": "Complaints must be associated with an external client."}` | Invalid client | Serializer | Yes |
| `{"job": "Job must belong to the complaint client."}` | Ownership | Serializer | Yes |
| 403 create | Wrong role | `check_permissions` | Yes |
| 403 resolve/reject | Wrong role | `check_permissions` | Yes |

**10. State machine**

| Transition | Rule |
|------------|------|
| Create | `status=open` |
| resolve | `open`/`in_review` → `resolved`; sets `resolution`, `resolved_by`, `resolved_at` |
| reject | → `rejected`; same resolution fields |
| Closed | `resolved` or `rejected` — no further changes |

**11. Permissions**

| Action | Roles |
|--------|-------|
| GET | Clients (own); admin, receptionist, qc_manager, lab_director, auditor |
| POST create | Clients, admin, receptionist |
| resolve/reject | admin, receptionist, lab_director |
| PATCH/DELETE | Blocked (`http_method_names`) |

```260:279:LSIMS-Backend/LSIMS-main/laboratory/policies.py
def complaint_records_visible_to(user, queryset=None):
    if is_external_client(user):
        return queryset.filter(client=user)
    if get_role_name(user) in {"admin", "receptionist", "qc_manager", "lab_director", "auditor"}:
        return queryset
    return queryset.none()
```

---

### Priority alerts — Backend Trace

**8. Response construction**

- **View:** `PriorityAlertViewSet` — only `list` implemented; no retrieve/create.
- **Logic:** Normal-priority jobs in active statuses older than 7 days.
- **Serializer:** `PriorityAlertSerializer` — computed rows, not a DB model.

```1068:1115:LSIMS-Backend/LSIMS-main/laboratory/views.py
    def list(self, request):
        # roles: admin, receptionist, qc_manager, lab_director, auditor
        active_statuses = [PENDING_FINANCE, RECEIVED, IN_PREP, IN_ANALYSIS, QC, FINANCE_HOLD]
        threshold = timezone.now() - timedelta(days=7)
        jobs = JobOrder.objects.filter(
            priority=JobOrder.Priority.NORMAL,
            current_status__in=active_statuses,
            created_at__lte=threshold,
        ).prefetch_related("samples").order_by("created_at")
        # payload: job, priority, current_status, age_days, sample_count, reason
        return Response(PriorityAlertSerializer(payload, many=True).data)
```

**9. Error messages**

| Message/Shape | Trigger | Enforced In | FE Displays? |
|---------------|---------|-------------|--------------|
| 403 | Role not allowed | `list` permission check | No (dashboard hides) |

**10. State machine** — N/A (computed snapshot).

**11. Permissions**

| Action | Roles |
|--------|-------|
| GET list | admin, receptionist, qc_manager, lab_director, auditor |

---

## Consolidated Tables

### Field-Level Summary

| Endpoint | Field Name | Frontend Expects | Backend Sends | Match? | Risk if Ignored |
|----------|------------|------------------|---------------|--------|-----------------|
| GET complaints/* | `client_email` | optional | present | OK | Table display |
| POST resolve/reject | `resolution` | string | required non-blank | OK | Close action |
| GET priority-alerts | array vs paginated | `PriorityAlert[]` | plain array | OK | **High** if client expects `results` |
| GET priority-alerts | `reason` | string | fixed template | OK | UX copy |

### Backend Logic Summary

| Endpoint | Error / Rule | Trigger | Enforced In | FE Displays? |
|----------|-------------|---------|-------------|--------------|
| POST resolve | Resolution required | Empty text | `resolve_complaint` | Yes |
| POST reject | Rejection reason required | Empty text | `reject_complaint` | Yes |
| POST resolve/reject | Closed complaints locked | status resolved/rejected | workflow | Yes |
| GET priority-alerts | 7-day normal jobs | Computed filter | `PriorityAlertViewSet.list` | N/A |
| PATCH/DELETE complaints | 405 | http_method_names | ViewSet | N/A |

### Final Summary

| Endpoint | Method | Used in FE | Where | Response Match | Rule Traced | Notes |
|----------|--------|------------|-------|----------------|-------------|-------|
| `/complaints/` | GET | Yes | StaffCompliancePage | Yes | Yes | Page-1 + client sort |
| `/complaints/{id}/` | GET | No | Dead export | N/A | Yes | |
| `/complaints/` | POST | Yes | Compliance, client job | Yes | Yes | Client auto-bound |
| `/complaints/{id}/` | PATCH | No | Dead | N/A | Blocked | 405 |
| `/complaints/{id}/` | DELETE | No | Dead | N/A | Blocked | 405 |
| `/complaints/{id}/resolve/` | POST | Yes | StaffCompliancePage | Yes | Yes | |
| `/complaints/{id}/reject/` | POST | Yes | StaffCompliancePage | Yes | Yes | |
| `/priority-alerts/` | GET | Yes | Dashboard, scheduling | Yes | Yes | Non-paginated |

---

## Highest-Risk Findings

1. **Priority alerts silently fail on dashboard** — `isError` returns `null` with no user feedback.
2. **Complaints list page-1 only** — Client-side search/sort does not paginate; older complaints invisible.
3. **PATCH/DELETE complaint exports are dead and blocked** — API layer suggests capabilities that do not exist.
4. **Resolve/reject share `resolution` field name** — Correct in API but easy to confuse in UI copy (labeled "resolution" for both).
5. **QC manager can list complaints but cannot resolve** — May expect lab director powers on compliance page.
6. **Priority alert criteria fixed** — Only `normal` priority, 7-day threshold; urgent/high jobs never alert.
7. **No `in_review` transition in API** — Status exists on model but no dedicated action; stays `open` until resolve/reject.

---

## Open Questions / Needs Manual Verification

- Whether staff compliance page should filter `status=open` server-side.
- If dashboard should show error state when priority-alerts 403 (wrong role).
- Whether clients should see complaint resolve/reject outcomes in client portal (read-only list).
- Expected volume of complaints vs page-1 truncation.
- Whether `in_review` status should be set automatically on staff open or investigate action.
