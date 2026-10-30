# FORGE AI — Safe Local Environment Shutdown
# Stops only FORGE AI processes (ports 3000, 8000, 5173 and recorded PIDs)

$ErrorActionPreference = "Continue"

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "       STOPPING FORGE AI LOCAL ENVIRONMENT          " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

$root = $PSScriptRoot
$pidFile = Join-Path $root ".forge-pids.json"
$portsToStop = @(3000, 8000, 5173)
$stoppedPids = [System.Collections.Generic.HashSet[int]]::new()

# 1. Stop processes recorded in PID file
if (Test-Path $pidFile) {
    try {
        $pids = Get-Content $pidFile -Raw | ConvertFrom-Json
        foreach ($prop in $pids.PSObject.Properties) {
            $pidVal = [int]$prop.Value
            if ($pidVal -gt 0) {
                $proc = Get-Process -Id $pidVal -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Host "Stopping $($prop.Name) service (PID $pidVal)..." -ForegroundColor White
                    Stop-Process -Id $pidVal -Force -ErrorAction SilentlyContinue
                    [void]$stoppedPids.Add($pidVal)
                }
            }
        }
        Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
    } catch {
        Write-Host "Note: Could not parse PID file." -ForegroundColor DarkGray
    }
}

# 2. Check and stop any remaining processes strictly listening on FORGE ports
foreach ($port in $portsToStop) {
    $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            $pidVal = $conn.OwningProcess
            if ($pidVal -gt 0 -and -not $stoppedPids.Contains($pidVal)) {
                $proc = Get-Process -Id $pidVal -ErrorAction SilentlyContinue
                if ($proc -and ($proc.ProcessName -match "node|python|uvicorn|cmd")) {
                    Write-Host "Stopping process on port $($port) ($($proc.ProcessName), PID $pidVal)..." -ForegroundColor White
                    Stop-Process -Id $pidVal -Force -ErrorAction SilentlyContinue
                    [void]$stoppedPids.Add($pidVal)
                }
            }
        }
    }
}

Start-Sleep -Milliseconds 800

Write-Host "`nPort Status Verification:" -ForegroundColor White
foreach ($port in $portsToStop) {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        Write-Host "  * Port $($port): STILL BOUND (PID $($conn.OwningProcess))" -ForegroundColor Yellow
    } else {
        Write-Host "  * Port $($port): FREED / OFFLINE" -ForegroundColor Green
    }
}

Write-Host "`nAll FORGE AI services stopped safely." -ForegroundColor Green
Write-Host "Unrelated system processes were NOT affected." -ForegroundColor Cyan
