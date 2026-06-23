# LSIMS Installation Guide

This guide explains how to install and run LSIMS locally using the scripts in the [`scripts/`](../scripts/) folder. The development stack runs entirely in Docker — you do not need Python or Node.js installed on your machine for normal development.

## What gets installed

The Docker stack defined in [`docker-compose.yml`](../docker-compose.yml) includes:

| Service | Description | Port |
|---------|-------------|------|
| **db** | PostgreSQL 16 | internal |
| **backend** | Django REST API | 8000 |
| **frontend** | Vite dev server (React) | 5173 |
| **pgadmin** | Database admin UI | 5050 |

All scripts automatically find the repository root (via `docker-compose.yml`) and ensure Docker is installed and running before executing any commands.

## Prerequisites

- **Docker Desktop** on Windows or macOS, or **Docker Engine** on Linux
- A terminal: PowerShell (Windows), Terminal (macOS), or any shell (Linux)

If Docker is not installed, the setup scripts can install it for you:

| Platform | Auto-install behavior |
|----------|----------------------|
| Windows | Downloads and installs Docker Desktop from docker.com |
| macOS | Installs via Homebrew (`brew install --cask docker`) if Homebrew is available |
| Linux | Runs the official [get.docker.com](https://get.docker.com) install script (requires `sudo`) |

After a first-time Docker install, you may need to reboot (Windows) or log out and back in (Linux) before the Docker engine is ready. The scripts print guidance if the engine does not start within the timeout.

## Quick start (first-time setup)

Run these commands from the **repository root** (`v1/`).

### Windows

PowerShell:

```powershell
.\scripts\setup.ps1
```

Alternatives (same result):

- Double-click `setup.bat` at the repo root
- Run `.\scripts\setup.bat`

### macOS / Linux

```bash
chmod +x scripts/*.sh
./scripts/setup.sh
```

### What `setup` does

1. Ensures Docker is installed and the engine is running
2. Pulls Docker images
3. Builds containers
4. Starts the stack in the background (`docker compose up -d`)
5. Waits for the Django backend to be ready (up to 120 seconds)
6. Seeds system roles (`seed_roles`)
7. Creates a default admin user
8. Prints dev URLs and login credentials

When setup finishes, open the frontend at **http://localhost:5173/login**.

> **Note:** The first frontend start runs `npm ci` inside Docker and may take several minutes. Watch progress with `.\scripts\logs.ps1 frontend` (Windows) or `./scripts/logs.sh frontend` (Mac/Linux).

## URLs and default credentials

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173/login |
| API | http://localhost:8000 |
| pgAdmin | http://localhost:5050 |

### Default admin login

| Field | Value |
|-------|-------|
| Email | `admin@ministry.gov` |
| Password | `AdminPass123!` |

To use different credentials during setup, set environment variables **before** running `setup`:

```powershell
# Windows PowerShell
$env:LSIMS_ADMIN_EMAIL = "you@example.com"
$env:LSIMS_ADMIN_PASSWORD = "YourSecurePass123!"
.\scripts\setup.ps1
```

```bash
# macOS / Linux
export LSIMS_ADMIN_EMAIL="you@example.com"
export LSIMS_ADMIN_PASSWORD="YourSecurePass123!"
./scripts/setup.sh
```

### pgAdmin (dev only)

| Field | Value |
|-------|-------|
| Email | `legekiya@gmail.com` |
| Password | `admin123` |

To connect pgAdmin to the database, add a server with host `db`, port `5432`, user `lsims`, password `lsims_dev`, database `lsims`.

## Script reference

All scripts are in [`scripts/`](../scripts/). Run them from the repository root.

| Script | Purpose | Windows | macOS / Linux |
|--------|---------|---------|---------------|
| **setup** | First-time install and bootstrap | `.\scripts\setup.ps1` or `setup.bat` | `./scripts/setup.sh` |
| **start** | Start stack with live logs (Ctrl+C stops) | `.\scripts\start.ps1` or `start.bat` | `./scripts/start.sh` |
| **stop** | Stop all containers | `.\scripts\stop.ps1` | `./scripts/stop.sh` |
| **status** | Show container status and dev URLs | `.\scripts\status.ps1` | `./scripts/status.sh` |
| **logs** | Follow container logs | `.\scripts\logs.ps1 [service]` | `./scripts/logs.sh [service]` |
| **create-user** | Create or update a user | `.\scripts\create-user.ps1 ...` | `./scripts/create-user.sh ...` |
| **reset** | Remove containers and wipe database volumes | `.\scripts\reset.ps1 -Yes` | `./scripts/reset.sh --yes` |

Windows `.bat` files in `scripts/` delegate to the matching PowerShell scripts. The repo-root `setup.bat` and `start.bat` are shortcuts to the same scripts.

## Daily development workflow

After the first-time setup, use these commands day to day:

### 1. Start the stack

Foreground mode shows live logs. Press **Ctrl+C** to stop containers.

```powershell
# Windows
.\scripts\start.ps1
```

```bash
# macOS / Linux
./scripts/start.sh
```

If the stack is already running in the background (from a previous `setup`), you can use `stop` first or let `start` rebuild as needed.

### 2. Stop the stack

```powershell
# Windows
.\scripts\stop.ps1
```

```bash
# macOS / Linux
./scripts/stop.sh
```

### 3. Check status

```powershell
# Windows
.\scripts\status.ps1
```

```bash
# macOS / Linux
./scripts/status.sh
```

### 4. View logs

Follow all services:

```powershell
# Windows
.\scripts\logs.ps1
```

```bash
# macOS / Linux
./scripts/logs.sh
```

Follow a single service (`backend`, `frontend`, `db`, or `pgadmin`):

```powershell
# Windows
.\scripts\logs.ps1 backend
```

```bash
# macOS / Linux
./scripts/logs.sh backend
```

## Creating additional users

The backend must be running before creating users. Use the `create-user` script (no local Python required):

```powershell
# Windows — internal staff user
.\scripts\create-user.ps1 --email analyst@ministry.gov --password AnalystPass123! --role analyst
```

```bash
# macOS / Linux
./scripts/create-user.sh --email analyst@ministry.gov --password AnalystPass123! --role analyst
```

Run the script with no arguments to see full help from `manage.py create_user`.

### Available internal roles

These roles are seeded automatically during setup:

| Role | Value |
|------|-------|
| Admin | `admin` |
| Receptionist | `receptionist` |
| Lab Analyst | `analyst` |
| QC Manager | `qc_manager` |
| Finance Officer | `finance` |
| Procurement Officer | `procurement` |
| Ministry Coordinator | `ministry_coordinator` |
| Auditor | `auditor` |

For external client users, use `--type external` and omit `--role`. See the help output for additional options such as `--organization-name`.

## Resetting the environment

To completely remove containers and **wipe the database** (all data is lost):

```powershell
# Windows
.\scripts\reset.ps1 -Yes
```

```bash
# macOS / Linux
./scripts/reset.sh --yes
```

After a reset, run `setup` again to bootstrap a fresh environment.

## Troubleshooting

### Docker is not running

1. Start **Docker Desktop** from the Start menu (Windows) or Applications (macOS)
2. Wait until the status shows **Engine running**
3. Reboot if prompted after a first install, then run setup again

### Backend did not become ready (timeout)

Check backend logs:

```powershell
# Windows
.\scripts\logs.ps1 backend
```

```bash
# macOS / Linux
./scripts/logs.sh backend
```

Common causes: database still starting, migration errors, or port 8000 already in use.

### Port conflicts

Ensure these ports are free on your machine:

- **5173** — frontend
- **8000** — API
- **5050** — pgAdmin

Stop any other services using those ports, then run `stop` and `start` again.

### Linux permission denied on Docker

After installing Docker via the auto-install script, your user may not yet be in the `docker` group. Try:

```bash
newgrp docker
```

Or log out and back in, then re-run setup.

### Frontend is slow on first start

This is expected. The frontend container runs `npm ci` before starting the Vite dev server. Monitor progress:

```bash
./scripts/logs.sh frontend
```

## Related documentation

- [Frontend API reference](frontend-api-reference.md) — authentication, endpoints, and React Query conventions
- [Swagger access](swagger-access.md) — API documentation in the browser

## Questions?

If you run into issues not covered here, reach out to the project maintainer — we're happy to help.
