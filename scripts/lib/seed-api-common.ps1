# Shared HTTP helpers and fixture definitions for scripts/seed-api.ps1

$script:SeedConfig = @{}
$script:SeedState = @{
    Roles       = @{}
    Departments = @()
    Staff       = @{}
    AllStaff    = @()
    Clients     = @()
    Tests       = @()
    Jobs                 = @()
    SampleTestAssignments = @()
}
$script:SeedStats = @{
    Created = @{}
    Skipped = @{}
}
$script:TokenCache = @{}
$script:SeedStepCounter = 0
$script:SeedStepTotal = 0

#region agent log
function Write-SeedDebugLog {
    param(
        [string]$HypothesisId,
        [string]$Location,
        [string]$Message,
        [object]$Data
    )

    $logPath = Join-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) 'debug-33b1fc.log'
    if (-not (Test-Path (Split-Path $logPath -Parent))) {
        $logPath = Join-Path (Get-Location) 'debug-33b1fc.log'
    }
    $entry = @{
        sessionId    = '33b1fc'
        hypothesisId = $HypothesisId
        location     = $Location
        message      = $Message
        data         = $Data
        timestamp    = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    } | ConvertTo-Json -Compress -Depth 6
    Add-Content -Path $logPath -Value $entry -Encoding UTF8
}
#endregion

function Initialize-SeedConfig {
    param(
        [string]$ApiUrl,
        [string]$AdminEmail,
        [string]$AdminPassword,
        [string]$StaffPassword,
        [bool]$SkipExisting,
        [bool]$DryRun
    )

    $base = if ($ApiUrl) { $ApiUrl.TrimEnd('/') }
            elseif ($env:LSIMS_API_URL) { $env:LSIMS_API_URL.TrimEnd('/') }
            else { 'http://localhost:8000' }

    $script:SeedConfig = @{
        ApiBaseUrl     = $base
        AdminEmail     = if ($AdminEmail) { $AdminEmail } elseif ($env:LSIMS_ADMIN_EMAIL) { $env:LSIMS_ADMIN_EMAIL } else { 'admin@ministry.gov' }
        AdminPassword  = if ($AdminPassword) { $AdminPassword } elseif ($env:LSIMS_ADMIN_PASSWORD) { $env:LSIMS_ADMIN_PASSWORD } else { 'AdminPass123!' }
        StaffPassword  = if ($StaffPassword) { $StaffPassword } else { 'SeedPass123!' }
        ClientPassword = 'SeedPass123!'
        SkipExisting   = $SkipExisting
        DryRun         = $DryRun
    }

    #region agent log
    Write-SeedDebugLog -HypothesisId 'A' -Location 'seed-api-common.ps1:Initialize-SeedConfig' -Message 'Resolved seed config' -Data @{
        apiBaseUrl   = $script:SeedConfig.ApiBaseUrl
        skipExisting = $script:SeedConfig.SkipExisting
        dryRun       = $script:SeedConfig.DryRun
    }
    #endregion
}

