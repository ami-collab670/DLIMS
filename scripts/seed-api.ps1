#Requires -Version 5.1
<#
.SYNOPSIS
  Populate LSIMS demo data through the REST API.

.DESCRIPTION
  Seeds reference data (departments, staff, clients, test catalog) and runs full
  laboratory workflows (jobs, samples, finance, preparation, analysis, QC) plus
  support entities (complaints, discount approvals, notifications).

.EXAMPLE
  .\scripts\seed-api.ps1

.EXAMPLE
  .\scripts\seed-api.ps1 -Batch 10

.EXAMPLE
  .\scripts\seed-api.ps1 batch 10
  # Positional alias for -Batch (also accepts: .\scripts\seed-api.ps1 batch 10)

.EXAMPLE
  .\scripts\seed-api.ps1 -Clients 5 -Jobs 20 -SamplesPerJob 2 -Tests 6
#>
[CmdletBinding()]
param(
    [string]$ApiUrl,
    [string]$AdminEmail,
    [string]$AdminPassword,
    [string]$StaffPassword,

    [int]$Batch = 0,
    [int]$Clients = 2,
    [int]$Departments = 2,
    [int]$StaffPerRole = 1,
    [int]$Tests = 3,
    [int]$Jobs = 2,
    [int]$SamplesPerJob = 1,
    [int]$Complaints = 1,
    [int]$Discounts = 1,
    [int]$Notifications = 2,

    [bool]$SkipExisting = $true,
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $ScriptDir 'lib\seed-api-common.ps1')

# Support accidental positional usage: .\seed-api.ps1 batch 50
if ($ApiUrl -eq 'batch') {
    if ($AdminEmail -match '^\d+$') {
        $Batch = [int]$AdminEmail
        $AdminEmail = $null
    }
    $ApiUrl = $null
} elseif ($ApiUrl -and $ApiUrl -notmatch '^https?://') {
    Write-Host "Invalid -ApiUrl '$ApiUrl'. Use -Batch N for batch mode, e.g. .\scripts\seed-api.ps1 -Batch 50" -ForegroundColor Red
    exit 1
}

#region agent log
Write-SeedDebugLog -HypothesisId 'A' -Location 'seed-api.ps1:param-normalize' -Message 'Normalized CLI parameters' -Data @{
    apiUrl = $ApiUrl
    batch  = $Batch
    skipExisting = $SkipExisting
    dryRun = $DryRun.IsPresent
}
#endregion

function Initialize-SeedPhases {
    param(
        [int]$WorkflowCount,
        [int]$ComplaintCount,
        [int]$DiscountCount,
        [int]$NotificationCount,
        [object]$Fixtures
    )

    $referenceSteps = $Fixtures.Departments.Count + $Fixtures.Staff.Count + $Fixtures.Clients.Count + $Fixtures.Tests.Count
    $workflowStepsPerJob = 8 + ($SamplesPerJob * 7)
    $workflowSteps = $WorkflowCount * $workflowStepsPerJob
    $discountSteps = $DiscountCount * 6
    $supportSteps = $ComplaintCount + $NotificationCount + 2

    $script:SeedStepTotal = $referenceSteps + $workflowSteps + $discountSteps + $supportSteps + 3
    $script:SeedStepCounter = 0
}

function Invoke-SeedRolesPhase {
    param(
        [Parameter(Mandatory)]
        [string]$AdminToken,
        [object]$Fixtures
    )

    $roles = Get-LsimsPaginated -Path '/api/accounts/roles/' -Token $AdminToken
    foreach ($role in $roles) {
        $script:SeedState.Roles[$role.role_name] = $role.id
    }
    if ($script:SeedState.Roles.Count -eq 0 -and $script:SeedConfig.DryRun) {
        foreach ($roleName in @(
                'admin', 'receptionist', 'lab_technician', 'analyst', 'qc_manager',
                'lab_director', 'finance', 'procurement', 'ministry_coordinator', 'auditor'
            )) {
            $script:SeedState.Roles[$roleName] = [guid]::NewGuid().ToString()
        }
    }
    if ($script:SeedState.Roles.Count -eq 0 -and -not $script:SeedConfig.DryRun) {
        throw 'No roles found. Run python manage.py seed_roles or migrations first.'
    }
    Write-SeedProgress -Message "Loaded $($script:SeedState.Roles.Count) roles." -Level Success
}

