# Create or update an LSIMS user via Docker (no local Python required).
# Usage (from repo root):
#   .\scripts\create-user.ps1 --email admin@ministry.gov --password AdminPass123! --role admin

param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
)

$ErrorActionPreference = "Stop"

$scriptDir = $PSScriptRoot
. (Join-Path $scriptDir "lib\common.ps1")

Initialize-RepoRoot -ScriptDir $scriptDir | Out-Null
Require-BackendRunning

if ($Args.Count -eq 0) {
    docker compose exec backend python manage.py create_user --help
    exit $LASTEXITCODE
}

docker compose exec backend python manage.py create_user @Args
exit $LASTEXITCODE
