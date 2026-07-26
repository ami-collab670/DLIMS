# Deploy LSIMS: Render + Vercel (free tier)

Client demo deployment using Render for backend/CMS/database and Vercel for the frontend.

| Service | Platform | Source |
|---|---|---|
| Frontend | Vercel | [`LSIMS-Frontend/`](../LSIMS-Frontend/) |
| Django API | Render web (Python) | [`LSIMS-Backend/LSIMS-main/`](../LSIMS-Backend/LSIMS-main/) |
| Strapi CMS | Render web (Docker) | [`cms/Dockerfile.prod`](../cms/Dockerfile.prod) |
| Postgres | Render database (free) | shared; CMS creates `cms` DB on boot |

Blueprint: [`render.yaml`](../render.yaml) at repo root.

## Credentials (client demo)

| Account | Email | Password |
|---|---|---|
| Django admin / frontend staff login | `admin@gie.com` | `seedpass!` |
| Strapi CMS admin | `cms@gie.com` | `seedpass!` |
| Demo staff / clients | see [DEMO.md](../DEMO.md) | `SeedPass123!` |

## Architecture

```
Browser → Vercel (SPA)
            ├─ VITE_API_BASE_URL → Render Django API → Postgres (lsims)
            └─ VITE_CMS_API_BASE_URL → Render Strapi CMS → Postgres (cms)
Strapi preview iframe → Vercel /preview
```

## Free-tier expectations

- Render web services **sleep after ~15 min idle** (30–60s cold start on first visit)
- First CMS deploy may take **5–10 minutes** (Strapi build)
- Free Postgres may **expire after ~30 days** unless upgraded
- CMS uploads are **not persisted** on free tier (bootstrap re-seeds text content)

---

## Step 1 — Push code to GitHub

Ensure `master` includes [`render.yaml`](../render.yaml) and all deploy files, then push to `github.com:ami-collab670/DLIMS`.

---

## Step 2 — Render Blueprint

1. Go to [dashboard.render.com/blueprints](https://dashboard.render.com/blueprints)
2. **New Blueprint Instance** → connect GitHub repo `ami-collab670/DLIMS`, branch `master`
3. Render creates:
   - `lsims-db` (Postgres)
   - `lsims-api` (Python/Django)
   - `lsims-cms` (Docker/Strapi)
4. When prompted during Blueprint setup, fill in **sync: false** variables:

| Variable | Service | Value |
|---|---|---|
| `APP_KEYS` | lsims-cms | Two random keys comma-separated (generate with `node -e "console.log(require('crypto').randomBytes(16).toString('base64')+','+require('crypto').randomBytes(16).toString('base64'))"`) |
| `PUBLIC_URL` | lsims-cms | `https://<your-cms-service>.onrender.com` (set after first deploy if unknown) |
| `CLIENT_URL` | lsims-cms | Vercel frontend URL (set after Step 3) |

5. Wait for all three resources to deploy. CMS is the slowest.
6. Copy public URLs:
   - API: `https://lsims-api-staging.onrender.com`
   - CMS: `https://lsims-cms.onrender.com`

If CMS fails on first build (timeout), click **Manual Deploy → Deploy latest commit**.

Update CMS env in Render dashboard:
- `PUBLIC_URL` = full CMS URL (no trailing slash)
- `CLIENT_URL` = Vercel URL (after Step 3)

Copy `PREVIEW_SECRET` from CMS env (auto-generated) — needed for Vercel.

---

## Step 3 — Vercel frontend

1. [vercel.com/new](https://vercel.com/new) → import `ami-collab670/DLIMS`
2. **Root Directory:** `LSIMS-Frontend`
3. **Framework:** Vite
4. **Environment variables (Production):**

| Variable | Example |
|---|---|
| `VITE_API_BASE_URL` | `https://lsims-api-staging.onrender.com` |
| `VITE_CMS_API_BASE_URL` | `https://lsims-cms.onrender.com/api` |
| `VITE_PREVIEW_SECRET` | Same as CMS `PREVIEW_SECRET` in Render |

5. Deploy → copy Vercel URL (e.g. `https://dlims.vercel.app`)
6. Update Render CMS `CLIENT_URL` to Vercel URL → **Redeploy CMS**

Config: [`LSIMS-Frontend/vercel.json`](../LSIMS-Frontend/vercel.json) (SPA rewrites + Strapi preview CSP for `*.onrender.com`).

---

## Step 4 — Full demo seed

Services may be sleeping — first request wakes them (wait 30–60s).

```powershell
copy .env.deploy.example .env.deploy
# Edit .env.deploy with your Render + Vercel URLs

.\scripts\deploy\bootstrap-production.ps1
```

Or manually:

```powershell
.\scripts\seed-demo-remote.ps1 `
  -ApiUrl "https://lsims-api-staging.onrender.com" `
  -CmsUrl "https://lsims-cms.onrender.com" `
  -AdminEmail "admin@gie.com" `
  -AdminPassword "seedpass!"

.\scripts\deploy\verify-deployment.ps1 `
  -ApiUrl "https://lsims-api-staging.onrender.com" `
  -CmsUrl "https://lsims-cms.onrender.com" `
  -FrontendUrl "https://YOUR-APP.vercel.app"
```

Backend bootstrap (`seed_roles`, admin user) runs automatically via [`build.sh`](../LSIMS-Backend/LSIMS-main/build.sh) on each Render deploy.

---

## Verification checklist

- [ ] Public marketing pages load on Vercel
- [ ] Login `admin@gie.com` / `seedpass!` on frontend
- [ ] Strapi admin `cms@gie.com` / `seedpass!` at `https://<cms>/admin`
- [ ] API docs at `https://<api>/api/docs/`
- [ ] Test catalog shows 74 entries after seed
- [ ] Client login `seed-client1@minerals.com` / `SeedPass123!`

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Backend 400 DisallowedHost | Render sets `RENDER_EXTERNAL_HOSTNAME` automatically; redeploy if needed |
| CMS build timeout | Retry manual deploy; free tier builds are slow |
| Empty public pages | Wake CMS (visit `/api/home-page`); check `VITE_CMS_API_BASE_URL`; redeploy Vercel |
| Frontend API errors | Check `VITE_API_BASE_URL`; redeploy Vercel after env change |
| Seed auth fails | Confirm API is awake; admin created by `build.sh` |
| Preview iframe blocked | CSP in `vercel.json` allows `https://*.onrender.com` |
| Slow first load | Normal on Render free (cold start) |

---

## Redeployments

| Change | Action |
|---|---|
| Backend code | Render redeploys `lsims-api` on git push |
| CMS code | Render redeploys `lsims-cms` on git push |
| Frontend code | Vercel redeploys on git push |
| API/CMS URL change | Update Vercel env vars and redeploy frontend |
| CMS preview URL | Update CMS `CLIENT_URL` and redeploy CMS |

---

## Optional: Railway files

Railway configs ([`railway.toml`](../LSIMS-Backend/LSIMS-main/railway.toml), etc.) remain in the repo but are **not used** for this free Render deploy.

---

## Security note

Demo passwords and open CORS are intentional for client presentations. Do not use for real production.
