# Fix lsims-api-staging on Render

## Option A — Recommended (Root Directory)

Render → **lsims-api-staging** → **Settings**:

| Setting | Value |
|---|---|
| Repository | `ami-collab670/DLIMS` |
| Branch | `master` |
| **Root Directory** | `LSIMS-Backend/LSIMS-main` |
| Build Command | `./build.sh` |
| **Start Command** | `bash start.sh` |
| Auto-Deploy | On |

Environment variables:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Linked to `lsims-db` |
| `DJANGO_DEBUG` | `False` |
| `DJANGO_SECRET_KEY` | any secure random string |
| `PYTHON_VERSION` | `3.12.12` |
| `LSIMS_ADMIN_EMAIL` | `admin@gie.com` |
| `LSIMS_ADMIN_PASSWORD` | `seedpass!` |

Save → **Manual Deploy** → latest commit.

---

## Option B — Repo root (if Root Directory cannot be saved)

| Setting | Value |
|---|---|
| Root Directory | *(leave empty)* |
| Build Command | `./build.sh` |
| **Start Command** | `bash start-api.sh` |

The repo-root [`build.sh`](../build.sh) and [`start-api.sh`](../start-api.sh) delegate to `LSIMS-Backend/LSIMS-main/`.

---

## Success logs

Build:

```
>>> Installing dependencies...
>>> Collecting static files...
>>> Build complete!
```

Runtime:

```
>>> Running database migrations...
>>> Seeding roles...
>>> Ensuring default admin user...
>>> Starting gunicorn...
```

## Verify

```powershell
Invoke-RestMethod -Method POST `
  -Uri "https://lsims-api-staging.onrender.com/api/auth/token/" `
  -ContentType "application/json" `
  -Body '{"email":"admin@gie.com","password":"seedpass!"}'
```
