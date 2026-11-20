param(
    [switch]$SkipOllama,
    [switch]$SkipInstall
)
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$logs = Join-Path $root 'logs'
$sandbox = Join-Path $root 'workspace_sandbox'
$pidFile = Join-Path $root '.forge-pids.json'
$services = @{}
New-Item -ItemType Directory -Force -Path $logs, $sandbox | Out-Null

function Get-CommandPath([string]$name) {
    $cmd = Get-Command $name -ErrorAction SilentlyContinue
    if (-not $cmd) { throw "Missing prerequisite: $name. See docs/LOCAL_VIVA.md." }
    return $cmd.Source
}
function Assert-PortFree([int]$port) {
    $occupied = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($occupied) {
        throw "Port $port is already occupied. Do not kill unrelated processes. If this is an earlier FORGE session, run .\stop-forge.ps1 first."
    }
}
function Check-Http([string]$url) {
    try {
        $res = Invoke-WebRequest -Uri $url -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        return ($res.StatusCode -eq 200)
    } catch {
        return $false
    }
}
function Save-Processes {
    $services | ConvertTo-Json -Depth 5 | Set-Content -Path $pidFile -Encoding UTF8
}
function Start-ForgeService([string]$name, [string]$exe, [string[]]$arguments,
                            [string]$workingDir, [string]$url) {
    $outFile = Join-Path $logs ($name + '.out.log')
    $errFile = Join-Path $logs ($name + '.err.log')
    $proc = Start-Process -FilePath $exe -ArgumentList $arguments -WorkingDirectory $workingDir -PassThru -WindowStyle Hidden -RedirectStandardOutput $outFile -RedirectStandardError $errFile
    $services[$name] = @{
        processId = $proc.Id
        startedUtc = $proc.StartTime.ToUniversalTime().ToString('o')
    }
    Save-Processes
    for ($i = 0; $i -lt 45; $i++) {
        if (Check-Http $url) {
            Write-Host ("  [OK] {0} on {1} (PID {2})" -f $name, $url, $proc.Id) -ForegroundColor Green
            return
        }
        Start-Sleep -Milliseconds 650
        $proc.Refresh()
        if ($proc.HasExited) { break }
    }
    throw "$name failed its health check. Inspect logs\$name.err.log and logs\$name.out.log. Stop via .\stop-forge.ps1."
}

