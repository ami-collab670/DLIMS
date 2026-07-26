#Requires -Version 5.1
<#
.SYNOPSIS
  Seed LSIMS demo data: CMS content, departments, staff, client service catalog, and workflows.

.DESCRIPTION
  Orchestrates CMS seeding and the API seed script using scripts/fixtures/demo-seed.json.
  Replaces the test catalog with the full CLIENT_SERVICE_CATALOG (74 tests, 4 departments).

.EXAMPLE
  .\scripts\seed-demo.ps1

.EXAMPLE
  .\scripts\seed-demo.ps1 -Batch 5
#>
[CmdletBinding()]
param(
    [int]$Batch = 0,
    [int]$Jobs = 2,
    [int]$SamplesPerJob = 1,
    [int]$Complaints = 1,
    [int]$Discounts = 1,
    [int]$Notifications = 2,
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $ScriptDir 'lib\common.ps1')

Initialize-RepoRoot -ScriptDir $ScriptDir | Out-Null
Require-BackendRunning
Wait-ForCms

Write-Host ''
Write-Host 'LSIMS demo seed' -ForegroundColor Green
Write-Host '==============='

& (Join-Path $ScriptDir 'seed-cms.ps1')

$seedApiArgs = @{
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
if ($Batch -gt 0) {
    $seedApiArgs.Batch = $Batch
}
if ($DryRun) {
    $seedApiArgs.DryRun = $true
}

& (Join-Path $ScriptDir 'seed-api.ps1') @seedApiArgs
