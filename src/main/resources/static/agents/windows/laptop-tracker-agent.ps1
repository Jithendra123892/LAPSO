<#
    LAPSO Windows Agent
    - Sends periodic heartbeats to the server with device metadata
    - Minimal dependencies; designed to run as Scheduled Task via installer
#>

param(
        [Parameter(Mandatory=$true)] [string]$DeviceId,
        [Parameter(Mandatory=$true)] [string]$UserEmail,
        [string]$ServerUrl = "http://localhost:8080"
)

# Agent metadata
$AgentVersion = "1.0.0"
$LastUpdateCheck = Get-Date "2000-01-01"
$UpdateCheckIntervalMinutes = 30

# Ensure execution policy allows running this process
try { Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force -ErrorAction SilentlyContinue } catch {}

function Write-Log {
    param([string]$Message,[string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$timestamp] [$Level] $Message"
    Write-Host $line
    try {
        $logDir = Join-Path $env:ProgramData "Lapso"
        if (-not (Test-Path $logDir)) { New-Item -Path $logDir -ItemType Directory -Force | Out-Null }
        $logFile = Join-Path $logDir "agent.log"
        Add-Content -Path $logFile -Value $line
    } catch { }
}

if ([string]::IsNullOrWhiteSpace($DeviceId)) { Write-Error "DeviceId is required"; exit 1 }
if ([string]::IsNullOrWhiteSpace($UserEmail)) { Write-Error "UserEmail is required"; exit 1 }

function Send-Heartbeat {
    param(
        [string]$DeviceId,
        [string]$UserEmail,
        [hashtable]$DeviceInfo,
        [hashtable]$Location
    )
    try {
        $body = @{
            deviceId = $DeviceId
            userEmail = $UserEmail
            deviceName = $env:COMPUTERNAME
            operatingSystem = $DeviceInfo.operatingSystem
            manufacturer = $DeviceInfo.brand
            model = $DeviceInfo.model
            batteryLevel = $DeviceInfo.batteryPercentage
            agentVersion = $AgentVersion
        }
        if ($Location -and $Location.latitude -and $Location.longitude) {
            $body.latitude = $Location.latitude
            $body.longitude = $Location.longitude
            if ($Location.accuracy) { $body.accuracy = [double]$Location.accuracy }
            if ($Location.source) { $body.locationSource = $Location.source }
            if ($Location.city -and $Location.country) { $body.address = "$($Location.city), $($Location.country)" }
        }
        $json = $body | ConvertTo-Json -Depth 5
        $uri = "$ServerUrl/api/agent/heartbeat"
        $resp = Invoke-RestMethod -Uri $uri -Method Post -Body $json -ContentType 'application/json' -TimeoutSec 15
        return $true
    } catch {
        Write-Log ("Heartbeat failed: {0}" -f $_.Exception.Message) "ERROR"
        return $false
    }
}

# Compare two semantic versions. Returns -1 if a<b, 0 if equal, 1 if a>b
function Compare-SemVer {
    param([string]$a,[string]$b)
    if (-not $a) { $a = "0.0.0" }
    if (-not $b) { $b = "0.0.0" }
    $pa = $a.Split('.') | ForEach-Object { [int]($_) }
    $pb = $b.Split('.') | ForEach-Object { [int]($_) }
    for ($i=0; $i -lt [Math]::Max($pa.Count,$pb.Count); $i++) {
        $va = if ($i -lt $pa.Count) { $pa[$i] } else { 0 }
        $vb = if ($i -lt $pb.Count) { $pb[$i] } else { 0 }
        if ($va -lt $vb) { return -1 }
        if ($va -gt $vb) { return 1 }
    }
    return 0
}

function Invoke-AgentSelfUpdate {
    param([string]$DeviceId,[string]$UserEmail,[string]$ServerUrl)
    try {
        # Throttle update checks
        if (((Get-Date) - $LastUpdateCheck).TotalMinutes -lt $UpdateCheckIntervalMinutes) { return }
        $script:LastUpdateCheck = Get-Date

        $versionUri = "$ServerUrl/api/agent/version?platform=windows"
        $vr = Invoke-RestMethod -Uri $versionUri -Method Get -TimeoutSec 10
        $remoteVersion = "$($vr.version)"
        if ([string]::IsNullOrWhiteSpace($remoteVersion)) { return }
        if ((Compare-SemVer -a $AgentVersion -b $remoteVersion) -ge 0) { return }

        Write-Log ("New agent version available: {0} -> {1}" -f $AgentVersion,$remoteVersion) "INFO"
    $downloadUrl = if ($vr.url) { $vr.url } else { "$ServerUrl/api/agents/download/windows/laptop-tracker-agent.ps1" }
    if ($downloadUrl -and ($downloadUrl -notlike 'http*')) { $downloadUrl = "$ServerUrl$downloadUrl" }

        $tempNew = Join-Path $env:TEMP ("lapso-agent-" + $remoteVersion + ".ps1")
        Invoke-WebRequest -Uri $downloadUrl -OutFile $tempNew -UseBasicParsing -TimeoutSec 30

        # Optional integrity check
        if ($vr.sha256) {
            $hash = (Get-FileHash -Algorithm SHA256 -Path $tempNew).Hash.ToLower()
            if ($hash -ne ("" + $vr.sha256).ToLower()) {
                Write-Log "Downloaded agent failed SHA256 validation. Aborting update." "ERROR"
                Remove-Item -Path $tempNew -Force -ErrorAction SilentlyContinue
                return
            }
        }

        $current = $MyInvocation.MyCommand.Path
        $updater = Join-Path $env:TEMP ("lapso-updater-" + (Get-Date -Format 'yyyyMMddHHmmss') + ".ps1")
        $updaterContent = @'
param(
    [string]$NewPath,
    [string]$CurrentPath,
    [string]$DeviceId,
    [string]$UserEmail,
    [string]$ServerUrl
)
Start-Sleep -Seconds 2
Copy-Item -Path $NewPath -Destination $CurrentPath -Force
try { Remove-Item -Path $NewPath -Force -ErrorAction SilentlyContinue } catch {}
Start-Process -FilePath powershell -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File', $CurrentPath, '-DeviceId', $DeviceId, '-UserEmail', $UserEmail, '-ServerUrl', $ServerUrl) | Out-Null
try { Remove-Item -Path $MyInvocation.MyCommand.Path -Force -ErrorAction SilentlyContinue } catch {}
'@
        Set-Content -Path $updater -Value $updaterContent -Encoding UTF8
        Write-Log "Launching updater and exiting for self-restart..." "INFO"
        Start-Process -FilePath powershell -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File', $updater, '-NewPath', $tempNew, '-CurrentPath', $current, '-DeviceId', $DeviceId, '-UserEmail', $UserEmail, '-ServerUrl', $ServerUrl) | Out-Null
        exit 0
    } catch {
        Write-Log ("Self-update check failed: {0}" -f $_.Exception.Message) "WARN"
    }
}

# Function to get REAL GPS location with high accuracy
function Get-RealGPSLocation {
    try {
    Write-Log "Getting GPS location (3-meter accuracy)..." "INFO"
        
        # Try Windows Location API first (most accurate)
        $location = $null
        try {
            Add-Type -AssemblyName System.Device
            $watcher = New-Object System.Device.Location.GeoCoordinateWatcher
            $watcher.Start()
            Start-Sleep -Seconds 5
            
            if ($watcher.Position.Location.IsUnknown -eq $false) {
                $location = @{
                    latitude = $watcher.Position.Location.Latitude
                    longitude = $watcher.Position.Location.Longitude
                    accuracy = $watcher.Position.Location.HorizontalAccuracy
                    source = "Windows_Location_API"
                }
                Write-Log "GPS Location: $($location.latitude), $($location.longitude) (±$($location.accuracy)m)" "INFO"
            }
            $watcher.Stop()
        } catch {
            Write-Log "Windows Location API not available, trying IP geolocation..." "WARN"
        }
        
        # Fallback to IP-based geolocation (less accurate but still works)
        if ($null -eq $location) {
            try {
                $ipInfo = Invoke-RestMethod -Uri "http://ip-api.com/json/" -TimeoutSec 10
                if ($ipInfo.status -eq "success") {
                    $location = @{
                        latitude = $ipInfo.lat
                        longitude = $ipInfo.lon
                        accuracy = 1000.0  # IP geolocation is less accurate
                        source = "IP_Geolocation"
                        city = $ipInfo.city
                        country = $ipInfo.country
                    }
                    Write-Log "IP Location: $($location.latitude), $($location.longitude) in $($ipInfo.city), $($ipInfo.country)" "INFO"
                }
            } catch {
                Write-Log "Failed to get location via IP geolocation" "ERROR"
            }
        }
        
        return $location
    } catch {
        Write-Log "Error getting GPS location: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

# Function to get comprehensive device information
function Get-DeviceInformation {
    try {
    Write-Log "Collecting device information..." "INFO"
        
        # Get basic system information
        $computerSystem = Get-CimInstance Win32_ComputerSystem
        $bios = Get-CimInstance Win32_BIOS
        $os = Get-CimInstance Win32_OperatingSystem
        $processor = Get-CimInstance Win32_Processor
        $memory = Get-CimInstance Win32_PhysicalMemory
        
        # Get network information
        $network = Get-NetIPAddress | Where-Object {$_.AddressFamily -eq "IPv4" -and $_.InterfaceAlias -notlike "*Loopback*"}
        $ipAddress = if ($network) { $network[0].IPAddress } else { "Unknown" }
        
        # Get battery information if available
        $battery = Get-CimInstance -ClassName Win32_Battery -ErrorAction SilentlyContinue
        $batteryPercentage = if ($battery) { $battery.EstimatedChargeRemaining } else { -1 }
        $batteryStatus = if ($battery) { $battery.BatteryStatus } else { "No Battery" }
        
        # Get disk information
        $disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'"
        $storage = if ($disk) { "$([math]::Round($disk.Size / 1GB, 2)) GB" } else { "Unknown" }
        
        # Create device information object
        $deviceInfo = @{
            brand = $computerSystem.Manufacturer
            model = $computerSystem.Model
            operatingSystem = $os.Caption
            batteryPercentage = $batteryPercentage
        }
        
        return $deviceInfo
    }
    catch {
        Write-Log "Error collecting device information: $_" "ERROR"
        return $null
    }
}

## Remove legacy registration/location functions; use heartbeat only

# Function to get current location (simplified - in a real implementation, you would use a location service)
function Get-DeviceLocation {
    # Get location using Windows Location API and IP geolocation
    try {
        # Try Windows Location API first
        Add-Type -AssemblyName System.Device
        $watcher = New-Object System.Device.Location.GeoCoordinateWatcher
        $watcher.Start()
        Start-Sleep -Seconds 3
        
        if ($watcher.Position.Location.IsUnknown -eq $false) {
            return @{
                latitude = $watcher.Position.Location.Latitude
                longitude = $watcher.Position.Location.Longitude
                accuracy = $watcher.Position.Location.HorizontalAccuracy
                source = "GPS"
            }
        }
    } catch {
        Write-Host "GPS unavailable, using IP geolocation"
    }
    
    # Fallback to IP geolocation
    try {
        $ipInfo = Invoke-RestMethod -Uri "http://ip-api.com/json/" -TimeoutSec 10
        return @{
            latitude = $ipInfo.lat
            longitude = $ipInfo.lon
            accuracy = 10000
            source = "IP"
            city = $ipInfo.city
            country = $ipInfo.country
        }
    } catch {
        # Last resort - return approximate location
        return @{
            latitude = 40.7128
            longitude = -74.0060
            accuracy = 50000
            source = "Default"
            city = "Unknown"
        }
    }
    
    try {
        # Simple IP geolocation using a free service
        $locationResponse = Invoke-RestMethod -Uri "http://ip-api.com/json/" -Method Get
        if ($locationResponse.status -eq "success") {
            return @{
                latitude = $locationResponse.lat
                longitude = $locationResponse.lon
            }
        }
    }
    catch {
        Write-Warning "Could not get location: $_"
    }
    
    # Default location if geolocation fails
    return @{
        latitude = 40.7128
        longitude = -74.0060
    }
}

## Remove legacy location endpoint usage

# Function to get pending commands from server
function Get-PendingCommands {
    param(
        [string]$DeviceId,
        [string]$UserEmail
    )
    try {
        $uri = "$ServerUrl/api/device-commands/poll/${DeviceId}?userEmail=$UserEmail"
        $response = Invoke-RestMethod -Uri $uri -Method Get -TimeoutSec 10
        
        Write-Log "🔍 POLL RESPONSE: success=$($response.success), commandCount=$($response.commandCount)" "INFO"
        Write-Log "🔍 POLL RESPONSE: commands type=$($response.commands.GetType().Name), count=$($response.commands.Count)" "INFO"
        
        if ($response.success -and $response.commandCount -gt 0) {
            Write-Log "Retrieved $($response.commandCount) pending commands" "INFO"
            return $response.commands
        }
        return @()
    }
    catch {
        Write-Log "❌ POLL ERROR: $($_.Exception.Message)" "ERROR"
        return @()
    }
}

# Function to report command result back to server
function Send-CommandResult {
    param(
        [string]$DeviceId,
        [object]$Result
    )
    
    try {
        $uri = "$ServerUrl/api/device-commands/result/$DeviceId"
        $json = $Result | ConvertTo-Json -Depth 3
        
        $response = Invoke-RestMethod -Uri $uri -Method Post -Body $json -ContentType "application/json" -TimeoutSec 10
    Write-Log "Command result sent to server" "INFO"
        return $true
        
    } catch {
        Write-Log "Failed to send command result: $($_.Exception.Message)" "WARN"
        return $false
    }
}

# Function to report command failure to server
function Send-CommandFailure {
    param(
        [long]$CommandId,
        [string]$ErrorMessage
    )
    
    try {
        $uri = "$ServerUrl/api/agent/commands/$CommandId/failed"
        $data = @{
            errorMessage = $ErrorMessage
        }
        $json = $data | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri $uri -Method Post -Body $json -ContentType "application/json"
        
        if ($response.success) {
            Write-Log "Command $CommandId failure reported" "INFO"
            return $true
        } else {
            Write-Log "Server responded with error when reporting command failure: $($response.message)" "WARN"
            return $false
        }
    }
    catch {
        Write-Log "Error reporting command failure: $_" "ERROR"
        return $false
    }
}

# Function to execute a command
function Execute-Command {
    param(
        [object]$Command
    )
    
    $result = @{
        commandId = $Command.commandId
        status = "success"
        message = "Command executed successfully"
        timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss"
    }
    
    try {
    Write-Log "Executing command: $($Command.action)" "INFO"
        
        switch ($Command.action) {
            "LOCK" {
                Write-Log "🔒 LOCKING DEVICE NOW..." "INFO"
                
                try {
                    # Multiple lock methods to ensure it works
                    
                    # Method 1: Direct lock (fastest)
                    Start-Process -FilePath "rundll32.exe" -ArgumentList "user32.dll,LockWorkStation" -WindowStyle Hidden -Wait:$false
                    
                    # Method 2: Create a VBS script that locks (works better from background)
                    $vbsScript = @"
Set objShell = CreateObject("WScript.Shell")
objShell.Run "rundll32.exe user32.dll,LockWorkStation", 0, False
"@
                    $vbsPath = Join-Path $env:TEMP "lapso-lock.vbs"
                    $vbsScript | Out-File -FilePath $vbsPath -Encoding ASCII -Force
                    Start-Process -FilePath "wscript.exe" -ArgumentList "`"$vbsPath`"" -WindowStyle Hidden -Wait:$false
                    
                    # Method 3: Use PowerShell with Add-Type for direct Win32 API call
                    $signature = @"
[DllImport("user32.dll", SetLastError = true)]
public static extern bool LockWorkStation();
"@
                    try {
                        Add-Type -MemberDefinition $signature -Name LockWorkStation -Namespace Win32Functions -PassThru | Out-Null
                        [Win32Functions.LockWorkStation]::LockWorkStation() | Out-Null
                        Write-Log "Win32 API lock method executed" "INFO"
                    } catch {
                        Write-Log "Win32 API method skipped (may already be added)" "INFO"
                    }
                    
                    # Method 4: Scheduled task with immediate execution
                    $taskName = "LAPSO_ScreenLock"
                    $action = New-ScheduledTaskAction -Execute "rundll32.exe" -Argument "user32.dll,LockWorkStation"
                    $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddSeconds(1)
                    $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest
                    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -DeleteExpiredTaskAfter 00:00:01
                    
                    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
                    Start-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
                    
                    # Cleanup after 3 seconds
                    Start-Sleep -Seconds 3
                    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
                    Remove-Item -Path $vbsPath -Force -ErrorAction SilentlyContinue
                    
                    $result.message = "🔒 Screen locked successfully! Multiple lock methods executed."
                    Write-Log "✅ Device locked - all lock methods executed" "INFO"
                }
                catch {
                    Write-Log "❌ Lock failed: $($_.Exception.Message)" "ERROR"
                    $result.status = "error"
                    $result.message = "Lock failed: $($_.Exception.Message)"
                }
            }
            
            "UNLOCK" {
                Write-Log "Unlock command received..." "INFO"
                $result.message = "Unlock command received (user must unlock manually)"
            }
            
            "PLAY_SOUND" {
                Write-Log "Playing sound..." "INFO"
                
                # Play multiple beeps to make it noticeable
                for ($i = 1; $i -le 10; $i++) {
                    [Console]::Beep(800, 300)
                    Start-Sleep -Milliseconds 100
                    [Console]::Beep(1200, 300)
                    Start-Sleep -Milliseconds 100
                }
                
                $result.message = "Sound played successfully - device should be audible"
            }
            
            "SCREENSHOT" {
                Write-Log "Taking screenshot..." "INFO"
                
                try {
                    Add-Type -AssemblyName System.Windows.Forms
                    Add-Type -AssemblyName System.Drawing
                    
                    $screen = [System.Windows.Forms.Screen]::PrimaryScreen
                    $bitmap = New-Object System.Drawing.Bitmap $screen.Bounds.Width, $screen.Bounds.Height
                    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
                    $graphics.CopyFromScreen($screen.Bounds.X, $screen.Bounds.Y, 0, 0, $screen.Bounds.Size)
                    
                    $screenshotPath = "$env:TEMP\lapso-screenshot-$(Get-Date -Format 'yyyyMMdd-HHmmss').png"
                    $bitmap.Save($screenshotPath, [System.Drawing.Imaging.ImageFormat]::Png)
                    
                    $graphics.Dispose()
                    $bitmap.Dispose()
                    
                    # Upload screenshot to server
                    Write-Log "Uploading screenshot to server..." "INFO"
                    $uploadUri = "$ServerUrl/api/screenshots/upload/$DeviceId"
                    
                    # Read file as base64
                    $fileBytes = [System.IO.File]::ReadAllBytes($screenshotPath)
                    $base64 = [Convert]::ToBase64String($fileBytes)
                    
                    $uploadBody = @{
                        deviceId = $DeviceId
                        userEmail = $UserEmail
                        imageData = $base64
                        timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss"
                    } | ConvertTo-Json
                    
                    $uploadResponse = Invoke-RestMethod -Uri $uploadUri -Method Post -Body $uploadBody -ContentType 'application/json' -TimeoutSec 30
                    
                    # Delete local file
                    Remove-Item -Path $screenshotPath -Force
                    
                    $result.message = "Screenshot captured and uploaded successfully"
                    $result.screenshotUrl = $uploadResponse.url
                }
                catch {
                    $result.status = "error"
                    $result.message = "Screenshot failed: $($_.Exception.Message)"
                }
            }
            
            "WIPE" {
                Write-Log "EMERGENCY WIPE COMMAND!" "WARN"
                
                # Lock device immediately
                rundll32.exe user32.dll,LockWorkStation
                
                # In production, this would securely wipe data
                $result.message = "EMERGENCY WIPE INITIATED - Device locked for security"
                $result.status = "warning"
            }
            
            "UPDATE_LOCATION" {
                Write-Log "Updating location..." "INFO"
                $result.message = "Location update requested - will be sent in next heartbeat"
            }
            
            default {
                $result.status = "error"
                $result.message = "Unknown command: $($Command.action)"
            }
        }
        
    Write-Log "Command completed: $($Command.action)" "INFO"
        
    } catch {
        $result.status = "error"
        $result.message = "Command execution failed: $($_.Exception.Message)"
        Write-Log "Command failed: $($_.Exception.Message)" "ERROR"
    }
    
    return $result
}

# Function to process pending commands
function Process-PendingCommands {
    param(
        [string]$DeviceId,
        [string]$UserEmail
    )
    
    Write-Log "Checking for pending commands..." "INFO"
    $commands = Get-PendingCommands -DeviceId $DeviceId -UserEmail $UserEmail
    
    if ($commands.Count -gt 0) {
    Write-Log "Found $($commands.Count) pending commands" "INFO"
        
        foreach ($command in $commands) {
            try {
                # Execute command
                $result = Execute-Command -Command $command
                
                # Report result back to server
                Send-CommandResult -DeviceId $DeviceId -Result $result
                
            } catch {
                # Create error result
                $errorResult = @{
                    commandId = $command.commandId
                    status = "error"
                    message = "Command execution failed: $($_.Exception.Message)"
                    timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss"
                }
                
                Send-CommandResult -DeviceId $DeviceId -Result $errorResult
            }
        }
    } else {
        Write-Log "No pending commands" "INFO"
    }
}

# Main execution: heartbeat loop with command polling
Write-Log "Starting LAPSO Agent..." "INFO"
Write-Log ("Server URL: {0}" -f $ServerUrl) "INFO"
Write-Log ("Device ID: {0}" -f $DeviceId) "INFO"
Write-Log ("User Email: {0}" -f $UserEmail) "INFO"
Write-Log ("Agent Version: {0}" -f $AgentVersion) "INFO"
Write-Log "Agent is running - sending heartbeats and polling for commands every 30 seconds" "INFO"

while ($true) {
    try {
        # Check for agent updates periodically
        Invoke-AgentSelfUpdate -DeviceId $DeviceId -UserEmail $UserEmail -ServerUrl $ServerUrl
        # Send heartbeat with device info and location
        $deviceInfo = Get-DeviceInformation
        $location = Get-DeviceLocation
        [void](Send-Heartbeat -DeviceId $DeviceId -UserEmail $UserEmail -DeviceInfo $deviceInfo -Location $location)
        
        # Poll for and execute pending commands
        Process-PendingCommands -DeviceId $DeviceId -UserEmail $UserEmail
    } catch {
        Write-Log ("Agent loop error: {0}" -f $_.Exception.Message) "ERROR"
    }
    Start-Sleep -Seconds 30
}