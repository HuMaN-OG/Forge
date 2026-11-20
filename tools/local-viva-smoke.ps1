param([switch]$NoWrite)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$base = 'http://127.0.0.1:3000'
function Require([bool]$condition,[string]$message) {
    if (-not $condition) { throw $message }
}
try {
    $status = Invoke-RestMethod -Uri "$base/api/system/status" -TimeoutSec 10
    Require ($status.backend.status -eq 'connected') 'Express backend is offline.'
    Require ($status.automationTools.status -eq 'available') 'Python automation service is offline.'
    Require ($status.readyForLocalAutomation -eq $true) 'Automation token or runtime is not ready.'
    Write-Host ("PASS: Express + Python ready; model status: {0}" -f $status.aiProvider.localStatus) -ForegroundColor Green
    if ($NoWrite) { exit 0 }
    $folder = "VivaCheck" + (Get-Date -Format 'HHmmssfff')
    $payload = @{ message = "Create a folder called $folder"; conversationId = "viva-check-$folder" } | ConvertTo-Json
    $planned = Invoke-RestMethod -Uri "$base/api/v1/chat" -Method Post -ContentType 'application/json' -Body $payload -TimeoutSec 20
    Require ($planned.task.status -eq 'WAITING_APPROVAL') 'Task did not enter WAITING_APPROVAL.'
    Require ($planned.task.plannedTool -eq 'file_system') 'Unexpected tool selected.'
    Require ($planned.task.approvalDetails.toolParams.targetDirectory -eq $folder) 'Planner extracted the wrong folder name.'
    $target = Join-Path (Join-Path $root 'workspace_sandbox') $folder
    Require (-not (Test-Path $target)) 'Task executed before approval!'
    Write-Host "PASS: Plan requires approval, target = $folder." -ForegroundColor Green
    $result = Invoke-RestMethod -Uri "$base/api/v1/tasks/$($planned.task.id)/approve" -Method Post -ContentType 'application/json' -Body '{}' -TimeoutSec 35
    Require ($result.success -eq $true) 'Approval execution failed.'
    Require (Test-Path $target -PathType Container) 'Approved folder was not created inside the sandbox.'
    Write-Host "PASS: Approved operation created $target" -ForegroundColor Green
    Write-Host 'PASS: Local planning, approval, authenticated tool dispatch, and disk verification.' -ForegroundColor Green
} catch {
    Write-Host "LOCAL SMOKE FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
