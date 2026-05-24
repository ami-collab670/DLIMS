# Create or update an LSIMS user via Docker (no local Python required).
# Usage (from repo root):
#   .\scripts\create-user.ps1 --email admin@ministry.gov --password AdminPass123! --role admin

param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
)

$ErrorActionPreference = "Stop"

function Find-RepoRoot {
    param([string]$StartDir)
    $dir = $StartDir
    while ($dir) {
        if (Test-Path (Join-Path $dir "docker-compose.yml")) {
            return $dir
        }
        $parent = Split-Path $dir -Parent
        if (-not $parent -or $parent -eq $dir) {
            break
        }
        $dir = $parent
    }
    return $null
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "docker is not installed or not on PATH."
    exit 1
}

docker compose version 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Error "docker compose is not available. Install Docker Desktop or the Compose plugin."
    exit 1
}

$repoRoot = Find-RepoRoot -StartDir $PSScriptRoot
if (-not $repoRoot) {
    Write-Error "Could not find docker-compose.yml. Run this script from the repository."
    exit 1
}

Push-Location $repoRoot
try {
    $backendId = docker compose ps -q backend 2>$null
    if (-not $backendId) {
        Write-Error "Backend container is not running. Start the stack first: docker compose up -d"
        exit 1
    }

    $running = docker compose ps --status running -q backend 2>$null
    if (-not $running) {
        Write-Error "Backend container is not running. Start the stack first: docker compose up -d"
        exit 1
    }

    if ($Args.Count -eq 0) {
        docker compose exec backend python manage.py create_user --help
        exit $LASTEXITCODE
    }

    docker compose exec backend python manage.py create_user @Args
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
