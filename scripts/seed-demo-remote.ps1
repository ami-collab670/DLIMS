#Requires -Version 5.1
<#
.SYNOPSIS
  Seed full LSIMS demo data against deployed Render/Vercel URLs (no local Docker).

.DESCRIPTION
  Waits for remote backend and CMS health, then invokes seed-api.ps1 with demo fixtures.
  CMS marketing content is seeded automatically on Strapi startup (cms/src/index.js bootstrap).

.EXAMPLE
  .\scripts\seed-demo-remote.ps1 `
    -ApiUrl "https://lsims-api.onrender.com" `
    -CmsUrl "https://lsims-cms.onrender.com"

.EXAMPLE
  $env:LSIMS_API_URL = "https://..."
  $env:LSIMS_CMS_URL = "https://..."
  .\scripts\seed-demo-remote.ps1
#>
[CmdletBinding()]
param(
    [string]$ApiUrl,
    [string]$CmsUrl,
    [string]$AdminEmail,
    [string]$AdminPassword,

    [int]$Batch = 0,
    [int]$Jobs = 2,
    [int]$SamplesPerJob = 1,
    [int]$Complaints = 1,
    [int]$Discounts = 1,
    [int]$Notifications = 2,
    [switch]$SkipCmsSeed,
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Resolve-RemoteUrl {
    param(
        [string]$Value,
        [string]$EnvName,
        [string]$Label
    )

    $resolved = if ($Value) { $Value.TrimEnd('/') }
                else {
                    $fromEnv = [Environment]::GetEnvironmentVariable($EnvName)
                    if ($fromEnv) { $fromEnv.TrimEnd('/') } else { $null }
                }

    if (-not $resolved) {
        Write-Host "Missing $Label. Pass -$Label or set environment variable $EnvName." -ForegroundColor Red
        exit 1
    }
    return $resolved
}

function Wait-ForRemoteBackend {
    param(
        [Parameter(Mandatory)]
        [string]$BaseUrl,
        [int]$TimeoutSeconds = 300
    )

    Write-Host "Waiting for backend at $BaseUrl (timeout ${TimeoutSeconds}s; Render free tier may cold-start)..."
    $elapsed = 0
    while ($true) {
        try {
            $response = Invoke-WebRequest -Uri "$BaseUrl/api/docs/" -Method GET -UseBasicParsing -TimeoutSec 15
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
                Write-Host "Backend is ready." -ForegroundColor Green
                return
            }
        } catch {
            # still starting
        }

        if ($elapsed -ge $TimeoutSeconds) {
            Write-Host "Backend did not become ready within ${TimeoutSeconds}s." -ForegroundColor Red
            exit 1
        }

        Start-Sleep -Seconds 3
        $elapsed += 3
    }
}

function Wait-ForRemoteCms {
    param(
        [Parameter(Mandatory)]
        [string]$BaseUrl,
        [int]$TimeoutSeconds = 300
    )

    Write-Host "Waiting for CMS at $BaseUrl (timeout ${TimeoutSeconds}s)..."
    $elapsed = 0
    while ($true) {
        try {
            $response = Invoke-WebRequest -Uri "$BaseUrl/api/home-page" -Method GET -UseBasicParsing -TimeoutSec 15
            if ($response.StatusCode -eq 200) {
                $body = $response.Content | ConvertFrom-Json
                if ($null -ne $body.data) {
                    Write-Host "CMS is ready." -ForegroundColor Green
                    return
                }
            }
        } catch {
            # still starting
        }

        if ($elapsed -ge $TimeoutSeconds) {
            Write-Host "CMS did not become ready within ${TimeoutSeconds}s." -ForegroundColor Red
            exit 1
        }

        Start-Sleep -Seconds 5
        $elapsed += 5
    }
}

function Invoke-RemoteCmsSeed {
    param([string]$CmsBaseUrl)

    if ($DryRun) {
        Write-Host "[dry-run] Skipping CMS content check." -ForegroundColor Yellow
        return
    }

    Write-Host "CMS content is seeded on Strapi bootstrap; verified at $CmsBaseUrl/api/home-page" -ForegroundColor Cyan
}

$apiBase = Resolve-RemoteUrl -Value $ApiUrl -EnvName 'LSIMS_API_URL' -Label 'ApiUrl'
$cmsBase = Resolve-RemoteUrl -Value $CmsUrl -EnvName 'LSIMS_CMS_URL' -Label 'CmsUrl'

Write-Host ''
Write-Host 'LSIMS remote demo seed' -ForegroundColor Green
Write-Host '======================'
Write-Host "API: $apiBase"
Write-Host "CMS: $cmsBase"
Write-Host ''

Wait-ForRemoteBackend -BaseUrl $apiBase
Wait-ForRemoteCms -BaseUrl $cmsBase

if (-not $SkipCmsSeed) {
    Invoke-RemoteCmsSeed -CmsBaseUrl $cmsBase
}

$seedApiArgs = @{
    ApiUrl          = $apiBase
    UseDemoFixtures = $true
    ReplaceCatalog  = $true
    Departments     = 4
    Clients         = 2
    StaffPerRole    = 1
    Jobs            = $Jobs
    SamplesPerJob   = $SamplesPerJob
    Complaints      = $Complaints
    Discounts       = $Discounts
    Notifications   = $Notifications
    SkipExisting    = $true
}

if ($AdminEmail) { $seedApiArgs.AdminEmail = $AdminEmail }
if ($AdminPassword) { $seedApiArgs.AdminPassword = $AdminPassword }
if ($Batch -gt 0) { $seedApiArgs.Batch = $Batch }
if ($DryRun) { $seedApiArgs.DryRun = $true }

& (Join-Path $ScriptDir 'seed-api.ps1') @seedApiArgs

Write-Host ''
Write-Host 'Remote demo seed complete.' -ForegroundColor Green
