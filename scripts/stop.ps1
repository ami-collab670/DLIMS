# Stop LSIMS dev stack.
# Usage (from repo root):
#   .\scripts\stop.ps1

$ErrorActionPreference = "Stop"

$scriptDir = $PSScriptRoot
. (Join-Path $scriptDir "lib\common.ps1")

Initialize-RepoRoot -ScriptDir $scriptDir | Out-Null

Write-Host "Stopping stack..."
Invoke-Compose down
