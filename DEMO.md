# DEMO: Run LSIMS with Docker Compose

This document shows the minimal steps for a client to run a demo/test instance of LSIMS from the repository root using Docker Compose. This is intended for short demos or evaluations only (development-mode settings are used). Do NOT use this for production.

Prerequisites
- Docker Engine (and Docker Compose plugin) installed and running on the demo machine.
- Network access to Docker registries (for initial image pulls and npm/pip installs).

Quick demo steps (copy/paste)

1) From the repository root, build and start the stack in the background:

```bash
docker compose up --build -d
```

2) Wait ~30–90 seconds for the PostgreSQL container to become healthy and the backend to finish migrations. The backend image runs migrations at container start (docker-entrypoint runs `manage.py migrate`).

3) Seed roles and create an admin user (run these after containers are healthy):

```bash
docker compose exec backend python manage.py seed_roles
# create an admin user (example):
docker compose exec backend python manage.py create_user --email admin@demo.local --password 'AdminPass123!' --role admin
```

(Alternatively use the provided helper scripts: `scripts/create-user.sh` or `scripts/create-user.ps1`.)

4) Open the UI and admin tools in a browser:
- Frontend (Vite dev server): http://localhost:5173/login
- Backend API: http://localhost:8000/
- pgAdmin (optional): http://localhost:5050

Stop and remove the demo (including volumes):

```bash
docker compose down -v
```

Notes and clarifications
- This demo runs the frontend in Vite "dev" mode (the docker-compose file uses `npm run dev`). The first run will perform `npm ci` inside the frontend container and may take several minutes depending on network speed.
- The backend Dockerfile uses Django's development server (`manage.py runserver`) and is intended for demo/dev only.
- The backend entrypoint runs `python manage.py migrate --noinput` automatically on container start. You do not normally need to run `migrate` manually.
- If you prefer a static frontend build (to avoid `npm ci` in the demo), run locally and produce a build ahead of time:

```bash
cd LSIMS-Frontend && npm ci && npm run build
# then serve the built files via an nginx container or copy them into Django static files and run collectstatic.
```

Ports used by the demo (adjust if conflict):
- Frontend: 5173
- Backend API: 8000
- pgAdmin: 5050

Troubleshooting (common issues)
- "Ports already in use": stop the conflicting services or change ports in docker-compose.yml.
- Slow first start: pip and npm downloads happen on the first build/run; give them time and ensure outbound network access.
- If backend migrations fail due to DB not ready, try: `docker compose restart backend` after DB becomes healthy.

Acceptance checklist for the demo
- After following the steps above you can:
  - Visit the frontend login page and load the UI.
  - Log in with the created admin account.
  - Open Admin flows (Users, Roles) and perform simple create/edit operations.

Seed demo data via API

After the stack is running and an admin account exists, populate the database with
full demo workflows (departments, staff, clients, test catalog, jobs, samples,
finance, preparation, analysis, QC, complaints, discounts, notifications):

```powershell
# Full demo seed (default counts)
.\scripts\seed-api.ps1

# Create 10 complete end-to-end laboratory workflows
.\scripts\seed-api.ps1 -Batch 10

# Custom entity counts
.\scripts\seed-api.ps1 -Clients 5 -Jobs 20 -SamplesPerJob 2 -Tests 6

# Preview planned API calls without writing data
.\scripts\seed-api.ps1 -DryRun
```

Default seeded staff password: `SeedPass123!` (clients use the same).
Override API URL or admin credentials with `-ApiUrl`, `-AdminEmail`, `-AdminPassword`.

Sample logins after seeding:
- Admin: `admin@ministry.gov` / `AdminPass123!` (or your setup credentials)
- Receptionist: `seed-receptionist@ministry.gov` / `SeedPass123!`
- Client: `seed-client1@minerals.com` / `SeedPass123!`

Security reminder
- The demo runs with development settings (DEBUG=True by default in the provided .env.example and the Django runserver). These settings are NOT secure for production use. Do not expose this demo to public internet without proper hardening.
