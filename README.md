# LSIMS

Laboratory Information Management System — a full-stack web application for managing laboratory workflows, samples, jobs, and staff operations.

## Getting started

See the **[Installation Guide](docs/installation.md)** for full setup instructions, script reference, and troubleshooting.

### Quick install

**Windows** (PowerShell, from this directory):

```powershell
.\scripts\setup.ps1
```

**macOS / Linux**:

```bash
chmod +x scripts/*.sh && ./scripts/setup.sh
```

After setup, open **http://localhost:5173/login** and sign in with the default admin credentials printed at the end of setup.

## Documentation

- [Installation Guide](docs/installation.md) — Docker setup, scripts, and daily workflow
- [Frontend API Reference](docs/frontend-api-reference.md) — API integration for frontend development
- [Swagger Access](docs/swagger-access.md) — Interactive API documentation

## Project structure

| Directory | Description |
|-----------|-------------|
| `LSIMS-Backend/` | Django REST API |
| `LSIMS-Frontend/` | React + Vite frontend |
| `scripts/` | Setup, start, stop, and maintenance scripts |
| `docs/` | Project documentation |
