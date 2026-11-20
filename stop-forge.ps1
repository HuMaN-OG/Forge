$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$pidFile = Join-Path $root '.forge-pids.json'
if (-not (Test-Path $pidFile)) {
    Write-Host 'No tracked FORGE processes; nothing was stopped.' -ForegroundColor Yellow
    exit 0
}
$expected = @{
    python = 'uvicorn'
    backend = 'src[/\\]server\.js'
    frontend = 'vite[/\\]bin[/\\]vite\.js'
    ollama = 'ollama.*serve'
}
$record = Get-Content $pidFile -Raw | ConvertFrom-Json
foreach ($entry in $record.PSObject.Properties) {
    $name = $entry.Name
    $details = $entry.Value
    $processId = [int]$details.processId
    $process = Get-CimInstance Win32_Process -Filter "ProcessId=$processId" -ErrorAction SilentlyContinue
    if (-not $process) {
        Write-Host "$name already stopped."
        continue
    }
    $commandLine = [string]$process.CommandLine
    $created = ([datetime]$process.CreationDate).ToUniversalTime()
    $started = ([datetime]$details.startedUtc).ToUniversalTime()
    $ageDifference = [Math]::Abs(($created - $started).TotalSeconds)
    if ($ageDifference -gt 60 -or -not $expected.ContainsKey($name) -or $commandLine -notmatch $expected[$name]) {
        Write-Warning "Skipping PID  $($processId): it no longer matches the recorded FORGE $name process."
        continue
    }
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Write-Host "Stopped FORGE $name (PID $processId)." -ForegroundColor Green
}
Remove-Item $pidFile -Force
Write-Host 'Only matching, recorded FORGE processes were considered. Ollama was left running if FORGE did not start it.'
