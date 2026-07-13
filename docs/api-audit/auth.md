# Auth API Audit — `/api/auth/`

**Audited:** July 13, 2026  
**Swagger source:** No pasted JSON  
**Test coverage:** [LSIMS-Backend/LSIMS-main/accounts/tests.py](LSIMS-Backend/LSIMS-main/accounts/tests.py) — `JWTAuthTests`, `PasswordResetOTPTests`, and edge-case login tests cover token obtain/refresh, password reset OTP, and deactivated-user denial; no dedicated public-registration test class found

---

## Table of Contents

- [Overview](#overview)
- [Part 1: Frontend Usage](#part-1-frontend-usage)
  - [POST /api/auth/register/](#post-apiauthregister)
  - [POST /api/auth/token/](#post-apiauthtoken)
  - [POST /api/auth/token/refresh/](#post-apiauthtokenrefresh)
  - [POST /api/auth/password-reset-request/](#post-apiauthpassword-reset-request)
  - [POST /api/auth/password-reset-confirm/](#post-apiauthpassword-reset-confirm)
- [Part 2: Backend Logic](#part-2-backend-logic)
  - [POST /api/auth/register/ and POST /api/auth/register](#post-apiauthregister-and-post-apiauthregister)
  - [POST /api/auth/token/](#post-apiauthtoken-1)
  - [POST /api/auth/token/refresh/](#post-apiauthtokenrefresh-1)
  - [POST /api/auth/password-reset-request/](#post-apiauthpassword-reset-request-1)
  - [POST /api/auth/password-reset-confirm/](#post-apiauthpassword-reset-confirm-1)
- [Consolidated Tables](#consolidated-tables)
- [Highest-Risk Findings](#highest-risk-findings)
- [Open Questions / Needs Manual Verification](#open-questions--needs-manual-verification)

---

## Overview

The Auth API provides public, unauthenticated endpoints for client self-registration, JWT login and refresh, and email OTP password recovery. All routes live under `/api/auth/` and are wired in [LSIMS-Backend/LSIMS-main/accounts/auth_urls.py](LSIMS-Backend/LSIMS-main/accounts/auth_urls.py). After login or registration, the frontend bootstraps session state via `GET /api/accounts/profile/` (covered in [docs/api-audit/accounts.md](docs/api-audit/accounts.md)).

This audit covers **6 HTTP operations** (5 used by the frontend, plus one backend-only duplicate registration path).

| Method | Path | Description | Used in Frontend |
|--------|------|-------------|------------------|
| POST | `/api/auth/register/` | Public external client signup + JWT | Yes |
| POST | `/api/auth/register` | Same handler, no trailing slash | No (backend-only duplicate) |
| POST | `/api/auth/token/` | Obtain JWT access + refresh pair | Yes |
| POST | `/api/auth/token/refresh/` | Refresh access token | Yes (interceptor) |
| POST | `/api/auth/password-reset-request/` | Request email OTP | Yes |
| POST | `/api/auth/password-reset-confirm/` | Confirm OTP + set new password | Yes |

---

## Part 1: Frontend Usage

Shared types used across auth endpoints:

- **`TokenPair`** — [LSIMS-Frontend/src/types/auth.ts](LSIMS-Frontend/src/types/auth.ts) (login, register response subset)
- **`RegisterResponse`** — [LSIMS-Frontend/src/types/auth.ts](LSIMS-Frontend/src/types/auth.ts) (`TokenPair` + `user: AuthUser`)
- **`AuthUser`** — [LSIMS-Frontend/src/types/auth.ts](LSIMS-Frontend/src/types/auth.ts) (register response `user`; login uses profile GET instead)
- **`RegisterPayload`** — [LSIMS-Frontend/src/features/auth/api.ts](LSIMS-Frontend/src/features/auth/api.ts)

Token storage: [LSIMS-Frontend/src/lib/auth-storage.ts](LSIMS-Frontend/src/lib/auth-storage.ts) (`sessionStorage` keys `lsims_access`, `lsims_refresh`).

---

### `POST /api/auth/register/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/auth/api.ts` | API layer | `registerRequest` |
| `LSIMS-Frontend/src/pages/auth/signup/SignupPage.tsx` | `SignupPage` | `registerRequest` |

Re-export shim: `LSIMS-Frontend/src/pages/auth/SignupPage.tsx` → `./signup/SignupPage`.

**Note:** Frontend posts to `/api/auth/register/` **with trailing slash**. It does **not** call `/api/auth/register` (no slash).

**3. Frontend-expected types**

Request (`RegisterPayload`):

```typescript
// LSIMS-Frontend/src/features/auth/api.ts
export type RegisterPayload = {
  email: string;
  password: string;
  password_confirm: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  nationality?: string;
  organization_name?: string;
  organization_type?: string;
};
```

Response (`RegisterResponse`):

```typescript
// LSIMS-Frontend/src/types/auth.ts
export type RegisterResponse = TokenPair & {
  user: AuthUser;
};
```

**4. Field comparison vs. real response JSON**

No pasted Swagger/response JSON for this audit. Verdicts below are inferred from backend serializer/view code only.

| Field | Verdict | Notes |
|-------|---------|-------|
| `access` | unclear - needs manual check | FE expects string JWT |
| `refresh` | unclear - needs manual check | FE expects string JWT |
| `user` | unclear - needs manual check | Nested `AuthUser` / `UserSerializer` shape |
| `user.id` | unclear - needs manual check | Typed as string (UUID) |
| `user.username` | unclear - needs manual check | Backend sets `username=email` on create |
| `user.email` | unclear - needs manual check | Lowercased on backend create |
| `user.first_name`, `user.last_name`, `user.phone` | unclear - needs manual check | Optional on request; model defaults |
| `user.user_type` | unclear - needs manual check | Backend forces `external` |
| `user.role`, `user.role_detail` | unclear - needs manual check | Expected `null` for new external clients |
| `user.department` | unclear - needs manual check | Expected `null` |
| `user.country`, `user.nationality` | unclear - needs manual check | Model defaults; FE signup form does not send `nationality` or `organization_type` |
| `user.organization_name`, `user.organization_type` | unclear - needs manual check | Optional on request |
| `user.is_active`, `user.is_superuser`, `user.date_joined` | unclear - needs manual check | Present in `UserSerializer` read output |

Request fields **not sent by SignupPage** but allowed by API type: `nationality`, `organization_type`.

**5. Fallback/default values found**

- Signup form omits empty optional strings (`undefined` rather than `""`):

```37:45:LSIMS-Frontend/src/pages/auth/signup/SignupPage.tsx
      const res = await registerRequest({
        email: values.email,
        password: values.password,
        password_confirm: values.passwordConfirm,
        first_name: values.first_name || undefined,
        last_name: values.last_name || undefined,
        organization_name: values.organization_name || undefined,
        phone: values.phone || undefined,
      });
```

- Post-register navigation hard-coded to `/client` (not role-aware via `getDashboardPath`).

**6. Error handling**

- `SignupPage` catch: `toast.error(getApiErrorMessage(e))`.
- `getApiErrorMessage` ([LSIMS-Frontend/src/lib/api-error.ts](LSIMS-Frontend/src/lib/api-error.ts)) surfaces first field error string or `detail`; no special-case for 409 duplicate email.

**7. Business rules / validation in frontend**

Client-side Zod schema before API call:

```3:16:LSIMS-Frontend/src/pages/auth/signup/signup-schema.ts
export const signupSchema = z
  .object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "At least 8 characters"),
    passwordConfirm: z.string().min(8, "Confirm your password"),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    organization_name: z.string().optional(),
    phone: z.string().optional(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords do not match",
    path: ["passwordConfirm"],
  });
```

- Password match validated client-side **and** server-side (`password_confirm` field).
- On success: tokens stored, `res.user` set directly (no follow-up profile GET).

---

### `POST /api/auth/token/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/auth/api.ts` | API layer | `loginRequest` |
| `LSIMS-Frontend/src/pages/auth/login/LoginPage.tsx` | `LoginPage` | `loginRequest` |

Re-export shim: `LSIMS-Frontend/src/pages/auth/LoginPage.tsx` → `./login/LoginPage`.

Login flow also calls `fetchProfile()` (`GET /api/accounts/profile/`) immediately after token obtain — not part of this endpoint but session-critical.

**3. Frontend-expected types**

Request body (inline in `loginRequest`):

```typescript
{ email: string; password: string }
```

Response (`TokenPair`):

```typescript
export type TokenPair = {
  access: string;
  refresh: string;
};
```

**4. Field comparison vs. real response JSON**

| Field | Verdict | Notes |
|-------|---------|-------|
| `access` | unclear - needs manual check | Stored via `authStorage.setTokens` |
| `refresh` | unclear - needs manual check | Stored via `authStorage.setTokens` |
| (request) `email` | unclear - needs manual check | User model `USERNAME_FIELD = "email"`; SimpleJWT uses that field |
| (request) `password` | unclear - needs manual check | Standard credential |

SimpleJWT default response is `{ access, refresh }` only — no `user` object (unlike register).

**5. Fallback/default values found**

- None on token response.
- Login form defaults: `{ email: "", password: "" }`.

**6. Error handling**

- `LoginPage` catch: `toast.error(getApiErrorMessage(e))`.
- Failed login typically 401; `getApiErrorMessage` returns `"Invalid email or password, or session expired."` when no structured body.
- **Profile fetch after login** shares the same try/catch — profile failure shows same toast as login failure (no distinct message).
- `apiClient` interceptor excludes `/api/auth/token/` from automatic refresh retry (`isAuthPath`).

**7. Business rules / validation in frontend**

```3:6:LSIMS-Frontend/src/pages/auth/login/login-schema.ts
export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
```

Post-login routing uses role-aware dashboard path:

```30:35:LSIMS-Frontend/src/pages/auth/login/LoginPage.tsx
      const tokens = await loginRequest(values.email, values.password);
      setTokens(tokens.access, tokens.refresh);
      const user = await fetchProfile();
      setUser(user);
      toast.success("Signed in.");
      navigate(getDashboardPath(user), { replace: true });
```

---

### `POST /api/auth/token/refresh/`

**1. Called in frontend?** Yes (not from auth pages — Axios interceptor)

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/api/token-refresh.ts` | Token refresh helper | `refreshAccessToken` |
| `LSIMS-Frontend/src/api/client.ts` | Axios response interceptor | `refreshAccessToken` on 401 |

**3. Frontend-expected types**

Request:

```typescript
{ refresh: string }
```

Response:

```typescript
{ access: string }
```

Uses standalone `axios.post` (not `apiClient`) to avoid interceptor recursion.

**4. Field comparison vs. real response JSON**

| Field | Verdict | Notes |
|-------|---------|-------|
| (request) `refresh` | unclear - needs manual check | Read from `authStorage.getRefresh()` |
| `access` | unclear - needs manual check | Written to storage via `authStorage.setAccess` |
| `refresh` (response) | N/A | FE does not expect rotated refresh; backend `ROTATE_REFRESH_TOKENS: False` |

**5. Fallback/default values found**

- If no refresh token in storage: throws `Error("No refresh token")` before HTTP call.
- Interceptor deduplicates concurrent refresh attempts via shared `refreshPromise`.

**6. Error handling**

- Refresh failure in interceptor: `useAuthStore.getState().clearSession()` then re-rejects original error.
- No user-facing toast from interceptor — caller sees failed original request.
- Refresh endpoint not in `isAuthPath` skip list for 401 retry (only token obtain and register are skipped).

**7. Business rules / validation in frontend**

```6:18:LSIMS-Frontend/src/api/token-refresh.ts
export async function refreshAccessToken(): Promise<string> {
  const refresh = authStorage.getRefresh();
  if (!refresh) {
    throw new Error("No refresh token");
  }
  const base = env.apiBaseUrl.replace(/\/$/, "");
  const { data } = await axios.post<{ access: string }>(
    `${base}/api/auth/token/refresh/`,
    { refresh },
    { headers: { "Content-Type": "application/json" } },
  );
  authStorage.setAccess(data.access);
  return data.access;
```

Session bootstrap ([LSIMS-Frontend/src/stores/auth-store.ts](LSIMS-Frontend/src/stores/auth-store.ts)) uses stored access token + profile GET; does not proactively refresh before expiry.

---

### `POST /api/auth/password-reset-request/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/auth/api.ts` | API layer | `requestPasswordReset` |
| `LSIMS-Frontend/src/pages/auth/forgot-password/ForgotPasswordPage.tsx` | `ForgotPasswordPage` step `"request"` | `requestPasswordReset` |

Re-export shim: `LSIMS-Frontend/src/pages/auth/ForgotPasswordPage.tsx` → `./forgot-password/ForgotPasswordPage`.

**3. Frontend-expected types**

Request: `{ email: string }`

Response: `{ detail: string }` — **response body not read** after success.

**4. Field comparison vs. real response JSON**

| Field | Verdict | Notes |
|-------|---------|-------|
| (request) `email` | unclear - needs manual check | FE trims + lowercases before POST |
| `detail` | unclear - needs manual check | Backend constant `PASSWORD_RESET_SUCCESS`; FE ignores value |

**5. Fallback/default values found**

- Email normalized: `values.email.trim().toLowerCase()`.
- Success toast is **hard-coded**, not from API `detail`:

```71:71:LSIMS-Frontend/src/pages/auth/forgot-password/ForgotPasswordPage.tsx
      toast.success("If that account exists, a reset code was sent to your email.");
```

**6. Error handling**

- `toast.error(getApiErrorMessage(e))` on failure.
- Backend returns 200 even for unknown emails (anti-enumeration); FE toast wording aligns with that behavior.

**7. Business rules / validation in frontend**

Request-step Zod:

```20:22:LSIMS-Frontend/src/pages/auth/forgot-password/ForgotPasswordPage.tsx
const requestSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});
```

On success, advances to OTP confirm step and pre-fills confirm form email via `setEmailForReset` / `confirmForm.setValue("email", email)`.

---

### `POST /api/auth/password-reset-confirm/`

**1. Called in frontend?** Yes

**2. Call sites**

| File | Component/Context | Function(s) |
|------|-------------------|-------------|
| `LSIMS-Frontend/src/features/auth/api.ts` | API layer | `confirmPasswordReset` |
| `LSIMS-Frontend/src/pages/auth/forgot-password/ForgotPasswordPage.tsx` | `ForgotPasswordPage` step `"confirm"` | `confirmPasswordReset` |

**3. Frontend-expected types**

Request (API layer):

```typescript
{ email: string; otp: string; new_password: string }
```

Form also collects `confirm_password` (client-only, not sent).

Response: `{ detail: string }` — not read; success toast hard-coded.

**4. Field comparison vs. real response JSON**

| Field | Verdict | Notes |
|-------|---------|-------|
| (request) `email` | unclear - needs manual check | Trimmed + lowercased |
| (request) `otp` | unclear - needs manual check | FE: 6-digit numeric; BE: `min_length=6, max_length=6`, digits only |
| (request) `new_password` | unclear - needs manual check | FE min 8; BE min 8 + Django validators |
| `detail` | unclear - needs manual check | Backend: `"Password reset successfully."`; FE ignores |

**5. Fallback/default values found**

- OTP trimmed: `values.otp.trim()`.
- `confirm_password` validated in Zod refine only; stripped before API call.

**6. Error handling**

- `toast.error(getApiErrorMessage(e))` — should surface `{"otp": ["Invalid or expired OTP."]}` from backend field errors.
- Success navigates to `/login` with hard-coded toast (not API `detail`).

**7. Business rules / validation in frontend**

```24:37:LSIMS-Frontend/src/pages/auth/forgot-password/ForgotPasswordPage.tsx
const confirmSchema = z
  .object({
    email: z.string().email(),
    otp: z
      .string()
      .length(6, "OTP must be 6 digits")
      .regex(/^\d+$/, "OTP must be numeric"),
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });
```

---

## Part 2: Backend Logic

Routing: [LSIMS-Backend/LSIMS-main/accounts/auth_urls.py](LSIMS-Backend/LSIMS-main/accounts/auth_urls.py)

| Path | View |
|------|------|
| `register` | `RegisterView` (no slash — backend-only from FE perspective) |
| `register/` | `RegisterView` (slash — FE uses this) |
| `token/` | `TokenObtainPairView` (SimpleJWT) |
| `token/refresh/` | `TokenRefreshView` (SimpleJWT) |
| `password-reset-request/` | `PasswordResetRequestView` |
| `password-reset-confirm/` | `PasswordResetConfirmView` |

Mounted at `/api/auth/` via [LSIMS-Backend/LSIMS-main/lsims_project/urls.py](LSIMS-Backend/LSIMS-main/lsims_project/urls.py).

---

### `POST /api/auth/register/` and `POST /api/auth/register`

**8. Response construction**

- **View:** `RegisterView` — `generics.CreateAPIView`, `permission_classes = [AllowAny]`.
- **Serializer:** `UserRegisterSerializer` — creates external user, sets `username=email`, `user_type=EXTERNAL`.
- **Response payload** (custom `create`, not default serializer output):

```231:241:LSIMS-Backend/LSIMS-main/accounts/views.py
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        payload = {
            "user": UserSerializer(user).data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }
        return Response(payload, status=status.HTTP_201_CREATED)
```

- **`user` nested object:** `UserSerializer` — includes `role_detail` computed via `RoleListSerializer(source="role")`.
- **Duplicate URL:** Both `register` and `register/` bind to the same view; Django serves either depending on `APPEND_SLASH` and client path. Frontend explicitly uses trailing slash.

**9. Error messages**

| Message/Shape | Trigger | Enforced In | FE Displays? |
|---------------|---------|-------------|--------------|
| `{"password_confirm": ["Passwords do not match."]}` | Mismatched passwords | `UserRegisterSerializer.validate` | Yes (via `getApiErrorMessage`) |
| Password min length 8 | Short password | `UserRegisterSerializer` field | Yes |
| Duplicate email / unique constraint | Existing email | Model/DB — exact JSON unclear | Yes (likely field error) |
| Django password validators | Weak password | `set_password` / validators — unclear if invoked on register | unclear - needs manual check |
| 400 validation errors | Missing required `email`/`password` | DRF serializer | Yes |

**10. State machine**

| Transition | Rule |
|------------|------|
| (none) → active external user | Registration creates user with `user_type=external`, `is_active=True` (model default) |
| N/A | No approval workflow on public register |

**11. Permissions**

| Action | Roles | Object check |
|--------|-------|--------------|
| POST register | AllowAny (public) | N/A |

---

### `POST /api/auth/token/`

**8. Response construction**

- **View:** `TokenObtainPairView` (SimpleJWT stock view).
- **User model:** `USERNAME_FIELD = "email"` — serializer accepts `email` + `password` (verified in `JWTAuthTests`).
- **Response:** `{ "access": "<jwt>", "refresh": "<jwt>" }` — no user profile embedded.
- **Settings:** [LSIMS-Backend/LSIMS-main/lsims_project/settings.py](LSIMS-Backend/LSIMS-main/lsims_project/settings.py) — access 60 min, refresh 7 days, no rotation/blacklist.

**9. Error messages**

| Message/Shape | Trigger | Enforced In | FE Displays? |
|---------------|---------|-------------|--------------|
| 401 Unauthorized | Wrong password, unknown email, inactive user | SimpleJWT authenticate | Yes (generic 401 message) |
| `{"detail": "..."}` | SimpleJWT default — exact string unclear | TokenObtainPairView | Yes if string `detail` present |

**10. State machine**

| Transition | Rule |
|------------|------|
| Login denied | `is_active=False` users cannot obtain token (tested: `test_deactivated_user_cannot_login`) |

**11. Permissions**

| Action | Roles | Object check |
|--------|-------|--------------|
| POST token | AllowAny | Active user credentials only |

---

### `POST /api/auth/token/refresh/`

**8. Response construction**

- **View:** `TokenRefreshView` (SimpleJWT stock).
- **Request:** `{ "refresh": "<jwt>" }`.
- **Response:** `{ "access": "<jwt>" }` when valid.
- **No refresh rotation** — same refresh token remains valid until expiry (`ROTATE_REFRESH_TOKENS: False`).

**9. Error messages**

| Message/Shape | Trigger | Enforced In | FE Displays? |
|---------------|---------|-------------|--------------|
| 401 Unauthorized | Invalid/expired refresh token | `TokenRefreshView` | No direct toast; session cleared in interceptor |

**10. State machine** — N/A (stateless JWT refresh).

**11. Permissions**

| Action | Roles | Object check |
|--------|-------|--------------|
| POST refresh | AllowAny | Valid refresh JWT only |

---

### `POST /api/auth/password-reset-request/`

**8. Response construction**

- **View:** `PasswordResetRequestView` — `AllowAny`.
- **Serializer:** `PasswordResetRequestSerializer` — single field `email`.
- **Logic:** If active user exists: invalidate prior unused OTPs, create new `OTPToken`, send email via `send_mail` (15-minute expiry stated in email body).
- **Always returns 200** with same message whether or not user exists:

```36:38:LSIMS-Backend/LSIMS-main/accounts/views.py
PASSWORD_RESET_SUCCESS = (
    "If an active account exists for that email, a password reset OTP has been sent."
)
```

**9. Error messages**

| Message/Shape | Trigger | Enforced In | FE Displays? |
|---------------|---------|-------------|--------------|
| `{"detail": PASSWORD_RESET_SUCCESS}` | Always on success path | `PasswordResetRequestView.post` | No (FE uses own toast text) |
| Invalid email format | Bad email | `EmailField` validation | Yes |
| Email send failure | SMTP error | `send_mail(fail_silently=False)` | Yes (500/exception) |

**10. State machine**

| Transition | Rule |
|------------|------|
| New OTP request | Marks all prior unused OTPs for user as used, then creates fresh OTP |
| Nonexistent email | No OTP created, no email sent, still 200 |

**11. Permissions**

| Action | Roles | Object check |
|--------|-------|--------------|
| POST password-reset-request | AllowAny | Active users only receive OTP |

---

### `POST /api/auth/password-reset-confirm/`

**8. Response construction**

- **View:** `PasswordResetConfirmView` — `AllowAny`.
- **Serializer:** `PasswordResetConfirmSerializer` — validates OTP against latest unused non-expired `OTPToken`, sets password, marks token used.
- **Success response:** `{"detail": "Password reset successfully."}` HTTP 200.

```288:294:LSIMS-Backend/LSIMS-main/accounts/serializers.py
    def save(self, **kwargs):
        user = self.validated_data["user"]
        token = self.validated_data["token"]
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        token.mark_used()
        return user
```

**9. Error messages**

| Message/Shape | Trigger | Enforced In | FE Displays? |
|---------------|---------|-------------|--------------|
| `{"otp": ["Invalid or expired OTP."]}` | Wrong OTP, expired, unknown email, reused OTP | `PasswordResetConfirmSerializer.validate` | Yes |
| `{"otp": ["OTP must be a 6-digit code."]}` | Non-numeric OTP | `validate_otp` | Yes |
| Django password validators | Weak `new_password` | `validate_new_password` | Yes |
| Min length 8 | Short password | field `min_length=8` | Yes |

**10. State machine**

| Transition | Rule |
|------------|------|
| Valid OTP → password changed | OTP marked `is_used=True` |
| Reused OTP | Second confirm with same OTP → 400 (tested) |
| Expired OTP | 400, password unchanged (tested) |

**11. Permissions**

| Action | Roles | Object check |
|--------|-------|--------------|
| POST password-reset-confirm | AllowAny | Must match active user + valid OTP |

---

## Consolidated Tables

### Field-Level Summary (all endpoints)

| Endpoint | Field Name | Frontend Expects | Backend Sends | Computed or Direct? | Match? | Risk if Ignored |
|----------|------------|------------------|---------------|---------------------|--------|-----------------|
| POST register/ | `access`, `refresh` | string JWT | string JWT | SimpleJWT | unclear - needs manual check | Session broken |
| POST register/ | `user` | `AuthUser` | `UserSerializer` | Mixed | unclear - needs manual check | Wrong dashboard/role UI |
| POST register/ | `user.role`, `user.role_detail` | null | likely null | Direct/computed | unclear - needs manual check | Client routing |
| POST register/ | request `password_confirm` | string | consumed, not stored | Serializer | OK | Registration fails if omitted |
| POST register/ | request `nationality`, `organization_type` | optional | model defaults if omitted | Direct | unclear - needs manual check | Incomplete client profile |
| POST token/ | `access`, `refresh` | string | string | SimpleJWT | unclear - needs manual check | Session broken |
| POST token/ | request `email` | string | auth identifier | USERNAME_FIELD | unclear - needs manual check | Login fails |
| POST token/refresh/ | `access` | string | string | SimpleJWT | unclear - needs manual check | Silent session loss after expiry |
| POST token/refresh/ | request `refresh` | string | string | Client storage | unclear - needs manual check | Refresh fails |
| POST password-reset-request/ | `detail` | string (ignored) | constant string | View | unclear - needs manual check | Low (FE hard-codes toast) |
| POST password-reset-confirm/ | `detail` | string (ignored) | `"Password reset successfully."` | View | unclear - needs manual check | Low |
| POST password-reset-confirm/ | request `otp` | 6-digit string | validated against hash | Model method | unclear - needs manual check | Reset fails |

### Backend Logic Summary

| Endpoint | Error Message / Rule | Triggering Condition | Enforced In | Frontend Displays It? |
|----------|---------------------|----------------------|-------------|----------------------|
| POST register/ | Passwords do not match | password ≠ password_confirm | `UserRegisterSerializer.validate` | Yes |
| POST register/ | min_length 8 on password fields | Short password | Serializer fields | Yes |
| POST register/ | External user only | Public registration | `UserRegisterSerializer.create` | N/A (implicit) |
| POST token/ | 401 | Bad credentials / inactive user | SimpleJWT | Yes (generic) |
| POST token/refresh/ | 401 | Invalid refresh | SimpleJWT | No (clears session) |
| POST password-reset-request/ | Generic 200 always | Any email | `PasswordResetRequestView` | N/A (anti-enumeration) |
| POST password-reset-request/ | Invalidates old OTPs | New request for existing user | View before `create_for_user` | N/A |
| POST password-reset-confirm/ | Invalid or expired OTP | Bad/expired/reused OTP | `PasswordResetConfirmSerializer` | Yes |
| POST password-reset-confirm/ | OTP must be 6-digit code | Non-numeric | `validate_otp` | Yes |
| All auth | AllowAny | Public endpoints | `permission_classes` | N/A |

### Final Summary

| Endpoint | Method | Used in Frontend | Where Used | Response Match | Backend Rule Traced | Notes |
|----------|--------|------------------|------------|----------------|---------------------|-------|
| `/api/auth/register/` | POST | Yes | SignupPage | unclear - needs manual check | Yes | FE uses slash URL; sets user from response |
| `/api/auth/register` | POST | No | — | N/A | Yes | Duplicate route, same `RegisterView` |
| `/api/auth/token/` | POST | Yes | LoginPage | unclear - needs manual check | Yes | Followed by profile GET |
| `/api/auth/token/refresh/` | POST | Yes | client.ts interceptor | unclear - needs manual check | Yes | Standalone axios; clears session on fail |
| `/api/auth/password-reset-request/` | POST | Yes | ForgotPasswordPage | unclear - needs manual check | Yes | FE ignores API `detail` text |
| `/api/auth/password-reset-confirm/` | POST | Yes | ForgotPasswordPage | unclear - needs manual check | Yes | OTP errors on `otp` field key |

---

## Highest-Risk Findings

1. **Login profile fetch shares login error handling** — If `loginRequest` succeeds but `fetchProfile` fails, user sees a generic error and remains unnavigated; tokens may already be stored without `user` in auth store.
2. **Register hard-routes to `/client`** — Does not use `getDashboardPath`; fine for external-only registration today but brittle if registration rules change.
3. **Register sets `user` from response, login from profile** — Two sources of truth for `AuthUser`; field drift between `UserSerializer` (register) and `ProfileSelfSerializer` (profile) could cause inconsistent session shape.
4. **No public registration tests in `tests.py`** — JWT and password reset are tested; register endpoint behavior (duplicate email, weak password validators) lacks explicit coverage.
5. **Token refresh failure clears session silently** — Interceptor calls `clearSession()` without toast; user may see unrelated API error on the request that triggered refresh.
6. **Duplicate backend register URLs** — `register` vs `register/` both exist; FE correctly uses slash; misconfigured clients or proxies could hit the wrong variant.
7. **Password reset success toasts ignore API `detail`** — Wording differs slightly from backend constants; low risk but complicates i18n/consistency.
8. **Signup omits `organization_type` and `nationality`** — Backend accepts them; new clients get model defaults (`organization_type=OTHER`, empty nationality) without UI capture.

---

## Open Questions / Needs Manual Verification

- Capture real JSON for register 201 response and compare every `AuthUser` / `UserSerializer` field to frontend types.
- Whether Django `validate_password` runs on public registration (not explicitly called in `UserRegisterSerializer.create`; only on password-reset confirm via `validate_new_password`).
- Exact 400 JSON for duplicate email on `POST /api/auth/register/` (integrity error vs field error shape).
- SimpleJWT 401 response body on failed login — whether `detail` is a string or nested structure for `getApiErrorMessage`.
- Behavior when access token expires mid-session but refresh is still valid — confirm interceptor retry succeeds for all API modules.
- Whether inactive users can complete password reset (backend filters `is_active=True` on lookup).
- Email delivery in production (`send_mail` / SMTP settings) — OTP flow untested from frontend E2E.
- Whether `POST /api/auth/register` without slash is reachable when `APPEND_SLASH=True` and client omits slash (redirect POST body loss risk).