function Invoke-SeedDepartmentsPhase {
    param(
        [Parameter(Mandatory)]
        [string]$AdminToken,
        [object]$Fixtures
    )

    foreach ($template in $Fixtures.Departments) {
        $existing = Find-ExistingEntity -ListPath '/api/accounts/departments/' -Token $AdminToken -FieldName 'name' -FieldValue $template.Name
        if ($existing) {
            $entry = @{
                Id   = $existing.id
                Name = $existing.name
            }
            $script:SeedState.Departments += $entry
            if ($script:SeedConfig.SkipExisting) {
                Add-SeedStat -Entity 'departments' -Action Skipped
                Write-SeedProgress -Message "Skipped existing department $($template.Name) ($($existing.id))." -Level Skip
            } else {
                Add-SeedStat -Entity 'departments' -Action Skipped
                Write-SeedProgress -Message "Reusing existing department $($template.Name) ($($existing.id))." -Level Skip
            }
            continue
        }

        $created = Invoke-LsimsApi -Method POST -Path '/api/accounts/departments/' -Token $AdminToken -Body @{
            name        = $template.Name
            description = $template.Description
        }
        $entry = @{
            Id   = if ($created) { $created.id } else { [guid]::NewGuid().ToString() }
            Name = $template.Name
        }
        $script:SeedState.Departments += $entry
        Add-SeedStat -Entity 'departments'
        Write-SeedProgress -Message "Created department $($template.Name) ($($entry.Id))." -Level Success
    }
}

function Invoke-SeedStaffPhase {
    param(
        [Parameter(Mandatory)]
        [string]$AdminToken,
        [object]$Fixtures
    )

    foreach ($template in $Fixtures.Staff) {
        $existing = Find-ExistingEntity -ListPath '/api/accounts/users/' -Token $AdminToken -FieldName 'email' -FieldValue $template.Email
        if ($existing) {
            $deptId = $existing.department
            $staffEntry = @{
                Id           = $existing.id
                Email        = $existing.email
                Role         = $template.Role
                DepartmentId = $deptId
            }
            $script:SeedState.AllStaff += $staffEntry
            if (-not $script:SeedState.Staff.ContainsKey($template.Role)) {
                $script:SeedState.Staff[$template.Role] = $staffEntry
            }
            Add-SeedStat -Entity 'staff_users' -Action Skipped
            Write-SeedProgress -Message "Skipped existing staff $($template.Email)." -Level Skip
            continue
        }

        $roleId = $script:SeedState.Roles[$template.Role]
        if (-not $roleId -and -not $script:SeedConfig.DryRun) {
            throw "Role '$($template.Role)' not found."
        }

        $body = @{
            username   = $template.Username
            email      = $template.Email
            password   = $script:SeedConfig.StaffPassword
            first_name = $template.FirstName
            user_type  = 'internal'
            role       = $roleId
        }
        $deptId = $null
        if ($template.NeedsDepartment) {
            $dept = $script:SeedState.Departments[$template.DeptIndex]
            $deptId = $dept.Id
            $body.department = $deptId
        }

        $created = Invoke-LsimsApi -Method POST -Path '/api/accounts/users/' -Token $AdminToken -Body $body
        $staffEntry = @{
            Id           = if ($created) { $created.id } else { [guid]::NewGuid().ToString() }
            Email        = $template.Email
            Role         = $template.Role
            DepartmentId = $deptId
        }
        $script:SeedState.AllStaff += $staffEntry
        if (-not $script:SeedState.Staff.ContainsKey($template.Role)) {
            $script:SeedState.Staff[$template.Role] = $staffEntry
        }
        Add-SeedStat -Entity 'staff_users'
        Write-SeedProgress -Message "Created staff $($template.Email) [$($template.Role)]." -Level Success
    }
}

