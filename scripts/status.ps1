# Show LSIMS container status and dev URLs.
# Usage (from repo root):
#   .\scripts\status.ps1

$ErrorActionPreference = "Stop"

$scriptDir = $PSScriptRoot
. (Join-Path $scriptDir "lib\common.ps1")

Initialize-RepoRoot -ScriptDir $scriptDir | Out-Null

Invoke-Compose ps
Show-DevUrls
