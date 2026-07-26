# Deploy LSIMS: Vercel + Railway

Production-style client demo deployment:

- **Frontend** → [Vercel](https://vercel.com) (`LSIMS-Frontend/`)
- **Django API** → [Railway](https://railway.com) (`LSIMS-Backend/LSIMS-main/`)
- **Strapi CMS** → Railway (`cms/`)
- **Postgres** → Railway plugin (shared; two databases: default + `cms`)
- **Demo seed** → Railway one-off job or local script

## Credentials (client demo)

| Account | Email | Password |
|---|---|---|
| Django admin / frontend staff login | `admin@gie.com` | `seedpass!` |
| Strapi CMS admin | `cms@gie.com` | `seedpass!` |
| Demo staff / clients | see [DEMO.md](../DEMO.md) | `SeedPass123!` |

## Architecture

```
Browser → Vercel (SPA)
            ├─ VITE_API_BASE_URL → Railway Django API → Postgres (lsims)
            └─ VITE_CMS_API_BASE_URL → Railway Strapi CMS → Postgres (cms)
Strapi preview iframe → Vercel /preview
```

## Prerequisites

- GitHub repo pushed and accessible
- Railway account + Vercel account
- Optional: [Railway CLI](https://docs.railway.com/guides/cli), [Vercel CLI](https://vercel.com/docs/cli)

## 1. Generate secrets (once)

Run locally and save outputs in a password manager:

```powershell
# Django
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Strapi — run each line and save
node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"  # APP_KEY 1
node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"  # APP_KEY 2
node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"  # API_TOKEN_SALT
node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"  # ADMIN_JWT_SECRET
node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"  # JWT_SECRET
node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"  # TRANSFER_TOKEN_SALT
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"  # ENCRYPTION_KEY

# Shared preview secret (same on Strapi + Vercel)
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

Pick one preview secret and use it for both `PREVIEW_SECRET` (CMS) and `VITE_PREVIEW_SECRET` (Vercel).

## 2. Railway project

Create one Railway project connected to your GitHub repo.

### 2.1 Postgres

1. **New → Database → PostgreSQL**
2. Note the connection variables (`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `DATABASE_URL`)

The CMS service creates a second database named `cms` on first boot.

### 2.2 Service: `lsims-backend`

| Setting | Value |
|---|---|
| Root directory | `LSIMS-Backend/LSIMS-main` |
| Builder | Dockerfile ([`Dockerfile`](../LSIMS-Backend/LSIMS-main/Dockerfile)) |
| Config | [`railway.toml`](../LSIMS-Backend/LSIMS-main/railway.toml) |

**Environment variables:**

| Variable | Value |
|---|---|
| `DATABASE_URL` | Reference from Postgres plugin |
| `DJANGO_DEBUG` | `False` |
| `DJANGO_SECRET_KEY` | Generated secret |
| `DJANGO_ALLOWED_HOSTS` | Railway public hostname (e.g. `lsims-backend-production.up.railway.app`) |
| `LSIMS_ADMIN_EMAIL` | `admin@gie.com` |
| `LSIMS_ADMIN_PASSWORD` | `seedpass!` |

**Networking:** Generate a public domain. Copy the URL — needed for Vercel.

Pre-deploy runs [`scripts/railway-release.sh`](../LSIMS-Backend/LSIMS-main/scripts/railway-release.sh): migrate, seed roles, create admin.

### 2.3 Service: `lsims-cms`

| Setting | Value |
|---|---|
| Root directory | `cms` |
| Builder | Dockerfile ([`Dockerfile.prod`](../cms/Dockerfile.prod)) |
| Config | [`railway.toml`](../cms/railway.toml) |

**Environment variables:**

| Variable | Value |
|---|---|
| `DATABASE_CLIENT` | `postgres` |
| `DATABASE_HOST` | From Postgres (`PGHOST`) |
| `DATABASE_PORT` | From Postgres (`PGPORT`) |
| `DATABASE_NAME` | `cms` |
| `DATABASE_USERNAME` | From Postgres (`PGUSER`) |
| `DATABASE_PASSWORD` | From Postgres (`PGPASSWORD`) |
| `DATABASE_SSL` | `true` |
| `DATABASE_SSL_REJECT_UNAUTHORIZED` | `false` (Railway managed Postgres) |
| `APP_KEYS` | Two keys comma-separated |
| `API_TOKEN_SALT` | Generated |
| `ADMIN_JWT_SECRET` | Generated |
| `JWT_SECRET` | Generated |
| `TRANSFER_TOKEN_SALT` | Generated |
| `ENCRYPTION_KEY` | Generated (32-byte base64) |
| `CMS_ADMIN_EMAIL` | `cms@gie.com` |
| `CMS_ADMIN_PASSWORD` | `seedpass!` |
| `CLIENT_URL` | Vercel frontend URL (set after Vercel deploy, then redeploy CMS) |
| `PUBLIC_URL` | This service's Railway public URL |
| `PREVIEW_SECRET` | Shared preview secret |
| `BEHIND_PROXY` | `true` |
| `HOST` | `0.0.0.0` |

**Volume (required for uploads):**

- Mount path: `/opt/app/public/uploads`
- Without this, CMS images are lost on redeploy.

**Networking:** Generate a public domain. Copy the URL — needed for Vercel.

First boot builds Strapi, creates admin user, and auto-seeds CMS content via [`cms/src/index.js`](../cms/src/index.js).

### 2.4 Deploy order (Railway)

1. Postgres
2. `lsims-backend` — wait until healthy (`/api/docs/`)
3. `lsims-cms` — wait until healthy (`/api/home-page` returns data); may take 2–3 minutes

## 3. Vercel frontend

1. **Add New Project** → import GitHub repo
2. **Root Directory:** `LSIMS-Frontend`
3. **Framework Preset:** Vite
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`

**Environment variables (Production):**

| Variable | Example |
|---|---|
| `VITE_API_BASE_URL` | `https://lsims-backend-production.up.railway.app` |
| `VITE_CMS_API_BASE_URL` | `https://lsims-cms-production.up.railway.app/api` |
| `VITE_PREVIEW_SECRET` | Same as CMS `PREVIEW_SECRET` |

Deploy. Copy the Vercel URL, then **update CMS `CLIENT_URL`** to that URL and redeploy CMS.

If API or CMS URLs change, **redeploy Vercel** (env vars are baked at build time).

Config files: [`vercel.json`](../LSIMS-Frontend/vercel.json) (SPA rewrites + Strapi preview CSP).

## 4. Full demo data seed

After backend and CMS are healthy, use the bootstrap helper (requires `railway login` and `vercel login`):

```powershell
# 1. Copy and fill deployment URLs
copy .env.deploy.example .env.deploy

# 2. Seed + verify (after services are live)
.\scripts\deploy\bootstrap-production.ps1
```

Or run steps manually:

### Option A — From your machine (recommended)

```powershell
.\scripts\seed-demo-remote.ps1 `
  -ApiUrl "https://YOUR-BACKEND.up.railway.app" `
  -CmsUrl "https://YOUR-CMS.up.railway.app" `
  -AdminEmail "admin@gie.com" `
  -AdminPassword "seedpass!"
```

### Option B — Railway one-off seed service

| Setting | Value |
|---|---|
| Root directory | repository root |
| Dockerfile | `scripts/deploy/Dockerfile.seed` |
| Config | [`scripts/deploy/railway.toml`](../scripts/deploy/railway.toml) |

**Environment variables:**

| Variable | Value |
|---|---|
| `LSIMS_API_URL` | Backend public URL |
| `LSIMS_CMS_URL` | CMS public URL |
| `LSIMS_ADMIN_EMAIL` | `admin@gie.com` |
| `LSIMS_ADMIN_PASSWORD` | `seedpass!` |

Deploy once, verify logs, then remove or disable the service.

### What gets seeded

- CMS marketing content (also on Strapi bootstrap)
- 4 departments, 74-test catalog, demo staff, 2 clients
- 2 end-to-end workflow jobs, complaints, discounts, notifications

See [DEMO.md](../DEMO.md) for sample staff logins.

## 5. Verification checklist

- [ ] Public marketing pages load on Vercel URL
- [ ] Login as `admin@gie.com` / `seedpass!` on frontend
- [ ] Strapi admin at `https://<cms>/admin` with `cms@gie.com` / `seedpass!`
- [ ] API docs at `https://<backend>/api/docs/`
- [ ] Test catalog shows 74 entries (staff → catalog)
- [ ] Client login `seed-client1@minerals.com` / `SeedPass123!`
- [ ] Strapi Content Manager → Preview opens Vercel `/preview` route

## 6. Troubleshooting

| Issue | Fix |
|---|---|
| Backend 400 / DisallowedHost | Set `DJANGO_ALLOWED_HOSTS` to exact Railway hostname |
| CMS build timeout | Increase Railway healthcheck timeout; first build is slow |
| Frontend API 404 / CORS | Check `VITE_API_BASE_URL` and redeploy Vercel |
| Empty public pages | CMS not ready or wrong `VITE_CMS_API_BASE_URL`; redeploy Vercel |
| CMS images missing after redeploy | Attach volume at `/opt/app/public/uploads` |
| Seed auth fails | Run backend pre-deploy or `create_user` manually |
| Preview iframe blocked | CSP in `vercel.json` allows `https://*.up.railway.app` |

## 7. Redeployments

| Change | Redeploy |
|---|---|
| Backend code/env | Railway backend |
| CMS code/env | Railway CMS |
| Frontend code | Vercel |
| API/CMS URL change | Vercel (rebuild) + update CMS `CLIENT_URL` |

## Security note

This configuration uses demo passwords and open CORS for client presentations. Do not use for real production without hardening.
