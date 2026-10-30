# FORGE AI — Reliable Local Environment Launcher
# Starts Python FastAPI, Node.js Express, and Vite Frontend safely and independently

$ErrorActionPreference = "Continue"

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "       STARTING FORGE AI LOCAL ENVIRONMENT          " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

$root = $PSScriptRoot
$canonicalWorkspace = Join-Path $root "workspace_sandbox"
if (-not (Test-Path $canonicalWorkspace)) {
    New-Item -ItemType Directory -Path $canonicalWorkspace -Force | Out-Null
}

$pidFile = Join-Path $root ".forge-pids.json"
$services = @{}

function Test-Endpoint {
    param([string]$Url, [int]$TimeoutSec = 2)
    try {
        $res = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec $TimeoutSec -UseBasicParsing -ErrorAction Stop
        return ($res.StatusCode -ge 200 -and $res.StatusCode -lt 400)
    } catch {
        return $false
    }
}

# -----------------------------------------------------------------------------
# 1. Probe Ollama
# -----------------------------------------------------------------------------
Write-Host "`n[1/4] Checking Local Ollama Service..." -ForegroundColor White
try {
    $ollama = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -Method Get -TimeoutSec 3 -ErrorAction Stop
    $models = ($ollama.models | ForEach-Object { $_.name })
    $hasQwen = ($models | Where-Object { $_ -like "qwen3:4b*" }).Count -gt 0
    if ($hasQwen) {
        Write-Host "  -> Ollama is ONLINE with target model: qwen3:4b" -ForegroundColor Green
    } else {
        Write-Host "  -> Ollama is ONLINE but qwen3:4b not detected. (Available: $($models -join ', '))" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  -> WARNING: Ollama is not responding on http://127.0.0.1:11434." -ForegroundColor Yellow
    Write-Host "     Please start Ollama if you intend to use local LLM inference." -ForegroundColor DarkGray
}

# -----------------------------------------------------------------------------
# 2. Python Automation Service (FastAPI on Port 8000)
# -----------------------------------------------------------------------------
Write-Host "`n[2/4] Checking Python FastAPI Automation Service (Port 8000)..." -ForegroundColor White
$pyOnline = Test-Endpoint "http://127.0.0.1:8000/health" 1

if ($pyOnline) {
    Write-Host "  -> Python Automation is already running on http://127.0.0.1:8000 (reusing existing instance)." -ForegroundColor Green
} else {
    Write-Host "  -> Launching Python FastAPI on http://127.0.0.1:8000..." -ForegroundColor White
    $pyExe = Join-Path $root "automation\.venv\Scripts\python.exe"
    if (-not (Test-Path $pyExe)) {
        $pyExe = "C:\Program Files\Python311\python.exe"
        if (-not (Test-Path $pyExe)) {
            $pyExe = "python"
        }
    }

    $env:WORKSPACE_DIR = $canonicalWorkspace
    $pyProc = Start-Process -FilePath $pyExe `
        -ArgumentList "-m uvicorn src.main:app --host 127.0.0.1 --port 8000" `
        -WorkingDirectory (Join-Path $root "automation") `
        -PassThru -WindowStyle Hidden

    $services["python"] = $pyProc.Id

    # Poll health endpoint
    $ready = $false
    for ($i = 0; $i -lt 12; $i++) {
        Start-Sleep -Milliseconds 500
        if (Test-Endpoint "http://127.0.0.1:8000/health" 1) {
            $ready = $true
            break
        }
    }

    if ($ready) {
        Write-Host "  -> Python Automation Service is HEALTHY (PID: $($pyProc.Id))." -ForegroundColor Green
    } else {
        Write-Host "  -> WARNING: Python Automation did not respond within 6s. Check automation logs." -ForegroundColor Yellow
    }
}

# -----------------------------------------------------------------------------
# 3. Node.js Express Backend (Port 3000)
# -----------------------------------------------------------------------------
Write-Host "`n[3/4] Checking Express Backend Service (Port 3000)..." -ForegroundColor White
$backendOnline = Test-Endpoint "http://127.0.0.1:3000/health" 1

if ($backendOnline) {
    Write-Host "  -> Express Backend is already running on http://127.0.0.1:3000 (reusing existing instance)." -ForegroundColor Green
} else {
    Write-Host "  -> Launching Express Backend on http://127.0.0.1:3000..." -ForegroundColor White
    $backendProc = Start-Process -FilePath "node" `
        -ArgumentList "src/server.js" `
        -WorkingDirectory (Join-Path $root "backend") `
        -PassThru -WindowStyle Hidden

    $services["backend"] = $backendProc.Id

    # Poll health endpoint
    $ready = $false
    for ($i = 0; $i -lt 12; $i++) {
        Start-Sleep -Milliseconds 500
        if (Test-Endpoint "http://127.0.0.1:3000/health" 1) {
            $ready = $true
            break
        }
    }

    if ($ready) {
        Write-Host "  -> Express Backend is HEALTHY (PID: $($backendProc.Id))." -ForegroundColor Green
    } else {
        Write-Host "  -> WARNING: Express Backend did not respond within 6s. Check backend logs." -ForegroundColor Yellow
    }
}

# -----------------------------------------------------------------------------
# 4. Vite Frontend (Port 5173)
# -----------------------------------------------------------------------------
Write-Host "`n[4/4] Checking Vite Frontend Service (Port 5173)..." -ForegroundColor White
$frontendOnline = Test-Endpoint "http://127.0.0.1:5173" 1

if ($frontendOnline) {
    Write-Host "  -> Vite Frontend is already running on http://127.0.0.1:5173 (reusing existing instance)." -ForegroundColor Green
} else {
    Write-Host "  -> Launching Vite Frontend on http://127.0.0.1:5173..." -ForegroundColor White
    $frontendProc = Start-Process -FilePath "npm.cmd" `
        -ArgumentList "run", "dev" `
        -WorkingDirectory (Join-Path $root "frontend") `
        -PassThru -WindowStyle Hidden

    $services["frontend"] = $frontendProc.Id

    # Poll frontend
    $ready = $false
    for ($i = 0; $i -lt 14; $i++) {
        Start-Sleep -Milliseconds 500
        if (Test-Endpoint "http://127.0.0.1:5173" 1) {
            $ready = $true
            break
        }
    }

    if ($ready) {
        Write-Host "  -> Vite Frontend is READY (PID: $($frontendProc.Id))." -ForegroundColor Green
    } else {
        Write-Host "  -> WARNING: Vite Frontend did not respond within 7s. Check frontend logs." -ForegroundColor Yellow
    }
}

# Save PIDs to tracking file
if ($services.Count -gt 0) {
    $existingPids = @{}
    if (Test-Path $pidFile) {
        try {
            $existingPids = (Get-Content $pidFile -Raw | ConvertFrom-Json)
        } catch {}
    }
    foreach ($k in $services.Keys) {
        $existingPids | Add-Member -NotePropertyName $k -NotePropertyValue $services[$k] -Force
    }
    $existingPids | ConvertTo-Json | Set-Content $pidFile -Encoding UTF8
}

Write-Host "`n====================================================" -ForegroundColor Cyan
Write-Host "            FORGE AI IS FULLY OPERATIONAL            " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "  * Frontend Web UI:    http://localhost:5173" -ForegroundColor Green
Write-Host "  * Express Backend:    http://127.0.0.1:3000" -ForegroundColor Green
Write-Host "  * Python Automation:  http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "  * Local LLM (Ollama): http://127.0.0.1:11434 (qwen3:4b)" -ForegroundColor Green
Write-Host "  * Canonical Sandbox:  $canonicalWorkspace" -ForegroundColor Green
Write-Host "`nTo cleanly stop services, run: .\stop-forge.ps1" -ForegroundColor DarkGray
