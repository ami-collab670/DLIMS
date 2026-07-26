# DEMO: Run LSIMS with Docker Compose

This document shows the minimal steps for a client to run a demo/test instance of LSIMS from the repository root using Docker Compose. This is intended for short demos or evaluations only (development-mode settings are used). Do NOT use this for production.

## Prerequisites

- Docker Engine (and Docker Compose plugin) installed and running on the demo machine.
- Network access to Docker registries (for initial image pulls and npm/pip installs).
- Windows: PowerShell 5.1+ (included with Windows).
- Mac/Linux: PowerShell (`pwsh`) for API seed scripts when using bash helpers.

## Quick demo (recommended)

From the repository root, run the first-time bootstrap script. It builds and starts the stack, seeds roles, creates the admin user, populates CMS content, and loads full demo data (4 departments, 74-test catalog, staff, clients, and sample workflows):

```powershell
# Windows
.\scripts\setup.ps1
```

```bash
# Mac/Linux
./scripts/setup.sh
```

Open in a browser:

- Frontend: http://localhost:5173/login
- CMS admin: http://localhost:1337/admin
- Backend API: http://localhost:8000/
- pgAdmin (optional): http://localhost:5050

Stop and remove the demo (including volumes):

```bash
docker compose down -v
```

## What setup seeds automatically

| Area | Content |
|---|---|
| **CMS** | Home page, services, news, events, partners, contact pages (from `cms/src/bootstrap/seed-data.js`) |
| **Departments** | Geochemical Services, Mineralogy Services, Physical and Geotechnical Analysis, Mineral Processing Services |
| **Test catalog** | 74 priced tests from `scripts/fixtures/demo-seed.json` (`CLIENT_SERVICE_CATALOG`) — replaces any existing catalog entries |
| **Staff** | All demo roles except admin (created separately): receptionist, finance, lab director, procurement, ministry coordinator, auditor, plus per-department analyst, lab technician, and QC manager |
| **Clients** | 2 registered external clients |
| **Workflows** | 2 end-to-end jobs (samples, finance, prep, analysis, QC), plus complaints, discount approval, and notifications |

Fixture source: [`scripts/fixtures/demo-seed.json`](scripts/fixtures/demo-seed.json)

## Manual re-seed commands

Re-run CMS content only:

```powershell
.\scripts\seed-cms.ps1
```

Re-run full LSIMS demo data (CMS + API reference data + workflows):

```powershell
.\scripts\seed-demo.ps1

# More workflow jobs
.\scripts\seed-demo.ps1 -Batch 10

# Preview API calls without writing
.\scripts\seed-demo.ps1 -DryRun
```

Lower-level API seed (legacy/custom counts without demo catalog):

```powershell
.\scripts\seed-api.ps1 -UseDemoFixtures -ReplaceCatalog -Departments 4
.\scripts\seed-api.ps1 -Clients 5 -Jobs 20 -SamplesPerJob 2
.\scripts\seed-api.ps1 -DryRun
```

## Sample logins

Default passwords: staff and clients use `SeedPass123!` unless overridden.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@ministry.gov` | `AdminPass123!` |
| Receptionist | `seed-receptionist@ministry.gov` | `SeedPass123!` |
| Finance | `seed-finance@ministry.gov` | `SeedPass123!` |
| Lab director | `seed-lab-director@ministry.gov` | `SeedPass123!` |
| Procurement | `seed-procurement@ministry.gov` | `SeedPass123!` |
| Ministry coordinator | `seed-ministry-coordinator@ministry.gov` | `SeedPass123!` |
| Auditor | `seed-auditor@ministry.gov` | `SeedPass123!` |
| Analyst (Geochemical) | `seed-geochemical-analyst@ministry.gov` | `SeedPass123!` |
| Analyst (Mineralogy) | `seed-mineralogy-analyst@ministry.gov` | `SeedPass123!` |
| QC manager (Geochemical) | `seed-geochemical-qc-manager@ministry.gov` | `SeedPass123!` |
| Lab technician (Geochemical) | `seed-geochemical-lab-technician@ministry.gov` | `SeedPass123!` |
| Client | `seed-client1@minerals.com` | `SeedPass123!` |

Per-department staff follows the pattern `seed-{department-slug}-{role}@ministry.gov` (e.g. `seed-physical-geotechnical-analyst@ministry.gov`).

Override API URL or admin credentials with `-ApiUrl`, `-AdminEmail`, `-AdminPassword` on seed scripts.

## Manual bootstrap (without setup script)

If you prefer raw Docker Compose:

```bash
docker compose up --build -d
docker compose exec backend python manage.py seed_roles
docker compose exec backend python manage.py create_user --email admin@ministry.gov --password 'AdminPass123!' --role admin
.\scripts\seed-demo.ps1
```

## Notes

- The frontend runs in Vite dev mode; the first start may take several minutes while `npm ci` runs inside Docker.
- The backend uses Django's development server and is not production-hardened.
- Migrations run automatically on backend container start.
- CMS content also auto-seeds on Strapi startup; `seed-cms.ps1` re-applies it idempotently.
- Test catalog replace deletes unreferenced entries; tests linked to existing samples are deactivated instead of deleted.

## Ports

| Service | Port |
|---|---|
| Frontend | 5173 |
| Backend API | 8000 |
| CMS | 1337 |
| pgAdmin | 5050 |

## Troubleshooting

- **Ports already in use**: stop conflicting services or change ports in `docker-compose.yml`.
- **Slow first start**: allow time for pip/npm downloads.
- **Backend migrations fail**: `docker compose restart backend` after DB is healthy.
- **CMS not ready during setup**: wait for Strapi healthcheck; check `.\scripts\logs.ps1 cms`.
- **Missing cms database**: create `cms` in Postgres or run `docker compose down -v` and setup again.

## Acceptance checklist

After setup you can:

- Visit the public site and client login at http://localhost:5173
- Log in as admin and browse staff flows (users, test catalog with 74 entries)
- Log in as receptionist/finance/analyst and follow seeded job workflows
- Submit a client job request using the live priced service catalog

## Security reminder

The demo runs with development settings (`DEBUG=True`). These settings are NOT secure for production. Do not expose this demo to the public internet without proper hardening.