function Invoke-SeedClientsPhase {
    param(
        [Parameter(Mandatory)]
        [string]$AdminToken,
        [object]$Fixtures
    )

    foreach ($template in $Fixtures.Clients) {
        $existing = Find-ExistingEntity -ListPath '/api/accounts/users/' -Token $AdminToken -FieldName 'email' -FieldValue $template.Email
        if ($existing) {
            $script:SeedState.Clients += @{
                Id    = $existing.id
                Email = $existing.email
            }
            Add-SeedStat -Entity 'clients' -Action Skipped
            Write-SeedProgress -Message "Skipped existing client $($template.Email)." -Level Skip
            continue
        }

        $created = Invoke-LsimsApi -Method POST -Path '/api/auth/register/' -Body @{
            email             = $template.Email
            password          = $script:SeedConfig.ClientPassword
            password_confirm  = $script:SeedConfig.ClientPassword
            first_name        = $template.FirstName
            organization_name = $template.OrganizationName
            organization_type = $template.OrganizationType
        }

        $clientId = $null
        if ($created -and $created.user -and $created.user.id) {
            $clientId = $created.user.id
        } elseif ($created -and $created.id) {
            $clientId = $created.id
        } else {
            $lookup = Find-ExistingEntity -ListPath '/api/accounts/users/' -Token $AdminToken -FieldName 'email' -FieldValue $template.Email
            $clientId = if ($lookup) { $lookup.id } else { [guid]::NewGuid().ToString() }
        }

        $script:SeedState.Clients += @{
            Id    = $clientId
            Email = $template.Email
        }
        Add-SeedStat -Entity 'clients'
        Write-SeedProgress -Message "Registered client $($template.Email) ($clientId)." -Level Success
    }
}

function Invoke-SeedTestsPhase {
    param(
        [Parameter(Mandatory)]
        [string]$AdminToken,
        [object]$Fixtures
    )

    foreach ($template in $Fixtures.Tests) {
        $existing = Find-ExistingEntity -ListPath '/api/laboratory/tests/' -Token $AdminToken -FieldName 'test_code' -FieldValue $template.test_code
        if ($existing) {
            $script:SeedState.Tests += @{
                Id         = $existing.id
                TestCode   = $existing.test_code
                Department = $existing.department
                IsActive   = [bool]$existing.is_active
                Unit       = $existing.unit
                Price      = $existing.price
            }
            Add-SeedStat -Entity 'tests' -Action Skipped
            Write-SeedProgress -Message "Skipped existing test $($template.test_code)." -Level Skip
            continue
        }

        $dept = $script:SeedState.Departments[$template.dept_index]
        $created = Invoke-LsimsApi -Method POST -Path '/api/laboratory/tests/' -Token $AdminToken -Body @{
            test_name   = $template.test_name
            test_code   = $template.test_code
            description = $template.description
            unit        = $template.unit
            price       = $template.price
            department  = $dept.Id
            is_active   = $template.is_active
        }
        $script:SeedState.Tests += @{
            Id         = if ($created) { $created.id } else { [guid]::NewGuid().ToString() }
            TestCode   = $template.test_code
            Department = $dept.Id
            IsActive   = [bool]$template.is_active
            Unit       = $template.unit
            Price      = $template.price
        }
        Add-SeedStat -Entity 'tests'
        Write-SeedProgress -Message "Created test $($template.test_code) for department $($dept.Name)." -Level Success
    }
}

