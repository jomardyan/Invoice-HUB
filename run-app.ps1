#Requires -Version 5.0

<#
.SYNOPSIS
Invoice-HUB Full Application Startup Script (PowerShell)

.DESCRIPTION
Starts all services: PostgreSQL, Redis, Backend API, Admin Frontend, User Frontend

.PARAMETER Action
The action to perform: Start, Stop, Health, or Logs

.EXAMPLE
.\run-app.ps1
.\run-app.ps1 -Action Health
.\run-app.ps1 -Action Logs -Service backend
#>

param(
    [Parameter(Position = 0)]
    [ValidateSet('Start', 'Stop', 'Health', 'Logs', 'Status')]
    [string]$Action = 'Start',
    
    [Parameter(Position = 1)]
    [ValidateSet('backend', 'admin', 'user', 'all')]
    [string]$Service = 'all'
)

################################################################################
# CONFIGURATION
################################################################################

$ErrorActionPreference = "Stop"

# Colors
$Colors = @{
    Red     = 'Red'
    Green   = 'Green'
    Yellow  = 'Yellow'
    Cyan    = 'Cyan'
    Magenta = 'Magenta'
    White   = 'White'
}

# URLs
$Urls = @{
    Backend = 'http://localhost:3000'
    Admin   = 'http://localhost:5174'
    User    = 'http://localhost:5173'
    Docs    = 'http://localhost:3000/api-docs'
}

# Paths
$RootDir = $PSScriptRoot
$BackendDir = Join-Path $RootDir 'backend'
$AdminDir = Join-Path $RootDir 'frontend-admin'
$UserDir = Join-Path $RootDir 'frontend-user'
$LogDir = Join-Path $RootDir '.run-logs'

# Docker executable path
$DockerExe = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"
if (-not (Test-Path $DockerExe)) {
    # Try alternate path or system PATH
    $DockerExe = (Get-Command docker -ErrorAction SilentlyContinue).Source
}

# Process tracking
$Script:RunningProcesses = @{}
$Script:DockerStarted = $false

################################################################################
# UTILITY FUNCTIONS
################################################################################

function Write-Banner {
    Clear-Host
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                                                                           ║" -ForegroundColor Cyan
    Write-Host "║              INVOICE-HUB FULL APPLICATION STARTUP                        ║" -ForegroundColor Cyan
    Write-Host "║              Database • Redis • Backend • Admin • User                   ║" -ForegroundColor Cyan
    Write-Host "║                                                                           ║" -ForegroundColor Cyan
    Write-Host "╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host ("━" * 80) -ForegroundColor Blue
    Write-Host $Title -ForegroundColor Magenta
    Write-Host ("━" * 80) -ForegroundColor Blue
    Write-Host ""
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Test-PortOpen {
    param(
        [int]$Port,
        [string]$Service
    )
    
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            Write-Warning "$Service (port $Port) is already in use - will attempt to use it"
            return $true
        }
    }
    catch {
        # Port likely not in use
    }
    
    return $false
}

function New-LogDirectory {
    if (-not (Test-Path $LogDir)) {
        New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
    }
    Write-Success "Log directory: $LogDir"
}

function Start-Service {
    param(
        [string]$Name,
        [string]$WorkingDir,
        [string]$Command,
        [string]$CheckUrl
    )
    
    Write-Info "Starting $Name..."
    
    $logFile = Join-Path $LogDir "$($Name -replace ' ', '-').log"
    
    try {
        $process = Start-Process -FilePath 'cmd.exe' `
            -ArgumentList "/c `"cd /d `"$WorkingDir`" && $Command`"" `
            -NoNewWindow `
            -RedirectStandardOutput $logFile `
            -RedirectStandardError "$logFile.error" `
            -PassThru
        
        $Script:RunningProcesses[$Name] = $process
        
        if ($CheckUrl) {
            Write-Info "Waiting for $Name to be ready..."
            $attempts = 0
            $maxAttempts = 60
            
            while ($attempts -lt $maxAttempts) {
                try {
                    $response = Invoke-WebRequest -Uri $CheckUrl -UseBasicParsing -ErrorAction SilentlyContinue
                    if ($response.StatusCode -eq 200) {
                        Write-Success "$Name started successfully (PID: $($process.Id))"
                        return $true
                    }
                }
                catch {
                    # Service not ready yet
                }
                
                if ($process.HasExited) {
                    Write-Error "$Name process died unexpectedly"
                    Write-Error "Last lines from $Name log:"
                    Get-Content $logFile -Tail 20 | Write-Host -ForegroundColor Red
                    return $false
                }
                
                Start-Sleep -Seconds 1
                $attempts++
                Write-Host -NoNewline "."
            }
            
            Write-Host ""
            Write-Error "$Name failed to start within $maxAttempts seconds"
            return $false
        }
        else {
            Write-Success "$Name started (PID: $($process.Id))"
            Start-Sleep -Seconds 2
            return $true
        }
    }
    catch {
        Write-Error "Failed to start $Name : $($_.Exception.Message)"
        return $false
    }
}

