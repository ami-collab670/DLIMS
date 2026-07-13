# Notifications API Audit — `/api/notifications/inbox/`

**Audited:** July 13, 2026  
**Swagger source:** Serializer / OpenAPI inference only (no real tested JSON captured)  
**Test coverage:** No dedicated `notifications` test module found in backend

---

## Table of Contents

- [Overview](#overview)
- [Part 1: Frontend Usage](#part-1-frontend-usage)
  - [GET /api/notifications/inbox/](#get-apinotificationsinbox)
  - [POST /api/notifications/inbox/](#post-apinotificationsinbox)
  - [GET /api/notifications/inbox/{id}/](#get-apinotificationsinboxid)
  - [PATCH /api/notifications/inbox/{id}/](#patch-apinotificationsinboxid)
  - [DELETE /api/notifications/inbox/{id}/](#delete-apinotificationsinboxid)
  - [GET /api/notifications/inbox/unread-count/](#get-apinotificationsinboxunread-count)
  - [POST /api/notifications/inbox/mark-all-read/](#post-apinotificationsinboxmark-all-read)
  - [POST /api/notifications/inbox/mark-all-unread/](#post-apinotificationsinboxmark-all-unread)
- [Part 2: Backend Logic](#part-2-backend-logic)
- [Consolidated Tables](#consolidated-tables)
- [Highest-Risk Findings](#highest-risk-findings)
- [Open Questions / Needs Manual Verification](#open-questions--needs-manual-verification)

---

## Overview

The Notifications inbox API delivers per-user in-app messages (job workflow events, staff-to-client messages, system notices). **All authenticated users** list, read, mark, and delete **only their own** inbox. **Admin and receptionist** (plus superuser) may **POST** new notifications to any user via `recipient` email or legacy UUID. Unread state is stored as `read_at` (null = unread); list supports `unread` query param (`1` / `0`) and `kind` filter.

This audit covers **8 HTTP operations** on `NotificationViewSet` under `/api/notifications/inbox/`.

| Method | Path | Description | Used in Frontend |
|--------|------|-------------|------------------|
| GET | `/api/notifications/inbox/` | Paginated own inbox (filters: `unread`, `kind`, `page`) | Yes |
| POST | `/api/notifications/inbox/` | Staff send notification to a user | Yes |
| GET | `/api/notifications/inbox/{id}/` | Single notification detail | Yes (lazy expand only) |
| PATCH | `/api/notifications/inbox/{id}/` | Mark read / unread | Yes |
| DELETE | `/api/notifications/inbox/{id}/` | Hard delete from inbox | Yes |
| GET | `/api/notifications/inbox/unread-count/` | Unread count for bell badge | Yes |
| POST | `/api/notifications/inbox/mark-all-read/` | Bulk mark all unread as read | Yes |
| POST | `/api/notifications/inbox/mark-all-unread/` | Bulk mark all read as unread | Yes |

**URL note:** Frontend list/create use `BASE = "/api/notifications/inbox"` **without** trailing slash; detail/mutations use `/${id}/` **with** trailing slash. DRF router registers `inbox/` with trailing slash — behavior depends on Django `APPEND_SLASH` redirect.

---

## Part 1: Frontend Usage

Shared types:

- **`NotificationRecord`**, **`NotificationKind`** — [LSIMS-Frontend/src/types/notification.ts](LSIMS-Frontend/src/types/notification.ts)
- **`DrfPaginated<T>`** — [LSIMS-Frontend/src/types/laboratory.ts](LSIMS-Frontend/src/types/laboratory.ts)
- **API layer** — [LSIMS-Frontend/src/features/notifications/api.ts](LSIMS-Frontend/src/features/notifications/api.ts)

---

### `GET /api/notifications/inbox/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/notifications/api.ts` | API layer | `fetchNotifications` |
| `LSIMS-Frontend/src/features/notifications/notifications-center.tsx` | `NotificationsCenter` | `fetchNotifications` |
| `LSIMS-Frontend/src/components/notifications/notification-bell.tsx` | `NotificationBell` | `fetchNotifications` |

Pages: `StaffNotificationsPage`, `ClientNotificationsPage` (via `NotificationsCenter`).

**3. Frontend-expected types**

```typescript
// api.ts — DrfPaginated<NotificationRecord>
export type NotificationListParams = {
  page?: number;
  unread?: "0" | "1";
  kind?: NotificationKind;
};

export type NotificationRecord = {
  id: string;
  title: string;
  body: string;
  kind: NotificationKind;
  metadata: Record<string, unknown>;
  read_at: string | null;
  is_read: boolean;
  created_at: string;
};
```

**4. Field comparison vs. backend serializer**

Inferred from `NotificationSerializer` (no live JSON verified):

| Field | Verdict | Notes |
|-------|---------|-------|
| `id` | OK | UUID string; React `key` |
| `title` | OK | Display in list and bell |
| `body` | OK | Full text in center; `line-clamp-2` in bell |
| `kind` | OK | Badge in center; UNUSED in bell |
| `metadata` | OK | Shown in expandable block when non-empty |
| `read_at` | OK | UNUSED BY FRONTEND directly (`is_read` used) |
| `is_read` | OK | Row styling, filters, mark-read toggles |
| `created_at` | OK | Formatted with `toLocaleString` |
| `count` | OK | Pagination in `NotificationsCenter` |
| `next` | OK | UNUSED BY FRONTEND |
| `previous` | OK | UNUSED BY FRONTEND |
| `results[]` | OK | Same shape as single record |

**5. Fallback/default values found**

- Bell: `recentQuery.data?.results ?? []` — empty list on fetch failure (no error UI).
- Center: explicit `isError` branch with `getApiErrorMessage`.

**6. Error handling**

- **`NotificationsCenter`:** `listQuery.isError` → destructive text with `getApiErrorMessage`.
- **`NotificationBell`:** no `isError` on recent list; shows "No notifications yet." when `items.length === 0`.

**7. Business rules / validation in frontend**

- Client-side `PAGE_SIZE = 20` matches Django `PAGE_SIZE` setting.
- Filters reset page to 1 on change (`unreadFilter`, `kindFilter`).
- Poll/refetch: center `refetchInterval: 30_000`; bell unread count `refetchInterval: 25_000`, recent list only when dropdown open.

```176:183:LSIMS-Frontend/src/features/notifications/notifications-center.tsx
  const listParams = useMemo(
    () => ({
      page,
      unread: unreadFilter === "" ? undefined : unreadFilter,
      kind: kindFilter === "" ? undefined : kindFilter,
    }),
    [page, unreadFilter, kindFilter],
  );
```

---

### `POST /api/notifications/inbox/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/notifications/api.ts` | API layer | `createNotification` |
| `LSIMS-Frontend/src/features/notifications/notifications-center.tsx` | `NotificationsCenter` send form | `createNotification` |

Only when `showStaffSendForm` and `canManageJobsAndSamples(user)` — staff notifications page passes `showStaffSendForm`; client page does not.

**3. Frontend-expected types**

Request: `CreateNotificationBody` — `recipient`, `title`, `body`, optional `kind`, optional `metadata`.  
Response: `NotificationRecord` (return value ignored beyond invalidation).

**4. Field comparison vs. backend serializer**

| Field | Verdict | Notes |
|-------|---------|-------|
| `recipient` | OK | FE sends trimmed email; backend `UserIdentityField` accepts email or UUID |
| `title` | OK | Required; FE trims |
| `body` | OK | Required; FE trims |
| `kind` | OK | Defaults to `"info"` in UI select |
| `metadata` | OK | UNUSED BY FRONTEND on send (omitted) |
| Response fields | OK | Same as list item shape (inferred) |

**5. Fallback/default values found**

- Send button disabled until recipient, title, body all non-empty after trim.
- `kind` defaults to `"info"` in component state.

**6. Error handling**

- `onError: toast.error(getApiErrorMessage(e))` on send mutation.

**7. Business rules / validation in frontend**

- UI gate uses `canManageJobsAndSamples` (admin, receptionist, superuser) — aligns with backend `IsAdminOrReceptionist` on create, not identical naming.

```170:170:LSIMS-Frontend/src/features/notifications/notifications-center.tsx
  const canSend = showStaffSendForm && canManageJobsAndSamples(user);
```

```57:62:LSIMS-Frontend/src/lib/staff-permissions.ts
export function canManageJobsAndSamples(user: AuthUser | null): boolean {
  if (!user?.is_active) return false;
  const r = roleName(user);
  return Boolean(
    user.is_superuser === true || r === "admin" || r === "receptionist",
  );
}
```

---

### `GET /api/notifications/inbox/{id}/`

**1. Called in frontend?** Yes (optional lazy load)

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/notifications/api.ts` | API layer | `fetchNotification` |
| `LSIMS-Frontend/src/features/notifications/notifications-center.tsx` | `NotificationListItem` | `fetchNotification` |

Triggered only when user clicks "Load full detail" (`enabled: expanded`). List row already holds full `NotificationRecord` — detail refetch is **redundant** for current serializer (same fields as list).

**3. Frontend-expected types**

Single `NotificationRecord`.

**4. Field comparison**

Same field table as list `results[]` — all fields OK (inferred). No extra detail-only fields on backend.

**5. Fallback/default values found**

- `const row = detailQuery.data ?? notification` — GET failure silently keeps list-row data.
- Expand label shows "Refreshing…" while refetching.

**6. Error handling**

- **Not handled** — no `isError` on detail `useQuery`; falls back to list item.

**7. Business rules / validation in frontend**

- `staleTime: 0` forces refetch on each expand.

```89:95:LSIMS-Frontend/src/features/notifications/notifications-center.tsx
  const detailQuery = useQuery({
    queryKey: notificationKeys.detail(notification.id),
    queryFn: () => fetchNotification(notification.id),
    enabled: expanded,
    staleTime: 0,
  });
  const row = detailQuery.data ?? notification;
```

---

### `PATCH /api/notifications/inbox/{id}/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/notifications/api.ts` | API layer | `patchNotificationRead` |
| `LSIMS-Frontend/src/features/notifications/notifications-center.tsx` | per-row toggle | `patchNotificationRead` |
| `LSIMS-Frontend/src/components/notifications/notification-bell.tsx` | "Read" button | `patchNotificationRead` |

**3. Frontend-expected types**

Request body: `{ read: boolean }`.  
Response: full `NotificationRecord` — **response data not read**; queries invalidated instead.

**4. Field comparison**

| Field | Verdict | Notes |
|-------|---------|-------|
| Request `read` | OK | Maps to `NotificationPartialUpdateSerializer` |
| Response | OK | Full serializer output (inferred); FE ignores |

**5. Fallback/default values found**

- Toggle sends `!row.is_read` (read ↔ unread).

**6. Error handling**

- Both center and bell: `onError: toast.error(getApiErrorMessage(e))`.

**7. Business rules / validation in frontend**

- Bell only offers mark-read (`read: true`), not mark-unread.

```39:46:LSIMS-Frontend/src/features/notifications/api.ts
export async function patchNotificationRead(
  id: string,
  read: boolean,
): Promise<NotificationRecord> {
  const { data } = await apiClient.patch<NotificationRecord>(`${BASE}/${id}/`, {
    read,
  });
  return data;
}
```

---

### `DELETE /api/notifications/inbox/{id}/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/notifications/api.ts` | API layer | `deleteNotification` |
| `LSIMS-Frontend/src/features/notifications/notifications-center.tsx` | row Delete | `deleteNotification` |

Not exposed in bell dropdown.

**3. Frontend-expected types**

`Promise<void>` — no response body parsed (expects 204 No Content).

**4. Field comparison**

N/A — empty response.

**5. Fallback/default values found**

- `window.confirm` before delete.

**6. Error handling**

- `onError: toast.error(getApiErrorMessage(e))`; success toast generic.

**7. Business rules / validation in frontend**

- Hard delete with user confirmation only; no undo.

---

### `GET /api/notifications/inbox/unread-count/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/notifications/api.ts` | API layer | `fetchUnreadNotificationCount` |
| `LSIMS-Frontend/src/components/notifications/notification-bell.tsx` | badge count | `fetchUnreadNotificationCount` |

Mounted in `Header`, `StaffDashboardLayout`, `ClientDashboardLayout`.

**3. Frontend-expected types**

API unwraps to `number`: `{ count: number }` → `data.count`.

**4. Field comparison**

| Field | Verdict | Notes |
|-------|---------|-------|
| `count` | OK | Integer; displayed as badge (cap "99+") |

**5. Fallback/default values found**

- `const count = unreadQuery.data ?? 0` — fetch failure shows **zero unread** (no error UI).

**6. Error handling**

- No `isError` on unread query; silent fallback to 0.

**7. Business rules / validation in frontend**

- Query disabled when no `user`; polls every 25s while signed in.

---

### `POST /api/notifications/inbox/mark-all-read/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/notifications/api.ts` | API layer | `markAllNotificationsRead` |
| `LSIMS-Frontend/src/features/notifications/notifications-center.tsx` | bulk action | `markAllNotificationsRead` |
| `LSIMS-Frontend/src/components/notifications/notification-bell.tsx` | header action | `markAllNotificationsRead` |

**3. Frontend-expected types**

Response `{ updated: number }` → returns `data.updated` as number.

**4. Field comparison**

| Field | Verdict | Notes |
|-------|---------|-------|
| `updated` | OK | Shown in success toast |

**5. Fallback/default values found**

- Toast when `n === 0`: "Nothing to mark." / "No unread notifications."

**6. Error handling**

- `onError: toast.error(getApiErrorMessage(e))`.

**7. Business rules / validation in frontend**

- Bell disables button when `count === 0`.

---

### `POST /api/notifications/inbox/mark-all-unread/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/notifications/api.ts` | API layer | `markAllNotificationsUnread` |
| `LSIMS-Frontend/src/features/notifications/notifications-center.tsx` | bulk action | `markAllNotificationsUnread` |

Not wired in bell dropdown.

**3. Frontend-expected types**

Same as mark-all-read: `{ updated: number }`.

**4. Field comparison**

| Field | Verdict | Notes |
|-------|---------|-------|
| `updated` | OK | Toast when zero: "No read notifications." |

**5–7.**

- Same invalidation/error pattern as mark-all-read.

---

## Part 2: Backend Logic

Routing: [LSIMS-Backend/LSIMS-main/notifications/urls.py](LSIMS-Backend/LSIMS-main/notifications/urls.py)

| Path | View / action |
|------|-----------------|
| `inbox/` | `NotificationViewSet` (list, create) |
| `inbox/{pk}/` | retrieve, partial_update, destroy |
| `inbox/unread-count/` | `@action` `unread_count` |
| `inbox/mark-all-read/` | `@action` `mark_all_read` |
| `inbox/mark-all-unread/` | `@action` `mark_all_unread` |

Model: [LSIMS-Backend/LSIMS-main/notifications/models.py](LSIMS-Backend/LSIMS-main/notifications/models.py) — `Notification` with `Kind` choices (`info`, `alert`, `job`, `message`, `system`), `read_at` null = unread, default ordering `-created_at`.

Programmatic creation (not HTTP): [LSIMS-Backend/LSIMS-main/notifications/services.py](LSIMS-Backend/LSIMS-main/notifications/services.py) — `create_notification_for_user`; called from [LSIMS-Backend/LSIMS-main/laboratory/signals.py](LSIMS-Backend/LSIMS-main/laboratory/signals.py) for job workflow events.

---

### `GET /api/notifications/inbox/` — Backend Trace

**8. Response construction**

- **View:** `NotificationViewSet.list` — default DRF pagination (`PAGE_SIZE: 20` in settings).
- **Serializer:** `NotificationSerializer`.
- **Queryset:**

```42:49:LSIMS-Backend/LSIMS-main/notifications/views.py
    def get_queryset(self):
        qs = Notification.objects.filter(recipient=self.request.user)
        unread = self.request.query_params.get("unread")
        if unread == "1":
            qs = qs.filter(read_at__isnull=True)
        elif unread == "0":
            qs = qs.filter(read_at__isnull=False)
        return qs
```

- **`is_read`:** computed `SerializerMethodField` — `read_at is not None`.
- **`kind` filter:** `DjangoFilterBackend` + `filterset_fields = ["kind"]`.
- **`unread` filter:** custom query param (not django-filter field).

**9. Error messages**

| Message/Shape | Trigger | Enforced In | FE Displays? |
|---------------|---------|-------------|--------------|
| 401 | Unauthenticated | `IsAuthenticated` | Center yes; bell silent (count 0) |
| Invalid page | Out-of-range page | DRF pagination | Unclear |

**10. State machine** — N/A (read-only list).

**11. Permissions**

| Action | Roles | Object check |
|--------|-------|--------------|
| GET list | Any authenticated user | `recipient=request.user` |

---

### `POST /api/notifications/inbox/` — Backend Trace

**8. Response construction**

- **Serializer (write):** `NotificationCreateSerializer` — `recipient`, `title`, `body`, `kind`, `metadata`.
- **Serializer (response):** `NotificationSerializer` after create (201).
- **`recipient`:** `UserIdentityField` — email (case-insensitive) or UUID pk.

```58:65:LSIMS-Backend/LSIMS-main/notifications/views.py
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        instance = serializer.instance
        out = NotificationSerializer(instance, context=self.get_serializer_context())
        headers = self.get_success_headers(out.data)
        return Response(out.data, status=status.HTTP_201_CREATED, headers=headers)
```

**9. Error messages**

| Message/Shape | Trigger | Enforced In | FE Displays? |
|---------------|---------|-------------|--------------|
| `{"recipient": ["No matching user for this email or id."]}` | Unknown recipient | `UserIdentityField` | Yes (toast) |
| `{"title": ["Title is required."]}` | Blank title after strip | `NotificationCreateSerializer.validate_title` | Yes |
| `{"body": ["Body is required."]}` | Blank body after strip | `NotificationCreateSerializer.validate_body` | Yes |
| 403 `"Admin or Receptionist access required."` | Non admin/receptionist create | `IsAdminOrReceptionist` | Yes |
| Invalid `kind` choice | Bad kind value | Model choices | Yes |

**10. State machine** — N/A (create only).

**11. Permissions**

| Action | Roles |
|--------|-------|
| POST create | `IsAuthenticated` + `IsAdminOrReceptionist` (or superuser) |

```37:40:LSIMS-Backend/LSIMS-main/notifications/views.py
    def get_permissions(self):
        if self.action == "create":
            return [IsAuthenticated(), IsAdminOrReceptionist()]
        return [IsAuthenticated()]
```

---

### `GET /api/notifications/inbox/{id}/` — Backend Trace

**8. Response construction**

- **Serializer:** `NotificationSerializer` (same as list item).
- **Object lookup:** scoped queryset → other users' IDs return 404.

**9. Error messages**

| Message/Shape | Trigger | Enforced In | FE Displays? |
|---------------|---------|-------------|--------------|
| 404 | ID not in user's inbox | Filtered queryset | No (fallback to list row) |
| 401 | Unauthenticated | `IsAuthenticated` | No |

**10. State machine** — N/A.

**11. Permissions**

| Action | Roles | Object check |
|--------|-------|--------------|
| GET retrieve | Any authenticated user | Must be recipient |

---

### `PATCH /api/notifications/inbox/{id}/` — Backend Trace

**8. Response construction**

- **Write serializer:** `NotificationPartialUpdateSerializer` — write-only `read: boolean`.
- **Response:** full `NotificationSerializer` after save.

```48:55:LSIMS-Backend/LSIMS-main/notifications/serializers.py
    def update(self, instance, validated_data):
        read = validated_data.pop("read", None)
        if read is True:
            instance.read_at = timezone.now()
        elif read is False:
            instance.read_at = None
        instance.save(update_fields=["read_at"])
        return instance
```

- PUT not exposed (`http_method_names` excludes `put`).

**9. Error messages**

| Message/Shape | Trigger | Enforced In | FE Displays? |
|---------------|---------|-------------|--------------|
| 404 | Not own notification | Queryset scope | Yes (toast) |
| Empty PATCH body | No `read` field | Serializer allows optional `read` — no-op | N/A |

**10. State machine**

| Transition | Rule |
|------------|------|
| Unread → read | PATCH `{ "read": true }` sets `read_at = now()` |
| Read → unread | PATCH `{ "read": false }` clears `read_at` |
| Bulk read | `mark-all-read` sets `read_at` on all unread for user |
| Bulk unread | `mark-all-unread` clears `read_at` on all read for user |

**11. Permissions**

| Action | Roles | Object check |
|--------|-------|--------------|
| PATCH | Any authenticated user | Must be recipient |

---

### `DELETE /api/notifications/inbox/{id}/` — Backend Trace

**8. Response construction**

- Standard `ModelViewSet.destroy` — hard delete row (204 No Content).

**9. Error messages**

| Message/Shape | Trigger | Enforced In | FE Displays? |
|---------------|---------|-------------|--------------|
| 404 | Not own notification | Queryset scope | Yes (toast) |

**10. State machine** — terminal (row removed).

**11. Permissions**

| Action | Roles | Object check |
|--------|-------|--------------|
| DELETE | Any authenticated user | Must be recipient |

---

### `GET /api/notifications/inbox/unread-count/` — Backend Trace

**8. Response construction**

```86:92:LSIMS-Backend/LSIMS-main/notifications/views.py
    @action(detail=False, methods=["get"], url_path="unread-count")
    def unread_count(self, request):
        n = Notification.objects.filter(
            recipient=request.user,
            read_at__isnull=True,
        ).count()
        return Response({"count": n})
```

**9. Error messages**

| Message/Shape | Trigger | Enforced In | FE Displays? |
|---------------|---------|-------------|--------------|
| 401 | Unauthenticated | `IsAuthenticated` | No (badge shows 0) |

**10. State machine** — N/A.

**11. Permissions:** any authenticated user, own inbox only.

---

### `POST /api/notifications/inbox/mark-all-read/` — Backend Trace

**8. Response construction**

```99:105:LSIMS-Backend/LSIMS-main/notifications/views.py
    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request):
        updated = Notification.objects.filter(
            recipient=request.user,
            read_at__isnull=True,
        ).update(read_at=timezone.now())
        return Response({"updated": updated}, status=status.HTTP_200_OK)
```

- Request body: none (`request=None` in schema).

**9–11.** Same auth as unread-count; returns count of rows updated.

---

### `POST /api/notifications/inbox/mark-all-unread/` — Backend Trace

**8. Response construction**

```112:118:LSIMS-Backend/LSIMS-main/notifications/views.py
    @action(detail=False, methods=["post"], url_path="mark-all-unread")
    def mark_all_unread(self, request):
        updated = Notification.objects.filter(
            recipient=request.user,
            read_at__isnull=False,
        ).update(read_at=None)
        return Response({"updated": updated}, status=status.HTTP_200_OK)
```

**9–11.** Same pattern as mark-all-read.

---

## Consolidated Tables

### Field-Level Summary (all endpoints)

| Endpoint | Field Name | Frontend Expects | Backend Sends | Computed or Direct? | Match? | Risk if Ignored |
|----------|------------|------------------|---------------|---------------------|--------|-----------------|
| GET list/detail/PATCH | `id` | string | UUID | Direct | OK (inferred) | Keys, mutations |
| GET list/detail/PATCH | `title`, `body` | string | string | Direct | OK | Display |
| GET list/detail/PATCH | `kind` | NotificationKind | choice string | Direct | OK | Filter/badge |
| GET list/detail/PATCH | `metadata` | object | JSON object | Direct | OK | Debug block |
| GET list/detail/PATCH | `read_at` | string\|null | datetime\|null | Direct | OK / UNUSED | Low |
| GET list/detail/PATCH | `is_read` | boolean | boolean | Computed | OK | **High** — UI state |
| GET list/detail/PATCH | `created_at` | string | datetime | Direct | OK | Sort/display |
| GET list | `count`, `results` | paginated | paginated | Pagination | OK (inferred) | Page nav |
| GET list | `next`, `previous` | string\|null | same | Pagination | UNUSED | None |
| POST create | `recipient` | email string | User FK (write) | Field transform | OK | **High** — delivery target |
| POST mark-all-* | `updated` | number | integer | View response | OK (inferred) | Toast only |
| GET unread-count | `count` | number | integer | View response | OK (inferred) | **High** — badge |
| DELETE | body | void | empty 204 | N/A | OK | — |

### Backend Logic Summary

| Endpoint | Error Message / Rule | Triggering Condition | Enforced In | Frontend Displays It? |
|----------|---------------------|----------------------|-------------|----------------------|
| POST inbox | Admin or Receptionist access required | Non admin/receptionist create | `IsAdminOrReceptionist` | Yes |
| POST inbox | No matching user for this email or id | Bad recipient | `UserIdentityField` | Yes |
| POST inbox | Title is required / Body is required | Blank after strip | `NotificationCreateSerializer` | Yes |
| GET/PATCH/DELETE `{id}` | 404 | Other user's notification | Scoped queryset | Varies |
| GET list | Own inbox only | Always | `get_queryset` filter | — |
| GET list | `unread=1` / `unread=0` | Query param | `get_queryset` | Yes (filter UI) |
| GET list | `kind=` filter | Query param | `DjangoFilterBackend` | Yes |
| All authenticated | 401 | No JWT | DRF auth | Varies |

### Final Summary

| Endpoint | Method | Used in Frontend | Where Used | Response Match | Backend Rule Traced | Notes |
|----------|--------|------------------|------------|----------------|---------------------|-------|
| `/api/notifications/inbox/` | GET | Yes | Center, bell | Inferred OK | Yes | List URL no trailing slash in FE |
| `/api/notifications/inbox/` | POST | Yes | Staff send form | Inferred OK | Yes | Admin/receptionist only |
| `/api/notifications/inbox/{id}/` | GET | Yes | Lazy expand | Inferred OK | Yes | Redundant vs list row |
| `/api/notifications/inbox/{id}/` | PATCH | Yes | Center, bell | Inferred OK | Yes | `{ read: boolean }` only |
| `/api/notifications/inbox/{id}/` | DELETE | Yes | Center only | OK | Yes | Hard delete, confirm dialog |
| `/api/notifications/inbox/unread-count/` | GET | Yes | Bell badge | Inferred OK | Yes | Silent 0 on error |
| `/api/notifications/inbox/mark-all-read/` | POST | Yes | Center, bell | Inferred OK | Yes | Empty body |
| `/api/notifications/inbox/mark-all-unread/` | POST | Yes | Center only | Inferred OK | Yes | Not in bell |

---

## Highest-Risk Findings

1. **Unread badge silent failure** — `NotificationBell` uses `unreadQuery.data ?? 0` with no error UI; network/auth errors show zero unread.
2. **Redundant detail fetch** — `fetchNotification` on expand returns same fields as list; adds latency and hides GET errors via list-row fallback.
3. **Trailing slash inconsistency** — list/create hit `/api/notifications/inbox` without slash; detail/actions use trailing slash — depends on redirect behavior.
4. **No backend tests** — inbox scoping, create permissions, bulk actions, and filter params untested in dedicated suite.
5. **Hard delete** — DELETE permanently removes rows; no soft-archive; staff cannot recall sent messages via API.
6. **Bell recent list masks errors** — empty state indistinguishable from fetch failure.
7. **Programmatic vs HTTP create** — job signals create notifications server-side; clients may see duplicates or timing gaps vs poll interval (~25–30s).
8. **`fetchNotification` export** — only used for optional expand; could be removed if list remains source of truth.

---

## Open Questions / Needs Manual Verification

- Real JSON samples for paginated list, create 201, PATCH response, and `{ count }` / `{ updated }` action payloads (field types, datetime format).
- Whether Django redirects `GET /api/notifications/inbox` → `.../inbox/` without CORS/preflight issues in production.
- Exact 403/404 JSON shape when accessing another user's notification ID (direct URL tampering).
- Behavior when PATCH omits `read` or sends invalid JSON — silent no-op vs validation error.
- Whether `metadata` from laboratory signals contains fields the UI should link (e.g. job id) instead of raw JSON dump.
- Default DRF page size if settings change — frontend hardcodes `PAGE_SIZE = 20`.
- Whether inactive recipient users should reject POST create (currently resolves user if exists).
- DELETE on already-deleted id — 404 handling in UI after concurrent delete.