function Get-SeedFixtureDefinitions {
    param(
        [int]$Departments = 2,
        [int]$Clients = 2,
        [int]$Tests = 3,
        [int]$StaffPerRole = 1
    )

    $departmentTemplates = @(
        @{ Name = 'Water'; Description = 'Water and environmental analysis section.' }
        @{ Name = 'Mineralogy'; Description = 'Mineralogy and ore analysis section.' }
    )
    for ($i = $departmentTemplates.Count; $i -lt $Departments; $i++) {
        $departmentTemplates += @{
            Name        = "Seed Department $($i + 1)"
            Description = "Auto-generated department for API seed script."
        }
    }
    $departmentTemplates = $departmentTemplates | Select-Object -First $Departments

    $testTemplates = @(
        @{
            test_name   = 'Gold Fire Assay'
            test_code   = 'GFA-01'
            description = 'Fire assay for gold content determination.'
            unit        = 'ppm'
            price       = '500.00'
            dept_index  = 1
            is_active   = $true
        }
        @{
            test_name   = 'Silver Analysis'
            test_code   = 'SLV-01'
            description = 'Atomic absorption for silver content.'
            unit        = 'ppm'
            price       = '350.00'
            dept_index  = 0
            is_active   = $true
        }
        @{
            test_name   = 'Deprecated Test'
            test_code   = 'DEP-01'
            description = 'This test is no longer offered.'
            unit        = 'mg/kg'
            price       = '100.00'
            dept_index  = 1
            is_active   = $false
        }
    )
    for ($i = $testTemplates.Count; $i -lt $Tests; $i++) {
        $deptIndex = $i % [Math]::Max($Departments, 1)
        $testTemplates += @{
            test_name   = "Seed Test $($i + 1)"
            test_code   = ('TST-{0:D2}' -f ($i + 1))
            description = 'Auto-generated catalog entry for API seed script.'
            unit        = 'ppm'
            price       = '{0:F2}' -f (100 + ($i * 25))
            dept_index  = $deptIndex
            is_active   = $true
        }
    }
    $testTemplates = $testTemplates | Select-Object -First $Tests

    $staffRoleSpecs = @(
        @{ Role = 'receptionist'; EmailPrefix = 'seed-receptionist'; NeedsDepartment = $false; PerDepartment = $false }
        @{ Role = 'finance'; EmailPrefix = 'seed-finance'; NeedsDepartment = $false; PerDepartment = $false }
        @{ Role = 'analyst'; EmailPrefix = 'seed-analyst'; NeedsDepartment = $true; PerDepartment = $true }
        @{ Role = 'lab_technician'; EmailPrefix = 'seed-lab-tech'; NeedsDepartment = $true; PerDepartment = $true }
        @{ Role = 'qc_manager'; EmailPrefix = 'seed-qc'; NeedsDepartment = $true; PerDepartment = $true }
        @{ Role = 'lab_director'; EmailPrefix = 'seed-director'; NeedsDepartment = $false; PerDepartment = $false }
        @{ Role = 'auditor'; EmailPrefix = 'seed-auditor'; NeedsDepartment = $false; PerDepartment = $false }
    )

    $staffTemplates = @()
    foreach ($spec in $staffRoleSpecs) {
        if ($spec.PerDepartment) {
            $iterations = [Math]::Max($Departments, 1)
            for ($d = 0; $d -lt $iterations; $d++) {
                $deptSlug = ($departmentTemplates[$d].Name -replace '[^a-zA-Z0-9]', '-').ToLower().Trim('-')
                for ($n = 1; $n -le $StaffPerRole; $n++) {
                    $suffix = if ($StaffPerRole -gt 1) { "-$n" } else { '' }
                    $staffTemplates += @{
                        Role            = $spec.Role
                        Email           = "$($spec.EmailPrefix)-$deptSlug$suffix@ministry.gov"
                        Username        = "$($spec.EmailPrefix)-$deptSlug$suffix"
                        FirstName       = "$($spec.Role -replace '_', ' ') $($departmentTemplates[$d].Name)"
                        NeedsDepartment = $spec.NeedsDepartment
                        DeptIndex       = $d
                    }
                }
            }
            continue
        }

        for ($n = 1; $n -le $StaffPerRole; $n++) {
            $suffix = if ($StaffPerRole -gt 1) { "-$n" } else { '' }
            $deptIndex = ($n - 1) % [Math]::Max($Departments, 1)
            $staffTemplates += @{
                Role            = $spec.Role
                Email           = "$($spec.EmailPrefix)$suffix@ministry.gov"
                Username        = "$($spec.EmailPrefix)$suffix"
                FirstName       = ($spec.Role -replace '_', ' ')
                NeedsDepartment = $spec.NeedsDepartment
                DeptIndex       = $deptIndex
            }
        }
    }

    $clientTemplates = @()
    for ($i = 1; $i -le $Clients; $i++) {
        $clientTemplates += @{
            Email            = "seed-client$i@minerals.com"
            FirstName        = "Seed Client $i"
            OrganizationName = "Seed Minerals Co $i"
            OrganizationType = if ($i % 2 -eq 0) { 'private' } else { 'university' }
        }
    }

    return @{
        Departments = $departmentTemplates
        Tests       = $testTemplates
        Staff       = $staffTemplates
        Clients     = $clientTemplates
    }
}

function Add-SeedStat {
    param(
        [string]$Entity,
        [ValidateSet('Created', 'Skipped')]
        [string]$Action = 'Created'
    )
    if (-not $script:SeedStats[$Action].ContainsKey($Entity)) {
        $script:SeedStats[$Action][$Entity] = 0
    }
    $script:SeedStats[$Action][$Entity]++
}

function Write-SeedProgress {
    param(
        [string]$Message,
        [ValidateSet('Info', 'Success', 'Skip', 'Warn', 'DryRun')]
        [string]$Level = 'Info'
    )

    $script:SeedStepCounter++
    $prefix = if ($script:SeedStepTotal -gt 0) {
        "[{0}/{1}]" -f $script:SeedStepCounter, $script:SeedStepTotal
    } else {
        '[seed]'
    }

    $color = switch ($Level) {
        'Success' { 'Green' }
        'Skip'    { 'DarkGray' }
        'Warn'    { 'Yellow' }
        'DryRun'  { 'DarkYellow' }
        default   { 'Cyan' }
    }
    Write-Host "$prefix $Message" -ForegroundColor $color
}