################################################################################
# DOCKER SERVICES
################################################################################

function Start-DockerServices {
    Write-Section "🐳 Starting Docker Services (PostgreSQL & Redis)"
    
    # Check if docker executable exists
    if (-not (Test-Path $DockerExe)) {
        Write-Warning "Docker executable not found at: $DockerExe"
        return $false
    }
    
    # Check if Docker daemon is running, if not, start Docker Desktop
    Write-Info "Checking Docker daemon..."
    $dockerRunning = $false
    try {
        $null = & $DockerExe ps 2>&1
        $dockerRunning = $true
    }
    catch {
        $dockerRunning = $false
    }
    
    if (-not $dockerRunning) {
        Write-Info "Docker daemon not running. Attempting to start Docker Desktop..."
        try {
            # Start Docker Desktop
            Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" -ErrorAction SilentlyContinue
            Write-Info "Docker Desktop started. Waiting 15 seconds for daemon to initialize..."
            Start-Sleep -Seconds 15
            
            # Verify docker is now running
            $null = & $DockerExe ps 2>&1
            Write-Success "Docker daemon is now running"
        }
        catch {
            Write-Warning "Could not start Docker Desktop automatically"
            Write-Info "Please start Docker Desktop manually and try again"
            return $false
        }
    }
    
    # Check if docker-compose file exists
    $composePath = Join-Path $RootDir 'docker-compose.yml'
    if (-not (Test-Path $composePath)) {
        Write-Warning "docker-compose.yml not found"
        return $false
    }
    
    try {
        # Check if services are already running
        $runningContainers = & $DockerExe ps --format "{{.Names}}" 2>$null
        
        if ($runningContainers -like '*postgres*') {
            Write-Success "PostgreSQL is already running"
            return $true
        }
        
        Write-Info "Starting PostgreSQL and Redis containers..."
        
        Push-Location $RootDir
        $dockerOutput = & $DockerExe compose up -d postgres redis 2>&1
        Pop-Location
        
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Docker compose failed"
            Write-Warning "Error: $dockerOutput"
            return $false
        }
        
        Write-Info "Waiting for database to be ready (this may take 10-15 seconds)..."
        Start-Sleep -Seconds 15
        
        Write-Success "Docker services started"
        $Script:DockerStarted = $true
        
        return $true
    }
    catch {
        Write-Warning "Failed to start Docker services: $($_.Exception.Message)"
        return $false
    }
}

function Stop-DockerServices {
    if ($Script:DockerStarted) {
        Write-Info "Stopping Docker services..."
        
        try {
            Push-Location $RootDir
            & $DockerExe compose down 2>&1 | Out-Null
            Pop-Location
            Write-Success "Docker services stopped"
        }
        catch {
            Write-Warning "Failed to stop Docker services: $($_.Exception.Message)"
        }
    }
}

################################################################################
# BACKEND
################################################################################

