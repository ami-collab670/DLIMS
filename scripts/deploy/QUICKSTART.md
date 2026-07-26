# Render deploy — do this now

Your Vercel app was pointing at **wrong API URLs** (`lsims-api.onrender.com` does not exist).
The live API is **`https://lsims-api-staging.onrender.com`**. CMS is not deployed yet.

## A. Fix API (Manual Deploy — 2 min)

1. Open **https://dashboard.render.com**
2. Open service **`lsims-api-staging`**
3. Click **Manual Deploy → Deploy latest commit** (branch `master`)
4. Wait until **Live** (runs latest [`build.sh`](../LSIMS-Backend/LSIMS-main/build.sh): migrate, roles, `admin@gie.com`)
5. Test: **https://lsims-api-staging.onrender.com/api/docs/**

## B. Deploy CMS + database (Blueprint — 10 min)

If you have **no `lsims-cms` service** yet:

1. **https://dashboard.render.com/blueprints** → **New Blueprint Instance**
2. Repo **`ami-collab670/DLIMS`**, branch **`master`**
3. When asked for variables:

| Variable | Value |
|---|---|
| `APP_KEYS` | `wpsdWlCRcnrnTd5dK4Wfjg==,pPeiERnwZ9YZxQS9CcpAGg==` |
| `PUBLIC_URL` | `https://lsims-cms.onrender.com` |
| `CLIENT_URL` | `https://dlims-wheat.vercel.app` |

4. Apply → wait for **lsims-cms** (and **lsims-db** if missing) to go **Live**

If Blueprint conflicts with existing `lsims-api-staging`, add **lsims-cms** manually:
- New **Web Service** → Docker → root `cms` → Dockerfile `Dockerfile.prod`
- Link same Postgres env vars as in [`render.yaml`](../../render.yaml)

## C. Vercel (already updated by Agent)

Production env should use:

- `VITE_API_BASE_URL` = `https://lsims-api-staging.onrender.com`
- `VITE_CMS_API_BASE_URL` = `https://lsims-cms.onrender.com/api`
- `VITE_PREVIEW_SECRET` = copy from Render **lsims-cms** env `PREVIEW_SECRET`

Frontend URL: **https://dlims-wheat.vercel.app**

## D. After both API and CMS are Live

```powershell
.\scripts\deploy\bootstrap-production.ps1 `
  -ApiUrl "https://lsims-api-staging.onrender.com" `
  -CmsUrl "https://lsims-cms.onrender.com" `
  -FrontendUrl "https://dlims-wheat.vercel.app"
```

## Logins

| System | Email | Password |
|---|---|---|
| Frontend | `admin@gie.com` | `seedpass!` |
| Strapi | `cms@gie.com` | `seedpass!` |
