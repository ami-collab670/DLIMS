# First-time LSIMS bootstrap: pull images, build, start stack, seed roles, create admin.
# Usage (from repo root):
#   Windows:  .\scripts\setup.ps1   OR   .\scripts\setup.bat   OR   setup.bat (repo root)
#   Mac/Linux: ./scripts/setup.sh
$ErrorActionPreference = "Stop"

$scriptDir = $PSScriptRoot
. (Join-Path $scriptDir "lib\common.ps1")

Initialize-RepoRoot -ScriptDir $scriptDir | Out-Null

Write-Host ">>> Pulling Docker images..."
Invoke-Compose pull

Write-Host ">>> Building containers..."
Invoke-Compose build

Write-Host ">>> Starting stack in background..."
Invoke-Compose up -d

Wait-ForBackend -TimeoutSeconds 120

Write-Host ">>> Seeding roles..."
Invoke-SeedRoles

Write-Host ">>> Creating default admin user..."
Invoke-CreateDefaultAdmin

Show-DevUrls
Write-Host ""
Write-Host "Setup complete. Run .\scripts\start.ps1 for daily development (foreground logs)."
