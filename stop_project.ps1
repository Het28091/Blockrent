<#
  Blockrent STOP Script
  - Kills PIDs from JSON file
  - Kills processes by Port (Cleanup)
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$PidFile = Join-Path $ScriptRoot '.blockrent_pids.json'

function Kill-Process {
    param($Id, $Name)
    if ($Id) {
        Write-Host "🛑 Stopping $Name (PID: $Id)..." -NoNewline
        Stop-Process -Id $Id -Force -ErrorAction SilentlyContinue
        Write-Host " Done." -ForegroundColor Green
    }
}

function Kill-Port {
    param($Port)
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($connections) {
        $ids = $connections | Select-Object -ExpandProperty OwningProcess | Sort-Object -Unique
        foreach ($id in $ids) {
            Write-Host "🧹 Cleaning zombie process on Port $Port (PID: $id)..." -NoNewline
            Stop-Process -Id $id -Force -ErrorAction SilentlyContinue
            Write-Host " Done." -ForegroundColor Yellow
        }
    }
}

Write-Host "=== 🛑 SHUTTING DOWN BLOCKRENT ===" -ForegroundColor Magenta

# 1. Kill from file
if (Test-Path $PidFile) {
    try {
        $json = Get-Content $PidFile -Raw | ConvertFrom-Json
        Kill-Process -Id $json.Frontend -Name "Frontend"
        Kill-Process -Id $json.Backend -Name "Backend"
        Kill-Process -Id $json.Hardhat -Name "Blockchain"
        Remove-Item $PidFile -Force
    } catch {
        Write-Host "⚠️  Could not read PID file. Moving to port cleanup." -ForegroundColor Yellow
    }
}

# 2. Kill by Port (Safety Net)
Kill-Port 3001 # Frontend
Kill-Port 5000 # Backend
Kill-Port 8545 # Blockchain

Write-Host "✅ Shutdown Complete." -ForegroundColor Green