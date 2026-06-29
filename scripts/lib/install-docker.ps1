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

# #region agent log
function Write-DebugLog {
    param(
        [string]$Location,
        [string]$Message,
        [hashtable]$Data,
        [string]$HypothesisId
    )
    $logPath = Join-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) "debug-ccbc68.log"
    $entry = @{
        sessionId    = "ccbc68"
        location     = $Location
        message      = $Message
        data         = $Data
        hypothesisId = $HypothesisId
        timestamp    = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        runId        = if ($env:LSIMS_DEBUG_RUN_ID) { $env:LSIMS_DEBUG_RUN_ID } else { "post-fix" }
    } | ConvertTo-Json -Compress
    Add-Content -Path $logPath -Value $entry -Encoding UTF8
}
# #endregion

function Add-DockerCliToPath {
    $added = @()
    foreach ($bin in $script:DockerCliBinPaths) {
        if ((Test-Path $bin) -and (($env:PATH -split ';') -notcontains $bin)) {
            $env:PATH = "$bin;$env:PATH"
            $added += $bin
        }
    }
    # #region agent log
    Write-DebugLog -Location "install-docker.ps1:Add-DockerCliToPath" -Message "PATH refresh" -HypothesisId "H1,H2" -Data @{
        addedPaths   = $added
        cliAvailable = [bool](Get-Command docker -ErrorAction SilentlyContinue)
        cliSource    = (Get-Command docker -ErrorAction SilentlyContinue).Source
    }
    # #endregion
    return $added
}

function Test-DockerCliInstalled {
    $cmd = Get-Command docker -ErrorAction SilentlyContinue
    # #region agent log
    Write-DebugLog -Location "install-docker.ps1:Test-DockerCliInstalled" -Message "docker CLI lookup" -HypothesisId "H1" -Data @{
        found     = [bool]$cmd
        source    = if ($cmd) { $cmd.Source } else { $null }
        pathHead  = ($env:PATH -split ';' | Select-Object -First 5) -join ';'
    }
    # #endregion
    return [bool]$cmd
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

    Add-DockerCliToPath | Out-Null
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
    # #region agent log
    Write-DebugLog -Location "install-docker.ps1:Ensure-DockerDesktop" -Message "entry" -HypothesisId "H1,H2,H3" -Data @{
        cliInstalled   = [bool](Get-Command docker -ErrorAction SilentlyContinue)
        legacyBinExists = (Test-Path "$env:LOCALAPPDATA\Programs\Docker\Docker\resources\bin\docker.exe")
        newBinExists    = (Test-Path "$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin\docker.exe")
    }
    # #endregion
    Add-DockerCliToPath | Out-Null

    if (-not (Test-DockerCliInstalled)) {
        Install-DockerDesktop
    }

    Add-DockerCliToPath | Out-Null

    if (-not (Test-DockerComposeAvailable)) {
        if (Start-DockerDesktopApp) {
            Wait-ForDockerDaemon -TimeoutSeconds 300 | Out-Null
        }
        Add-DockerCliToPath | Out-Null
    }

    if (-not (Test-DockerComposeAvailable)) {
        # #region agent log
        Write-DebugLog -Location "install-docker.ps1:Ensure-DockerDesktop" -Message "compose still unavailable" -HypothesisId "H1,H2,H3" -Data @{
            cliInstalledAfterInstall = (Test-DockerCliInstalled)
            legacyBinExists          = (Test-Path "$env:LOCALAPPDATA\Programs\Docker\Docker\resources\bin\docker.exe")
            newBinExists             = (Test-Path "$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin\docker.exe")
        }
        # #endregion
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
