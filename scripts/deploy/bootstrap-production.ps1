#Requires -Version 5.1
<#
.SYNOPSIS
  Seed and verify LSIMS after Render + Vercel deploy.

.DESCRIPTION
  Set deployment URLs in .env.deploy (copy from .env.deploy.example) or pass parameters.

.EXAMPLE
  .\scripts\deploy\bootstrap-production.ps1 -ApiUrl "https://..." -CmsUrl "https://..." -FrontendUrl "https://..."
#>
[CmdletBinding()]
param(
    [string]$ApiUrl,
    [string]$CmsUrl,
    [string]$FrontendUrl,
    [switch]$SkipSeed,
    [switch]$SkipVerify
)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = (Resolve-Path (Join-Path $ScriptDir '..\..')).Path

function Read-DeployEnv {
    param([string]$Key)

    $file = Join-Path $RepoRoot '.env.deploy'
    if (-not (Test-Path $file)) { return $null }

    foreach ($line in Get-Content $file) {
        if ($line -match "^\s*$Key\s*=\s*(.+)\s*$") {
            return $Matches[1].Trim().Trim('"').Trim("'")
        }
    }
    return $null
}

Write-Host 'LSIMS production bootstrap (Render + Vercel)' -ForegroundColor Green
Write-Host '============================================'
Write-Host ''

$apiBase = if ($ApiUrl) { $ApiUrl.TrimEnd('/') } else { Read-DeployEnv 'LSIMS_API_URL' }
$cmsBase = if ($CmsUrl) { $CmsUrl.TrimEnd('/') } else { Read-DeployEnv 'LSIMS_CMS_URL' }
$frontendBase = if ($FrontendUrl) { $FrontendUrl.TrimEnd('/') } else { Read-DeployEnv 'LSIMS_FRONTEND_URL' }

if (-not $apiBase -or -not $cmsBase) {
    Write-Host 'Missing LSIMS_API_URL or LSIMS_CMS_URL. Set .env.deploy or pass -ApiUrl / -CmsUrl.' -ForegroundColor Yellow
    Write-Host 'Complete Render Blueprint + Vercel setup first (see docs/DEPLOY.md).' -ForegroundColor Yellow
    exit 0
}

if (-not $SkipSeed) {
    Write-Host '>>> Running remote demo seed...' -ForegroundColor Cyan
    & (Join-Path $RepoRoot 'scripts\seed-demo-remote.ps1') `
        -ApiUrl $apiBase `
        -CmsUrl $cmsBase `
        -AdminEmail 'admin@gie.com' `
        -AdminPassword 'seedpass!'
}

if (-not $SkipVerify) {
    Write-Host '>>> Verifying deployment...' -ForegroundColor Cyan
    $verifyArgs = @{
        ApiUrl = $apiBase
        CmsUrl = $cmsBase
    }
    if ($frontendBase) { $verifyArgs.FrontendUrl = $frontendBase }
    & (Join-Path $ScriptDir 'verify-deployment.ps1') @verifyArgs
}

Write-Host ''
Write-Host 'Bootstrap complete.' -ForegroundColor Green
if ($frontendBase) {
    Write-Host "Frontend: $frontendBase"
}
Write-Host "API:      $apiBase"
Write-Host "CMS:      $cmsBase/admin"
