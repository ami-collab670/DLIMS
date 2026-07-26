#Requires -Version 5.1
<#
.SYNOPSIS
  Smoke-test deployed LSIMS URLs.

.EXAMPLE
  .\scripts\deploy\verify-deployment.ps1 `
    -ApiUrl "https://backend.up.railway.app" `
    -CmsUrl "https://cms.up.railway.app" `
    -FrontendUrl "https://app.vercel.app"
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$ApiUrl,
    [Parameter(Mandatory)]
    [string]$CmsUrl,
    [string]$FrontendUrl
)

$ErrorActionPreference = 'Stop'
$failures = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [scriptblock]$Assert
    )

    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -UseBasicParsing -TimeoutSec 30
        & $Assert $response
        Write-Host "[ok] $Name" -ForegroundColor Green
    } catch {
        Write-Host "[fail] $Name - $($_.Exception.Message)" -ForegroundColor Red
        $script:failures += $Name
    }
}

$api = $ApiUrl.TrimEnd('/')
$cms = $CmsUrl.TrimEnd('/')

Write-Host 'Verifying LSIMS deployment...' -ForegroundColor Cyan

Test-Endpoint -Name 'Backend API docs' -Url "$api/api/docs/" -Assert {
    param($r)
    if ($r.StatusCode -ge 500) { throw "HTTP $($r.StatusCode)" }
}

Test-Endpoint -Name 'CMS home page' -Url "$cms/api/home-page" -Assert {
    param($r)
    if ($r.StatusCode -ne 200) { throw "HTTP $($r.StatusCode)" }
    $body = $r.Content | ConvertFrom-Json
    if ($null -eq $body.data) { throw 'CMS home-page missing data' }
}

Test-Endpoint -Name 'CMS admin UI' -Url "$cms/admin" -Assert {
    param($r)
    if ($r.StatusCode -ge 500) { throw "HTTP $($r.StatusCode)" }
}

if ($FrontendUrl) {
    $frontend = $FrontendUrl.TrimEnd('/')
    Test-Endpoint -Name 'Frontend SPA' -Url $frontend -Assert {
        param($r)
        if ($r.StatusCode -ge 500) { throw "HTTP $($r.StatusCode)" }
    }
}

try {
    $tokenResponse = Invoke-RestMethod -Method POST -Uri "$api/api/auth/token/" `
        -ContentType 'application/json' `
        -Body (@{ email = 'admin@gie.com'; password = 'seedpass!' } | ConvertTo-Json)
    if (-not $tokenResponse.access) { throw 'No access token' }
    Write-Host '[ok] Django admin login' -ForegroundColor Green
} catch {
    Write-Host "[fail] Django admin login - $($_.Exception.Message)" -ForegroundColor Red
    $failures += 'Django admin login'
}

if ($failures.Count -gt 0) {
    Write-Host ''
    Write-Host "Verification failed: $($failures -join ', ')" -ForegroundColor Red
    exit 1
}

Write-Host ''
Write-Host 'All checks passed.' -ForegroundColor Green