function Invoke-SeedPaidWorkflow {
    param(
        [int]$JobIndex,
        [int]$ClientIndex = 0
    )

    $receptionistToken = Get-StaffToken -Role 'receptionist'
    $financeToken = Get-StaffToken -Role 'finance'
    $client = $script:SeedState.Clients[$ClientIndex % $script:SeedState.Clients.Count]
    $activeTests = Get-ActiveTests
    if ($activeTests.Count -eq 0) {
        throw 'No active tests available for workflow seeding.'
    }
    $primaryTest = $activeTests[$JobIndex % $activeTests.Count]

    $job = Invoke-LsimsApi -Method POST -Path '/api/laboratory/jobs/' -Token $receptionistToken -Body @{
        client      = $client.Id
        priority    = if ($JobIndex % 3 -eq 0) { 'urgent' } else { 'normal' }
        description = "Seed workflow job #$($JobIndex + 1) for $($client.Email)."
    }
    $jobId = if ($job) { $job.id } else { [guid]::NewGuid().ToString() }
    Add-SeedStat -Entity 'jobs'
    Write-SeedProgress -Message "Created job $jobId for client $($client.Email)." -Level Success

    $sampleIds = @()
    for ($s = 0; $s -lt $SamplesPerJob; $s++) {
        $sample = Invoke-LsimsApi -Method POST -Path '/api/laboratory/samples/' -Token $receptionistToken -Body @{
            job            = $jobId
            sample_name    = "Seed Sample $($JobIndex + 1)-$($s + 1)"
            sample_weight  = '{0:F3}' -f (100 + ($JobIndex * 10) + $s)
            packaging_type = 'Sealed Bag'
            submitted_by   = $client.Id
            notes          = 'Created by seed-api.ps1'
        }
        $sampleId = if ($sample) { $sample.id } else { [guid]::NewGuid().ToString() }
        $sampleIds += $sampleId
        Add-SeedStat -Entity 'samples'
        Write-SeedProgress -Message "Created sample $sampleId on job $jobId." -Level Success

        $testForSample = $activeTests[($JobIndex + $s) % $activeTests.Count]
        $sampleTestResponse = Invoke-LsimsApi -Method POST -Path '/api/laboratory/sample-tests/' -Token $receptionistToken -Body @{
            sample = $sampleId
            test   = $testForSample.Id
        }
        $sampleTestId = if ($sampleTestResponse) { $sampleTestResponse.id } else { [guid]::NewGuid().ToString() }
        $script:SeedState.SampleTestAssignments += @{
            Id       = $sampleTestId
            SampleId = $sampleId
            Test     = $testForSample.Id
        }
        Add-SeedStat -Entity 'sample_tests'
        Write-SeedProgress -Message "Assigned test $($testForSample.TestCode) to sample $sampleId." -Level Success

        $analystForTest = Get-StaffForDepartment -Role 'analyst' -DepartmentId $testForSample.Department
        Invoke-LsimsApi -Method POST -Path "/api/laboratory/samples/$sampleId/assign-analyst/" -Token $receptionistToken -Body @{
            assigned_analyst   = $analystForTest.Id
            reassigned_reason  = 'Seed script assignment.'
        } | Out-Null
        Add-SeedStat -Entity 'sample_assignments'
        Write-SeedProgress -Message "Assigned analyst $($analystForTest.Email) to sample $sampleId." -Level Success
    }

    $expectedAmount = '{0:F2}' -f ([decimal]$primaryTest.Price * $SamplesPerJob)
    Invoke-LsimsApi -Method POST -Path '/api/laboratory/financial-records/' -Token $financeToken -Body @{
        job             = $jobId
        amount_expected = $expectedAmount
        amount_paid     = $expectedAmount
        payment_status  = 'paid'
    } | Out-Null
    Add-SeedStat -Entity 'financial_records'
    Write-SeedProgress -Message "Marked job $jobId paid ($expectedAmount)." -Level Success

    foreach ($sampleId in $sampleIds) {
        $sampleTests = @(
            $script:SeedState.SampleTestAssignments |
                Where-Object { $_.SampleId -eq $sampleId } |
                ForEach-Object {
                    [PSCustomObject]@{
                        id     = $_.Id
                        test   = $_.Test
                        sample = $_.SampleId
                    }
                }
        )
        if ($sampleTests.Count -eq 0) {
            $sampleTests = @(Get-LsimsPaginated -Path "/api/laboratory/sample-tests/?sample=$sampleId" -Token $receptionistToken)
        }

        #region agent log
        Write-SeedDebugLog -HypothesisId 'B' -Location 'seed-api.ps1:Invoke-SeedPaidWorkflow' -Message 'Resolved sample tests for preparation' -Data @{
            sampleId        = $sampleId
            sampleTestCount = $sampleTests.Count
            dryRun          = $script:SeedConfig.DryRun
        }
        #endregion

        if ($sampleTests.Count -eq 0) {
            throw "No sample tests found for sample $sampleId."
        }

        $firstTestMeta = @($script:SeedState.Tests | Where-Object { $_.Id -eq $sampleTests[0].test } | Select-Object -First 1)
        $sampleDeptId = if ($firstTestMeta) { $firstTestMeta.Department } else { $primaryTest.Department }
        $technician = Get-StaffForDepartment -Role 'lab_technician' -DepartmentId $sampleDeptId
        $technicianToken = Get-LsimsToken -Email $technician.Email -Password $script:SeedConfig.StaffPassword
        $qcManager = Get-StaffForDepartment -Role 'qc_manager' -DepartmentId $sampleDeptId
        $qcToken = Get-LsimsToken -Email $qcManager.Email -Password $script:SeedConfig.StaffPassword

        $prep = Invoke-LsimsApi -Method POST -Path '/api/laboratory/preparation-records/' -Token $receptionistToken -Body @{
            sample     = $sampleId
            technician = $technician.Id
            notes      = 'Seed preparation record.'
        }
        $prepId = if ($prep) { $prep.id } else { [guid]::NewGuid().ToString() }
        Add-SeedStat -Entity 'preparation_records'
        Write-SeedProgress -Message "Created preparation record $prepId for sample $sampleId." -Level Success

        Invoke-LsimsApi -Method POST -Path "/api/laboratory/preparation-records/$prepId/start/" -Token $technicianToken | Out-Null
        Add-SeedStat -Entity 'preparation_starts'
        Write-SeedProgress -Message "Started preparation $prepId." -Level Success

        Invoke-LsimsApi -Method POST -Path "/api/laboratory/preparation-records/$prepId/complete/" -Token $technicianToken -Body @{
            preparation_data = @{ method = 'standard prep' }
            notes            = 'Seed prep complete.'
        } | Out-Null
        Add-SeedStat -Entity 'preparation_completes'
        Write-SeedProgress -Message "Completed preparation $prepId." -Level Success

        foreach ($sampleTest in $sampleTests) {
            $testMeta = @($script:SeedState.Tests | Where-Object { $_.Id -eq $sampleTest.test } | Select-Object -First 1)
            $unit = if ($testMeta) { $testMeta.Unit } else { 'ppm' }
            $deptId = if ($testMeta) { $testMeta.Department } else { $primaryTest.Department }
            $analystForResult = Get-StaffForDepartment -Role 'analyst' -DepartmentId $deptId
            $resultToken = Get-LsimsToken -Email $analystForResult.Email -Password $script:SeedConfig.StaffPassword

            $result = Invoke-LsimsApi -Method POST -Path '/api/laboratory/analysis-results/' -Token $resultToken -Body @{
                sample_test = $sampleTest.id
                value       = '{0:F2}' -f (10 + ($JobIndex * 1.5))
                unit        = $unit
                method      = 'ICP-OES'
                remarks     = 'Seed analysis result.'
            }
            $resultId = if ($result) { $result.id } else { [guid]::NewGuid().ToString() }
            Add-SeedStat -Entity 'analysis_results'
            Write-SeedProgress -Message "Created analysis result $resultId." -Level Success

            Invoke-LsimsApi -Method POST -Path '/api/laboratory/calibration-records/' -Token $resultToken -Body @{
                analysis_result       = $resultId
                instrument_name       = 'ICP-OES-1'
                calibration_reference = "CAL-SEED-$JobIndex"
                calibration_data      = @{ standard = 'STD-A' }
                notes                 = 'Seed calibration record.'
            } | Out-Null
            Add-SeedStat -Entity 'calibration_records'
            Write-SeedProgress -Message "Added calibration for result $resultId." -Level Success

            Invoke-LsimsApi -Method POST -Path "/api/laboratory/analysis-results/$resultId/submit/" -Token $resultToken | Out-Null
            Add-SeedStat -Entity 'analysis_submissions'
            Write-SeedProgress -Message "Submitted analysis result $resultId." -Level Success

            Invoke-LsimsApi -Method POST -Path "/api/laboratory/analysis-results/$resultId/approve/" -Token $qcToken -Body @{
                reason = 'Seed QC approval.'
            } | Out-Null
            Add-SeedStat -Entity 'qc_approvals'
            Write-SeedProgress -Message "QC approved result $resultId." -Level Success
        }
    }

    $script:SeedState.Jobs += @{
        Id       = $jobId
        ClientId = $client.Id
    }
}

