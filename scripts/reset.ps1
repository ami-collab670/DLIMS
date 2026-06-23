# Remove LSIMS containers and volumes (wipes database). Requires -Yes.
# Usage (from repo root):
#   .\scripts\reset.ps1 -Yes

param(
    [switch]$Yes
)

$ErrorActionPreference = "Stop"

$scriptDir = $PSScriptRoot
. (Join-Path $scriptDir "lib\common.ps1")

if (-not $Yes) {
    Write-Error "This removes all containers and volumes (database will be wiped). Re-run with -Yes to confirm: .\scripts\reset.ps1 -Yes"
    exit 1
}

Initialize-RepoRoot -ScriptDir $scriptDir | Out-Null

Write-Host "Removing stack and volumes..."
Invoke-Compose down -v
Write-Host "Reset complete. Run .\scripts\setup.ps1 to bootstrap again."
