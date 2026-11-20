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
    Write-Host 'PASS: Local folder planning, approval, authenticated tool dispatch, and disk verification.' -ForegroundColor Green

    # More substantive viva demonstration: real workbook with user-supplied rows.
    $excelName = "VivaSales" + (Get-Date -Format 'HHmmssfff') + ".xlsx"
    $excelPrompt = "Create an Excel spreadsheet named $excelName with columns Item and Amount containing Laptop 25000, Mouse 500, Keyboard 1000, and total"
    $excelPayload = @{ message = $excelPrompt; conversationId = "viva-excel-$excelName" } | ConvertTo-Json
    $excelPlan = Invoke-RestMethod -Uri "$base/api/v1/chat" -Method Post -ContentType 'application/json' -Body $excelPayload -TimeoutSec 25
    Require ($excelPlan.task.status -eq 'WAITING_APPROVAL') 'Excel task bypassed approval.'
    Require ($excelPlan.task.plannedTool -eq 'excel_writer') 'Incorrect Excel tool selected.'
    Require ($excelPlan.task.approvalDetails.toolParams.formulas.B5 -eq '=SUM(B2:B4)') 'Expected total formula missing from the plan.'
    $workbookPath = Join-Path (Join-Path $root 'workspace_sandbox') $excelName
    Require (-not (Test-Path $workbookPath)) 'Excel was generated before approval.'
    $excelResult = Invoke-RestMethod -Uri "$base/api/v1/tasks/$($excelPlan.task.id)/approve" -Method Post -ContentType 'application/json' -Body '{}' -TimeoutSec 40
    Require ($excelResult.success -eq $true) 'Excel tool execution failed.'
    Require (Test-Path $workbookPath -PathType Leaf) 'Workbook missing from sandbox.'
    $python = Join-Path $root 'automation\.venv\Scripts\python.exe'
    & $python -c "import sys; from openpyxl import load_workbook; w=load_workbook(sys.argv[1],data_only=False); s=w.active; assert s['A1'].value=='Item'; assert s['B1'].value=='Amount'; assert s['B2'].value==25000; assert s['B5'].value=='=SUM(B2:B4)'; w.close()" $workbookPath
    Require ($LASTEXITCODE -eq 0) 'Workbook contents or formula did not match the approved plan.'
    Write-Host "PASS: Excel rows + SUM formula persisted: $workbookPath" -ForegroundColor Green

} catch {
    Write-Host "LOCAL SMOKE FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