function Format-LsimsError {
    param([System.Management.Automation.ErrorRecord]$ErrorRecord)

    if ($ErrorRecord.Exception.Response -and $ErrorRecord.Exception.Response.GetResponseStream) {
        try {
            $reader = New-Object System.IO.StreamReader($ErrorRecord.Exception.Response.GetResponseStream())
            $body = $reader.ReadToEnd()
            $reader.Close()
            if ($body) {
                try {
                    $parsed = $body | ConvertFrom-Json
                    return ($parsed | ConvertTo-Json -Depth 10 -Compress)
                } catch {
                    return $body
                }
            }
        } catch {
            # fall through
        }
    }
    return $ErrorRecord.Exception.Message
}

function Invoke-LsimsApi {
    param(
        [ValidateSet('GET', 'POST', 'PUT', 'PATCH', 'DELETE')]
        [string]$Method = 'GET',
        [Parameter(Mandatory)]
        [string]$Path,
        [object]$Body,
        [string]$Token,
        [switch]$AllowFailure
    )

    if (-not $Path.StartsWith('/')) {
        $Path = "/$Path"
    }
    $uri = "$($script:SeedConfig.ApiBaseUrl)$Path"

    if ($script:SeedConfig.DryRun) {
        Write-SeedProgress -Message "DRY-RUN $Method $Path" -Level DryRun
        if ($null -ne $Body) {
            Write-Host ($Body | ConvertTo-Json -Depth 20 -Compress) -ForegroundColor DarkYellow
        }
        return $null
    }

    $headers = @{ Accept = 'application/json' }
    if ($Token) {
        $headers.Authorization = "Bearer $Token"
    }

    $params = @{
        Method      = $Method
        Uri         = $uri
        Headers     = $headers
        ErrorAction = 'Stop'
    }
    if ($null -ne $Body) {
        $params.ContentType = 'application/json; charset=utf-8'
        $params.Body = ($Body | ConvertTo-Json -Depth 20 -Compress)
    }

    try {
        return Invoke-RestMethod @params
    } catch {
        $detail = Format-LsimsError -ErrorRecord $_
        if ($AllowFailure) {
            Write-SeedProgress -Message "$Method $Path failed (allowed): $detail" -Level Warn
            return $null
        }
        Write-Host "API error on $Method $Path" -ForegroundColor Red
        Write-Host $detail -ForegroundColor Red
        throw
    }
}

function Get-LsimsToken {
    param(
        [Parameter(Mandatory)]
        [string]$Email,
        [Parameter(Mandatory)]
        [string]$Password
    )

    $cacheKey = $Email.ToLower()
    if ($script:TokenCache.ContainsKey($cacheKey)) {
        return $script:TokenCache[$cacheKey]
    }

    if ($script:SeedConfig.DryRun) {
        $fake = "dry-run-token-$cacheKey"
        $script:TokenCache[$cacheKey] = $fake
        return $fake
    }

    $response = Invoke-LsimsApi -Method POST -Path '/api/auth/token/' -Body @{
        email    = $Email
        password = $Password
    }
    if (-not $response.access) {
        throw "Authentication failed for $Email - no access token returned."
    }
    $script:TokenCache[$cacheKey] = $response.access
    return $response.access
}

function Get-AdminToken {
    return Get-LsimsToken -Email $script:SeedConfig.AdminEmail -Password $script:SeedConfig.AdminPassword
}

function Ensure-AdminExists {
    try {
        Get-AdminToken | Out-Null
        Write-SeedProgress -Message "Authenticated as admin ($($script:SeedConfig.AdminEmail))." -Level Success
    } catch {
        Write-Host @"

Cannot authenticate as admin ($($script:SeedConfig.AdminEmail)).
Run the bootstrap first:
  .\scripts\setup.ps1
  docker compose exec backend python manage.py create_user --email $($script:SeedConfig.AdminEmail) --password '$($script:SeedConfig.AdminPassword)' --role admin

"@ -ForegroundColor Red
        exit 1
    }
}

function Get-LsimsPaginated {
    param(
        [Parameter(Mandatory)]
        [string]$Path,
        [Parameter(Mandatory)]
        [string]$Token
    )

    if ($script:SeedConfig.DryRun) {
        return @()
    }

    $results = @()
    $nextPath = $Path
    while ($nextPath) {
        $response = Invoke-LsimsApi -Method GET -Path $nextPath -Token $Token
        if ($null -eq $response) { break }
        if ($response.PSObject.Properties.Name -contains 'results') {
            $results += @($response.results)
            $next = $response.next
            if ($next) {
                if ($next.StartsWith($script:SeedConfig.ApiBaseUrl)) {
                    $nextPath = $next.Substring($script:SeedConfig.ApiBaseUrl.Length)
                } else {
                    $nextPath = $next
                }
            } else {
                $nextPath = $null
            }
        } else {
            return @($response)
        }
    }
    return $results
}

