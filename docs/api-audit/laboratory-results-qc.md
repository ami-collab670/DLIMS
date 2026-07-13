# Laboratory Results & QC API Audit — `/api/laboratory/analysis-results/`, `/qc-decisions/`, `/calibration-records/`

**Audited:** July 13, 2026  
**Swagger source:** Serializer field lists and ViewSet definitions in codebase (no invented response JSON)  
**Test coverage:** [LSIMS-Backend/LSIMS-main/laboratory/tests/test_analysis_qc_workflow.py](LSIMS-Backend/LSIMS-main/laboratory/tests/test_analysis_qc_workflow.py) — analysis submit/approve/reject, calibration scope, QC decision history

---

## Table of Contents

- [Overview](#overview)
- [Part 1: Frontend Usage](#part-1-frontend-usage)
  - [GET /api/laboratory/analysis-results/](#get-apilaboratoryanalysis-results)
  - [GET /api/laboratory/analysis-results/{id}/](#get-apilaboratoryanalysis-resultsid)
  - [POST /api/laboratory/analysis-results/](#post-apilaboratoryanalysis-results)
  - [PATCH /api/laboratory/analysis-results/{id}/](#patch-apilaboratoryanalysis-resultsid)
  - [POST /api/laboratory/analysis-results/{id}/submit/](#post-apilaboratoryanalysis-resultsidsubmit)
  - [POST /api/laboratory/analysis-results/{id}/approve/](#post-apilaboratoryanalysis-resultsidapprove)
  - [POST /api/laboratory/analysis-results/{id}/reject/](#post-apilaboratoryanalysis-resultsidreject)
  - [DELETE /api/laboratory/analysis-results/{id}/](#delete-apilaboratoryanalysis-resultsid)
  - [GET /api/laboratory/qc-decisions/](#get-apilaboratoryqc-decisions)
  - [GET /api/laboratory/qc-decisions/{id}/](#get-apilaboratoryqc-decisionsid)
  - [GET /api/laboratory/calibration-records/](#get-apilaboratorycalibration-records)
  - [GET /api/laboratory/calibration-records/{id}/](#get-apilaboratorycalibration-recordsid)
  - [POST /api/laboratory/calibration-records/](#post-apilaboratorycalibration-records)
  - [PATCH /api/laboratory/calibration-records/{id}/](#patch-apilaboratorycalibration-recordsid)
  - [DELETE /api/laboratory/calibration-records/{id}/](#delete-apilaboratorycalibration-recordsid)
- [Part 2: Backend Logic](#part-2-backend-logic)
- [Consolidated Tables](#consolidated-tables)
- [Highest-Risk Findings](#highest-risk-findings)
- [Open Questions / Needs Manual Verification](#open-questions--needs-manual-verification)

---

## Overview

These endpoints implement the **analysis result lifecycle** (draft → submit → approve/reject), **read-only QC decision history**, and **calibration traceability** linked to results. Analysts create and edit draft/rejected results, submit for QC, and attach calibration metadata. QC managers approve or reject submitted results via custom actions; each decision is persisted as a `QCDecision` row (QC API is read-only). Job workflow advances automatically when all results are submitted (→ `qc`) or all approved (→ `completed`).

This audit covers **17 HTTP operations** (14 backend-active; 3 blocked by `http_method_names` but exported in frontend or Swagger).

| Method | Path | Description | Used in Frontend |
|--------|------|-------------|------------------|
| GET | `/api/laboratory/analysis-results/` | Paginated result list | Yes |
| GET | `/api/laboratory/analysis-results/{id}/` | Result detail | No (dead export) |
| POST | `/api/laboratory/analysis-results/` | Create draft result | Yes |
| PATCH | `/api/laboratory/analysis-results/{id}/` | Edit draft/rejected result | No (dead export) |
| POST | `/api/laboratory/analysis-results/{id}/submit/` | Submit for QC | Yes |
| POST | `/api/laboratory/analysis-results/{id}/approve/` | QC approve | Yes |
| POST | `/api/laboratory/analysis-results/{id}/reject/` | QC reject | Yes |
| DELETE | `/api/laboratory/analysis-results/{id}/` | Delete result | No (dead export; **405** on backend) |
| GET | `/api/laboratory/qc-decisions/` | Paginated QC history | Yes |
| GET | `/api/laboratory/qc-decisions/{id}/` | QC decision detail | No (dead export) |
| GET | `/api/laboratory/calibration-records/` | Paginated calibration list | Yes |
| GET | `/api/laboratory/calibration-records/{id}/` | Calibration detail | No (dead export) |
| POST | `/api/laboratory/calibration-records/` | Create calibration | Yes |
| PATCH | `/api/laboratory/calibration-records/{id}/` | Edit calibration | Yes |
| DELETE | `/api/laboratory/calibration-records/{id}/` | Delete calibration | Yes (**405** on backend) |
| PUT | `/api/laboratory/analysis-results/{id}/` | Full replace | No (**405** on backend) |
| PUT | `/api/laboratory/calibration-records/{id}/` | Full replace | No (**405** on backend) |

---

## Part 1: Frontend Usage

Shared types — [LSIMS-Frontend/src/types/laboratory.ts](LSIMS-Frontend/src/types/laboratory.ts):

- **`AnalysisResult`**, **`AnalysisResultState`** — analysis list/detail/workflow
- **`QCDecision`**, **`QCDecisionValue`** — QC history (read-only)
- **`CalibrationRecord`** — instruments page
- **`DrfPaginated<T>`** — paginated list responses

API layers:

- [LSIMS-Frontend/src/features/laboratory/analysis-results-api.ts](LSIMS-Frontend/src/features/laboratory/analysis-results-api.ts)
- [LSIMS-Frontend/src/features/laboratory/qc-decisions-api.ts](LSIMS-Frontend/src/features/laboratory/qc-decisions-api.ts)
- [LSIMS-Frontend/src/features/laboratory/calibration-records-api.ts](LSIMS-Frontend/src/features/laboratory/calibration-records-api.ts)

Pages:

- [StaffResultsPage](LSIMS-Frontend/src/pages/staff/lims-extensions/results/StaffResultsPage.tsx) — draft create/submit
- [StaffQcPage](LSIMS-Frontend/src/pages/staff/lims-extensions/qc/StaffQcPage.tsx) — approve/reject + QC history
- [StaffInstrumentsPage](LSIMS-Frontend/src/pages/staff/lims-extensions/instruments/StaffInstrumentsPage.tsx) — calibration CRUD
- [analyst-sample-detail-panel.tsx](LSIMS-Frontend/src/pages/staff/analyst/analyst-sample-detail-panel.tsx) — create + submit in one flow

---

### `GET /api/laboratory/analysis-results/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `analysis-results-api.ts` | API layer | `fetchAnalysisResults` |
| `StaffResultsPage.tsx` | Draft table | `fetchAnalysisResults({ state: "draft" })` |
| `StaffQcPage.tsx` | Submitted queue | `fetchAnalysisResults({ state: "submitted" })` |
| `StaffInstrumentsPage.tsx` | Result picker | `fetchAnalysisResults({ state: "approved" })` |

**3. Frontend-expected types**

`DrfPaginated<AnalysisResult>` with query params: `page`, `search`, `state`, `sample`, `sample_test`.

```151:172:LSIMS-Frontend/src/types/laboratory.ts
export type AnalysisResult = {
  id: string;
  sample_test: string;
  sample: string;
  sample_code: string | null;
  test: string;
  test_name: string;
  test_code: string;
  analyst: string | null;
  analyst_email: string | null;
  state: AnalysisResultState;
  value: string;
  unit: string;
  method: string;
  remarks: string;
  revision: number;
  submitted_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
};
```

**4. Field comparison vs. backend serializer**

| Field | Verdict | Notes |
|-------|---------|-------|
| `id`, `sample_test`, `state`, `value`, `unit`, `method`, `remarks`, `revision` | OK | Direct model fields |
| `sample`, `sample_code`, `test`, `test_name`, `test_code` | OK | Computed from `sample_test` relations |
| `analyst`, `analyst_email` | OK | FK + `source="analyst.email"` |
| `submitted_at`, `approved_at`, `rejected_at`, `created_at`, `updated_at` | OK | Timestamps |
| `sample` query param (FE) | MISMATCH | FE sends `sample`; backend `filterset_fields` only has `sample_test`, `state`, `analyst` — filter ignored |

**5. Fallback/default values found**

- `draftResults?.results ?? []`, `submittedRows = submittedResults?.results ?? []`, `resultOptions = approvedResults?.results ?? []`.

**6. Error handling**

- List queries generally lack `isError` UI on `StaffResultsPage` / `StaffInstrumentsPage`; `StaffQcPage` shows loading only for submitted list.

**7. Business rules / validation in frontend**

- Filter by `state` drives page sections (`draft`, `submitted`, `approved`).
- All list callers use `page: 1` only — no pagination beyond first page.

---

### `GET /api/laboratory/analysis-results/{id}/`

**1. Called in frontend?** No

**2. Call sites**

| File | Status |
|------|--------|
| `analysis-results-api.ts` | `fetchAnalysisResult` — **never imported** |

---

### `POST /api/laboratory/analysis-results/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `StaffResultsPage.tsx` | Draft form | `createAnalysisResult` |
| `analyst-sample-detail-panel.tsx` | Result entry | `createAnalysisResult` (then `submitAnalysisResult`) |

**3. Frontend-expected types**

Request body: `{ sample_test, value?, unit?, method?, remarks? }`. Response: `AnalysisResult`.

**4. Field comparison**

| Field | Verdict | Notes |
|-------|---------|-------|
| Writable on create | OK | `sample_test`, `value`, `unit`, `method`, `remarks` per serializer |
| `analyst` | OK | Auto-set for analyst role in `create()` |
| `state` | OK | Defaults `draft` (read-only in serializer) |

**5. Fallback/default values found**

- `unit` omitted when blank (`undefined`).

**6. Error handling**

- `onError: toast.error(getApiErrorMessage(e))` on both create mutations.

**7. Business rules / validation in frontend**

Client-side required fields:

```178:181:LSIMS-Frontend/src/pages/staff/lims-extensions/results/StaffResultsPage.tsx
            if (!draftSampleTest.trim() || !draftValue.trim()) {
              toast.error("Sample-test ID and value are required.");
              return;
```

Backend additionally requires completed preparation and `in_analysis` sample status (see Part 2).

---

### `PATCH /api/laboratory/analysis-results/{id}/`

**1. Called in frontend?** No

**2. Call sites**

| File | Status |
|------|--------|
| `analysis-results-api.ts` | `patchAnalysisResult` — **never imported** |

---

### `POST /api/laboratory/analysis-results/{id}/submit/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `StaffResultsPage.tsx` | Draft table | `submitAnalysisResult` |
| `analyst-sample-detail-panel.tsx` | After create | `submitAnalysisResult` |

**3. Frontend-expected types**

Request: empty body (`POST` with no payload). Response: `AnalysisResult` with `state: "submitted"`.

**4. Field comparison**

| Field | Verdict | Notes |
|-------|---------|-------|
| `state` | OK | Becomes `submitted` |
| `revision` | OK | Incremented when resubmitting from `rejected` |
| `submitted_at` | OK | Set by workflow |

**5–6.**

- Success toast; errors via `getApiErrorMessage`.
- Workflow errors returned as `{"state": "<message>"}` (see Part 2).

**7. Business rules / validation in frontend**

- No client-side pre-check for empty `value` before submit — relies on backend `WorkflowTransitionError`.

---

### `POST /api/laboratory/analysis-results/{id}/approve/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `StaffQcPage.tsx` | QC review panel | `approveAnalysisResult` |

**3. Frontend-expected types**

Request: `{ reason?: string }` (optional). Response: `AnalysisResult` with `state: "approved"`.

**4. Field comparison**

| Field | Verdict | Notes |
|-------|---------|-------|
| `reason` | OK | Maps to `QCReviewSerializer.reason` |
| Response `state` | OK | `approved` |

**5–7.**

- Reason optional on approve in UI (`qcReason.trim() || undefined`).
- Backend creates `QCDecision` with `decision: approved` (visible via qc-decisions list).

---

### `POST /api/laboratory/analysis-results/{id}/reject/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `StaffQcPage.tsx` | QC review panel | `rejectAnalysisResult` |

**3. Frontend-expected types**

Request: `{ reason?: string }`. Response: `AnalysisResult` with `state: "rejected"`.

**4. Field comparison**

| Field | Verdict | Notes |
|-------|---------|-------|
| `reason` | MISMATCH RISK | FE allows empty reason; backend **requires** non-blank rejection reason |

**5–7.**

- Same optional-reason pattern as approve — may 400 when reason empty.

```375:378:LSIMS-Backend/LSIMS-main/laboratory/services/workflow.py
def reject_analysis_result(analysis_result, user, *, reason):
    """Reject a submitted result and return the work to analysis."""
    if not reason.strip():
        raise WorkflowTransitionError("A rejection reason is required.")
```

---

### `DELETE /api/laboratory/analysis-results/{id}/`

**1. Called in frontend?** No

**2. Call sites**

| File | Status |
|------|--------|
| `analysis-results-api.ts` | `deleteAnalysisResult` — **never imported** |

**3–7.** Backend `http_method_names` excludes `delete` — endpoint returns **405** even for admin.

---

### `GET /api/laboratory/qc-decisions/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `qc-decisions-api.ts` | API layer | `fetchQCDecisions` |
| `StaffQcPage.tsx` | QC history table | `fetchQCDecisions({ page: 1 })` |

**3. Frontend-expected types**

`DrfPaginated<QCDecision>`. Params: `page`, `analysis_result`.

```187:195:LSIMS-Frontend/src/types/laboratory.ts
export type QCDecision = {
  id: string;
  analysis_result: string;
  decision: QCDecisionValue;
  reason: string;
  decided_by: string | null;
  decided_by_email: string | null;
  decided_at: string;
};
```

**4. Field comparison**

| Field | Verdict | Notes |
|-------|---------|-------|
| All fields | OK | All serializer fields read-only; match FE type |
| `decided_by_email` | OK | Present in serializer; displayed in QC history table |

**5. Fallback/default values found**

- `historyRows = qcHistory?.results ?? []`.

**6. Error handling**

- No explicit `isError` on QC history query.

**7. Business rules / validation in frontend**

- **Read-only** — no create/update/delete in FE; decisions created only via approve/reject actions on analysis results.
- Page-1 only (`LIMS_EXTENSION_PAGE_SIZE` slice for display).

---

### `GET /api/laboratory/qc-decisions/{id}/`

**1. Called in frontend?** No

**2. Call sites**

| File | Status |
|------|--------|
| `qc-decisions-api.ts` | `fetchQCDecision` — **never imported** |

---

### `GET /api/laboratory/calibration-records/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `calibration-records-api.ts` | API layer | `fetchCalibrationRecords` |
| `StaffInstrumentsPage.tsx` | Main table | `fetchCalibrationRecords({ page: 1 })` |

**3. Frontend-expected types**

`DrfPaginated<CalibrationRecord>`.

**4. Field comparison**

| Field | Verdict | Notes |
|-------|---------|-------|
| `id`, `analysis_result`, `instrument_name`, `calibration_reference`, `calibration_date`, `calibration_data`, `notes`, `recorded_by`, `created_at`, `updated_at` | OK | Match serializer |
| `recorded_by_email` | MISSING FROM FE type | Backend sends via `source="recorded_by.email"`; UNUSED BY FRONTEND |

**5–7.**

- `rows = data?.results ?? []`.
- `isError` shown on instruments page.
- Page-1 only.

---

### `GET /api/laboratory/calibration-records/{id}/`

**1. Called in frontend?** No — `fetchCalibrationRecord` never imported.

---

### `POST /api/laboratory/calibration-records/`

**1. Called in frontend?** Yes — `StaffInstrumentsPage.tsx` via `createCalibrationRecord`.

**3. Frontend-expected types**

Request: `{ analysis_result, instrument_name, calibration_reference?, calibration_date?, calibration_data?, notes? }`.

**4. Field comparison**

| Field | Verdict | Notes |
|-------|---------|-------|
| Writable fields | OK | Match serializer |
| `recorded_by` | OK | Auto-set in `create()` |

**7. Business rules / validation in frontend**

- UI requires `instrument_name` and `analysis_result`.
- **Mismatch:** picker lists **approved** results, but backend only allows calibration on **draft or rejected** results.

```737:740:LSIMS-Backend/LSIMS-main/laboratory/serializers.py
        if value.state not in {AnalysisResult.State.DRAFT, AnalysisResult.State.REJECTED}:
            raise serializers.ValidationError(
                "Calibration can only be added to draft or rejected results."
            )
```

```42:46:LSIMS-Frontend/src/pages/staff/lims-extensions/instruments/StaffInstrumentsPage.tsx
  const { data: approvedResults } = useQuery({
    queryKey: laboratoryQueryKeys.analysisResults({ state: "approved" }),
    queryFn: () => fetchAnalysisResults({ page: 1, state: "approved" }),
```

---

### `PATCH /api/laboratory/calibration-records/{id}/`

**1. Called in frontend?** Yes — `StaffInstrumentsPage.tsx` edit form via `patchCalibrationRecord`.

**4. Field comparison**

| Field | Verdict | Notes |
|-------|---------|-------|
| Patchable fields | OK | `instrument_name`, `calibration_reference`, `calibration_date`, `calibration_data`, `notes` |
| `analysis_result` | OK | Immutable after create (serializer blocks change) |

---

### `DELETE /api/laboratory/calibration-records/{id}/`

**1. Called in frontend?** Yes — `StaffInstrumentsPage.tsx` via `deleteCalibrationRecord`.

**4–7.**

- Backend `http_method_names` excludes `delete` — UI delete button will **405**.
- Confirm dialog before delete.

---

## Part 2: Backend Logic

Routing: [LSIMS-Backend/LSIMS-main/laboratory/urls.py](LSIMS-Backend/LSIMS-main/laboratory/urls.py)

| Path | View |
|------|------|
| `analysis-results/` | `AnalysisResultViewSet` |
| `qc-decisions/` | `QCDecisionViewSet` (ReadOnlyModelViewSet) |
| `calibration-records/` | `CalibrationRecordViewSet` |

---

### Analysis results — Backend Trace

**8. Response construction**

- **View:** `AnalysisResultViewSet` — `serializer_class = AnalysisResultSerializer`.
- **Queryset:** `analysis_results_visible_to()` with `select_related` / `prefetch_related` for sample, test, analyst, calibrations, qc_decisions.
- **Filters:** `state`, `sample_test`, `analyst`; search on sample code, test code, value, method.
- **Custom actions:** `submit`, `approve`, `reject` delegate to `workflow.py`.

```602:654:LSIMS-Backend/LSIMS-main/laboratory/serializers.py
class AnalysisResultSerializer(serializers.ModelSerializer):
    sample = serializers.UUIDField(source="sample_test.sample_id", read_only=True)
    sample_code = serializers.CharField(source="sample_test.sample.sample_code", read_only=True)
    test = serializers.UUIDField(source="sample_test.test_id", read_only=True)
    test_name = serializers.CharField(source="sample_test.test.test_name", read_only=True)
    test_code = serializers.CharField(source="sample_test.test.test_code", read_only=True)
    analyst_email = serializers.EmailField(source="analyst.email", read_only=True)
    # state, revision, timestamps read-only; value/unit/method/remarks writable in draft/rejected
```

**9. Error messages**

| Message/Shape | Trigger | Enforced In | FE Displays? |
|---------------|---------|-------------|--------------|
| `{"state": "Only draft or rejected analysis results can be submitted."}` | Wrong state on submit | `submit_analysis_result` | Yes (toast) |
| `{"state": "Result value is required before submission."}` | Empty value on submit | `submit_analysis_result` | Yes |
| `{"state": "Only submitted analysis results can be reviewed."}` | Approve/reject wrong state | `_decide_analysis_result` | Yes |
| `{"state": "A rejection reason is required."}` | Empty reject reason | `reject_analysis_result` | Yes (if sent) |
| `{"state": "Submitted or approved results cannot be edited."}` | PATCH locked result | `AnalysisResultSerializer.validate` | N/A (PATCH unused) |
| `{"sample_test": "Sample must complete preparation..."}` | Pre-create validation | `validate_sample_test` | Yes |
| 403 | Wrong role | `check_permissions` | Yes |

**10. State machine**

| Transition | Rule |
|------------|------|
| → `draft` | Created via POST; default state |
| `draft`/`rejected` → `submitted` | POST `submit/`; requires non-empty `value`; rejected resubmit bumps `revision` |
| `submitted` → `approved` | POST `approve/`; creates `QCDecision(approved)`; may complete sample/job |
| `submitted` → `rejected` | POST `reject/` with reason; creates `QCDecision(rejected)`; sample → `in_analysis`, job may leave `qc` |
| Edit | PATCH only while `draft` or `rejected` |
| Job side effect | All results submitted → job `in_analysis` → `qc`; all approved while in `qc` → `completed` |

```261:323:LSIMS-Backend/LSIMS-main/laboratory/services/workflow.py
def submit_analysis_result(analysis_result, user):
    if analysis_result.state not in {DRAFT, REJECTED}:
        raise WorkflowTransitionError("Only draft or rejected analysis results can be submitted.")
    if not analysis_result.value.strip():
        raise WorkflowTransitionError("Result value is required before submission.")
    # ... sets state=SUBMITTED, may transition job to QC
```

**11. Permissions**

| Action | Roles |
|--------|-------|
| GET list/detail | Authenticated internal roles per visibility policy; clients see none |
| POST/PATCH/submit | `admin`, `analyst` (assigned + department scope) |
| approve/reject | `admin`, `qc_manager` |
| destroy (blocked) | `admin` only in `check_permissions` |

```206:235:LSIMS-Backend/LSIMS-main/laboratory/policies.py
def analysis_results_visible_to(user, queryset=None):
    if is_external_client(user):
        return queryset.none()
    if role_name == "analyst":
        return queryset.filter(analyst=user, sample_test__test__department_id=department_id)
    if role_name == "qc_manager":
        return queryset.filter(sample_test__test__department_id=department_id)
```

---

### QC decisions — Backend Trace

**8. Response construction**

- **View:** `QCDecisionViewSet` — `ReadOnlyModelViewSet`; no write methods.
- **Serializer:** `QCDecisionSerializer` — all fields read-only.
- **Creation path:** `QCDecision.objects.create()` inside `_decide_analysis_result` only.

**9. Error messages** — N/A for writes (read-only API).

**10. State machine** — Append-only audit log; no transitions via QC API.

**11. Permissions**

| Action | Roles |
|--------|-------|
| GET | Same visibility as parent analysis results (`qc_decisions_visible_to`) |

---

### Calibration records — Backend Trace

**8. Response construction**

- **View:** `CalibrationRecordViewSet` — `CalibrationRecordSerializer`.
- **Filters:** `analysis_result`, `recorded_by`, `calibration_date`; search on instrument, reference, notes.
- **`recorded_by`:** auto-set on create.

**9. Error messages**

| Message/Shape | Trigger | Enforced In | FE Displays? |
|---------------|---------|-------------|--------------|
| `"Calibration can only be added to draft or rejected results."` | Wrong result state on create | `validate_analysis_result` | Yes |
| `"Calibration can only be edited while the result is draft or rejected."` | PATCH on locked result | `validate` | Yes |
| 403 | Non analyst/admin write | `check_permissions` | Yes |

**10. State machine** — Editable only while linked result is `draft` or `rejected`.

**11. Permissions**

| Action | Roles |
|--------|-------|
| GET | Derived from visible analysis results |
| POST/PATCH | `admin`, `analyst` |

---

## Consolidated Tables

### Field-Level Summary

| Endpoint | Field Name | Frontend Expects | Backend Sends | Computed or Direct? | Match? | Risk if Ignored |
|----------|------------|------------------|---------------|---------------------|--------|-----------------|
| GET analysis-results/* | `sample_code`, `test_code` | string | string | Computed | OK | Display |
| GET analysis-results/* | `analyst_email` | string\|null | string\|null | Computed | OK | QC table |
| GET analysis-results/ | `sample` filter | query param | not in filterset | — | MISMATCH | Filter ignored |
| POST submit | `state` | submitted | submitted | Workflow | OK | Job transition |
| POST reject | `reason` | optional | required non-blank | Workflow | MISMATCH | 400 on empty |
| GET qc-decisions/* | all `QCDecision` fields | typed | present | Mixed | OK | Audit trail |
| GET calibration-records/* | `recorded_by_email` | not in type | present | Computed | MISSING FROM FE type | Low |
| POST calibration | `analysis_result` state | approved (picker) | requires draft/rejected | Validation | MISMATCH | **High** — create fails |

### Backend Logic Summary

| Endpoint | Error Message / Rule | Triggering Condition | Enforced In | Frontend Displays It? |
|----------|---------------------|----------------------|-------------|----------------------|
| POST analysis-results | Preparation must be completed | Sample not ready | `validate_sample_test` | Yes |
| POST submit | Result value is required | Empty value | `submit_analysis_result` | Yes |
| POST reject | A rejection reason is required | Blank reason | `reject_analysis_result` | Sometimes (FE allows blank) |
| POST approve/reject | Only submitted results can be reviewed | Wrong state | `_decide_analysis_result` | Yes |
| PATCH analysis-results | Submitted or approved cannot be edited | Locked state | Serializer | N/A |
| POST calibration | Draft or rejected result only | Approved result selected | Serializer | Yes |
| DELETE calibration/analysis | 405 Method Not Allowed | http_method_names | ViewSet | Yes (on delete click) |
| GET qc-decisions | Read-only ViewSet | Any write | `ReadOnlyModelViewSet` | N/A |

### Final Summary

| Endpoint | Method | Used in Frontend | Where Used | Response Match | Backend Rule Traced | Notes |
|----------|--------|------------------|------------|----------------|---------------------|-------|
| `/analysis-results/` | GET | Yes | Results, QC, Instruments | Yes | Yes | `sample` filter ignored |
| `/analysis-results/{id}/` | GET | No | Dead export | N/A | Yes | |
| `/analysis-results/` | POST | Yes | Results, Analyst panel | Yes | Yes | Prep gate |
| `/analysis-results/{id}/` | PATCH | No | Dead export | N/A | Yes | |
| `/analysis-results/{id}/submit/` | POST | Yes | Results, Analyst panel | Yes | Yes | draft→submitted |
| `/analysis-results/{id}/approve/` | POST | Yes | StaffQcPage | Yes | Yes | Creates QCDecision |
| `/analysis-results/{id}/reject/` | POST | Yes | StaffQcPage | Yes | Yes | Reason required |
| `/analysis-results/{id}/` | DELETE | No | Dead export | N/A | Blocked | 405 |
| `/qc-decisions/` | GET | Yes | StaffQcPage | Yes | Yes | Read-only |
| `/qc-decisions/{id}/` | GET | No | Dead export | N/A | Yes | |
| `/calibration-records/` | GET | Yes | StaffInstrumentsPage | Yes | Yes | |
| `/calibration-records/{id}/` | GET | No | Dead export | N/A | Yes | |
| `/calibration-records/` | POST | Yes | StaffInstrumentsPage | Partial | Yes | Picker state mismatch |
| `/calibration-records/{id}/` | PATCH | Yes | StaffInstrumentsPage | Yes | Yes | |
| `/calibration-records/{id}/` | DELETE | Yes | StaffInstrumentsPage | N/A | Blocked | 405 |

---

## Highest-Risk Findings

1. **Instruments page calibration picker uses approved results** — Backend only accepts draft/rejected `analysis_result`; create will 400 for every picker option.
2. **QC reject allows empty reason in UI** — Backend requires non-blank reason; approve path is fine (optional).
3. **DELETE calibration exposed in UI but blocked on backend** — Delete button in `StaffInstrumentsPage` will fail with 405.
4. **`sample` query param on analysis list** — Frontend types/support it; backend has no matching filter (use `sample_test` or search).
5. **Page-1-only lists** — Draft, submitted, QC history, and calibration tables do not paginate; busy labs miss rows.
6. **Dead API exports** — `fetchAnalysisResult`, `patchAnalysisResult`, `deleteAnalysisResult`, `fetchQCDecision`, `fetchCalibrationRecord` — maintenance noise.
7. **QC is read-only by design** — No direct POST to `/qc-decisions/`; history depends on approve/reject actions (correct but easy to misunderstand).

---

## Open Questions / Needs Manual Verification

- Whether instruments workflow should link calibration to **draft** results (fix picker) or backend should allow post-approval calibration records.
- Exact 403 body when analyst creates result for unassigned sample (department scope).
- Whether `StaffQcPage` should require rejection reason client-side before POST.
- Default DRF `PAGE_SIZE` vs typical draft/submitted volume — when page-1 truncation affects QC operations.
- Whether `deleteCalibrationRecord` / `deleteAnalysisResult` should be removed from FE or enabled on backend.
