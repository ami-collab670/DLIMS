# Laboratory Samples API Audit — `/api/laboratory/samples/`, `/sample-tests/`, `/preparation-records/`

**Audited:** July 13, 2026  
**Swagger source:** Code-traced from [LSIMS-Backend/LSIMS-main/laboratory/views.py](LSIMS-Backend/LSIMS-main/laboratory/views.py) and [LSIMS-Backend/LSIMS-main/laboratory/serializers.py](LSIMS-Backend/LSIMS-main/laboratory/serializers.py) — no user-provided JSON fixtures  
**Test coverage:** No dedicated backend API audit suite (unlike accounts); laboratory has workflow tests ([test_preparation_workflow.py](LSIMS-Backend/LSIMS-main/laboratory/tests/test_preparation_workflow.py), [test_blind_analysis.py](LSIMS-Backend/LSIMS-main/laboratory/tests/test_blind_analysis.py), [test_business_logic.py](LSIMS-Backend/LSIMS-main/laboratory/tests/test_business_logic.py)) but not comprehensive endpoint-by-endpoint coverage

---

## Table of Contents

- [Overview](#overview)
- [Part 1: Frontend Usage](#part-1-frontend-usage)
  - [Samples](#samples)
    - [GET /api/laboratory/samples/](#get-apilaboratorysamples)
    - [POST /api/laboratory/samples/](#post-apilaboratorysamples)
    - [GET /api/laboratory/samples/{id}/](#get-apilaboratorysamplesid)
    - [PUT /api/laboratory/samples/{id}/](#put-apilaboratorysamplesid)
    - [PATCH /api/laboratory/samples/{id}/](#patch-apilaboratorysamplesid)
    - [DELETE /api/laboratory/samples/{id}/](#delete-apilaboratorysamplesid)
    - [POST /api/laboratory/samples/{id}/assign-analyst/](#post-apilaboratorysamplesidassign-analyst)
  - [Sample Tests](#sample-tests)
    - [GET /api/laboratory/sample-tests/](#get-apilaboratorysample-tests)
    - [POST /api/laboratory/sample-tests/](#post-apilaboratorysample-tests)
    - [GET /api/laboratory/sample-tests/{id}/](#get-apilaboratorysample-testsid)
    - [PUT /api/laboratory/sample-tests/{id}/](#put-apilaboratorysample-testsid)
    - [PATCH /api/laboratory/sample-tests/{id}/](#patch-apilaboratorysample-testsid)
    - [DELETE /api/laboratory/sample-tests/{id}/](#delete-apilaboratorysample-testsid)
  - [Preparation Records](#preparation-records)
    - [GET /api/laboratory/preparation-records/](#get-apilaboratorypreparation-records)
    - [POST /api/laboratory/preparation-records/](#post-apilaboratorypreparation-records)
    - [GET /api/laboratory/preparation-records/{id}/](#get-apilaboratorypreparation-recordsid)
    - [PUT /api/laboratory/preparation-records/{id}/](#put-apilaboratorypreparation-recordsid)
    - [PATCH /api/laboratory/preparation-records/{id}/](#patch-apilaboratorypreparation-recordsid)
    - [DELETE /api/laboratory/preparation-records/{id}/](#delete-apilaboratorypreparation-recordsid)
    - [POST /api/laboratory/preparation-records/{id}/start/](#post-apilaboratorypreparation-recordsidstart)
    - [POST /api/laboratory/preparation-records/{id}/complete/](#post-apilaboratorypreparation-recordsidcomplete)
- [Part 2: Backend Logic](#part-2-backend-logic)
- [Consolidated Tables](#consolidated-tables)
- [Highest-Risk Findings](#highest-risk-findings)
- [Open Questions / Needs Manual Verification](#open-questions--needs-manual-verification)

---

## Overview

Three related resource areas under `/api/laboratory/`:

1. **Samples** — intake, blind-analysis read paths, analyst assignment, hard delete.
2. **Sample tests** — link catalog tests to samples (create/delete only; no update).
3. **Preparation records** — post-payment prep workflow with `start` / `complete` actions.

This audit covers **21 HTTP operations** (7 samples + 6 sample-tests + 8 preparation-records). Some preparation and sample-test update methods are registered on the router but **blocked** by `http_method_names`.

| Method | Path | Description | Used in Frontend |
|--------|------|-------------|------------------|
| GET | `/api/laboratory/samples/` | Paginated sample list | Yes |
| POST | `/api/laboratory/samples/` | Register sample (receptionist) | Yes |
| GET | `/api/laboratory/samples/{id}/` | Sample detail | Yes |
| PUT | `/api/laboratory/samples/{id}/` | Full replace | No |
| PATCH | `/api/laboratory/samples/{id}/` | Partial update | Yes |
| DELETE | `/api/laboratory/samples/{id}/` | Hard delete | Yes |
| POST | `/api/laboratory/samples/{id}/assign-analyst/` | Assign/reassign analyst | Yes |
| GET | `/api/laboratory/sample-tests/` | Paginated test assignments | Yes |
| POST | `/api/laboratory/sample-tests/` | Assign test to sample | Yes |
| GET | `/api/laboratory/sample-tests/{id}/` | Assignment detail | No (dead export) |
| PUT | `/api/laboratory/sample-tests/{id}/` | Full replace | No (**405** — disabled) |
| PATCH | `/api/laboratory/sample-tests/{id}/` | Partial update | No (**405** — disabled) |
| DELETE | `/api/laboratory/sample-tests/{id}/` | Remove assignment | Yes |
| GET | `/api/laboratory/preparation-records/` | Paginated prep records | Yes |
| POST | `/api/laboratory/preparation-records/` | Create prep record | Yes |
| GET | `/api/laboratory/preparation-records/{id}/` | Prep detail | No (dead export) |
| PUT | `/api/laboratory/preparation-records/{id}/` | Full replace | No (**405** — disabled) |
| PATCH | `/api/laboratory/preparation-records/{id}/` | Partial update | No (dead export; **405**) |
| DELETE | `/api/laboratory/preparation-records/{id}/` | Delete prep record | No (dead export; **405**) |
| POST | `/api/laboratory/preparation-records/{id}/start/` | Start preparation | Yes |
| POST | `/api/laboratory/preparation-records/{id}/complete/` | Complete preparation | Yes |

---

## Part 1: Frontend Usage

Shared types:

- **`SampleRecord`**, **`SampleTestRow`**, **`PreparationRecord`**, **`DrfPaginated<T>`** — [LSIMS-Frontend/src/types/laboratory.ts](LSIMS-Frontend/src/types/laboratory.ts)
- **`SampleCreateResponse`** — [LSIMS-Frontend/src/types/api-responses.ts](LSIMS-Frontend/src/types/api-responses.ts)

API modules:

- [LSIMS-Frontend/src/features/laboratory/staff-api.ts](LSIMS-Frontend/src/features/laboratory/staff-api.ts) — samples, sample-tests, assign-analyst
- [LSIMS-Frontend/src/features/laboratory/preparation-records-api.ts](LSIMS-Frontend/src/features/laboratory/preparation-records-api.ts) — preparation workflow

---

## Samples

### `GET /api/laboratory/samples/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/laboratory/staff-api.ts` | API layer | `fetchSamples` |
| `LSIMS-Frontend/src/pages/staff/samples/staff-samples-section.tsx` | samples table | `fetchSamples` |
| `LSIMS-Frontend/src/pages/staff/analyst/staff-analyst-section.tsx` | analyst list | `fetchSamples` |
| `LSIMS-Frontend/src/pages/staff/laboratory/assignments/staff-assignments-section.tsx` | sample picker | `fetchSamples({ page: 1 })` |
| `LSIMS-Frontend/src/pages/staff/dashboard-home/staff-dashboard-stats-grid.tsx` | stats | `fetchSamples` |
| `LSIMS-Frontend/src/pages/staff/lims-extensions/results/StaffResultsPage.tsx` | results context | `fetchSamples` |
| `LSIMS-Frontend/src/pages/staff/lims-extensions/scheduling/StaffSchedulingPage.tsx` | scheduling | `fetchSamples` |

Legacy/unrouted pages under `pages/staff/samples/` still call the same APIs (`StaffSamplesPage` redirects per routes config).

**3. Frontend-expected types**

`DrfPaginated<SampleRecord>` — union shape for staff full payload vs analyst blind payload (optional fields documented in type).

**4. Field comparison vs. backend serializers**

Staff read uses `SampleSerializer`:

```304:330:LSIMS-Backend/LSIMS-main/laboratory/serializers.py
        fields = [
            "id",
            "job",
            "job_status",
            "blind_alias",
            "blind_alias_code",
            "sample_code",
            "sample_name",
            ...
            "assigned_analyst",
            "assigned_analyst_email",
            ...
            "sample_tests",
            ...
        ]
```

Analyst read uses `SampleAnalystSerializer` (blind):

```1107:1122:LSIMS-Backend/LSIMS-main/laboratory/serializers.py
        fields = [
            "id",
            "blind_alias_id",
            "blind_alias_code",
            "sample_weight",
            "packaging_type",
            "collection_date",
            "sample_status",
            "assigned_at",
            "sample_tests",
            "notes",
            "created_at",
            "updated_at",
        ]
```

| Field | Verdict | Notes |
|-------|---------|-------|
| `id`, `sample_code`, `blind_alias_code` | OK | List label / display |
| `sample_name`, `job`, `submitted_by` | OK staff / **MISSING analyst** | Blind protocol |
| `assigned_analyst` | **MISMATCH** | Backend FK → **UUID**; FE type says email; picker uses email |
| `assigned_analyst_email` | OK staff | Backend sends; FE type omits dedicated field |
| `status_sync_with_job` | **MISSING backend read** | In FE `SampleRecord` type but not in `SampleSerializer` fields |
| `sample_tests` | OK | Nested `SampleTestRow[]`; embedded on list/detail |
| `received_by` | OK | UUID FK; FE typed as email\|null |

**5. Fallback/default values found**

- `rowLabel()` falls back to `blind_alias_code` then `"—"`.
- Assignment picker: page 1 only.

**6. Error handling**

- List queries: `isError` + message in samples/analyst sections.
- Dashboard: count falls back to `"—"`.

**7. Business rules / validation in frontend**

- Filters: `job`, `sample_status`, `search` query params.
- Client-side sort on current page in samples section.
- Analyst list scoped automatically by backend queryset (assigned samples only).

---

### `POST /api/laboratory/samples/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/laboratory/staff-api.ts` | API layer | `createSample` |
| `LSIMS-Frontend/src/pages/staff/samples/new-sample-form.tsx` | intake form | `createSample` |
| `LSIMS-Frontend/src/pages/staff/analyst/register-sample-form.tsx` | analyst hub intake | `createSample` |

**3. Frontend-expected types**

```103:118:LSIMS-Frontend/src/features/laboratory/staff-api.ts
export type CreateSampleBody = {
  job: string;
  sample_name: string;
  /** Client account email (API accepts legacy user UUID as well). */
  submitted_by: string;
  /** Lab analyst email, or omit (API accepts legacy user UUID as well). */
  assigned_analyst?: string | null;
  ...
};
```

Response: `SampleCreateResponse` in api-responses.ts.

**4. Field comparison**

Backend `SampleCreateSerializer` — FK fields `submitted_by`, `assigned_analyst` are standard `PrimaryKeyRelatedField` (UUID):

```362:378:LSIMS-Backend/LSIMS-main/laboratory/serializers.py
        fields = [
            "id",
            "job",
            ...
            "submitted_by",
            "assigned_analyst",
            "sample_status",
            "notes",
        ]
```

| Field | Verdict | Notes |
|-------|---------|-------|
| `submitted_by` | **RISK** | FE sends `selectedJob.client` (typed as email); backend tests use UUID strings |
| `assigned_analyst` | **RISK** | FE sends analyst **email** from picker; backend expects user PK |
| `sample_code`, `blind_alias_code` | OK read-only | Null until payment gate |
| `status_sync_with_job` | **MISSING** | In FE response type but not in create serializer fields |

**5. Fallback/default values found**

- Optional fields omitted when empty strings.
- `submitted_by` derived from selected job's `client` field.

**6. Error handling**

- Mutation errors toasted via `getApiErrorMessage`.

**7. Business rules / validation in frontend**

Analyst picker uses email as value:

```114:117:LSIMS-Frontend/src/pages/staff/samples/new-sample-form.tsx
            {analysts.map((a) => (
              <option key={a.id} value={a.email}>
                {a.email}
              </option>
```

Backend validation (create):

```394:414:LSIMS-Backend/LSIMS-main/laboratory/serializers.py
        if submitted_by.user_type != "external":
            raise serializers.ValidationError(
                {"submitted_by": "Samples must be submitted by an external client."}
            )
        ...
            _validate_assigned_analyst(assigned_analyst)
```

---

### `GET /api/laboratory/samples/{id}/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/laboratory/staff-api.ts` | API layer | `fetchSample` |
| `LSIMS-Frontend/src/pages/staff/samples/staff-samples-section.tsx` | detail panel | `fetchSample(selectedId)` |
| `LSIMS-Frontend/src/pages/staff/analyst/staff-analyst-section.tsx` | analyst detail | `fetchSample(selectedId)` |

**3–4.** Same `SampleRecord` vs serializer split as list (staff vs analyst blind).

**5–7.**

- Detail panel re-syncs form state on `sample` prop change.
- `isBlindView` derived from missing `sample_code` + presence of `blind_alias_code`.

---

### `PUT /api/laboratory/samples/{id}/`

**1. Called in frontend?** No — PATCH used.

**2–7.** N/A

---

### `PATCH /api/laboratory/samples/{id}/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/laboratory/staff-api.ts` | API layer | `patchSample` |
| `LSIMS-Frontend/src/pages/staff/samples/sample-detail-panel.tsx` | save fields | `patchSample` |
| `LSIMS-Frontend/src/pages/staff/analyst/analyst-sample-detail-panel.tsx` | save fields | `patchSample` |

**3. Frontend-expected types**

`patchSample` type includes fields **beyond** backend writable set:

```130:144:LSIMS-Frontend/src/features/laboratory/staff-api.ts
  body: Partial<{
    sample_name: string;
    sample_weight: string | null;
    packaging_type: string;
    collection_date: string | null;
    assigned_analyst: string | null;
    assigned_at: string | null;
    reassigned_reason: string;
    status_sync_with_job: boolean;
    sample_status: string;
    notes: string;
  }>,
```

**4. Field comparison**

Backend `SampleUpdateSerializer` whitelists only:

```434:442:LSIMS-Backend/LSIMS-main/laboratory/serializers.py
        fields = [
            "sample_name",
            "sample_weight",
            "packaging_type",
            "collection_date",
            "notes",
        ]
```

| Field | Verdict | Notes |
|-------|---------|-------|
| `sample_name`, `sample_weight`, `packaging_type`, `collection_date`, `notes` | OK | Actually PATCHed from UI |
| `assigned_at` | **IGNORED** | UI sends via PATCH; not in update serializer |
| `assigned_analyst`, `reassigned_reason` | **IGNORED on PATCH** | Separate assign-analyst action used in UI |
| `status_sync_with_job`, `sample_status` | **IGNORED** | Not in update serializer |

**5–7.**

- Detail panel PATCH omits analyst fields (uses assign endpoint separately).
- `assigned_at` formatted to ISO from datetime-local input — silently dropped by backend.

---

### `DELETE /api/laboratory/samples/{id}/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/laboratory/staff-api.ts` | API layer | `deleteSampleHard` |
| `LSIMS-Frontend/src/pages/staff/samples/sample-detail-panel.tsx` | delete button | `deleteSampleHard` |
| `LSIMS-Frontend/src/pages/staff/analyst/analyst-sample-detail-panel.tsx` | delete button | `deleteSampleHard` |

**3–7.**

- Hard delete (not soft cancel) per backend docstring.
- Confirm dialog before mutate.
- Receptionist/admin permission enforced server-side.

---

### `POST /api/laboratory/samples/{id}/assign-analyst/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/laboratory/staff-api.ts` | API layer | `assignSampleAnalyst` |
| `LSIMS-Frontend/src/pages/staff/samples/sample-detail-panel.tsx` | assign button | `assignSampleAnalyst` |
| `LSIMS-Frontend/src/pages/staff/analyst/analyst-sample-detail-panel.tsx` | assign button | `assignSampleAnalyst` |

**3. Frontend-expected types**

```typescript
{ assigned_analyst: string; reassigned_reason?: string }
```

Response typed as full `SampleRecord`.

**4. Field comparison**

Backend uses **UUID PrimaryKeyRelatedField**:

```445:455:LSIMS-Backend/LSIMS-main/laboratory/serializers.py
class SampleAssignAnalystSerializer(serializers.ModelSerializer):
    assigned_analyst = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(is_active=True)
    )
    class Meta:
        model = Sample
        fields = ["assigned_analyst", "assigned_at", "reassigned_reason"]
        read_only_fields = ["assigned_at"]
```

| Field | Verdict | Notes |
|-------|---------|-------|
| `assigned_analyst` | **HIGH RISK** | FE sends **email**; backend expects user UUID |
| `reassigned_reason` | OK | Optional string |
| Response | OK | View re-serializes with `SampleSerializer` (staff shape) |

**5–7.**

UI state seeds analyst select from `sample.assigned_analyst` (UUID if backend returned FK) but options use **email** values — selected option may not match after load.

Assign mutation:

```118:123:LSIMS-Frontend/src/pages/staff/samples/sample-detail-panel.tsx
      assignSampleAnalyst(sample.id, {
        assigned_analyst: analystId,
        reassigned_reason: reassignedReason.trim() || undefined,
      }),
```

Backend tests use UUID:

```146:146:LSIMS-Backend/LSIMS-main/laboratory/tests/test_department_isolation.py
                "assigned_analyst": str(self.analyst_user.id),
```

---

## Sample Tests

### `GET /api/laboratory/sample-tests/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/laboratory/staff-api.ts` | API layer | `fetchSampleTests` |
| `LSIMS-Frontend/src/pages/staff/laboratory/assignments/staff-assignments-section.tsx` | assignments table | `fetchSampleTests({ page })` |
| `LSIMS-Frontend/src/pages/staff/lims-extensions/results/StaffResultsPage.tsx` | results linkage | `fetchSampleTests({ page: 1 })` |

**3. Frontend-expected types**

```typescript
export type SampleTestRow = {
  id: string;
  sample: string;
  test: string;
  test_name: string;
  test_code: string;
  created_at: string;
};
```

**4. Field comparison**

Matches `SampleTestSerializer`:

```87:90:LSIMS-Backend/LSIMS-main/laboratory/serializers.py
        fields = ["id", "sample", "test", "test_name", "test_code", "created_at"]
```

All fields OK; `test_name`/`test_code` computed from related `TestCatalog`.

**5–7.**

- Pagination manual in assignments section.
- Filters `sample`, `test` supported in API but rarely used from UI.

---

### `POST /api/laboratory/sample-tests/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/laboratory/staff-api.ts` | API layer | `assignTestToSample` |
| `LSIMS-Frontend/src/pages/staff/laboratory/assignments/staff-assignments-section.tsx` | assign form | `assignTestToSample` |
| `LSIMS-Frontend/src/pages/staff/samples/sample-detail-panel.tsx` | inline assign | `assignTestToSample` |
| `LSIMS-Frontend/src/pages/staff/analyst/analyst-sample-detail-panel.tsx` | inline assign | `assignTestToSample` |

**3–4.**

Body `{ sample: UUID, test: UUID }` — pickers correctly use sample/test **id** values.

Backend duplicate guard:

```105:112:LSIMS-Backend/LSIMS-main/laboratory/serializers.py
        if SampleTest.objects.filter(sample=sample, test=test).exists():
            raise serializers.ValidationError(
                {"test": "This test is already assigned to this sample."}
            )
        if not test.is_active:
            raise serializers.ValidationError(
                {"test": "Cannot assign an inactive test."}
            )
```

**5–7.**

- Admin/receptionist only (`manage` flag in UI).
- Errors toasted on mutation failure.

---

### `GET /api/laboratory/sample-tests/{id}/`

**1. Called in frontend?** No

**2. Call sites**

| File | Status |
|------|--------|
| `LSIMS-Frontend/src/features/laboratory/staff-api.ts` | `fetchSampleTest` defined, **never imported** |

**3–7.** N/A — dead export.

---

### `PUT /api/laboratory/sample-tests/{id}/`

**1. Called in frontend?** No

**2. Backend note:** `http_method_names` excludes PUT — returns **405 Method Not Allowed**.

```1136:1137:LSIMS-Backend/LSIMS-main/laboratory/views.py
    # Disable PUT/PATCH — test assignments are create-or-delete, not editable
    http_method_names = ["get", "post", "delete", "head", "options"]
```

**3–7.** N/A

---

### `PATCH /api/laboratory/sample-tests/{id}/`

**1. Called in frontend?** No — same **405** as PUT.

**2–7.** N/A

---

### `DELETE /api/laboratory/sample-tests/{id}/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/laboratory/staff-api.ts` | API layer | `removeSampleTestAssignment` |
| `LSIMS-Frontend/src/pages/staff/laboratory/assignments/staff-assignments-section.tsx` | remove button | `removeSampleTestAssignment` |
| `LSIMS-Frontend/src/pages/staff/samples/sample-detail-panel.tsx` | remove inline | `removeSampleTestAssignment` |
| `LSIMS-Frontend/src/pages/staff/analyst/analyst-sample-detail-panel.tsx` | remove inline | `removeSampleTestAssignment` |

**3–7.**

- Confirm dialog in assignments section.
- Hard delete assignment row.

---

## Preparation Records

### `GET /api/laboratory/preparation-records/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/laboratory/preparation-records-api.ts` | API layer | `fetchPreparationRecords` |
| `LSIMS-Frontend/src/pages/staff/analyst/analyst-preparation-section.tsx` | prep bench table | `fetchPreparationRecords({ page: 1 })` |

**3. Frontend-expected types**

`PreparationRecord` in laboratory.ts — matches `PreparationRecordSerializer` field names including computed `sample_code`, `job`, `*_email` fields.

**4. Field comparison**

| Field | Verdict | Notes |
|-------|---------|-------|
| `status` | OK | Drives Start/Complete buttons |
| `reference_code`, `sample_code` | OK | Display |
| `technician_email` | OK | Display |
| `preparation_data` | OK | UNUSED in UI (complete sends notes only) |

**5–7.**

- Page 1 only in analyst section.
- Generic error message on fetch failure.

---

### `POST /api/laboratory/preparation-records/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/laboratory/preparation-records-api.ts` | API layer | `createPreparationRecord` |
| `LSIMS-Frontend/src/pages/staff/samples/sample-detail-panel.tsx` | create prep button | `createPreparationRecord({ sample: sample.id })` |

**3–4.**

Body `{ sample, technician?, notes? }`. UI sends sample UUID only.

Backend gates:

```551:559:LSIMS-Backend/LSIMS-main/laboratory/serializers.py
        if value.sample_code is None or value.blind_alias_id is None:
            raise serializers.ValidationError(
                "Only paid and permanently coded samples can enter preparation."
            )
        if not value.sample_tests.exists():
            raise serializers.ValidationError(
                "Sample must have at least one assigned test before preparation."
            )
```

Sample has **OneToOne** prep record — second POST likely fails at DB level.

**5–7.**

- Triggered from sample detail when manage=true.
- Invalidates `preparation-records` query key on success.

---

### `GET /api/laboratory/preparation-records/{id}/`

**1. Called in frontend?** No — `fetchPreparationRecord` never imported.

**2–7.** N/A — dead export.

---

### `PUT /api/laboratory/preparation-records/{id}/`

**1. Called in frontend?** No

**2. Backend:** `http_method_names = ["get", "post", "head", "options"]` — **405**.

**3–7.** N/A

---

### `PATCH /api/laboratory/preparation-records/{id}/`

**1. Called in frontend?** No — `patchPreparationRecord` exported but **never imported**; backend returns **405**.

**2–7.** N/A — dead export + disabled route.

---

### `DELETE /api/laboratory/preparation-records/{id}/`

**1. Called in frontend?** No — `deletePreparationRecord` never imported; backend **405**.

**2–7.** N/A — dead export + disabled route.

---

### `POST /api/laboratory/preparation-records/{id}/start/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/laboratory/preparation-records-api.ts` | API layer | `startPreparationRecord` |
| `LSIMS-Frontend/src/pages/staff/analyst/analyst-preparation-section.tsx` | Start button | `startPreparationRecord(id)` |

**3–4.**

Empty POST body. Response `PreparationRecord`.

**5–7.**

- Shown only when `r.status === "pending"`.
- Errors toasted via `getApiErrorMessage`.

---

### `POST /api/laboratory/preparation-records/{id}/complete/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/laboratory/preparation-records-api.ts` | API layer | `completePreparationRecord` |
| `LSIMS-Frontend/src/pages/staff/analyst/analyst-preparation-section.tsx` | Complete dialog | `completePreparationRecord(id, { notes? })` |

**3–4.**

Optional body `{ preparation_data?, notes? }` — UI sends **notes only** (no `preparation_data`).

Backend payload serializer:

```595:599:LSIMS-Backend/LSIMS-main/laboratory/serializers.py
class PreparationCompleteSerializer(serializers.Serializer):
    preparation_data = serializers.JSONField(required=False)
    notes = serializers.CharField(required=False, allow_blank=True)
```

**5–7.**

- Complete button only when `status === "in_progress"`.
- Inline dialog for notes before confirm.

---

## Part 2: Backend Logic

Routing: [LSIMS-Backend/LSIMS-main/laboratory/urls.py](LSIMS-Backend/LSIMS-main/laboratory/urls.py)

| Path | ViewSet |
|------|---------|
| `samples/` | `SampleViewSet` |
| `sample-tests/` | `SampleTestViewSet` |
| `preparation-records/` | `PreparationRecordViewSet` |

Workflow service: [LSIMS-Backend/LSIMS-main/laboratory/services/workflow.py](LSIMS-Backend/LSIMS-main/laboratory/services/workflow.py)

---

### Samples — Backend Trace

**8. Response construction**

- **Serializer switch** on read/update/create/assign:

```375:395:LSIMS-Backend/LSIMS-main/laboratory/views.py
    def get_serializer_class(self):
        if self.action == "create":
            return SampleCreateSerializer
        if self.action == "assign_analyst":
            return SampleAssignAnalystSerializer
        if self.action in ("update", "partial_update"):
            return SampleUpdateSerializer
        user = self.request.user
        role_name = getattr(user, "role_name", None)
        if role_name == "analyst":
            return SampleAnalystSerializer
        return SampleSerializer
```

- **Queryset:** `samples_visible_to` — analysts see assigned-only; clients see own jobs; qc_manager/lab_technician department-scoped.

- **`sample_tests` nested list:** filtered by `_visible_sample_tests_for_request` / department policy.

- **Assign response:** always `SampleSerializer` (full staff shape) even if caller is analyst.

**9. Error messages**

| Message/Shape | Trigger | Enforced In | FE Displays? |
|---------------|---------|-------------|--------------|
| Only Receptionists can register samples | POST create | `check_permissions` | Yes |
| Only Admin or Receptionist can modify… | PATCH/DELETE | `check_permissions` | Yes |
| Only Admin, Receptionist, or Department Manager can assign analysts | assign-analyst | `check_permissions` | Yes |
| submitted_by must match the client… | create | `SampleCreateSerializer.validate` | Yes |
| assigned_analyst must be an internal user with the analyst role | create/assign | `_validate_assigned_analyst` | Yes |
| Assigned analyst must belong to the manager's department | assign (qc_manager) | `SampleAssignAnalystSerializer.validate` | Yes |
| Invalid PK / not found | bad UUID on assign | `PrimaryKeyRelatedField` | Yes (400) |

**10. State machine**

| Transition | Rule |
|------------|------|
| New sample | `status_sync_with_job=True` default → `sample_status` mirrors job status on save |
| Payment gate | `sample_code` / blind alias assigned when finance clears |
| Prep start (via prep record) | sample → `in_prep` |
| Prep complete | sample → `in_analysis` |
| Hard delete | DELETE removes DB row |

**11. Permissions**

| Action | Roles |
|--------|-------|
| GET | Authenticated; queryset filtered by role |
| POST create | Receptionist (+ superuser via `IsReceptionist`) |
| PATCH/PUT/DELETE | Admin or receptionist |
| POST assign-analyst | Admin, receptionist, qc_manager (+ superuser) |

---

### Sample Tests — Backend Trace

**8. Response construction**

- List/retrieve: `SampleTestSerializer`; create: `SampleTestCreateSerializer`.
- Queryset: `sample_tests_visible_to`.

**9. Error messages**

| Message | Trigger | Enforced In | FE Displays? |
|---------|---------|-------------|--------------|
| This test is already assigned… | duplicate pair | `SampleTestCreateSerializer` | Yes |
| Cannot assign an inactive test | inactive catalog | same | Yes |
| Only Admin or Receptionist can manage test assignments | POST/DELETE | `check_permissions` | Yes |

**10. State machine** — N/A (link rows, not workflow states).

**11. Permissions**

| Action | Roles |
|--------|-------|
| GET | Authenticated (visibility policy) |
| POST/DELETE | Admin or receptionist |

---

### Preparation Records — Backend Trace

**8. Response construction**

- **Serializer:** `PreparationRecordSerializer` for list/retrieve/create/start/complete responses.
- **HTTP methods restricted:**

```483:483:LSIMS-Backend/LSIMS-main/laboratory/views.py
    http_method_names = ["get", "post", "head", "options"]
```

- **`reference_code`:** auto-generated on model default.
- **Create:** sets `created_by=request.user` in `perform_create`.

**9. Error messages**

| Message/Shape | Trigger | Enforced In | FE Displays? |
|---------------|---------|-------------|--------------|
| Only paid and permanently coded samples… | create | `PreparationRecordSerializer.validate_sample` | Yes |
| Sample must have at least one assigned test… | create | same | Yes |
| `{"status": "Only pending preparation can be started."}` | bad start transition | `start_preparation` → `ValidationError` | Yes |
| `{"status": "Only in-progress preparation can be completed."}` | bad complete | `complete_preparation` | Yes |
| Only the assigned Lab Technician can complete… | wrong technician | `complete_preparation` | Yes (toast) |
| Only Admin, Lab Technician, or Department Manager… | start/complete perm | `check_permissions` | Yes |

Workflow transitions:

```161:195:LSIMS-Backend/LSIMS-main/laboratory/services/workflow.py
def start_preparation(preparation_record, user):
    if preparation_record.status != PreparationRecord.Status.PENDING:
        raise WorkflowTransitionError("Only pending preparation can be started.")
    ...
        preparation_record.status = PreparationRecord.Status.IN_PROGRESS
        sample.sample_status = Sample.SampleStatus.IN_PREP
        if job.current_status == JobOrder.Status.RECEIVED:
            transition_job(job, JobOrder.Status.IN_PREP, ...)
```

```198:256:LSIMS-Backend/LSIMS-main/laboratory/services/workflow.py
def complete_preparation(...):
    if preparation_record.status != PreparationRecord.Status.IN_PROGRESS:
        raise WorkflowTransitionError("Only in-progress preparation can be completed.")
    ...
        preparation_record.status = PreparationRecord.Status.COMPLETED
        sample.sample_status = Sample.SampleStatus.IN_ANALYSIS
        if job.current_status == JobOrder.Status.IN_PREP and _all_job_preparations_completed(job):
            transition_job(job, JobOrder.Status.IN_ANALYSIS, ...)
```

**10. State machine**

| Status | Allowed next | Side effects |
|--------|--------------|--------------|
| `pending` | `start` → `in_progress` | Sample/job → `in_prep`; auto-set technician if lab_technician |
| `in_progress` | `complete` → `completed` | Sample → `in_analysis`; job → `in_analysis` when all preps done |
| `completed` | terminal | — |

**11. Permissions**

| Action | Roles |
|--------|-------|
| GET | Authenticated (visibility policy) |
| POST create | Admin, receptionist, qc_manager |
| POST start/complete | Admin, lab_technician, qc_manager |
| PUT/PATCH/DELETE | **Not exposed** (405) |

---

## Consolidated Tables

### Field-Level Summary

| Endpoint | Field Name | Frontend Expects | Backend Sends | Match? | Risk if Ignored |
|----------|------------|------------------|---------------|--------|-----------------|
| GET samples/ (staff) | `assigned_analyst` | email (type) | UUID FK | **NO** | Analyst picker mismatch |
| GET samples/ (staff) | `assigned_analyst_email` | not typed | email | OK | Should use for display |
| GET samples/ (analyst) | identity fields | optional | omitted | OK | Blind protocol |
| PATCH samples/{id}/ | `assigned_at`, status fields | sent | ignored | **NO** | Silent data loss |
| POST assign-analyst | `assigned_analyst` | email | UUID PK required | **NO** | **400 on assign** |
| POST samples/ | `submitted_by`, `assigned_analyst` | email | UUID PK | **RISK** | Create failures |
| GET sample-tests/ | all row fields | typed | present | OK | — |
| GET prep-records/ | `status`, codes | typed | present | OK | Workflow UI |
| POST prep complete | `preparation_data` | optional | accepted | OK | UNUSED in UI |

### Backend Logic Summary

| Endpoint | Error / Rule | Trigger | Enforced In | FE Displays? |
|----------|-------------|---------|-------------|--------------|
| POST assign-analyst | PrimaryKeyRelatedField invalid | email instead of UUID | DRF | Yes |
| POST samples/ | submitted_by must be external client | staff email | `SampleCreateSerializer` | Yes |
| POST preparation-records/ | Only paid and permanently coded… | pre-payment sample | serializer | Yes |
| POST …/start/ | Only pending preparation can be started | wrong status | workflow | Yes |
| POST …/complete/ | Only in-progress… | wrong status | workflow | Yes |
| POST …/complete/ | Only assigned Lab Technician… | wrong user | workflow | Yes |
| DELETE samples/ | Hard delete | cascade FK | DB | Yes |
| PUT/PATCH sample-tests | 405 | any | `http_method_names` | N/A |
| PATCH/DELETE prep-records | 405 | any | `http_method_names` | N/A |

### Final Summary

| Endpoint | Method | Used in Frontend | Where Used | Response Match | Backend Rule Traced | Notes |
|----------|--------|------------------|------------|----------------|---------------------|-------|
| `/api/laboratory/samples/` | GET | Yes | Samples, analyst, pickers, dashboard | Partial | Yes | Blind vs staff split |
| `/api/laboratory/samples/` | POST | Yes | New/register sample forms | Partial | Yes | Email-as-FK risk |
| `/api/laboratory/samples/{id}/` | GET | Yes | Detail panels | Partial | Yes | |
| `/api/laboratory/samples/{id}/` | PUT | No | — | N/A | Yes | |
| `/api/laboratory/samples/{id}/` | PATCH | Yes | Detail panels | Partial | Yes | Extra FE fields ignored |
| `/api/laboratory/samples/{id}/` | DELETE | Yes | Detail panels | N/A | Yes | Hard delete |
| `/api/laboratory/samples/{id}/assign-analyst/` | POST | Yes | Detail panels | Partial | Yes | **Email vs UUID** |
| `/api/laboratory/sample-tests/` | GET | Yes | Assignments, results | Yes | Yes | |
| `/api/laboratory/sample-tests/` | POST | Yes | Assignments, detail panels | Yes | Yes | |
| `/api/laboratory/sample-tests/{id}/` | GET | No | Dead `fetchSampleTest` | N/A | Yes | |
| `/api/laboratory/sample-tests/{id}/` | PUT | No | 405 | N/A | Yes | |
| `/api/laboratory/sample-tests/{id}/` | PATCH | No | 405 | N/A | Yes | |
| `/api/laboratory/sample-tests/{id}/` | DELETE | Yes | Assignments, detail | N/A | Yes | |
| `/api/laboratory/preparation-records/` | GET | Yes | Analyst prep section | Yes | Yes | Page 1 only |
| `/api/laboratory/preparation-records/` | POST | Yes | Sample detail panel | Yes | Yes | Payment gate |
| `/api/laboratory/preparation-records/{id}/` | GET | No | Dead export | N/A | Yes | |
| `/api/laboratory/preparation-records/{id}/` | PUT/PATCH/DELETE | No | 405 + dead exports | N/A | Yes | |
| `/api/laboratory/preparation-records/{id}/start/` | POST | Yes | Analyst prep | Yes | Yes | State machine |
| `/api/laboratory/preparation-records/{id}/complete/` | POST | Yes | Analyst prep | Yes | Yes | Notes only in UI |

---

## Highest-Risk Findings

1. **Email-as-analyst FK in assign-analyst** — UI `<option value={a.email}>` and `assignSampleAnalyst({ assigned_analyst: analystId })`, but `SampleAssignAnalystSerializer` uses `PrimaryKeyRelatedField` (UUID). Backend tests pass UUID strings. Assign-from-UI likely **400** unless undocumented email lookup exists elsewhere.
2. **Blind vs staff serializers on samples** — Analyst role gets `SampleAnalystSerializer` (no client/name/job); staff gets full `SampleSerializer`. FE uses one `SampleRecord` type with optional fields — UI must guard (`isBlindView`), but list sort keys like `sample_name` break for analysts.
3. **Dead GET-by-id exports** — `fetchSampleTest`, `fetchPreparationRecord` never imported; list/embed data only.
4. **Preparation start/complete state machine** — Strict `pending → in_progress → completed` with job/sample status side effects; wrong-status POST returns `{"status": "<message>"}`. UI only handles via generic toast. `complete` enforces assigned technician for lab_technician role.
5. **PATCH sample field drift** — Frontend `patchSample` type and UI send `assigned_at`, status fields; `SampleUpdateSerializer` accepts only five mutable fields — silent drops.
6. **Preparation PATCH/DELETE exports vs 405 backend** — `patchPreparationRecord` / `deletePreparationRecord` exist in FE but routes disabled — misleading API surface.
7. **Create sample email FK** — Same email-vs-UUID mismatch for `submitted_by` and optional `assigned_analyst` on POST (comments claim email accepted; serializer uses standard FK).
8. **Legacy samples pages** — `StaffSamplesPage` / `NewSampleForm` / `SampleDetailPanel` under `/staff/samples` may be unrouted; active paths duplicate in analyst hub.

---

## Open Questions / Needs Manual Verification

- Whether production API accepts email strings for user FK fields on sample create/assign (FE comments vs `PrimaryKeyRelatedField` code).
- Runtime behavior when assign-analyst POST receives an email string — exact 400 JSON shape.
- Whether analyst detail panel should use `assigned_analyst_email` from staff-shaped assign response to seed picker.
- Duplicate `POST /preparation-records/` when OneToOne record already exists — error shape.
- Whether `assigned_at` PATCH from UI is intentional (needs serializer change) or dead UI field.
- If `status_sync_with_job` should appear on read responses (`SampleSerializer` omits it; FE type includes it).
- Whether legacy `/staff/samples` routes will be removed or re-linked.
- Job-order `client` field runtime shape (UUID vs email) when used as `submitted_by` on sample create.