function Invoke-SeedDiscountWorkflow {
    param([int]$DiscountIndex)

    $receptionistToken = Get-StaffToken -Role 'receptionist'
    $financeToken = Get-StaffToken -Role 'finance'
    $directorToken = Get-StaffToken -Role 'lab_director'
    $client = $script:SeedState.Clients[$DiscountIndex % $script:SeedState.Clients.Count]
    $activeTests = Get-ActiveTests
    $test = $activeTests[$DiscountIndex % $activeTests.Count]

    $job = Invoke-LsimsApi -Method POST -Path '/api/laboratory/jobs/' -Token $receptionistToken -Body @{
        client      = $client.Id
        priority    = 'normal'
        description = "Seed discount workflow job #$($DiscountIndex + 1)."
    }
    $jobId = if ($job) { $job.id } else { [guid]::NewGuid().ToString() }
    Add-SeedStat -Entity 'discount_jobs'
    Write-SeedProgress -Message "Created discount job $jobId." -Level Success

    $sample = Invoke-LsimsApi -Method POST -Path '/api/laboratory/samples/' -Token $receptionistToken -Body @{
        job            = $jobId
        sample_name    = "Discount Seed Sample $($DiscountIndex + 1)"
        sample_weight  = '150.000'
        packaging_type = 'Sealed Container'
        submitted_by   = $client.Id
    }
    $sampleId = if ($sample) { $sample.id } else { [guid]::NewGuid().ToString() }
    Add-SeedStat -Entity 'discount_samples'
    Write-SeedProgress -Message "Created discount sample $sampleId." -Level Success

    Invoke-LsimsApi -Method POST -Path '/api/laboratory/sample-tests/' -Token $receptionistToken -Body @{
        sample = $sampleId
        test   = $test.Id
    } | Out-Null
    Add-SeedStat -Entity 'discount_sample_tests'
    Write-SeedProgress -Message "Assigned test $($test.TestCode) to discount sample." -Level Success

    $approval = Invoke-LsimsApi -Method POST -Path '/api/laboratory/discount-approvals/' -Token $financeToken -Body @{
        job           = $jobId
        discount_type = 'free_test'
        reason        = 'Director-approved public-interest testing (seed script).'
    }
    $approvalId = if ($approval) { $approval.id } else { [guid]::NewGuid().ToString() }
    Add-SeedStat -Entity 'discount_approvals'
    Write-SeedProgress -Message "Requested discount approval $approvalId." -Level Success

    Invoke-LsimsApi -Method POST -Path "/api/laboratory/discount-approvals/$approvalId/approve/" -Token $directorToken -Body @{
        review_note = 'Approved as free test (seed script).'
    } | Out-Null
    Add-SeedStat -Entity 'discount_approvals_approved'
    Write-SeedProgress -Message "Director approved discount $approvalId (samples coded)." -Level Success
}

