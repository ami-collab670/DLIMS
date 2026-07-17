# Accounts API Audit — `/api/accounts/`

**Audited:** July 13, 2026  
**Revised:** July 16, 2026 — department read permissions (`IsAdminOrReadOnly`); client service catalog `GET /departments/` no longer admin-only  
**Swagger source:** Real tested JSON (user-provided for analysts, clients, users, departments, profile)  
**Test coverage:** [LSIMS-Backend/LSIMS-main/accounts/tests.py](LSIMS-Backend/LSIMS-main/accounts/tests.py) — comprehensive Sprint 1 suite (~1000+ lines: auth, permissions, happy paths, business logic). `test_authenticated_client_can_list_departments` added July 16, 2026.

---

## Table of Contents

- [Overview](#overview)
- [Part 1: Frontend Usage](#part-1-frontend-usage)
  - [GET /api/accounts/analysts/](#get-apiaccountsanalysts)
  - [GET /api/accounts/clients/](#get-apiaccountsclients)
  - [GET /api/accounts/users/](#get-apiaccountsusers)
  - [POST /api/accounts/users/](#post-apiaccountsusers)
  - [GET /api/accounts/users/{id}/](#get-apiaccountsusersid)
  - [PUT /api/accounts/users/{id}/](#put-apiaccountsusersid)
  - [PATCH /api/accounts/users/{id}/](#patch-apiaccountsusersid)
  - [DELETE /api/accounts/users/{id}/](#delete-apiaccountsusersid)
  - [POST /api/accounts/users/{id}/change-password/](#post-apiaccountsusersidchange-password)
  - [GET /api/accounts/departments/](#get-apiaccountsdepartments)
  - [POST /api/accounts/departments/](#post-apiaccountsdepartments)
  - [GET /api/accounts/departments/{id}/](#get-apiaccountsdepartmentsid)
  - [PUT /api/accounts/departments/{id}/](#put-apiaccountsdepartmentsid)
  - [PATCH /api/accounts/departments/{id}/](#patch-apiaccountsdepartmentsid)
  - [DELETE /api/accounts/departments/{id}/](#delete-apiaccountsdepartmentsid)
  - [GET /api/accounts/roles/](#get-apiaccountsroles)
  - [POST /api/accounts/roles/](#post-apiaccountsroles)
  - [GET /api/accounts/roles/{id}/](#get-apiaccountsrolesid)
  - [PUT /api/accounts/roles/{id}/](#put-apiaccountsrolesid)
  - [PATCH /api/accounts/roles/{id}/](#patch-apiaccountsrolesid)
  - [DELETE /api/accounts/roles/{id}/](#delete-apiaccountsrolesid)
  - [GET /api/accounts/profile/](#get-apiaccountsprofile)
  - [PUT /api/accounts/profile/](#put-apiaccountsprofile)
  - [PATCH /api/accounts/profile/](#patch-apiaccountsprofile)
  - [POST /api/accounts/profile/change-password/](#post-apiaccountsprofilechange-password)
- [Part 2: Backend Logic](#part-2-backend-logic)
- [Consolidated Tables](#consolidated-tables)
- [Highest-Risk Findings](#highest-risk-findings)
- [Open Questions / Needs Manual Verification](#open-questions--needs-manual-verification)

---

## Overview

The Accounts API manages LSIMS users (staff and external clients), laboratory departments, role-scoped picker lists for intake workflows, and the authenticated user's own profile. **Staff** use user management (`/users/`), department write CRUD (admin only), analyst/client pickers, and (for admin/receptionist) sending notifications to clients by email. **All authenticated users** can **read** `/departments/` (used by the client service catalog picker). **Clients** use profile GET/PATCH and change-password after login.

This audit covers **25 HTTP operations** across five resource areas under `/api/accounts/`.

| Method | Path | Description | Used in Frontend |
|--------|------|-------------|------------------|
| GET | `/api/accounts/analysts/` | Non-paginated active analyst list | Yes |
| GET | `/api/accounts/clients/` | Non-paginated active client list | Yes |
| GET | `/api/accounts/users/` | Paginated admin user list | Yes |
| POST | `/api/accounts/users/` | Admin create user | Yes |
| GET | `/api/accounts/users/{id}/` | Admin user detail | Yes |
| PUT | `/api/accounts/users/{id}/` | Full user replace | No |
| PATCH | `/api/accounts/users/{id}/` | Partial user update / reactivate | Yes |
| DELETE | `/api/accounts/users/{id}/` | Soft-deactivate user | Yes |
| POST | `/api/accounts/users/{id}/change-password/` | Admin reset password | Yes |
| GET | `/api/accounts/departments/` | Paginated department list | Yes |
| POST | `/api/accounts/departments/` | Create department | Yes |
| GET | `/api/accounts/departments/{id}/` | Department detail | No (dead export) |
| PUT | `/api/accounts/departments/{id}/` | Full department replace | No |
| PATCH | `/api/accounts/departments/{id}/` | Partial department update | Yes |
| DELETE | `/api/accounts/departments/{id}/` | Hard delete department | Yes |
| GET | `/api/accounts/roles/` | Paginated role list | Yes |
| POST | `/api/accounts/roles/` | Create role | Yes |
| GET | `/api/accounts/roles/{id}/` | Role detail | No (dead export) |
| PUT | `/api/accounts/roles/{id}/` | Full role replace | No (dead export) |
| PATCH | `/api/accounts/roles/{id}/` | Partial role update | Yes |
| DELETE | `/api/accounts/roles/{id}/` | Delete role | Yes |
| GET | `/api/accounts/profile/` | Current user profile | Yes |
| PUT | `/api/accounts/profile/` | Replace editable profile fields | No (dead export) |
| PATCH | `/api/accounts/profile/` | Partial profile update | Yes |
| POST | `/api/accounts/profile/change-password/` | Self-service password change | Yes |

---

## Part 1: Frontend Usage

Shared types used across multiple endpoints:

- **`AdminUserRow`** — [LSIMS-Frontend/src/types/account-admin.ts](LSIMS-Frontend/src/types/account-admin.ts) (analysts, clients, users list/detail/PATCH)
- **`AuthUser`** — [LSIMS-Frontend/src/types/auth.ts](LSIMS-Frontend/src/types/auth.ts) (profile GET/PATCH)
- **`RoleRecord`** — [LSIMS-Frontend/src/types/account-admin.ts](LSIMS-Frontend/src/types/account-admin.ts) (roles CRUD and role pickers)
- **`DrfPaginated<T>`** — [LSIMS-Frontend/src/types/laboratory.ts](LSIMS-Frontend/src/types/laboratory.ts)

---

### `GET /api/accounts/analysts/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/accounts/lab-analysts-api.ts` | API layer | `fetchLabAnalysts` |
| `LSIMS-Frontend/src/pages/staff/analyst/register-sample-form.tsx` | `RegisterSampleForm` | `fetchLabAnalysts` |
| `LSIMS-Frontend/src/pages/staff/analyst/analyst-sample-detail-panel.tsx` | `AnalystSampleDetailPanel` | `fetchLabAnalysts` |
| `LSIMS-Frontend/src/pages/staff/samples/new-sample-form.tsx` | `NewSampleForm` | `fetchLabAnalysts` |
| `LSIMS-Frontend/src/pages/staff/samples/sample-detail-panel.tsx` | `SampleDetailPanel` | `fetchLabAnalysts` |

`NewSampleForm` / `SampleDetailPanel` live under unrouted legacy samples pages (`/staff/samples` redirects to `/staff/analyst`).

**3. Frontend-expected types**

Non-paginated array of `AdminUserRow`:

```typescript
// lab-analysts-api.ts — response typed as AdminUserRow[]
export type AdminUserRow = {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  user_type: "internal" | "external";
  role: string | null;
  role_detail: RoleDetail | null;
  department: string | null;
  country?: string;
  nationality: string;
  organization_name: string;
  organization_type: string;
  is_active: boolean;
  is_superuser?: boolean;
  date_joined: string;
};
```

**4. Field comparison vs. real response JSON**

| Field | Verdict | Notes |
|-------|---------|-------|
| `id` | OK | React `key`; not used as `<option value>` |
| `username` | OK | UNUSED BY FRONTEND in pickers |
| `email` | OK | Primary display and `<option value>` |
| `first_name`, `last_name` | OK | UNUSED BY FRONTEND in pickers |
| `phone` | OK | UNUSED BY FRONTEND |
| `user_type` | OK | UNUSED BY FRONTEND |
| `role` | OK | UNUSED BY FRONTEND |
| `role_detail` (+ nested) | OK | UNUSED BY FRONTEND |
| `department` | OK | UNUSED BY FRONTEND |
| `country` | OK | UNUSED BY FRONTEND |
| `nationality`, `organization_*` | OK | UNUSED BY FRONTEND |
| `is_active`, `is_superuser` | OK | UNUSED BY FRONTEND |
| `date_joined` | OK | UNUSED BY FRONTEND |

**5. Fallback/default values found**

- `data: analysts = []` in all picker `useQuery` hooks — failed fetch shows empty dropdown with **no error UI**.

**6. Error handling**

- No `isError` on analyst picker queries; Axios rejection leaves `analysts = []`.
- Downstream assign uses `getApiErrorMessage` only on mutation failure (sample assign), not on list fetch.

**7. Business rules / validation in frontend**

Analyst `<option>` uses **email** as value (not UUID):

```115:118:LSIMS-Frontend/src/pages/staff/samples/new-sample-form.tsx
            {analysts.map((a) => (
              <option key={a.id} value={a.email}>
                {a.email}
              </option>
```

Same pattern in `register-sample-form.tsx`, `sample-detail-panel.tsx`, `analyst-sample-detail-panel.tsx`.

---

### `GET /api/accounts/clients/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/accounts/lab-clients-api.ts` | API layer | `fetchLabClients` |
| `LSIMS-Frontend/src/pages/staff/laboratory/jobs/staff-job-intake-form.tsx` | `StaffJobIntakeForm` | `fetchLabClients` |

**3. Frontend-expected types**

Same as analysts: `AdminUserRow[]` (non-paginated).

**4. Field comparison vs. real response JSON**

Same `AdminUserRow` table as analysts. Runtime reads: `id`, `email`, `first_name`, `last_name` for option label.

| Field | Verdict | Notes |
|-------|---------|-------|
| All `AdminUserRow` fields | OK | Only `id`, `email`, `first_name`, `last_name` read in UI |

**5. Fallback/default values found**

- `data: clients = []` — masks fetch failures.

**6. Error handling**

- No `isError` on client picker query.

**7. Business rules / validation in frontend**

Client job intake uses **email** as job `client` field:

```78:80:LSIMS-Frontend/src/pages/staff/laboratory/jobs/staff-job-intake-form.tsx
        {clients.map((c) => (
          <option key={c.id} value={c.email}>
            {c.email} — {c.first_name} {c.last_name}
```

---

### `GET /api/accounts/users/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/accounts/admin-api.ts` | API layer | `fetchAdminUsers` |
| `LSIMS-Frontend/src/pages/staff/user-management/StaffUserManagementPage.tsx` | `StaffUserManagementPage` | `fetchAdminUsers` |

Dead wrappers (never imported): `fetchExternalClients`, `fetchAnalystUsers` in `admin-api.ts` (filter same endpoint).

**3. Frontend-expected types**

```typescript
// DrfPaginated<AdminUserRow>
{ count: number; next: string | null; previous: string | null; results: AdminUserRow[] }
```

**4. Field comparison vs. real response JSON**

| Field | Verdict | Notes |
|-------|---------|-------|
| `count` | OK | Pagination in `StaffUserManagementPage` |
| `next` | OK | UNUSED BY FRONTEND |
| `previous` | OK | UNUSED BY FRONTEND |
| `results[]` | OK | All `AdminUserRow` fields OK; table reads subset |

**5. Fallback/default values found**

- `listData?.results ?? []` in user table.
- `role_detail?.display_name ?? "—"` masks missing role detail.

**6. Error handling**

- `StaffUserManagementPage` list query: `isError` + `getApiErrorMessage` shown in `UserManagementTable`.

**7. Business rules / validation in frontend**

Client-side sort on current page only (no server `ordering` param):

```56:57:LSIMS-Frontend/src/pages/staff/user-management/user-management-table.tsx
  // Users API has no ordering param — sort current page only.
  const rows = useMemo(() => {
```

---

### `POST /api/accounts/users/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/accounts/admin-api.ts` | API layer | `createAdminUser` |
| `LSIMS-Frontend/src/pages/staff/user-management/StaffUserManagementPage.tsx` | create mutation | `createAdminUser` |
| `LSIMS-Frontend/src/pages/staff/user-management/user-create-form.tsx` | `UserCreateForm` | via parent mutation |

**3. Frontend-expected types**

Response: `AdminUserCreateResponse` ([LSIMS-Frontend/src/types/api-responses.ts](LSIMS-Frontend/src/types/api-responses.ts)) — response **not read** after create; list invalidated.

**4. Field comparison vs. real POST JSON**

| Field | Verdict | Notes |
|-------|---------|-------|
| `id`, `username`, `email`, `first_name`, `last_name`, `phone`, `user_type`, `role`, `nationality`, `organization_name`, `organization_type` | OK | In create response type |
| `department` | MISSING FROM FRONTEND type | Present in real JSON; ignored (response unused) |
| `country` | MISSING FROM FRONTEND type | Present in real JSON; ignored |
| `role_detail`, `is_active`, `date_joined`, `is_superuser` | N/A | Not in create sample |

**5. Fallback/default values found**

- None on response (ignored).

**6. Error handling**

- `onError: toast.error(getApiErrorMessage(e))` on create mutation.

**7. Business rules / validation in frontend**

Client-side validation in `UserCreateForm`:

```49:71:LSIMS-Frontend/src/pages/staff/user-management/user-create-form.tsx
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const email = form.email.trim().toLowerCase();
    if (!email || !form.password || form.password.length < 8) {
      toast.error("Email and password (min 8 chars) are required.");
      return;
    }
    onSubmit({
      username: form.username.trim() || email,
      email,
      password: form.password,
      // ...
      country: form.nationality.trim() || undefined,
    });
  }
```

- Email lowercased; `username` defaults to email if blank.
- Internal users send `role` UUID; external sends `role: null`.
- `nationality` form field maps to `country` in POST body (same pattern as user edit PATCH).

---

### `GET /api/accounts/users/{id}/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/accounts/admin-api.ts` | API layer | `fetchAdminUser` |
| `LSIMS-Frontend/src/pages/staff/user-management/user-edit-dialog.tsx` | `UserEditDialog` | `fetchAdminUser` |

**3. Frontend-expected types**

`AdminUserRow` (single object).

**4. Field comparison vs. real response JSON**

Full `AdminUserRow` — all fields OK. Edit dialog reads: `username`, `email`, `first_name`, `last_name`, `phone`, `user_type`, `role`, `department`, `nationality`, `organization_name`, `organization_type`, `is_active`.

**5. Fallback/default values found**

- `freshUser ?? user` — GET failure silently keeps list-row data.
- `first_name ?? ""`, `role ?? ""`, `department ?? ""`, etc. on form init.

**6. Error handling**

- **Not handled** — no `isError` on detail `useQuery`; falls back to `initialData: user`.

**7. Business rules / validation in frontend**

Internal users must have role before save:

```119:122:LSIMS-Frontend/src/pages/staff/user-management/user-edit-dialog.tsx
    if (userType === "internal" && !roleId) {
      toast.error("Internal staff must have a role.");
      return;
```

---

### `PUT /api/accounts/users/{id}/`

**1. Called in frontend?** No

**2. Call sites** — None. Updates use `patchAdminUser` only.

**3–7.** N/A — endpoint not wired in frontend. Backend still exposes PUT via `UserViewSet` with `UserUpdateSerializer` (same validation as PATCH).

---

### `PATCH /api/accounts/users/{id}/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/accounts/admin-api.ts` | API layer | `patchAdminUser` |
| `LSIMS-Frontend/src/pages/staff/user-management/StaffUserManagementPage.tsx` | `updateMut`, `reactivateMut` | `patchAdminUser` |
| `LSIMS-Frontend/src/pages/staff/user-management/user-edit-dialog.tsx` | `onSave` | via parent |

**3. Frontend-expected types**

`AdminUserRow` response. Request: `UpdateAdminUserBody` (partial fields).

**4. Field comparison**

Same as GET detail — OK for all consumed fields.

**5. Fallback/default values found**

- Edit PATCH sends `country: nationality.trim() || undefined` while form loads `nationality` not `country` — may overwrite country from nationality field.

**6. Error handling**

- `onError: toast.error(getApiErrorMessage(e))` on update mutation.

**7. Business rules / validation in frontend**

External users clear role/department on patch:

```141:143:LSIMS-Frontend/src/pages/staff/user-management/user-edit-dialog.tsx
        role: userType === "internal" ? roleId : null,
        department:
          userType === "internal" && departmentId ? departmentId : null,
```

Password change chained after PATCH when admin sets new password:

```98:101:LSIMS-Frontend/src/pages/staff/user-management/StaffUserManagementPage.tsx
      const row = await patchAdminUser(opts.id, opts.patch);
      if (opts.newPassword) {
        await adminChangeUserPassword(opts.id, opts.newPassword);
```

---

### `DELETE /api/accounts/users/{id}/`

**1. Called in frontend?** Yes (soft-deactivate)

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/accounts/admin-api.ts` | API layer | `deactivateAdminUser` |
| `LSIMS-Frontend/src/pages/staff/user-management/StaffUserManagementPage.tsx` | `deactivateMut` | `deactivateAdminUser` |

**3. Frontend-expected types**

`ApiDetailResponse`: `{ detail: string }` — **not parsed**; generic success toast only.

**4. Field comparison**

| Field | Verdict | Notes |
|-------|---------|-------|
| `detail` | OK | Matches `"User '…' has been deactivated."` |

**5. Fallback/default values found**

- None.

**6. Error handling**

- `onError: toast.error(getApiErrorMessage(e))`.

**7. Business rules / validation in frontend**

Confirm before deactivate:

```116:121:LSIMS-Frontend/src/pages/staff/user-management/StaffUserManagementPage.tsx
  function handleDeactivate(u: AdminUserRow) {
    if (
      confirm(`Deactivate ${u.email}? They will not be able to sign in.`)
    ) {
      deactivateMut.mutate(u.id);
```

---

### `POST /api/accounts/users/{id}/change-password/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/accounts/admin-api.ts` | API layer | `adminChangeUserPassword` |
| `LSIMS-Frontend/src/pages/staff/user-management/StaffUserManagementPage.tsx` | inside `updateMut` | `adminChangeUserPassword` |

Dead wrapper: `changeOwnPasswordAsAdmin` in [LSIMS-Frontend/src/features/profile/api.ts](LSIMS-Frontend/src/features/profile/api.ts) — never imported.

**3. Frontend-expected types**

Request: `{ new_password: string }`. Response: `ApiDetailResponse`.

**4. Field comparison**

| Field | Verdict | Notes |
|-------|---------|-------|
| `detail` | OK | Not displayed verbatim |

**5–7.**

- Errors toasted via parent mutation.
- No standalone UI for password-only change outside edit flow.

---

### `GET /api/accounts/departments/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/accounts/departments-api.ts` | API layer | `fetchDepartments` |
| `LSIMS-Frontend/src/pages/staff/user-management/departments-management-section.tsx` | `DepartmentsManagementSection` | `fetchDepartments` |
| `LSIMS-Frontend/src/pages/staff/user-management/user-create-form.tsx` | `UserCreateForm` | `fetchDepartments()` (default page 1) |
| `LSIMS-Frontend/src/pages/staff/user-management/user-edit-dialog.tsx` | `UserEditDialog` | `fetchDepartments()` (default page 1) |
| `LSIMS-Frontend/src/pages/staff/catalog/staff-catalog-section.tsx` | `StaffCatalogSection` | `fetchDepartments({ page: 1 })` |
| `LSIMS-Frontend/src/features/laboratory/test-catalog-api.ts` | `fetchAllDepartments` | paginates via `next` |
| `LSIMS-Frontend/src/features/jobs/client-new-job-request-form.tsx` | via `fetchClientServiceCatalog` | indirect |

**3. Frontend-expected types**

```typescript
// DrfPaginated<DepartmentRecord>
export type DepartmentRecord = {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
};
```

**4. Field comparison vs. real response JSON**

| Field | Verdict | Notes |
|-------|---------|-------|
| `count`, `next`, `previous`, `results` | OK | `next` used only in `fetchAllDepartments` |
| `id`, `name`, `description` | OK | Primary consumers |
| `created_at`, `updated_at` | OK | UNUSED BY FRONTEND |

**5. Fallback/default values found**

- `departmentsData?.results ?? []` in forms — silent empty on failure.
- `dept.description ?? ""`, `d.description?.trim() || "—"` in management table.

**6. Error handling**

- `DepartmentsManagementSection`: `isError` + message.
- User/catalog forms: **no error UI** on dept query (staff pickers).
- **Client service catalog:** `ClientServiceCatalogPicker` surfaces `getApiErrorMessage` on catalog load failure ([client-new-job-request-form.tsx](LSIMS-Frontend/src/features/jobs/client-new-job-request-form.tsx)). Prior to July 16, 2026, external clients received **403** `"Admin access required."` on `GET /departments/` — **resolved** via `IsAdminOrReadOnly` on `DepartmentViewSet`.

**7. Business rules / validation in frontend**

Client catalog maps department id → name:

```41:49:LSIMS-Frontend/src/features/jobs/service-catalog.ts
  const deptNameById = new Map(departments.map((d) => [d.id, d.name]));
  ...
    const departmentName = test.department
      ? (deptNameById.get(test.department) ?? GENERAL_SERVICES_LABEL)
      : GENERAL_SERVICES_LABEL;
```

Full pagination only in client catalog path:

```22:34:LSIMS-Frontend/src/features/laboratory/test-catalog-api.ts
async function fetchAllDepartments(): Promise<DepartmentRecord[]> {
  const items: DepartmentRecord[] = [];
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    const data = await fetchDepartments({ page });
    items.push(...data.results);
    hasMore = data.next != null;
    page += 1;
  }
  return items;
}
```

---

### `POST /api/accounts/departments/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/accounts/departments-api.ts` | API layer | `createDepartment` |
| `LSIMS-Frontend/src/pages/staff/user-management/departments-management-section.tsx` | `createMut` | `createDepartment` |

**3. Frontend-expected types**

`DepartmentRecord` response — ignored after success; list invalidated.

**4. Field comparison**

All `DepartmentRecord` fields OK in response.

**5–7.**

- Name required client-side before POST.
- Errors toasted on mutation failure.

```109:114:LSIMS-Frontend/src/pages/staff/user-management/departments-management-section.tsx
    if (!form.name.trim()) {
      toast.error("Department name is required.");
      return;
    }
    if (editing) patchMut.mutate();
    else createMut.mutate();
```

---

### `GET /api/accounts/departments/{id}/`

**1. Called in frontend?** No

**2. Call sites**

| File | Status |
|------|--------|
| `LSIMS-Frontend/src/features/accounts/departments-api.ts` | `fetchDepartment` defined, **never imported** |

**3–7.** N/A

---

### `PUT /api/accounts/departments/{id}/`

**1. Called in frontend?** No — PATCH used instead.

---

### `PATCH /api/accounts/departments/{id}/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/accounts/departments-api.ts` | API layer | `patchDepartment` |
| `LSIMS-Frontend/src/pages/staff/user-management/departments-management-section.tsx` | `patchMut` | `patchDepartment` |

**3–4.** `DepartmentRecord` response — OK; response ignored.

**5–7.** Name required; errors toasted.

---

### `DELETE /api/accounts/departments/{id}/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/accounts/departments-api.ts` | API layer | `deleteDepartment` |
| `LSIMS-Frontend/src/pages/staff/user-management/departments-management-section.tsx` | `deleteMut` | `deleteDepartment` |

**3. Frontend-expected types**

`Promise<void>` — no JSON body (matches Swagger: empty 204).

**4–7.**

- Confirm dialog warns about user department links.
- Errors toasted on failure.

---

### `GET /api/accounts/roles/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/accounts/roles-api.ts` | API layer | `fetchRoles` |
| `LSIMS-Frontend/src/pages/staff/user-management/roles-management-section.tsx` | Roles table | `fetchRoles` |
| `LSIMS-Frontend/src/pages/staff/user-management/user-create-form.tsx` | Role picker | `fetchRoles` |
| `LSIMS-Frontend/src/pages/staff/user-management/user-edit-dialog.tsx` | Role picker | `fetchRoles` |
| `LSIMS-Frontend/src/pages/staff/lims-extensions/qc/StaffQcPage.tsx` | QC role filter | `fetchRoles` |
| `LSIMS-Frontend/src/pages/staff/lims-extensions/finance/finance-invoices-section.tsx` | Finance role filter | `fetchRoles` |
| `LSIMS-Frontend/src/pages/staff/laboratory/jobs/staff-job-detail-panel.tsx` | Blocked-by-role picker | `fetchRoles` |

**3. Frontend-expected types**

Paginated API response unwrapped to `RoleRecord[]` via `.results`:

```typescript
// LSIMS-Frontend/src/types/account-admin.ts
export type RoleRecord = {
  id: string;
  role_name: string;
  /** Present on nested user.role_detail; omitted on GET /api/accounts/roles/. */
  display_name?: string;
  contact_alias: string;
};
```

```20:32:LSIMS-Frontend/src/features/accounts/roles-api.ts
export async function fetchRoles(params?: {
  page?: number;
  search?: string;
}): Promise<RoleRecord[]> {
  const query: Record<string, string | number> = {};
  if (params?.page && params.page > 0) query.page = params.page;
  if (params?.search?.trim()) query.search = params.search.trim();

  const { data } = await apiClient.get<DrfPaginated<RoleRecord>>(ROLES_BASE, {
    params: query,
  });
  return data.results;
}
```

**4. Field comparison vs. real response JSON**

| Field | Verdict | Notes |
|-------|---------|-------|
| `id` | unclear - needs manual check | UUID expected |
| `role_name` | unclear - needs manual check | Choice slug |
| `display_name` | MISSING FROM BE (list) | `RoleSerializer` omits; UI uses `roleOptionLabel()` fallback |
| `contact_alias` | unclear - needs manual check | Used in mgmt table |
| `count`, `next`, `previous` | UNUSED BY FRONTEND | Pagination envelope discarded after `.results` |

**5. Fallback/default values found**

- `roles = []` default in `RolesManagementSection` and user forms.
- `roleOptionLabel()` maps `role_name` → human label when `display_name` absent.

**6. Error handling**

- `RolesManagementSection`: `isError` surfaced in UI.
- User create/edit role pickers: silent `= []` default on failure (no `isError`).

**7. Business rules**

- All callers use page 1 only (no pagination loop).
- QC/finance/job panels filter roles client-side by `role_name` slug.

---

### `POST /api/accounts/roles/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/accounts/roles-api.ts` | API layer | `createRole` |
| `LSIMS-Frontend/src/pages/staff/user-management/roles-management-section.tsx` | `createMut` | `createRole` |

**3. Frontend-expected types**

```typescript
export type CreateRoleBody = {
  role_name: RoleName;
  contact_alias: string;
};
// Response: RoleRecord
```

**4. Field comparison vs. real response JSON**

| Field | Verdict | Notes |
|-------|---------|-------|
| Request `role_name`, `contact_alias` | unclear - needs manual check | Trimmed in UI |
| Response body | unclear - needs manual check | Response ignored on success |

**5–7.**

- `contact_alias` trimmed before POST.
- Errors via `getApiErrorMessage` → toast.

---

### `GET /api/accounts/roles/{id}/`

**1. Called in frontend?** No (dead export)

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/accounts/roles-api.ts` | API layer only | `fetchRole` |

**3–7.** Exported but never imported by pages. List row data used for edit instead.

---

### `PUT /api/accounts/roles/{id}/`

**1. Called in frontend?** No (dead export)

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/accounts/roles-api.ts` | API layer only | `replaceRole` |

**3–7.** PATCH used for edits; PUT never called.

---

### `PATCH /api/accounts/roles/{id}/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/accounts/roles-api.ts` | API layer | `patchRole` |
| `LSIMS-Frontend/src/pages/staff/user-management/roles-management-section.tsx` | `patchMut` | `patchRole` |

**3. Frontend-expected types**

`Partial<CreateRoleBody>` request; `RoleRecord` response (ignored on success).

**4–7.**

- Both `role_name` and `contact_alias` sent on edit.
- Errors toasted via `getApiErrorMessage`.

---

### `DELETE /api/accounts/roles/{id}/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/accounts/roles-api.ts` | API layer | `deleteRole` |
| `LSIMS-Frontend/src/pages/staff/user-management/roles-management-section.tsx` | `deleteMut` | `deleteRole` |

**3. Frontend-expected types**

`Promise<void>` — expects 204 empty body.

**4–7.**

- Confirm dialog before delete.
- Errors toasted on failure; FK-protected delete error shape unclear.

---

### `GET /api/accounts/profile/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/auth/api.ts` | API layer | `fetchProfile` |
| `LSIMS-Frontend/src/stores/auth-store.ts` | Session bootstrap | `fetchProfile` |
| `LSIMS-Frontend/src/pages/auth/login/LoginPage.tsx` | Post-login hydrate | `fetchProfile` |
| `LSIMS-Frontend/src/pages/profile/profile/ProfileManagementPage.tsx` | Profile page | `fetchProfile` |

**3. Frontend-expected types**

```typescript
// LSIMS-Frontend/src/types/auth.ts
export type AuthUser = {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  user_type: "internal" | "external";
  role: string | null;
  role_detail: RoleDetail | null;
  department: string | null;
  country?: string;
  nationality: string;
  organization_name: string;
  organization_type: string;
  is_active: boolean;
  is_superuser?: boolean;
  date_joined: string;
};
```

**4. Field comparison vs. real response JSON**

| Field | Verdict | Notes |
|-------|---------|-------|
| All fields in `AuthUser` | OK | Matches Swagger profile shape |
| `role_detail.*` nested | OK | Used in staff profile sections |
| `country` | OK | Read in account section; edit form uses `nationality` not `country` |
| `date_joined` | OK | UNUSED BY FRONTEND in profile UI |

**5. Fallback/default values found**

- Profile form reset: `profile.first_name ?? ""`, etc.
- Login/auth-store: failure paths unclear - needs manual check in `auth-store.ts`.

**6. Error handling**

- `ProfileManagementPage`: loading state only; no explicit `isError` on profile query.
- Login: errors handled in login flow (unclear - needs manual check).

**7. Business rules / validation in frontend**

Profile form uses Zod schema `profileFormSchema` before PATCH. Staff permissions derived from profile in `ProfileStaffPermissionsSection`.

---

### `PUT /api/accounts/profile/`

**1. Called in frontend?** No

**2. Call sites**

| File | Status |
|------|--------|
| `LSIMS-Frontend/src/features/profile/api.ts` | `replaceProfile` — **never imported** |

---

### `PATCH /api/accounts/profile/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/profile/api.ts` | API layer | `updateProfile` |
| `LSIMS-Frontend/src/pages/profile/profile/ProfileManagementPage.tsx` | save mutation | `updateProfile` |

**3. Frontend-expected types**

Request: `ProfileUpdatePayload` (subset). Response: `AuthUser`.

```typescript
export type ProfileUpdatePayload = {
  first_name?: string;
  last_name?: string;
  phone?: string;
  nationality?: string;
  organization_name?: string;
  organization_type?: string;
};
```

**4. Field comparison**

PATCH response returns full `AuthUser` (same as GET) — OK. Writable fields on backend are a subset; identity/role fields read-only in `ProfileSelfSerializer`.

**5–7.**

- `onError: toast.error(getApiErrorMessage(e))`.
- On success: `setUser(user)` updates auth store.

```72:78:LSIMS-Frontend/src/pages/profile/profile/ProfileManagementPage.tsx
  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (user) => {
      setUser(user);
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile saved.");
```

---

### `POST /api/accounts/profile/change-password/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/profile/api.ts` | API layer | `changeOwnPassword` |
| `LSIMS-Frontend/src/pages/profile/profile/profile-password-section.tsx` | `ProfilePasswordSection` | `changeOwnPassword` |

**3. Frontend-expected types**

Request: `{ current_password: string; new_password: string }`. Response: `{ detail: string }`.

**4. Field comparison**

| Field | Verdict | Notes |
|-------|---------|-------|
| `detail` | OK | `"Password changed successfully."` — success toast generic |

**5–7.**

- Errors via `getApiErrorMessage` in password section mutation.

---

## Part 2: Backend Logic

Routing: [LSIMS-Backend/LSIMS-main/accounts/urls.py](LSIMS-Backend/LSIMS-main/accounts/urls.py)

| Path | View |
|------|------|
| `analysts/` | `LabAnalystListView` |
| `clients/` | `LabClientListView` |
| `users/` | `UserViewSet` (router) |
| `departments/` | `DepartmentViewSet` (router) |
| `roles/` | `RoleViewSet` (router) |
| `profile/` | `ProfileView` |
| `profile/change-password/` | `ProfilePasswordChangeView` |

---

### `GET /api/accounts/analysts/` — Backend Trace

**8. Response construction**

- **View:** `LabAnalystListView` — `pagination_class = None` (plain JSON array).
- **Serializer:** `UserSerializer`.
- **Queryset:**

```191:200:LSIMS-Backend/LSIMS-main/accounts/views.py
    def get_queryset(self):
        return (
            User.objects.filter(
                user_type="internal",
                is_active=True,
                role__role_name="analyst",
            )
            .select_related("role")
            .order_by("email")
        )
```

- **`role_detail`:** computed via `RoleListSerializer(source="role")` — includes `display_name` from `get_role_name_display`.
- All other fields direct model fields.

**9. Error messages**

| Message/Shape | Trigger | Enforced In | FE Displays? |
|---------------|---------|-------------|--------------|
| 401 | Unauthenticated | `IsAuthenticated` | No (picker silent) |
| 403 | Non admin/receptionist | `IsAdminOrReceptionist` | No (picker silent) |

**10. State machine** — N/A (read-only list).

**11. Permissions**

| Action | Roles | Object check |
|--------|-------|--------------|
| GET | Admin, receptionist, superuser | Queryset filter only |

---

### `GET /api/accounts/clients/` — Backend Trace

**8. Response construction**

- **Serializer:** `UserSerializer`, non-paginated.
- **Queryset:** `user_type="external", is_active=True`, ordered by email.

**9–11.** Same permission pattern as analysts (`IsAdminOrReceptionist`).

---

### `GET/POST/PATCH/DELETE /api/accounts/users/` — Backend Trace

**8. Response construction**

- **View:** `UserViewSet` — `queryset = User.objects.select_related("role", "department").all()`.
- **Serializers:** `UserSerializer` (read), `UserCreateSerializer` (create), `UserUpdateSerializer` (update/patch).
- **Filters:** `user_type`, `role__role_name`, `department`, `country`, `organization_type`, `is_active`; search on email, names, org, dept name.

**9. Error messages**

| Message/Shape | Trigger | Enforced In | FE Displays? |
|---------------|---------|-------------|--------------|
| `{"role": ["Internal users must be assigned a role."]}` | Internal user without role on create/update | `_validate_internal_role_and_department` | Yes |
| `{"department": ["Department is required for Lab Analysts and Lab Technicians and Department Managers."]}` | Role requires dept, dept missing | `_validate_internal_role_and_department` | Yes |
| `{"detail": "User '…' has been deactivated."}` | DELETE (soft) | `UserViewSet.destroy` | No (generic toast) |
| `{"detail": "Password updated for '…'."}` | change-password success | `UserViewSet.change_password` | No |
| 403 | Non-admin | `IsAdmin` | Yes |
| Password min length 8 | create/change-password | `UserCreateSerializer`, `ChangePasswordSerializer` | Yes |

```114:121:LSIMS-Backend/LSIMS-main/accounts/views.py
    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        user.is_active = False
        user.save(update_fields=["is_active"])
        return Response(
            {"detail": f"User '{user.email}' has been deactivated."},
            status=status.HTTP_200_OK,
        )
```

**10. State machine**

| Transition | Rule |
|------------|------|
| Active → inactive | DELETE sets `is_active=False` (not hard delete) |
| Inactive → active | PATCH `is_active: true` (reactivate in UI) |
| Blocked | Deactivated users cannot login (tested in `tests.py`) |

**11. Permissions**

| Action | Roles |
|--------|-------|
| All user CRUD + change-password | `IsAdmin` (+ superuser) |

---

### `GET/POST/PATCH/DELETE /api/accounts/departments/` — Backend Trace

**8. Response construction**

- **View:** `DepartmentViewSet` — `queryset = Department.objects.all()`.
- **Serializer:** `DepartmentSerializer` — all fields direct model fields.
- **Search:** `name`, `description`.
- **Permissions (July 16, 2026):** `permission_classes = [IsAdminOrReadOnly]` — all authenticated users may **GET** list/detail; **POST/PATCH/DELETE** require admin (or superuser).

```49:55:LSIMS-Backend/LSIMS-main/accounts/views.py
# edited by kiya
class DepartmentViewSet(viewsets.ModelViewSet):
    """CRUD operations for laboratory departments."""

    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminOrReadOnly]
```

**9. Error messages**

| Message/Shape | Trigger | Enforced In | FE Displays? |
|---------------|---------|-------------|--------------|
| 403 `"Admin access required."` | Non-admin **write** (POST/PATCH/DELETE) | `IsAdminOrReadOnly` | Yes (management section) |
| 403 | Unauthenticated | `IsAdminOrReadOnly` | Yes (login redirect) |
| Validation on unique name | Duplicate dept | Model/serializer — unclear exact JSON | Yes |

**10. State machine** — N/A.

**11. Permissions**

| Action | Roles |
|--------|-------|
| GET list / GET detail | All authenticated users |
| POST / PATCH / DELETE | `admin` (+ superuser) |

---

### `GET/POST/PATCH/DELETE /api/accounts/roles/` — Backend Trace

**8. Response construction**

- **View:** `RoleViewSet` — `queryset = Role.objects.all()`.
- **Serializer:** `RoleSerializer` — fields `id`, `role_name`, `contact_alias` (no `display_name`; unlike nested `RoleListSerializer` on users/profile).
- **Search:** `role_name`, `contact_alias`.

```66:72:LSIMS-Backend/LSIMS-main/accounts/views.py
class RoleViewSet(viewsets.ModelViewSet):
    """CRUD operations for system Roles."""

    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    search_fields = ["role_name", "contact_alias"]
```

```59:65:LSIMS-Backend/LSIMS-main/accounts/serializers.py
class RoleSerializer(serializers.ModelSerializer):
    """Full Role serializer for Admin CRUD."""

    class Meta:
        model = Role
        fields = ["id", "role_name", "contact_alias"]
        read_only_fields = ["id"]
```

**9. Error messages**

| Message/Shape | Trigger | Enforced In | FE Displays? |
|---------------|---------|-------------|--------------|
| 403 | Non-admin | `IsAdmin` | Yes (mgmt section) |
| Validation on `role_name` choices | Invalid slug | Model choices — unclear exact JSON | Yes |
| ProtectedError on DELETE | Users still reference role FK | Django ORM — unclear exact JSON | Yes (toast) |

**10. State machine** — N/A (static role catalog).

**11. Permissions**

| Action | Roles |
|--------|-------|
| All role CRUD | `IsAdmin` (+ superuser) |

---

### `GET/PUT/PATCH /api/accounts/profile/` — Backend Trace

**8. Response construction**

- **View:** `ProfileView` — `get_object()` returns `request.user`.
- **Serializer:** `ProfileSelfSerializer` — editable: `first_name`, `last_name`, `phone`, `nationality`, `organization_name`, `organization_type`.
- **Read-only:** `id`, `username`, `email`, `user_type`, `role`, `role_detail`, `department`, `country`, `is_active`, `is_superuser`, `date_joined`.
- **`role_detail`:** computed nested `RoleListSerializer`.

**9. Error messages**

| Message/Shape | Trigger | Enforced In | FE Displays? |
|---------------|---------|-------------|--------------|
| 401 | Unauthenticated | `IsAuthenticated` | Yes (login/profile) |
| Field validation | Invalid org type etc. | Model choices — unclear | Yes |

**10. State machine** — N/A (profile fields, not workflow).

**11. Permissions**

| Action | Roles |
|--------|-------|
| GET/PUT/PATCH own profile | Any authenticated user (self only) |

---

### `POST /api/accounts/profile/change-password/` — Backend Trace

**8. Response construction**

- **View:** `ProfilePasswordChangeView`.
- **Serializer:** `SelfChangePasswordSerializer`.

**9. Error messages**

| Message/Shape | Trigger | Enforced In | FE Displays? |
|---------------|---------|-------------|--------------|
| `{"current_password": ["Current password is incorrect."]}` | Wrong current password | `SelfChangePasswordSerializer.validate_current_password` | Yes |
| `{"detail": "Password changed successfully."}` | Success | `ProfilePasswordChangeView.post` | No (generic toast) |
| Django password validators | Weak new password | `validate_new_password` | Yes |

```230:234:LSIMS-Backend/LSIMS-main/accounts/serializers.py
    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value
```

**11. Permissions:** `IsAuthenticated`, self only.

---

## Consolidated Tables

### Field-Level Summary (all endpoints)

| Endpoint | Field Name | Frontend Expects | Backend Sends | Computed or Direct? | Match? | Risk if Ignored |
|----------|------------|------------------|---------------|---------------------|--------|-----------------|
| GET analysts/clients/users* | `id` | string | UUID | Direct | OK | Keys, mutations |
| GET analysts/clients/users* | `email` | string | string | Direct | OK | **High** — used as FK value in pickers |
| GET analysts/clients/users* | `role_detail.display_name` | string | string | Computed | OK | Table display |
| GET analysts/clients | most other AdminUserRow fields | typed | present | Direct | OK / UNUSED | Low |
| GET users/ | `count` | number | number | Pagination | OK | Page nav |
| GET users/ | `next`/`previous` | string\|null | same | Pagination | UNUSED | None |
| POST users/ | `department`,`country` | not in create type | present | Direct | MISSING FROM FE type | None (ignored) |
| DELETE users/ | `detail` | string | string | View response | OK | Low |
| GET departments/ | `id`,`name`,`description` | typed | present | Direct | OK | High |
| GET departments/ | `created_at`,`updated_at` | typed | present | Direct | UNUSED | None |
| GET roles/ | `id`,`role_name`,`contact_alias` | typed | present | Direct | unclear - needs manual check | CRUD keys |
| GET roles/ | `display_name` | optional in type | absent on list | N/A | MISSING FROM BE | UI uses `roleOptionLabel` |
| GET roles/ | pagination envelope | DrfPaginated | present | Pagination | UNUSED (`.results` only) | Page >1 roles missing |
| GET/PATCH profile | `AuthUser` fields | typed | present | Mixed | OK | Session + UI |
| PATCH profile | writable subset | ProfileUpdatePayload | subset only writable | Serializer whitelist | OK | — |
| POST profile/change-password | `detail` | string | string | View | OK | Low |

\*Same `UserSerializer` / `AdminUserRow` shape for analysts, clients, users list/detail/PATCH.

### Backend Logic Summary

| Endpoint | Error Message / Rule | Triggering Condition | Enforced In | Frontend Displays It? |
|----------|---------------------|----------------------|-------------|----------------------|
| GET analysts/clients | 403 Admin or Receptionist | Wrong role | `IsAdminOrReceptionist` | No (silent picker) |
| POST/PATCH users | Internal users must be assigned a role | internal + no role | `serializers._validate_internal_role_and_department` | Yes |
| POST/PATCH users | Department is required for… | analyst/lab_technician/qc_manager w/o dept | same | Yes |
| DELETE users | User '…' has been deactivated | DELETE | `UserViewSet.destroy` | No |
| POST users/…/change-password | Password updated for '…' | success | `UserViewSet.change_password` | No |
| GET/POST/PATCH/DELETE departments (write) | Admin only | non-admin write | `IsAdminOrReadOnly` | Yes (mgmt section) |
| GET departments | All authenticated | unauthenticated | `IsAdminOrReadOnly` | Yes (client catalog picker) |
| GET/POST/PATCH/DELETE roles | Admin only | non-admin | `IsAdmin` | Yes (mgmt section) |
| POST profile/change-password | Current password is incorrect | bad password | `SelfChangePasswordSerializer` | Yes |
| POST profile/change-password | Password changed successfully | success | `ProfilePasswordChangeView` | No |
| All authenticated | 401 | no JWT | DRF auth | Varies |

### Final Summary

| Endpoint | Method | Used in Frontend | Where Used | Response Match | Backend Rule Traced | Notes |
|----------|--------|------------------|------------|----------------|---------------------|-------|
| `/api/accounts/analysts/` | GET | Yes | Sample forms, detail panels | Yes | Yes | Email as option value; silent errors |
| `/api/accounts/clients/` | GET | Yes | StaffJobIntakeForm | Yes | Yes | Email as job client |
| `/api/accounts/users/` | GET | Yes | StaffUserManagementPage | Yes | Yes | Page-1 sort client-side |
| `/api/accounts/users/` | POST | Yes | UserCreateForm | Yes | Yes | Response ignored |
| `/api/accounts/users/{id}/` | GET | Yes | UserEditDialog | Yes | Yes | Detail errors not surfaced |
| `/api/accounts/users/{id}/` | PUT | No | — | N/A | Yes | PATCH used |
| `/api/accounts/users/{id}/` | PATCH | Yes | Edit + reactivate | Yes | Yes | nationality→country mapping |
| `/api/accounts/users/{id}/` | DELETE | Yes | Deactivate | Yes | Yes | Soft delete, 200+json |
| `/api/accounts/users/{id}/change-password/` | POST | Yes | Edit flow | Yes | Yes | Dead `changeOwnPasswordAsAdmin` |
| `/api/accounts/departments/` | GET | Yes | Mgmt, forms, **client catalog** | Yes | Yes | All authenticated; `fetchAllDepartments` paginates |
| `/api/accounts/departments/` | POST | Yes | DepartmentsManagementSection | Yes | Yes | Admin only |
| `/api/accounts/departments/{id}/` | GET | No | Dead `fetchDepartment` | N/A | Yes | |
| `/api/accounts/departments/{id}/` | PUT | No | — | N/A | Yes | |
| `/api/accounts/departments/{id}/` | PATCH | Yes | DepartmentsManagementSection | Yes | Yes | |
| `/api/accounts/departments/{id}/` | DELETE | Yes | DepartmentsManagementSection | Yes | Yes | Empty body OK |
| `/api/accounts/roles/` | GET | Yes | Mgmt, user forms, QC/finance/job pickers | unclear | Yes | `.results` only; no `display_name` |
| `/api/accounts/roles/` | POST | Yes | RolesManagementSection | unclear | Yes | Response ignored |
| `/api/accounts/roles/{id}/` | GET | No | Dead `fetchRole` | N/A | Yes | |
| `/api/accounts/roles/{id}/` | PUT | No | Dead `replaceRole` | N/A | Yes | |
| `/api/accounts/roles/{id}/` | PATCH | Yes | RolesManagementSection | unclear | Yes | |
| `/api/accounts/roles/{id}/` | DELETE | Yes | RolesManagementSection | Yes | Yes | FK protect unclear |
| `/api/accounts/profile/` | GET | Yes | Login, auth-store, profile page | Yes | Yes | Session-critical |
| `/api/accounts/profile/` | PUT | No | Dead `replaceProfile` | N/A | Yes | |
| `/api/accounts/profile/` | PATCH | Yes | ProfileManagementPage | Yes | Yes | Updates auth store |
| `/api/accounts/profile/change-password/` | POST | Yes | ProfilePasswordSection | Yes | Yes | |

---

## Highest-Risk Findings

1. **Analyst/client pickers send email, not UUID** — `<option value={a.email}>` in sample and job forms; sample `assign-analyst` API uses `PrimaryKeyRelatedField` (UUID). Assign-from-UI may 400 unless backend accepts email elsewhere.
2. **Silent empty dropdowns** — `fetchLabAnalysts` / `fetchLabClients` / dept queries in user forms use `= []` default with no `isError`; permission or network failures look like "no data."
3. **Department list page-1 only** — `UserCreateForm`, `UserEditDialog`, `StaffCatalogSection`, and `DepartmentsManagementSection` do not paginate; departments beyond page 1 missing from staff pickers (client catalog path is safe via `fetchAllDepartments`).
4. ~~**Client catalog blocked on GET departments**~~ — **Resolved July 16, 2026:** external clients can list departments for service catalog grouping.
5. **User edit detail fetch failures hidden** — `UserEditDialog` falls back to list row when `fetchAdminUser` fails; stale/wrong data possible.
6. **Profile GET is session-critical** — `auth-store` and `LoginPage` depend on `/profile/`; error handling on bootstrap unclear.
7. **nationality vs country on user/profile edit** — Forms edit `nationality`; admin user PATCH may send `country` from nationality; profile backend has `country` read-only — field drift risk.
8. **Dead API exports** — `fetchDepartment`, `replaceProfile`, `fetchExternalClients`, `fetchAnalystUsers`, `changeOwnPasswordAsAdmin`, **`fetchRole`**, **`replaceRole`** — maintenance noise and doc drift.
9. **Role list omits `display_name`** — `RoleSerializer` vs nested `RoleListSerializer`; pickers rely on client-side `roleOptionLabel`.
10. **Role list page-1 only** — `fetchRoles` unwraps `.results` without pagination; roles beyond page 1 missing from pickers.
11. **DELETE user returns 200 not 204** — Frontend types as delete with body; works but unconventional.

---

## Open Questions / Needs Manual Verification

- Whether backend `assigned_analyst` / job `client` truly accept email strings on write (frontend assumes yes for jobs; samples use assign endpoint with email).
- Exact validation JSON for duplicate department name or invalid `organization_type` on user create.
- `auth-store.ts` behavior when `fetchProfile` fails during session restore.
- `LoginPage` error path when profile fetch fails after successful token login.
- Whether `StaffSamplesPage` / `NewSampleForm` / `SampleDetailPanel` will be re-routed (currently legacy/unmounted).
- Default DRF `PAGE_SIZE` vs department count — when staff pickers miss departments beyond page 1.
- Whether `catalog-row.tsx` should resolve `test.department` UUID to name (displays raw UUID today).
- DELETE department when users still reference department FK — exact error shape (likely 500/ProtectedError).