try {
    Write-Host 'FORGE | Local-first startup (Windows)' -ForegroundColor Cyan
    foreach ($port in @(8000,3000,5173)) { Assert-PortFree $port }
    $nodeExe = Get-CommandPath 'node.exe'
    $npm = Get-CommandPath 'npm.cmd'
    $pythonLauncher = $null
    $pythonFlags = @()
    if (Get-Command 'py.exe' -ErrorAction SilentlyContinue) {
        & py.exe -3.11 -c 'import sys; assert sys.version_info >= (3,11)'
        if ($LASTEXITCODE -eq 0) { $pythonLauncher = (Get-Command py.exe).Source; $pythonFlags = @('-3.11') }
    }
    if (-not $pythonLauncher) {
        $pythonLauncher = Get-CommandPath 'python.exe'
        & $pythonLauncher -c 'import sys; assert sys.version_info >= (3,11)'
        if ($LASTEXITCODE -ne 0) { throw 'Python 3.11+ is required for the local runtime.' }
    }

    $venvPython = Join-Path $root 'automation\.venv\Scripts\python.exe'
    if (-not (Test-Path $venvPython)) {
        if ($SkipInstall) { throw 'Python virtual environment missing; remove -SkipInstall.' }
        Write-Host '[setup] Creating isolated automation Python environment...'
        & $pythonLauncher @pythonFlags -m venv (Join-Path $root 'automation\.venv')
        if ($LASTEXITCODE -ne 0) { throw 'Could not create automation virtual environment.' }
    }
    & $venvPython -c 'import fastapi, uvicorn, openpyxl, docx, reportlab, pypdf, pptx, pywinauto, win32api' 2>$null
    if ($LASTEXITCODE -ne 0) {
        if ($SkipInstall) { throw 'Python requirements missing; remove -SkipInstall.' }
        Write-Host '[setup] Installing local Python automation requirements...'
        & $venvPython -m pip install -r (Join-Path $root 'automation\requirements.txt')
        if ($LASTEXITCODE -ne 0) { throw 'Python dependency installation failed.' }
    }
    foreach ($part in @('backend','frontend')) {
        if (-not (Test-Path (Join-Path $root "$part\node_modules"))) {
            if ($SkipInstall) { throw "$part packages missing; remove -SkipInstall." }
            Write-Host "[setup] Installing $part Node dependencies..."
            & $npm ci --prefix (Join-Path $root $part)
            if ($LASTEXITCODE -ne 0) { throw "npm ci failed for $part." }
        }
    }

    # One random shared token is inherited by both child services; never written to the repository.
    $random = New-Object byte[] 48
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($random) } finally { $rng.Dispose() }
    $env:FORGE_AUTOMATION_TOKEN = [Convert]::ToBase64String($random).TrimEnd('=').Replace('+','-').Replace('/','_')
    $env:WORKSPACE_DIR = $sandbox
    $env:PYTHON_AUTOMATION_URL = 'http://127.0.0.1:8000'
    $env:HOST = '127.0.0.1'
    $env:VITE_API_BASE_URL = 'http://127.0.0.1:3000'
    $env:VITE_USE_MOCK = 'false'
    $env:VITE_API_TIMEOUT = '120000'
    $env:OLLAMA_BASE_URL = 'http://127.0.0.1:11434'
    if (-not $env:OLLAMA_MODEL) { $env:OLLAMA_MODEL = 'qwen3:4b' }

    if (-not $SkipOllama) {
        Write-Host '[ollama] Checking local model...' -ForegroundColor Cyan
        if (-not (Check-Http 'http://127.0.0.1:11434/api/tags')) {
            $ollamaCmd = Get-Command 'ollama.exe' -ErrorAction SilentlyContinue
            if ($ollamaCmd) {
                try {
                    Start-ForgeService 'ollama' $ollamaCmd.Source @('serve') $root 'http://127.0.0.1:11434/api/tags'
                } catch {
                    Write-Warning "Ollama did not start automatically; start it manually: $($_.Exception.Message)"
                }
            }
        }
        try {
            $models = (Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 3).models
            $found = @($models | Where-Object { $_.name -like "$($env:OLLAMA_MODEL)*" }).Count -gt 0
            if ($found) { Write-Host "[ollama] Model $($env:OLLAMA_MODEL) detected." -ForegroundColor Green }
            else { Write-Warning "Model unavailable. Run: ollama pull $($env:OLLAMA_MODEL) . Rule-based local task routing can still run." }
        } catch {
            Write-Warning 'Ollama offline; task classification falls back to rules, not model inference.'
        }
    }

    Start-ForgeService 'python' $venvPython @('-m','uvicorn','src.main:app','--host','127.0.0.1','--port','8000') (Join-Path $root 'automation') 'http://127.0.0.1:8000/health'
    Start-ForgeService 'backend' $nodeExe @('src/server.js') (Join-Path $root 'backend') 'http://127.0.0.1:3000/api/system/status'
    Start-ForgeService 'frontend' $nodeExe @('node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5173','--strictPort') (Join-Path $root 'frontend') 'http://127.0.0.1:5173'

    $status = Invoke-RestMethod -Uri 'http://127.0.0.1:3000/api/system/status' -TimeoutSec 8
    if ($status.automationTools.status -ne 'available' -or -not $status.readyForLocalAutomation) {
        throw 'Automation backend is not ready; inspect logs and token configuration.'
    }
    Write-Host ''
    Write-Host 'FORGE local automation is READY: http://127.0.0.1:5173' -ForegroundColor Green
    Write-Host ("Ollama: {0}; Python tools: {1}; sandbox: {2}" -f $status.aiProvider.localStatus, $status.automationTools.status, $sandbox)
    Write-Host 'For a real sandbox-only test run: .\tools\local-viva-smoke.ps1'
    Write-Host 'Stop only processes launched here: .\stop-forge.ps1'
} catch {
    Write-Host "FORGE STARTUP FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host 'See logs\*.err.log. If some services started, run .\stop-forge.ps1.' -ForegroundColor Yellow
    exit 1
}