function Invoke-SeedComplaintsPhase {
    param([int]$Count)

    if ($Count -le 0) { return }

    for ($i = 0; $i -lt $Count; $i++) {
        $clientIndex = $i % $script:SeedState.Clients.Count
        $client = $script:SeedState.Clients[$clientIndex]
        $clientToken = Get-ClientToken -Index $clientIndex

        $job = $null
        $existingJob = @($script:SeedState.Jobs | Where-Object { $_.ClientId -eq $client.Id } | Select-Object -First 1)
        if ($existingJob) {
            $job = @{ id = $existingJob.Id }
        } else {
            $receptionistToken = Get-StaffToken -Role 'receptionist'
            $job = Invoke-LsimsApi -Method POST -Path '/api/laboratory/jobs/' -Token $receptionistToken -Body @{
                client      = $client.Id
                priority    = 'normal'
                description = "Complaint support job for $($client.Email)."
            }
        }
        $jobId = if ($job) { $job.id } else { [guid]::NewGuid().ToString() }

        $categories = @('payment', 'sample', 'result', 'other')
        Invoke-LsimsApi -Method POST -Path '/api/laboratory/complaints/' -Token $clientToken -Body @{
            job         = $jobId
            category    = $categories[$i % $categories.Count]
            description = "Seed complaint #$($i + 1) from $($client.Email)."
        } | Out-Null
        Add-SeedStat -Entity 'complaints'
        Write-SeedProgress -Message "Created complaint for client $($client.Email) on job $jobId." -Level Success
    }
}

