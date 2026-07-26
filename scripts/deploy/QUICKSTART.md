# Quick start — Render + Vercel (after git push)

## 1. Render Blueprint

Open: **https://dashboard.render.com/blueprints**

- Select blueprint `ami-collab670/dlmis` → **Manual Sync** (or create new from `master`)
- Confirm **3 resources**: `lsims-db`, `lsims-api-staging`, `lsims-cms`

### lsims-api-staging (must use current master)

If API deploy fails with `requirements.txt not found`, follow **[RENDER-API-FIX.md](RENDER-API-FIX.md)**:

- **Root Directory:** `LSIMS-Backend/LSIMS-main`
- **Start Command:** `bash start.sh` (or repo root: `bash start-api.sh`)
- **PYTHON_VERSION:** `3.12.12`

- **Manual Deploy** both web services on latest commit

`APP_KEYS`, `PUBLIC_URL`, and `CLIENT_URL` are pre-set in [`render.yaml`](../../render.yaml) — no manual CMS env entry needed.

Wait until **lsims-api-staging** and **lsims-cms** are Live (CMS first deploy may take 5–10 min).

Copy CMS `PREVIEW_SECRET` from Render env → update Vercel `VITE_PREVIEW_SECRET` → redeploy Vercel.

## 2. Vercel frontend

- **Production URL:** https://dlims-wheat.vercel.app
- **Dashboard:** https://vercel.com/tempotest26-ctrls-projects/dlims

Env vars (Production):

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://lsims-api-staging.onrender.com` |
| `VITE_CMS_API_BASE_URL` | `https://lsims-cms.onrender.com/api` |
| `VITE_PREVIEW_SECRET` | match CMS `PREVIEW_SECRET` |

Redeploy after Render is live:

```powershell
npx vercel deploy --cwd LSIMS-Frontend --prod --yes
```

## 3. Seed demo data (after Render is Live)

```powershell
copy .env.deploy.example .env.deploy

.\scripts\deploy\bootstrap-production.ps1
```

## Logins

| System | Email | Password |
|---|---|---|
| Django / frontend | admin@gie.com | seedpass! |
| Strapi CMS | cms@gie.com | seedpass! |

## Troubleshooting

- **Network Error on login** → Vercel `VITE_API_BASE_URL` must be `https://lsims-api-staging.onrender.com` (not `lsims-api`)
- **CMS missing** → Blueprint Manual Sync, or create Docker web service manually from `cms/Dockerfile.prod`
- **Slow first load** → Render free tier cold start (30–60s); wake API before seeding
