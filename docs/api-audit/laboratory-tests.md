# Laboratory Tests API Audit — `/api/laboratory/tests/`

**Audited:** July 13, 2026  
**Swagger source:** Code-traced from [LSIMS-Backend/LSIMS-main/laboratory/views.py](LSIMS-Backend/LSIMS-main/laboratory/views.py) and [LSIMS-Backend/LSIMS-main/laboratory/serializers.py](LSIMS-Backend/LSIMS-main/laboratory/serializers.py) — no user-provided JSON fixtures  
**Test coverage:** No dedicated backend API audit suite (unlike [LSIMS-Backend/LSIMS-main/accounts/tests.py](LSIMS-Backend/LSIMS-main/accounts/tests.py)); laboratory module has scattered workflow/permission tests but no comprehensive catalog CRUD coverage

---

## Table of Contents

- [Overview](#overview)
- [Part 1: Frontend Usage](#part-1-frontend-usage)
  - [GET /api/laboratory/tests/](#get-apilaboratorytests)
  - [POST /api/laboratory/tests/](#post-apilaboratorytests)
  - [GET /api/laboratory/tests/{id}/](#get-apilaboratorytestsid)
  - [PUT /api/laboratory/tests/{id}/](#put-apilaboratorytestsid)
  - [PATCH /api/laboratory/tests/{id}/](#patch-apilaboratorytestsid)
  - [DELETE /api/laboratory/tests/{id}/](#delete-apilaboratorytestsid)
- [Part 2: Backend Logic](#part-2-backend-logic)
- [Consolidated Tables](#consolidated-tables)
- [Highest-Risk Findings](#highest-risk-findings)
- [Open Questions / Needs Manual Verification](#open-questions--needs-manual-verification)

---

## Overview

The Test Catalog API (`TestCatalogViewSet`) manages laboratory test definitions (code, name, unit, price, department, active flag). **All authenticated users** can list/read entries subject to department visibility rules. **Writes** (create/update/delete) require admin, superuser, or department manager (`qc_manager`).

This audit covers **6 HTTP operations** on `/api/laboratory/tests/`.

| Method | Path | Description | Used in Frontend |
|--------|------|-------------|------------------|
| GET | `/api/laboratory/tests/` | Paginated test catalog list | Yes |
| POST | `/api/laboratory/tests/` | Create catalog entry | Yes |
| GET | `/api/laboratory/tests/{id}/` | Test detail | No (dead export) |
| PUT | `/api/laboratory/tests/{id}/` | Full replace | No |
| PATCH | `/api/laboratory/tests/{id}/` | Partial update (`is_active` toggle) | Yes |
| DELETE | `/api/laboratory/tests/{id}/` | Hard delete | Yes |

---

## Part 1: Frontend Usage

Shared types:

- **`TestCatalogItem`** — [LSIMS-Frontend/src/types/laboratory.ts](LSIMS-Frontend/src/types/laboratory.ts)
- **`DrfPaginated<T>`** — [LSIMS-Frontend/src/types/laboratory.ts](LSIMS-Frontend/src/types/laboratory.ts)

Primary API module: [LSIMS-Frontend/src/features/laboratory/staff-api.ts](LSIMS-Frontend/src/features/laboratory/staff-api.ts)

UI module: [LSIMS-Frontend/src/pages/staff/catalog/staff-catalog-section.tsx](LSIMS-Frontend/src/pages/staff/catalog/staff-catalog-section.tsx) + [LSIMS-Frontend/src/pages/staff/catalog/catalog-row.tsx](LSIMS-Frontend/src/pages/staff/catalog/catalog-row.tsx)

---

### `GET /api/laboratory/tests/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/laboratory/staff-api.ts` | API layer | `fetchTestCatalog` |
| `LSIMS-Frontend/src/pages/staff/catalog/staff-catalog-section.tsx` | `StaffCatalogSection` | `fetchTestCatalog` |
| `LSIMS-Frontend/src/pages/staff/catalog/catalog-row.tsx` | (via list parent) | — |
| `LSIMS-Frontend/src/pages/staff/laboratory/assignments/staff-assignments-section.tsx` | test picker | `fetchTestCatalog({ page: 1, is_active: true })` |
| `LSIMS-Frontend/src/pages/staff/samples/sample-detail-panel.tsx` | test assign picker | `fetchTestCatalog({ page: 1, is_active: true })` |
| `LSIMS-Frontend/src/pages/staff/analyst/analyst-sample-detail-panel.tsx` | test assign picker | `fetchTestCatalog({ page: 1, is_active: true })` |
| `LSIMS-Frontend/src/pages/staff/dashboard-home/staff-dashboard-stats-grid.tsx` | stats count | `fetchTestCatalog({ page: 1, is_active: true })` |
| `LSIMS-Frontend/src/pages/staff/lims-extensions/inventory/StaffInventoryPage.tsx` | inventory list | `fetchTestCatalog({ page: 1, is_active: true })` |
| `LSIMS-Frontend/src/pages/staff/lims-extensions/results/StaffResultsPage.tsx` | indirect via sample-tests | — |

Client-facing catalog uses a separate module: [LSIMS-Frontend/src/features/laboratory/test-catalog-api.ts](LSIMS-Frontend/src/features/laboratory/test-catalog-api.ts) (`fetchClientServiceCatalog`) — paginates `GET /api/laboratory/tests/` **and** `GET /api/accounts/departments/` (department names for grouping). As of July 16, 2026, department list read is allowed for all authenticated users — see [accounts.md](accounts.md).

**3. Frontend-expected types**

```typescript
// laboratory.ts
export type TestCatalogItem = {
  id: string;
  test_name: string;
  test_code: string;
  description: string;
  unit: string;
  price: string;
  department: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
```

**4. Field comparison vs. backend serializer**

Backend: `TestCatalogSerializer` — fields from model `TestCatalog`:

```36:52:LSIMS-Backend/LSIMS-main/laboratory/serializers.py
class TestCatalogSerializer(serializers.ModelSerializer):
    """Full TestCatalog serializer for Admin CRUD and read-only views."""

    class Meta:
        model = TestCatalog
        fields = [
            "id",
            "test_name",
            "test_code",
            "description",
            "unit",
            "price",
            "department",
            "is_active",
            "created_at",
            "updated_at",
        ]
```

| Field | Verdict | Notes |
|-------|---------|-------|
| `count`, `next`, `previous`, `results` | OK | Standard DRF pagination |
| `id` | OK | UUID string; keys and `<option value>` |
| `test_name`, `test_code` | OK | Display + search |
| `description` | OK | Create form only; table UNUSED |
| `unit`, `price` | OK | Table columns |
| `department` | OK | UUID FK; **displayed raw in catalog table** (not resolved to name) |
| `is_active` | OK | Checkbox in `CatalogRow` |
| `created_at`, `updated_at` | OK | UNUSED BY FRONTEND |

**5. Fallback/default values found**

- `data?.results ?? []` in `StaffCatalogSection` sort helper.
- Picker queries use page 1 only — tests beyond first page invisible in assignment/sample detail pickers.

**6. Error handling**

- `StaffCatalogSection`: `isError` + `getApiErrorMessage(error)`.
- Dashboard stats: loading spinner only; failed catalog count shows `"—"`.
- Assignment/sample pickers: no `isError` on catalog query — empty dropdown on failure.

**7. Business rules / validation in frontend**

- Client-side sort on current page only (`sortRowsClientSide`).
- Create form uppercases `test_code` before POST:

```72:74:LSIMS-Frontend/src/pages/staff/catalog/staff-catalog-section.tsx
        test_name: form.test_name.trim(),
        test_code: form.test_code.trim().toUpperCase(),
        unit: form.unit.trim(),
```

- Department picker uses **UUID** `<option value={d.id}>` (correct for FK).
- `canWrite` gated by admin/superuser/qc_manager in parent page — not enforced in API layer.

---

### `POST /api/laboratory/tests/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/laboratory/staff-api.ts` | API layer | `createTestCatalogItem` |
| `LSIMS-Frontend/src/pages/staff/catalog/staff-catalog-section.tsx` | create form | `createMut` |

**3. Frontend-expected types**

Request body (from `createTestCatalogItem`):

```typescript
{
  test_name: string;
  test_code: string;
  description?: string;
  unit: string;
  price: string;
  department?: string | null;
  is_active?: boolean;
}
```

Response typed as `TestCatalogItem` — ignored after success; list invalidated.

**4. Field comparison**

| Field | Verdict | Notes |
|-------|---------|-------|
| Writable fields | OK | Match serializer (department is optional UUID FK) |
| Response fields | OK | Same as list item shape |

**5. Fallback/default values found**

- `price: "0"`, `is_active: true` defaults in form state.
- `department: null` when picker empty.

**6. Error handling**

- Mutation `onError` → toast via `getApiErrorMessage`.
- Client-side guard: name, code, unit required before submit.

**7. Business rules / validation in frontend**

- qc_manager without department picker sees helper text that API auto-uses profile department (matches backend `perform_create`).

---

### `GET /api/laboratory/tests/{id}/`

**1. Called in frontend?** No

**2. Call sites**

| File | Status |
|------|--------|
| `LSIMS-Frontend/src/features/laboratory/staff-api.ts` | `fetchTestCatalogItem` defined, **never imported** |

**3–7.** N/A — dead export.

---

### `PUT /api/laboratory/tests/{id}/`

**1. Called in frontend?** No — PATCH used for toggling `is_active`; no full-replace export exists.

**2–7.** N/A

---

### `PATCH /api/laboratory/tests/{id}/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/laboratory/staff-api.ts` | API layer | `patchTestCatalogItem` |
| `LSIMS-Frontend/src/pages/staff/catalog/catalog-row.tsx` | active checkbox | `patchTestCatalogItem(test.id, { is_active })` |

**3. Frontend-expected types**

Partial body — runtime only sends `{ is_active: boolean }`. Type allows other catalog fields but UI never PATCHes them.

**4. Field comparison**

| Field | Verdict | Notes |
|-------|---------|-------|
| `is_active` | OK | Only field written from UI |
| Other catalog fields | N/A | Not PATCHed from frontend |

**5–7.**

- Optimistic UI via checkbox `onChange`.
- Errors toasted on mutation failure.

---

### `DELETE /api/laboratory/tests/{id}/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/laboratory/staff-api.ts` | API layer | `deleteTestCatalogItem` |
| `LSIMS-Frontend/src/pages/staff/catalog/catalog-row.tsx` | delete button | `deleteTestCatalogItem` |

**3. Frontend-expected types**

`Promise<void>` — empty body assumed.

**4–7.**

- Confirm dialog warns about references; suggests deactivate instead.
- Errors toasted on failure.
- On success, parent list invalidated via `onPatched`.

---

## Part 2: Backend Logic

Routing: [LSIMS-Backend/LSIMS-main/laboratory/urls.py](LSIMS-Backend/LSIMS-main/laboratory/urls.py) — `router.register(r"tests", TestCatalogViewSet)`.

ViewSet: [LSIMS-Backend/LSIMS-main/laboratory/views.py](LSIMS-Backend/LSIMS-main/laboratory/views.py) `TestCatalogViewSet`

---

### `GET/POST/PATCH/DELETE /api/laboratory/tests/` — Backend Trace

**8. Response construction**

- **View:** `TestCatalogViewSet` — standard `ModelViewSet`.
- **Serializer:** `TestCatalogSerializer` for all actions.
- **Queryset:** `tests_visible_to(request.user, TestCatalog.objects.select_related("department"))`.

```111:116:LSIMS-Backend/LSIMS-main/laboratory/views.py
    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return TestCatalog.objects.none()

        base_qs = TestCatalog.objects.select_related("department")
        return tests_visible_to(self.request.user, base_qs)
```

- **Filters:** `filterset_fields = ["is_active", "department"]`; `search_fields = ["test_name", "test_code", "department__name"]`.
- **`department`:** direct FK UUID on model.
- **`price`:** model `DecimalField` → JSON string.

**9. Error messages**

| Message/Shape | Trigger | Enforced In | FE Displays? |
|---------------|---------|-------------|--------------|
| 403 + `detail` | Non-admin/qc_manager write | `check_permissions` | Yes (catalog toast) |
| `{"department": "Department Managers can only manage their department."}` | qc_manager wrong dept on create/update | `perform_create` / `perform_update` | Yes |
| ProtectedError / 500 | DELETE referenced test | DB FK constraints | Yes (generic toast) |
| Field validation | duplicate `test_code`, invalid price | Model/serializer | Yes |

```129:132:LSIMS-Backend/LSIMS-main/laboratory/views.py
        self.permission_denied(
            request,
            message="Only Admin or Department Manager can manage test catalog entries.",
        )
```

**10. State machine**

| Transition | Rule |
|------------|------|
| Active ↔ inactive | PATCH `is_active` (preferred in UI over DELETE) |
| Hard delete | DELETE removes row if no FK references |

**11. Permissions**

| Action | Roles |
|--------|-------|
| GET (list/retrieve) | Any authenticated user; queryset scoped by `tests_visible_to` |
| POST/PATCH/PUT/DELETE | Superuser, `admin`, or `qc_manager` (with department scope on write) |

Department visibility (`policies.tests_visible_to`):

- Superuser: all tests.
- `lab_technician`, `qc_manager`: filter `department_id = user.department_id`; no department → empty queryset.
- Others: unfiltered (all departments).

qc_manager write scope:

```134:143:LSIMS-Backend/LSIMS-main/laboratory/views.py
    def perform_create(self, serializer):
        user = self.request.user
        if getattr(user, "role_name", None) == "qc_manager" and not user.is_superuser:
            department = serializer.validated_data.get("department")
            if department and department.id != user.department_id:
                raise ValidationError(
                    {"department": "Department Managers can only manage their department."}
                )
            serializer.save(department=user.department)
```

---

### `PUT /api/laboratory/tests/{id}/` — Backend Trace

**8–11.** Same serializer and permissions as PATCH. Frontend does not call PUT.

---

## Consolidated Tables

### Field-Level Summary

| Endpoint | Field Name | Frontend Expects | Backend Sends | Computed or Direct? | Match? | Risk if Ignored |
|----------|------------|------------------|---------------|---------------------|--------|-----------------|
| GET tests/ | `id`, `test_code`, `test_name`, `unit`, `price` | typed | present | Direct | OK | Table/pickers |
| GET tests/ | `department` | UUID string\|null | UUID FK | Direct | OK | **Medium** — raw UUID shown in catalog UI |
| GET tests/ | `description`, timestamps | typed | present | Direct | UNUSED | Low |
| POST tests/ | writable body | typed | accepts | Direct | OK | — |
| PATCH tests/{id}/ | `is_active` | boolean | boolean | Direct | OK | Deactivate vs delete |
| GET tests/{id}/ | all fields | typed | same as list item | Direct | N/A | Dead export |

### Backend Logic Summary

| Endpoint | Error Message / Rule | Triggering Condition | Enforced In | Frontend Displays It? |
|----------|---------------------|----------------------|-------------|----------------------|
| GET tests/ | Empty queryset | dept-scoped role w/o department | `tests_visible_to` | Looks like "no tests" |
| POST/PATCH/DELETE | Only Admin or Department Manager… | wrong role | `check_permissions` | Yes |
| POST/PATCH | Department Managers can only manage their department | qc_manager cross-dept | `perform_create/update` | Yes |
| POST sample-tests (downstream) | Cannot assign an inactive test | inactive catalog row | `SampleTestCreateSerializer` | Yes (assignments UI) |
| DELETE tests/{id}/ | DB protected error | referenced by SampleTest | Django FK | Yes (toast) |

### Final Summary

| Endpoint | Method | Used in Frontend | Where Used | Response Match | Backend Rule Traced | Notes |
|----------|--------|------------------|------------|----------------|---------------------|-------|
| `/api/laboratory/tests/` | GET | Yes | Catalog, pickers, dashboard, client catalog | Yes | Yes | Page-1-only in pickers |
| `/api/laboratory/tests/` | POST | Yes | StaffCatalogSection | Yes | Yes | qc_manager dept auto-set |
| `/api/laboratory/tests/{id}/` | GET | No | Dead `fetchTestCatalogItem` | N/A | Yes | |
| `/api/laboratory/tests/{id}/` | PUT | No | — | N/A | Yes | PATCH used |
| `/api/laboratory/tests/{id}/` | PATCH | Yes | CatalogRow `is_active` | Yes | Yes | No inline edit of name/price |
| `/api/laboratory/tests/{id}/` | DELETE | Yes | CatalogRow | Yes | Yes | Hard delete |

---

## Highest-Risk Findings

1. **Dead GET-by-id export** — `fetchTestCatalogItem` in `staff-api.ts` is never imported; list row data is the only source of truth in UI.
2. **No PUT in frontend** — full replace exists on backend but staff UI only PATCHes `is_active`; doc/API drift if Swagger consumers expect PUT parity.
3. **Department UUID displayed raw** — `CatalogRow` renders `test.department ?? "—"` without resolving to department name (unlike client catalog path).
4. **Page-1-only test pickers** — assignment forms, sample detail panels, and dashboard stats fetch `page: 1` only; active tests on later pages missing from dropdowns.
5. **DELETE vs deactivate** — UI offers hard DELETE with confirm dialog; backend FK protection may fail while inactive tests are the safer path (PATCH).
6. **qc_manager department list page-1** — catalog create form loads `fetchDepartments({ page: 1 })` only; same pagination gap as accounts audit.

---

## Open Questions / Needs Manual Verification

- Exact error JSON when DELETE fails on FK-protected `SampleTest` reference.
- Whether inactive tests should be hidden from assignment pickers (`is_active: true` filter is used in some but not all call sites).
- Whether catalog inline edit (name, price, unit) is intentionally PATCH-only-on-server vs missing UI.
- Default DRF `PAGE_SIZE` vs total catalog size — when pickers miss tests beyond page 1.
- Whether `StaffInventoryPage` should resolve department UUID to human-readable name.