function Find-ExistingEntity {
    param(
        [Parameter(Mandatory)]
        [string]$ListPath,
        [Parameter(Mandatory)]
        [string]$Token,
        [Parameter(Mandatory)]
        [string]$FieldName,
        [Parameter(Mandatory)]
        [string]$FieldValue
    )

    if (-not $script:SeedConfig.SkipExisting) {
        # Always resolve natural keys for reference entities; SkipExisting only skips creation when found.
    }

    $searchPath = if ($ListPath.Contains('?')) { "$ListPath&search=$([uri]::EscapeDataString($FieldValue))" }
                  else { "$ListPath`?search=$([uri]::EscapeDataString($FieldValue))" }
    $items = Get-LsimsPaginated -Path $searchPath -Token $Token
    foreach ($item in $items) {
        if ($item.$FieldName -eq $FieldValue) {
            #region agent log
            Write-SeedDebugLog -HypothesisId 'C' -Location 'seed-api-common.ps1:Find-ExistingEntity' -Message 'Found existing entity' -Data @{
                listPath   = $ListPath
                fieldName  = $FieldName
                fieldValue = $FieldValue
            }
            #endregion
            return $item
        }
    }
    return $null
}

function Get-StaffToken {
    param([Parameter(Mandatory)][string]$Role)

    $staff = $script:SeedState.Staff[$Role]
    if (-not $staff) {
        throw "Staff account for role '$Role' was not seeded."
    }
    return Get-LsimsToken -Email $staff.Email -Password $script:SeedConfig.StaffPassword
}

function Get-ClientToken {
    param([int]$Index = 0)

    if ($script:SeedState.Clients.Count -eq 0) {
        throw 'No seeded clients available.'
    }
    $client = $script:SeedState.Clients[$Index % $script:SeedState.Clients.Count]
    return Get-LsimsToken -Email $client.Email -Password $script:SeedConfig.ClientPassword
}

function Get-StaffForDepartment {
    param(
        [Parameter(Mandatory)]
        [string]$Role,
        [Parameter(Mandatory)]
        [string]$DepartmentId
    )

    $pool = if ($script:SeedState.AllStaff.Count -gt 0) {
        @($script:SeedState.AllStaff)
    } else {
        @($script:SeedState.Staff.Values)
    }
    $candidates = @($pool | Where-Object { $_.Role -eq $Role })
    foreach ($candidate in $candidates) {
        if ($candidate.DepartmentId -eq $DepartmentId) {
            return $candidate
        }
    }
    return $candidates | Select-Object -First 1
}

function Get-ActiveTests {
    return @($script:SeedState.Tests | Where-Object { $_.IsActive })
}

function Show-SeedSummary {
    Write-Host ''
    Write-Host 'Seed summary' -ForegroundColor Green
    Write-Host '------------'
    foreach ($entity in ($script:SeedStats.Created.Keys | Sort-Object)) {
        $created = $script:SeedStats.Created[$entity]
        $skipped = if ($script:SeedStats.Skipped.ContainsKey($entity)) { $script:SeedStats.Skipped[$entity] } else { 0 }
        Write-Host ("  {0,-22} created: {1,-4} skipped: {2}" -f $entity, $created, $skipped)
    }
    Write-Host ''
    Write-Host "API base: $($script:SeedConfig.ApiBaseUrl)"
}

function Test-BackendReachable {
    if ($script:SeedConfig.DryRun) {
        Write-SeedProgress -Message 'DRY-RUN skipping backend reachability check.' -Level DryRun
        return
    }

    $uri = "$($script:SeedConfig.ApiBaseUrl)/api/schema/"
    try {
        $null = Invoke-WebRequest -Uri $uri -Method GET -UseBasicParsing -TimeoutSec 15
        Write-SeedProgress -Message "Backend reachable at $($script:SeedConfig.ApiBaseUrl)." -Level Success
    } catch {
        Write-Host "Backend is not reachable at $($script:SeedConfig.ApiBaseUrl)." -ForegroundColor Red
        Write-Host 'Start the stack with .\scripts\start.ps1 or .\scripts\setup.ps1' -ForegroundColor Red
        exit 1
    }
}

function Invoke-OptionalSeedRoles {
    param([string]$ScriptDir)

    $commonPath = Join-Path $ScriptDir 'lib\common.ps1'
    if (-not (Test-Path $commonPath)) { return }

    . $commonPath
    $repoRoot = Find-RepoRoot -StartDir $ScriptDir
    if (-not $repoRoot) { return }

    $backendId = docker compose ps -q backend 2>$null
    if (-not $backendId) { return }

    Write-SeedProgress -Message 'Ensuring roles exist via seed_roles (local Docker)...' -Level Info
    try {
        Invoke-SeedRoles
    } catch {
        Write-SeedProgress -Message 'seed_roles skipped or failed (non-fatal for remote APIs).' -Level Warn
    }
}