function Invoke-SeedNotificationsPhase {
    param(
        [Parameter(Mandatory)]
        [string]$AdminToken,
        [int]$Count
    )

    if ($Count -le 0) { return }
    if ($script:SeedState.Clients.Count -eq 0) { return }

    for ($i = 0; $i -lt $Count; $i++) {
        $client = $script:SeedState.Clients[$i % $script:SeedState.Clients.Count]
        Invoke-LsimsApi -Method POST -Path '/api/notifications/inbox/' -Token $AdminToken -Body @{
            recipient = $client.Email
            title     = "Seed notification #$($i + 1)"
            body      = 'Demo inbox message created by seed-api.ps1.'
            kind      = if ($i % 2 -eq 0) { 'info' } else { 'alert' }
            metadata  = @{ source = 'seed-api.ps1'; index = $i + 1 }
        } | Out-Null
        Add-SeedStat -Entity 'notifications'
        Write-SeedProgress -Message "Sent notification to $($client.Email)." -Level Success
    }
}

Write-Host ''
Write-Host 'LSIMS API database seed' -ForegroundColor Green
Write-Host '======================='

Initialize-SeedConfig -ApiUrl $ApiUrl -AdminEmail $AdminEmail -AdminPassword $AdminPassword -StaffPassword $StaffPassword -SkipExisting $SkipExisting -DryRun:$DryRun.IsPresent
$fixtures = Get-SeedFixtureDefinitions -Departments $Departments -Clients $Clients -Tests $Tests -StaffPerRole $StaffPerRole

$workflowCount = if ($Batch -gt 0) { $Batch } else { $Jobs }
Initialize-SeedPhases -WorkflowCount $workflowCount -ComplaintCount $Complaints -DiscountCount $Discounts -NotificationCount $Notifications -Fixtures $fixtures

Test-BackendReachable
Invoke-OptionalSeedRoles -ScriptDir $ScriptDir
Ensure-AdminExists
$adminToken = Get-AdminToken

Write-Host ''
Write-Host 'Phase 1 - reference data' -ForegroundColor Yellow
Invoke-SeedRolesPhase -AdminToken $adminToken -Fixtures $fixtures
Invoke-SeedDepartmentsPhase -AdminToken $adminToken -Fixtures $fixtures
Invoke-SeedStaffPhase -AdminToken $adminToken -Fixtures $fixtures
Invoke-SeedClientsPhase -AdminToken $adminToken -Fixtures $fixtures
Invoke-SeedTestsPhase -AdminToken $adminToken -Fixtures $fixtures

Write-Host ''
Write-Host "Phase 2 - laboratory workflows ($workflowCount jobs)" -ForegroundColor Yellow
for ($j = 0; $j -lt $workflowCount; $j++) {
    Write-Host "  Workflow $($j + 1)/$workflowCount" -ForegroundColor DarkCyan
    Invoke-SeedPaidWorkflow -JobIndex $j -ClientIndex $j
}

if ($Discounts -gt 0) {
    Write-Host ''
    Write-Host "Phase 2b - discount workflows ($Discounts)" -ForegroundColor Yellow
    for ($d = 0; $d -lt $Discounts; $d++) {
        Invoke-SeedDiscountWorkflow -DiscountIndex $d
    }
}

Write-Host ''
Write-Host 'Phase 3 - support entities' -ForegroundColor Yellow
Invoke-SeedComplaintsPhase -Count $Complaints
Invoke-SeedNotificationsPhase -AdminToken $adminToken -Count $Notifications

Show-SeedSummary

if ($DryRun) {
    Write-Host 'Dry run complete - no data was written.' -ForegroundColor DarkYellow
} else {
    Write-Host 'Seed complete.' -ForegroundColor Green
}
