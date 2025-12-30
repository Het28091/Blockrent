<#
  Blockrent START Script
  - Cleans up ports first
  - Launches Hardhat (Blockchain)
  - Deploys Contracts & Syncs ABIs
  - Starts Backend
  - Starts Frontend
  - Tracks PIDs
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Join-Path $ScriptRoot 'blockrent'
$ContractsDir = Join-Path $ProjectDir 'contracts'
$BackendDir = Join-Path $ProjectDir 'backend'
$FrontendDir = Join-Path $ProjectDir 'frontend'
$PidFile = Join-Path $ScriptRoot '.blockrent_pids.json'
$LogsDir = Join-Path $ProjectDir 'logs'

# Ensure logs directory exists
if (-not (Test-Path $LogsDir)) {
    New-Item -ItemType Directory -Force -Path $LogsDir | Out-Null
}

function Ensure-PortFree {
  param([int]$Port)
  $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
  if ($connections) {
    Write-Host "⚠️  Port $Port is in use. Killing process..." -ForegroundColor Yellow
    $connections | Select-Object -ExpandProperty OwningProcess | Sort-Object -Unique | ForEach-Object {
      Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 1
  }
}

function Start-ProcessBackground {
  param($Dir, $Cmd, $Name, $LogFile)
  
  Write-Host "🚀 Starting $Name..." -ForegroundColor Cyan
  
  $logPath = Join-Path $LogsDir $LogFile
  $process = Start-Process -FilePath "powershell" `
    -ArgumentList "-NoProfile", "-Command", "cd '$Dir'; $Cmd > '$logPath' 2>&1" `
    -WindowStyle Hidden `
    -PassThru

  if ($null -eq $process) {
      throw "Failed to start $Name"
  }
  
  return $process.Id
}

function Wait-For-Port {
  param($Port, $Timeout=30)
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  while ($sw.Elapsed.TotalSeconds -lt $Timeout) {
      if (Test-NetConnection -ComputerName "localhost" -Port $Port -InformationLevel Quiet) {
          return $true
      }
      Start-Sleep -Seconds 1
  }
  return $false
}

try {
    Write-Host "=== 🏗️  INITIALIZING BLOCKRENT ENVIRONMENT ===" -ForegroundColor Magenta

    # 1. Cleanup Ports
    Ensure-PortFree 8545 # Hardhat
    Ensure-PortFree 5000 # Backend
    Ensure-PortFree 3001 # Frontend

    # 2. Start Blockchain
    $hardhatPid = Start-ProcessBackground -Dir $ContractsDir -Cmd "npx hardhat node" -Name "Blockchain (Hardhat)" -LogFile "hardhat.log"
    
    Write-Host "⏳ Waiting for blockchain to initialize..."
    if (-not (Wait-For-Port 8545)) {
        throw "Hardhat failed to start on port 8545. Check logs/hardhat.log"
    }
    Write-Host "✅ Blockchain is running (PID: $hardhatPid)" -ForegroundColor Green

    # 3. Deploy Contracts & Sync ABI
    Write-Host "📝 Deploying Contracts & Syncing Config..."
    
    # We run this synchronously so we know it succeeded before starting the app
    try {
        Start-Process -FilePath "node" `
            -ArgumentList (Join-Path $ProjectDir "scripts/deploy_and_update.cjs") `
            -NoNewWindow -Wait
    } catch {
        throw "Deployment script failed."
    }

    # 4. Start Backend
    $backendPid = Start-ProcessBackground -Dir $BackendDir -Cmd "npm start" -Name "Backend Server" -LogFile "backend.log"
    
    # 5. Start Frontend
    # Setting PORT=3001 explicitly in the command
    $frontendCmd = "$env:PORT=3001; npm start"
    $frontendPid = Start-ProcessBackground -Dir $FrontendDir -Cmd $frontendCmd -Name "Frontend App" -LogFile "frontend.log"

    # 6. Save PIDs
    $pidsObj = @{
        Hardhat = $hardhatPid
        Backend = $backendPid
        Frontend = $frontendPid
    }
    $pidsObj | ConvertTo-Json | Set-Content $PidFile

    Write-Host "`n🎉 BLOCKRENT IS LIVE!" -ForegroundColor Green
    Write-Host "   Frontend: http://localhost:3001"
    Write-Host "   Backend:  http://localhost:5000"
    Write-Host "   Logs:     $LogsDir"
    Write-Host "   PIDs:     Saved to .blockrent_pids.json"
    Write-Host "`n   Run .\stop_project.ps1 to shut down." -ForegroundColor Gray

} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($hardhatPid) { Stop-Process -Id $hardhatPid -Force -ErrorAction SilentlyContinue }
    if ($backendPid) { Stop-Process -Id $backendPid -Force -ErrorAction SilentlyContinue }
    if ($frontendPid) { Stop-Process -Id $frontendPid -Force -ErrorAction SilentlyContinue }
    exit 1
}