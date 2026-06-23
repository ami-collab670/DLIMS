# Shared helpers for LSIMS Docker dev scripts (Windows PowerShell).

$script:LSIMS_DEFAULT_ADMIN_EMAIL = if ($env:LSIMS_ADMIN_EMAIL) { $env:LSIMS_ADMIN_EMAIL } else { "admin@ministry.gov" }
$script:LSIMS_DEFAULT_ADMIN_PASSWORD = if ($env:LSIMS_ADMIN_PASSWORD) { $env:LSIMS_ADMIN_PASSWORD } else { "AdminPass123!" }

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

function Require-Docker {
    # Deprecated alias — use Ensure-Docker via Initialize-RepoRoot.
    Ensure-Docker
}

function Initialize-RepoRoot {
    param([string]$ScriptDir)

    $installDocker = Join-Path $ScriptDir "lib\install-docker.ps1"
    if (Test-Path $installDocker) {
        . $installDocker
    }
    Ensure-DockerDesktop

    $repoRoot = Find-RepoRoot -StartDir $ScriptDir
    if (-not $repoRoot) {
        Write-Host "Could not find docker-compose.yml. Run this script from the repository." -ForegroundColor Red
        exit 1
    }

    Set-Location $repoRoot
    return $repoRoot
}

function Invoke-Compose {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
    & docker compose @Args
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

function Require-BackendRunning {
    $backendId = docker compose ps -q backend 2>$null
    if (-not $backendId) {
        Write-Host "Backend container is not running. Start the stack first:" -ForegroundColor Red
        Write-Host "  .\scripts\setup.ps1   (first time)"
        Write-Host "  .\scripts\start.ps1   (daily dev)"
        exit 1
    }

    $running = docker compose ps --status running -q backend 2>$null
    if (-not $running) {
        Write-Host "Backend container is not running. Start the stack first:" -ForegroundColor Red
        Write-Host "  .\scripts\setup.ps1   (first time)"
        Write-Host "  .\scripts\start.ps1   (daily dev)"
        exit 1
    }
}

function Wait-ForBackend {
    param([int]$TimeoutSeconds = 120)

    Write-Host "Waiting for backend to be ready (timeout ${TimeoutSeconds}s)..."
    $elapsed = 0
    while ($true) {
        docker compose exec -T backend python manage.py check 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Backend is ready."
            return
        }

        if ($elapsed -ge $TimeoutSeconds) {
            Write-Host "Backend did not become ready within ${TimeoutSeconds}s. Check logs: .\scripts\logs.ps1 backend" -ForegroundColor Red
            exit 1
        }

        Start-Sleep -Seconds 2
        $elapsed += 2
    }
}

function Show-DevUrls {
    Write-Host @"

LSIMS is running:
  Frontend:  http://localhost:5173/login
  API:       http://localhost:8000
  pgAdmin:   http://localhost:5050

Default login:
  Email:     $($script:LSIMS_DEFAULT_ADMIN_EMAIL)
  Password:  $($script:LSIMS_DEFAULT_ADMIN_PASSWORD)

Note: First frontend start runs npm ci inside Docker and may take several minutes.
"@
}

function Invoke-SeedRoles {
    docker compose exec -T backend python manage.py seed_roles
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

function Invoke-CreateDefaultAdmin {
    docker compose exec -T backend python manage.py create_user `
        --email $script:LSIMS_DEFAULT_ADMIN_EMAIL `
        --password $script:LSIMS_DEFAULT_ADMIN_PASSWORD `
        --role admin
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
