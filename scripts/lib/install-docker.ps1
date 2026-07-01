# Docker Desktop install/start helpers for Windows (official Docker sources).

$script:DockerDesktopInstallerUrl = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
$script:DockerCliBinPaths = @(
    "$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin"
    "$env:LOCALAPPDATA\Programs\Docker\Docker\resources\bin"
    "$env:ProgramFiles\Docker\Docker\resources\bin"
)
$script:DockerDesktopPaths = @(
    "$env:LOCALAPPDATA\Programs\DockerDesktop\Docker Desktop.exe"
    "$env:LOCALAPPDATA\Programs\Docker\Docker\Docker Desktop.exe"
    "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
)

function Add-DockerCliToPath {
    foreach ($bin in $script:DockerCliBinPaths) {
        if ((Test-Path $bin) -and (($env:PATH -split ';') -notcontains $bin)) {
            $env:PATH = "$bin;$env:PATH"
        }
    }
}

function Test-DockerCliInstalled {
    return [bool](Get-Command docker -ErrorAction SilentlyContinue)
}

function Test-DockerComposeAvailable {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        return $false
    }

    $prevPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    docker compose version *> $null
    $ok = ($LASTEXITCODE -eq 0)
    $ErrorActionPreference = $prevPreference
    return $ok
}

function Test-DockerDaemonRunning {
    if (-not (Test-DockerCliInstalled)) {
        return $false
    }

    $prevPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    docker info *> $null
    $ok = ($LASTEXITCODE -eq 0)
    $ErrorActionPreference = $prevPreference
    return $ok
}

function Start-DockerDesktopApp {
    foreach ($path in $script:DockerDesktopPaths) {
        if (Test-Path $path) {
            Write-Host "Starting Docker Desktop..."
            Start-Process -FilePath $path | Out-Null
            return $true
        }
    }
    return $false
}

function Wait-ForDockerDaemon {
    param([int]$TimeoutSeconds = 300)

    Write-Host "Waiting for Docker engine (timeout ${TimeoutSeconds}s)..."
    $elapsed = 0
    while (-not (Test-DockerDaemonRunning)) {
        if ($elapsed -ge $TimeoutSeconds) {
            return $false
        }
        Start-Sleep -Seconds 5
        $elapsed += 5
        if (($elapsed % 30) -eq 0) {
            Write-Host "  Still waiting... (${elapsed}s)"
        }
    }
    Write-Host "Docker engine is running."
    return $true
}

function Install-DockerDesktop {
    $installer = Join-Path $env:TEMP "DockerDesktopInstaller.exe"

    Write-Host ">>> Docker is not installed. Downloading Docker Desktop from docker.com..."
    Write-Host "    (This is a large download and may take several minutes.)"
    try {
        Invoke-WebRequest -Uri $script:DockerDesktopInstallerUrl -OutFile $installer -UseBasicParsing
    }
    catch {
        Write-Host ""
        Write-Host "Failed to download Docker Desktop: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Download manually from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
        exit 1
    }

    Write-Host ">>> Installing Docker Desktop (per-user, quiet)..."
    $process = Start-Process -FilePath $installer -ArgumentList "install", "--user", "--quiet", "--accept-license" -Wait -PassThru
    if ($process.ExitCode -ne 0) {
        Write-Host ""
        Write-Host "Docker Desktop installer exited with code $($process.ExitCode)." -ForegroundColor Red
        Write-Host "Try installing manually from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
        Write-Host "A reboot may be required after first install (WSL2/Hyper-V setup)." -ForegroundColor Yellow
        exit 1
    }

    Write-Host "Docker Desktop installed."

    Add-DockerCliToPath
}

function Show-DockerNotReadyHelp {
    Write-Host ""
    Write-Host "Docker is not running yet." -ForegroundColor Red
    Write-Host "If you just installed Docker Desktop:" -ForegroundColor Yellow
    Write-Host "  1. Start Docker Desktop from the Start menu"
    Write-Host "  2. Wait until it shows 'Engine running'"
    Write-Host "  3. Reboot if prompted, then run setup again"
    Write-Host ""
    Write-Host "Then run:" -ForegroundColor Yellow
    Write-Host "  .\scripts\setup.ps1"
    Write-Host "  OR  .\scripts\setup.bat"
}

function Ensure-DockerDesktop {
    Add-DockerCliToPath

    if (-not (Test-DockerCliInstalled)) {
        Install-DockerDesktop
    }

    Add-DockerCliToPath

    if (-not (Test-DockerComposeAvailable)) {
        if (Start-DockerDesktopApp) {
            Wait-ForDockerDaemon -TimeoutSeconds 300 | Out-Null
        }
        Add-DockerCliToPath
    }

    if (-not (Test-DockerComposeAvailable)) {
        Write-Host ""
        Write-Host "docker compose is not available." -ForegroundColor Red
        Write-Host "Install or update Docker Desktop: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
        Write-Host "If you just installed Docker Desktop, open a new PowerShell window and run setup again." -ForegroundColor Yellow
        exit 1
    }

    if (Test-DockerDaemonRunning) {
        return
    }

    if (-not (Start-DockerDesktopApp)) {
        Write-Host ""
        Write-Host "Could not find Docker Desktop. Install from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Red
        exit 1
    }

    if (-not (Wait-ForDockerDaemon -TimeoutSeconds 300)) {
        Show-DockerNotReadyHelp
        exit 1
    }
}