function Start-Backend {
    Write-Section "🚀 Starting Backend API Server"
    
    if (-not (Test-Path $BackendDir)) {
        Write-Error "Backend directory not found: $BackendDir"
        return $false
    }
    
    Test-PortOpen -Port 3000 -Service "Backend"
    
    $packageJson = Join-Path $BackendDir 'package.json'
    if (-not (Test-Path $packageJson)) {
        Write-Error "Backend package.json not found"
        return $false
    }
    
    # Install dependencies if needed
    $nodeModules = Join-Path $BackendDir 'node_modules'
    if (-not (Test-Path $nodeModules)) {
        Write-Info "Installing backend dependencies..."
        Push-Location $BackendDir
        npm install --silent 2>&1 | Out-Null
        Pop-Location
    }
    
    return (Start-Service -Name "Backend API" `
            -WorkingDir $BackendDir `
            -Command "npm run dev" `
            -CheckUrl "$($Urls.Backend)/api/health")
}

################################################################################
# ADMIN FRONTEND
################################################################################

function Start-AdminFrontend {
    Write-Section "⚙️  Starting Admin Frontend"
    
    if (-not (Test-Path $AdminDir)) {
        Write-Error "Admin frontend directory not found: $AdminDir"
        return $false
    }
    
    Test-PortOpen -Port 5174 -Service "Admin Frontend"
    
    $packageJson = Join-Path $AdminDir 'package.json'
    if (-not (Test-Path $packageJson)) {
        Write-Error "Admin frontend package.json not found"
        return $false
    }
    
    # Install dependencies if needed
    $nodeModules = Join-Path $AdminDir 'node_modules'
    if (-not (Test-Path $nodeModules)) {
        Write-Info "Installing admin frontend dependencies..."
        Push-Location $AdminDir
        npm install --silent 2>&1 | Out-Null
        Pop-Location
    }
    
    return (Start-Service -Name "Admin Frontend" `
            -WorkingDir $AdminDir `
            -Command "npm run dev" `
            -CheckUrl $Urls.Admin)
}

################################################################################
# USER FRONTEND
################################################################################

