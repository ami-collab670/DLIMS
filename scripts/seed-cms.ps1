#Requires -Version 5.1
<#
.SYNOPSIS
  Populate Strapi CMS with demo content from cms/src/bootstrap/seed-data.js.

.EXAMPLE
  .\scripts\seed-cms.ps1
#>
$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $ScriptDir 'lib\common.ps1')

Initialize-RepoRoot -ScriptDir $ScriptDir | Out-Null
Require-BackendRunning
Wait-ForCms

Write-Host '>>> Seeding CMS content...'
Invoke-SeedCms
Write-Host 'CMS seed complete.' -ForegroundColor Green
