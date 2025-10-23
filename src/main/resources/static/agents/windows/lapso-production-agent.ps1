# LAPSO Windows Agent - Production Version v2.0
# Real GPS tracking, system monitoring, security features, and native OS integration

param(
    [string]$ServerUrl = "http://localhost:8080",
    [string]$DeviceId = "",
    [string]$UserEmail = "",
    [int]$UpdateInterval = 30,
    [string]$ConfigFile = "$env:APPDATA\LAPSO\config.json"
)

# Import required assemblies for advanced features
Add-Type -AssemblyName System.Device
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

Write-Host "🚀 LAPSO Windows Agent - Production Version v2.0" -ForegroundColor Green
Write-Host "🔧 Initializing advanced features..." -ForegroundColor Yellow

# Create config directory
$configDir = Split-Path $ConfigFile -Parent
if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
}

# Load or create configuration
function Load-Config {
    if (Test-Path $ConfigFile) {
        try {
            $config = Get-Content $ConfigFile | ConvertFrom-Json
            return $config
        } catch {
            Write-Host "⚠️ Config file corrupted, creating new one" -ForegroundColor Yellow
        }
    }
    
    $config = @{
        DeviceId = if ($DeviceId) { $DeviceId } else { "WIN-" + [System.Guid]::NewGuid().ToString().Substring(0,8).ToUpper() }
        ServerUrl = $ServerUrl
        UserEmail = $UserEmail
        UpdateInterval = $UpdateInterval
        FirstRun = $true
        InstallDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
        Version = "2.0.0"
    }
    
    $config | ConvertTo-Json | Set-Content $ConfigFile
    return $config
}

$config = Load-Config
$DeviceId = $config.DeviceId

Write-Host "📱 Device ID: $DeviceId" -ForegroundColor Cyan
Write-Host "🌐 Server: $($config.ServerUrl)" -ForegroundColor Cyan

# Advanced system information gathering
function Get-SystemInfo {
    try {
        $computerInfo = Get-ComputerInfo
        $processor = Get-WmiObject -Class Win32_Processor | Select-Object -First 1
        $memory = Get-WmiObject -Class Win32_PhysicalMemory | Measure-Object -Property Capacity -Sum
        $disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DriveType=3" | Select-Object -First 1
        $network = Get-WmiObject -Class Win32_NetworkAdapterConfiguration | Where-Object { $_.IPEnabled -eq $true } | Select-Object -First 1
        
        return @{
            Manufacturer = $computerInfo.CsManufacturer
            Model = $computerInfo.CsModel
            SerialNumber = $computerInfo.BiosSeralNumber
            OSName = $computerInfo.WindowsProductName
            OSVersion = $computerInfo.WindowsVersion
            ProcessorName = $processor.Name
            ProcessorCores = $processor.NumberOfCores
            TotalMemoryGB = [math]::Round($memory.Sum / 1GB, 2)
            DiskTotalGB = [math]::Round($disk.Size / 1GB, 2)
            DiskFreeGB = [math]::Round($disk.FreeSpace / 1GB, 2)
            IPAddress = $network.IPAddress[0]
            MACAddress = $network.MACAddress
        }
    } catch {
        Write-Host "⚠️ Error gathering system info: $($_.Exception.Message)" -ForegroundColor Yellow
        return @{}
    }
}# Real G
PS location using Windows Location API
function Get-RealLocation {
    try {
        $geoWatcher = New-Object System.Device.Location.GeoCoordinateWatcher
        $geoWatcher.Start()
        
        # Wait up to 10 seconds for location
        $timeout = 0
        while ($geoWatcher.Status -ne "Ready" -and $timeout -lt 100) {
            Start-Sleep -Milliseconds 100
            $timeout++
        }
        
        if ($geoWatcher.Status -eq "Ready" -and $geoWatcher.Position.Location.IsUnknown -eq $false) {
            $location = $geoWatcher.Position.Location
            $geoWatcher.Stop()
            
            return @{
                Latitude = $location.Latitude
                Longitude = $location.Longitude
                Altitude = $location.Altitude
                Accuracy = $location.HorizontalAccuracy
                Source = "GPS"
                Timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
            }
        }
        
        $geoWatcher.Stop()
    } catch {
        Write-Host "⚠️ GPS unavailable, using IP-based location" -ForegroundColor Yellow
    }
    
    # Fallback to IP-based location
    try {
        $ipInfo = Invoke-RestMethod -Uri "http://ip-api.com/json" -TimeoutSec 5
        return @{
            Latitude = $ipInfo.lat
            Longitude = $ipInfo.lon
            Altitude = 0
            Accuracy = 1000
            Source = "IP"
            City = $ipInfo.city
            Country = $ipInfo.country
            Timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
        }
    } catch {
        Write-Host "❌ Location services unavailable" -ForegroundColor Red
        return $null
    }
}

# Advanced battery information
function Get-BatteryInfo {
    try {
        $battery = Get-WmiObject -Class Win32_Battery | Select-Object -First 1
        if ($battery) {
            return @{
                Level = $battery.EstimatedChargeRemaining
                IsCharging = $battery.BatteryStatus -eq 2
                Status = switch ($battery.BatteryStatus) {
                    1 { "Discharging" }
                    2 { "Charging" }
                    3 { "Critical" }
                    4 { "Low" }
                    5 { "High" }
                    6 { "Full" }
                    default { "Unknown" }
                }
                EstimatedRuntime = $battery.EstimatedRunTime
            }
        }
    } catch {
        Write-Host "⚠️ Battery info unavailable (desktop system?)" -ForegroundColor Yellow
    }
    
    return @{
        Level = 100
        IsCharging = $true
        Status = "AC Power"
        EstimatedRuntime = -1
    }
}

# Performance monitoring
function Get-PerformanceInfo {
    try {
        $cpu = Get-Counter "\Processor(_Total)\% Processor Time" -SampleInterval 1 -MaxSamples 2
        $cpuUsage = [math]::Round(($cpu.CounterSamples | Measure-Object -Property CookedValue -Average).Average, 2)
        
        $memory = Get-Counter "\Memory\Available MBytes"
        $totalMemory = (Get-WmiObject -Class Win32_ComputerSystem).TotalPhysicalMemory / 1MB
        $availableMemory = $memory.CounterSamples[0].CookedValue
        $memoryUsage = [math]::Round((($totalMemory - $availableMemory) / $totalMemory) * 100, 2)
        
        return @{
            CPUUsage = $cpuUsage
            MemoryUsage = $memoryUsage
            AvailableMemoryMB = $availableMemory
            TotalMemoryMB = $totalMemory
            ProcessCount = (Get-Process).Count
            UptimeHours = [math]::Round(((Get-Date) - (Get-CimInstance Win32_OperatingSystem).LastBootUpTime).TotalHours, 2)
        }
    } catch {
        Write-Host "⚠️ Performance monitoring unavailable" -ForegroundColor Yellow
        return @{}
    }
}