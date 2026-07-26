# Quick start — Render + Vercel (after git push)

## 1. Render Blueprint (you click this)

Open: **https://dashboard.render.com/blueprints**

- New Blueprint Instance → GitHub repo `ami-collab670/DLIMS` → branch `master`

When prompted, set:

| Variable | Value |
|---|---|
| `APP_KEYS` | Run: `node -e "console.log(require('crypto').randomBytes(16).toString('base64')+','+require('crypto').randomBytes(16).toString('base64'))"` |
| `PUBLIC_URL` | `https://lsims-cms.onrender.com` (adjust if Render assigns a different hostname) |
| `CLIENT_URL` | `https://dlims-wheat.vercel.app` |

Wait until **lsims-api** and **lsims-cms** are both Live (CMS may take 5–10 min).

Copy CMS `PREVIEW_SECRET` from Render env → update Vercel `VITE_PREVIEW_SECRET` to match → redeploy Vercel.

## 2. Vercel frontend (already deployed)

- **Production URL:** https://dlims-wheat.vercel.app
- **Dashboard:** https://vercel.com/tempotest26-ctrls-projects/dlims

Env vars set (update if Render hostnames differ):

- `VITE_API_BASE_URL` = `https://lsims-api.onrender.com`
- `VITE_CMS_API_BASE_URL` = `https://lsims-cms.onrender.com/api`
- `VITE_PREVIEW_SECRET` = match CMS `PREVIEW_SECRET`

Redeploy after Render is live:

```powershell
npx vercel deploy --cwd LSIMS-Frontend --prod --yes
```

## 3. Seed demo data (after Render is Live)

```powershell
copy .env.deploy.example .env.deploy
# Edit URLs if hostnames differ

.\scripts\deploy\bootstrap-production.ps1
```

## Logins

| System | Email | Password |
|---|---|---|
| Django / frontend | admin@gie.com | seedpass! |
| Strapi CMS | cms@gie.com | seedpass! |
