#Requires -Version 5.1
<#
.SYNOPSIS
  Post-login helper to deploy LSIMS to Railway + Vercel and run demo seed.

.DESCRIPTION
  Requires Railway CLI and Vercel CLI (npx works). Run after:
    npx @railway/cli login
    npx vercel login

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

function Get-CliCommand {
    param([string]$Name)

    if (Get-Command $Name -ErrorAction SilentlyContinue) {
        return $Name
    }
    return "npx"
}

function Invoke-Railway {
    param([string[]]$Args)

    $railway = Get-CliCommand 'railway'
    if ($railway -eq 'npx') {
        & npx @('@railway/cli') @Args
    } else {
        & railway @Args
    }
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

function Invoke-Vercel {
    param([string[]]$Args)

    $vercel = Get-CliCommand 'vercel'
    if ($vercel -eq 'npx') {
        & npx vercel @Args
    } else {
        & vercel @Args
    }
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

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

Write-Host 'LSIMS production bootstrap' -ForegroundColor Green
Write-Host '=========================='
Write-Host ''
Write-Host 'Step 1: Connect services in Railway and Vercel dashboards using docs/DEPLOY.md'
Write-Host 'Step 2: Set .env.deploy from .env.deploy.example with your public URLs'
Write-Host 'Step 3: Re-run this script to seed and verify'
Write-Host ''

try {
    Invoke-Railway @('whoami') | Out-Null
} catch {
    Write-Host 'Railway CLI not authenticated. Run: npx @railway/cli login' -ForegroundColor Red
    exit 1
}

try {
    Invoke-Vercel @('whoami') | Out-Null
} catch {
    Write-Host 'Vercel CLI not authenticated. Run: npx vercel login' -ForegroundColor Red
    exit 1
}

$apiBase = if ($ApiUrl) { $ApiUrl.TrimEnd('/') } else { Read-DeployEnv 'LSIMS_API_URL' }
$cmsBase = if ($CmsUrl) { $CmsUrl.TrimEnd('/') } else { Read-DeployEnv 'LSIMS_CMS_URL' }
$frontendBase = if ($FrontendUrl) { $FrontendUrl.TrimEnd('/') } else { Read-DeployEnv 'LSIMS_FRONTEND_URL' }

if (-not $apiBase -or -not $cmsBase) {
    Write-Host 'Missing LSIMS_API_URL or LSIMS_CMS_URL. Set .env.deploy or pass -ApiUrl / -CmsUrl.' -ForegroundColor Yellow
    Write-Host 'Complete Railway + Vercel dashboard setup first (see docs/DEPLOY.md).' -ForegroundColor Yellow
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
