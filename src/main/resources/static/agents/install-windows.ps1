# LaptopTracker Pro Enterprise - Auto Installer for Windows
# Superior to Microsoft Find My Device

param(
    [Parameter(Mandatory=$false)]
    [string]$UserEmail = "",
    [Parameter(Mandatory=$false)]
    [string]$ServerUrl = "http://localhost:8086"
)

Write-Host "🚀 LaptopTracker Pro Enterprise - Auto Installer" -ForegroundColor Cyan
Write-Host "📱 Superior Device Tracking Solution" -ForegroundColor Green
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "⚠️  Requesting administrator privileges for full system access..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -File `"$PSCommandPath`" -UserEmail `"$UserEmail`" -ServerUrl `"$ServerUrl`"" -Verb RunAs
    exit
}

Write-Host "✅ Running with administrator privileges" -ForegroundColor Green

# Function to check if Node.js is installed
function Test-NodeJS {
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
            return $true
        }
    }
    catch {
        return $false
    }
    return $false
}

# Function to install Node.js
function Install-NodeJS {
    Write-Host "📥 Installing Node.js..." -ForegroundColor Yellow
    
    $nodeInstallerUrl = "https://nodejs.org/dist/v20.9.0/node-v20.9.0-x64.msi"
    $tempPath = "$env:TEMP\nodejs-installer.msi"
    
    try {
        # Download Node.js installer
        Write-Host "⬇️  Downloading Node.js installer..." -ForegroundColor Cyan
        Invoke-WebRequest -Uri $nodeInstallerUrl -OutFile $tempPath -UseBasicParsing
        
        # Install Node.js silently
        Write-Host "🔧 Installing Node.js (this may take a few minutes)..." -ForegroundColor Cyan
        Start-Process msiexec.exe -ArgumentList "/i `"$tempPath`" /quiet /norestart" -Wait
        
        # Update PATH for current session
        $env:PATH = $env:PATH + ";C:\Program Files\nodejs"
        
        # Clean up
        Remove-Item $tempPath -Force -ErrorAction SilentlyContinue
        
        # Verify installation
        Start-Sleep 3
        if (Test-NodeJS) {
            Write-Host "✅ Node.js installed successfully!" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Node.js installation verification failed" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Failed to install Node.js: $_" -ForegroundColor Red
        return $false
    }
}

# Check for Node.js
if (-not (Test-NodeJS)) {
    Write-Host "⚠️  Node.js not found. Installing..." -ForegroundColor Yellow
    if (-not (Install-NodeJS)) {
        Write-Host "❌ Cannot proceed without Node.js. Please install it manually from https://nodejs.org" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Get user email if not provided
if ([string]::IsNullOrEmpty($UserEmail)) {
    $UserEmail = Read-Host "📧 Enter your email address for device registration"
    if ([string]::IsNullOrEmpty($UserEmail)) {
        $UserEmail = "$env:USERNAME@$env:COMPUTERNAME.local"
        Write-Host "Using default email: $UserEmail" -ForegroundColor Yellow
    }
}

# Create installation directory
$installDir = "$env:USERPROFILE\.laptoptracker"
if (-not (Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
    Write-Host "📁 Created installation directory: $installDir" -ForegroundColor Green
}

# Download the agent
$agentUrl = "$ServerUrl/agents/laptop-tracker-agent.js"
$agentPath = "$installDir\agent.js"

try {
    Write-Host "⬇️  Downloading LaptopTracker agent..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri $agentUrl -OutFile $agentPath -UseBasicParsing
    Write-Host "✅ Agent downloaded successfully" -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed to download agent: $_" -ForegroundColor Red
    Write-Host "Make sure the LaptopTracker server is running at $ServerUrl" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Create startup script
$startupScript = @"
@echo off
title LaptopTracker Pro Enterprise Agent
echo 🚀 Starting LaptopTracker Pro Enterprise Agent...
set LAPTOPTRACKER_EMAIL=$UserEmail
cd /d "$installDir"
node agent.js
pause
"@

$startupScriptPath = "$installDir\start-agent.bat"
$startupScript | Out-File -FilePath $startupScriptPath -Encoding ASCII

# Create Windows service registration script
$serviceScript = @"
@echo off
echo 🔧 Installing LaptopTracker Pro as Windows Service...
sc create "LaptopTrackerPro" binpath= "node `"$agentPath`" --service" displayname= "LaptopTracker Pro Enterprise" start= auto
sc description "LaptopTrackerPro" "Enterprise device tracking and security service"
sc start "LaptopTrackerPro"
echo ✅ Service installed and started!
pause
"@

$serviceScriptPath = "$installDir\install-service.bat"
$serviceScript | Out-File -FilePath $serviceScriptPath -Encoding ASCII

# Add to startup (Task Scheduler approach)
$taskName = "LaptopTracker Pro Enterprise"
$taskExists = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($taskExists) {
    Write-Host "🔄 Updating existing startup task..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

$action = New-ScheduledTaskAction -Execute "node" -Argument "`"$agentPath`"" -WorkingDirectory $installDir
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType InteractiveOrPassword -RunLevel Highest

try {
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
    Write-Host "✅ Startup task registered successfully" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  Could not register startup task: $_" -ForegroundColor Yellow
    Write-Host "You can manually run the agent from: $startupScriptPath" -ForegroundColor Cyan
}

# Set environment variable
[Environment]::SetEnvironmentVariable("LAPTOPTRACKER_EMAIL", $UserEmail, "User")
Write-Host "✅ Environment configured" -ForegroundColor Green

# Create desktop shortcut
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut("$env:USERPROFILE\Desktop\LaptopTracker Pro.lnk")
$shortcut.TargetPath = $startupScriptPath
$shortcut.WorkingDirectory = $installDir
$shortcut.Description = "LaptopTracker Pro Enterprise Agent"
$shortcut.Save()
Write-Host "✅ Desktop shortcut created" -ForegroundColor Green

# Start the agent
Write-Host ""
Write-Host "🚀 Starting LaptopTracker Pro Enterprise Agent..." -ForegroundColor Cyan
Write-Host "📧 Registered email: $UserEmail" -ForegroundColor Green
Write-Host "📁 Installation directory: $installDir" -ForegroundColor Green
Write-Host ""

# Set environment variable for current session
$env:LAPTOPTRACKER_EMAIL = $UserEmail

# Change to installation directory and start agent
Set-Location $installDir

try {
    Write-Host "🔄 Initializing agent..." -ForegroundColor Cyan
    Start-Process -FilePath "node" -ArgumentList "agent.js" -NoNewWindow -PassThru
    
    Start-Sleep 3
    Write-Host ""
    Write-Host "✅ LaptopTracker Pro Enterprise Agent is now running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Your device is being tracked with the following features:" -ForegroundColor Cyan
    Write-Host "   • Real-time location tracking" -ForegroundColor White
    Write-Host "   • Battery and system monitoring" -ForegroundColor White
    Write-Host "   • Hardware information detection" -ForegroundColor White
    Write-Host "   • Network status monitoring" -ForegroundColor White
    Write-Host "   • Security lock detection" -ForegroundColor White
    Write-Host "   • Automatic updates every 30 seconds" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 View your devices at: $ServerUrl/dashboard" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔧 Management options:" -ForegroundColor Yellow
    Write-Host "   • Desktop shortcut: LaptopTracker Pro.lnk" -ForegroundColor White
    Write-Host "   • Manual start: $startupScriptPath" -ForegroundColor White
    Write-Host "   • Service install: $serviceScriptPath (run as admin)" -ForegroundColor White
    Write-Host ""
}
catch {
    Write-Host "❌ Failed to start agent: $_" -ForegroundColor Red
    Write-Host "You can manually start it using: $startupScriptPath" -ForegroundColor Yellow
}

Write-Host "Installation completed! Agent will start automatically on system boot." -ForegroundColor Green
Write-Host "Press Enter to exit..."
Read-Host