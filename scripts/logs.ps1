# Follow LSIMS container logs.
# Usage (from repo root):
#   .\scripts\logs.ps1
#   .\scripts\logs.ps1 backend

param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
)

$ErrorActionPreference = "Stop"

$scriptDir = $PSScriptRoot
. (Join-Path $scriptDir "lib\common.ps1")

Initialize-RepoRoot -ScriptDir $scriptDir | Out-Null

Invoke-Compose logs -f @Args