function Start-UserFrontend {
    Write-Section "👤 Starting User Frontend"
    
    if (-not (Test-Path $UserDir)) {
        Write-Error "User frontend directory not found: $UserDir"
        return $false
    }
    
    Test-PortOpen -Port 5173 -Service "User Frontend"
    
    $packageJson = Join-Path $UserDir 'package.json'
    if (-not (Test-Path $packageJson)) {
        Write-Error "User frontend package.json not found"
        return $false
    }
    
    # Install dependencies if needed
    $nodeModules = Join-Path $UserDir 'node_modules'
    if (-not (Test-Path $nodeModules)) {
        Write-Info "Installing user frontend dependencies..."
        Push-Location $UserDir
        npm install --silent 2>&1 | Out-Null
        Pop-Location
    }
    
    return (Start-Service -Name "User Frontend" `
            -WorkingDir $UserDir `
            -Command "npm run dev" `
            -CheckUrl $Urls.User)
}

################################################################################
# STATUS & HEALTH
################################################################################

function Show-StartupInfo {
    Write-Section "📋 Application Startup Summary"
    
    Write-Host ("━" * 80) -ForegroundColor White
    Write-Host "✓ All services started successfully!" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Running Services:" -ForegroundColor Cyan
    foreach ($serviceName in $Script:RunningProcesses.Keys) {
        $process = $Script:RunningProcesses[$serviceName]
        Write-Host "  ✓ $serviceName (PID: $($process.Id))" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Access URLs:" -ForegroundColor Cyan
    Write-Host "  Backend API:        $($Urls.Backend)" -ForegroundColor Blue
    Write-Host "  API Documentation:  $($Urls.Docs)" -ForegroundColor Blue
    Write-Host "  Admin Dashboard:    $($Urls.Admin)" -ForegroundColor Blue
    Write-Host "  User Application:   $($Urls.User)" -ForegroundColor Blue
    
    Write-Host ""
    Write-Host "Log Files:" -ForegroundColor Cyan
    Write-Host "  Backend:            $(Join-Path $LogDir 'Backend-API.log')" -ForegroundColor White
    Write-Host "  Admin Frontend:     $(Join-Path $LogDir 'Admin-Frontend.log')" -ForegroundColor White
    Write-Host "  User Frontend:      $(Join-Path $LogDir 'User-Frontend.log')" -ForegroundColor White
    
    Write-Host ""
    Write-Host "Quick Commands:" -ForegroundColor Cyan
    Write-Host "  View all logs:      Get-Content $(Join-Path $LogDir '*')" -ForegroundColor White
    Write-Host "  Check health:       .\run-app.ps1 -Action Health" -ForegroundColor White
    Write-Host "  View log:           .\run-app.ps1 -Action Logs -Service backend" -ForegroundColor White
    Write-Host "  Stop all:           .\run-app.ps1 -Action Stop" -ForegroundColor White
    
    Write-Host ("━" * 80) -ForegroundColor White
    Write-Host ""
}

function Check-Health {
    Write-Section "🏥 Checking Service Health"
    
    $allHealthy = $true
    
    # Backend
    try {
        $response = Invoke-WebRequest -Uri "$($Urls.Backend)/api/health" -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Success "Backend API is healthy"
        }
        else {
            Write-Warning "Backend API returned status $($response.StatusCode)"
            $allHealthy = $false
        }
    }
    catch {
        Write-Warning "Backend API health check failed"
        $allHealthy = $false
    }
    
    # Admin Frontend
    try {
        $response = Invoke-WebRequest -Uri $Urls.Admin -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Success "Admin Frontend is responding"
        }
    }
    catch {
        Write-Warning "Admin Frontend not yet responding"
    }
    
    # User Frontend
    try {
        $response = Invoke-WebRequest -Uri $Urls.User -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Success "User Frontend is responding"
        }
    }
    catch {
        Write-Warning "User Frontend not yet responding"
    }
    
    Write-Host ""
    return $allHealthy
}

function Show-Logs {
    param([string]$ServiceName)
    
    $logMapping = @{
        'backend' = 'Backend-API'
        'admin'   = 'Admin-Frontend'
        'user'    = 'User-Frontend'
        'all'     = '*'
    }
    
    $pattern = $logMapping[$ServiceName]
    $logPath = Join-Path $LogDir "$pattern.log"
    
    if (Test-Path $logPath) {
        Write-Info "Tailing logs: $logPath"
        Get-Content $logPath -Tail 50 -Wait
    }
    else {
        Write-Error "Log file not found: $logPath"
    }
}

function Show-Status {
    Write-Section "📊 Service Status"
    
    Write-Host "Running Processes:" -ForegroundColor Cyan
    foreach ($serviceName in $Script:RunningProcesses.Keys) {
        $process = $Script:RunningProcesses[$serviceName]
        if ($process.HasExited) {
            Write-Host "  ✗ $serviceName - STOPPED" -ForegroundColor Red
        }
        else {
            Write-Host "  ✓ $serviceName - RUNNING (PID: $($process.Id))" -ForegroundColor Green
        }
    }
    
    Write-Host ""
}

################################################################################
# SHUTDOWN
################################################################################

function Stop-AllServices {
    Write-Section "🛑 Shutting Down Services"
    
    foreach ($serviceName in $Script:RunningProcesses.Keys) {
        $process = $Script:RunningProcesses[$serviceName]
        
        if (-not $process.HasExited) {
            Write-Info "Stopping $serviceName (PID: $($process.Id))..."
            
            try {
                $process | Stop-Process -Force -ErrorAction SilentlyContinue
                Write-Success "$serviceName stopped"
            }
            catch {
                Write-Warning "Failed to stop ${serviceName}: $($_.Exception.Message)"
            }
        }
    }
    
    Stop-DockerServices
    Write-Success "All services stopped"
}

################################################################################
# MAIN
################################################################################

function Main {
    Write-Banner
    
    # Setup exit handler
    $null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
        Stop-AllServices
    }
    
    New-LogDirectory
    
    # Try to start Docker services (optional)
    $dockerStarted = Start-DockerServices
    
    if ($dockerStarted) {
        # Start backend only if Docker is available
        if (-not (Start-Backend)) {
            Write-Warning "Backend failed to start - check logs and database connection"
        }
    }
    else {
        Write-Warning "Docker/Database not available - skipping Backend"
        Write-Info "Frontend-only mode: You can still test Admin and User dashboards"
        Write-Info "To use the backend, ensure Docker Desktop is running with proper permissions"
    }
    
    # Start admin frontend
    if (-not (Start-AdminFrontend)) {
        Write-Warning "Failed to start admin frontend"
    }
    
    # Start user frontend
    if (-not (Start-UserFrontend)) {
        Write-Warning "Failed to start user frontend"
    }
    
    # Show info
    Show-StartupInfo
    Check-Health
    
    Write-Info "All services are running. Press Ctrl+C to stop."
    Write-Host ""
    
    # Wait for processes
    foreach ($process in $Script:RunningProcesses.Values) {
        $process.WaitForExit()
    }
}

################################################################################
# EXECUTE ACTION
################################################################################

switch ($Action) {
    'Start' {
        Main
    }
    'Stop' {
        Stop-AllServices
    }
    'Health' {
        Check-Health
    }
    'Logs' {
        Show-Logs -ServiceName $Service
    }
    'Status' {
        Show-Status
    }
}
