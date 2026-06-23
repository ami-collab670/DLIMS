# Start LSIMS dev stack in foreground (live logs). Ctrl+C stops containers.
# Usage (from repo root):
#   .\scripts\start.ps1

$ErrorActionPreference = "Stop"

$scriptDir = $PSScriptRoot
. (Join-Path $scriptDir "lib\common.ps1")

Initialize-RepoRoot -ScriptDir $scriptDir | Out-Null

Show-DevUrls
Write-Host ""
Write-Host "Starting stack (Ctrl+C to stop)..."
Invoke-Compose up --build
