# Enhanced Lock Script for LAPSO Agent
# This script is executed when user clicks "Lock" button

param(
    [string]$LockMessage = "This device has been locked by LAPSO",
    [string]$ContactInfo = ""
)

Write-Host "🔒 LAPSO Enhanced Lock Activated" -ForegroundColor Red

# 1. Lock the screen immediately
rundll32.exe user32.dll,LockWorkStation

# 2. Disable Task Manager (requires admin)
try {
    $regPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Policies\System"
    if (-not (Test-Path $regPath)) {
        New-Item -Path $regPath -Force | Out-Null
    }
    Set-ItemProperty -Path $regPath -Name "DisableTaskMgr" -Value 1 -Type DWord
    Write-Host "✅ Task Manager disabled" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Could not disable Task Manager (need admin)" -ForegroundColor Yellow
}

# 3. Set auto-lock timer to 1 second
try {
    powercfg /setacvalueindex SCHEME_CURRENT SUB_VIDEO VIDEOIDLE 1
    powercfg /setdcvalueindex SCHEME_CURRENT SUB_VIDEO VIDEOIDLE 1
    powercfg /setactive SCHEME_CURRENT
    Write-Host "✅ Auto-lock set to 1 second" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Could not set auto-lock timer" -ForegroundColor Yellow
}

# 4. Create lock screen wallpaper with message
try {
    Add-Type -AssemblyName System.Drawing
    $bitmap = New-Object System.Drawing.Bitmap(1920, 1080)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    # Red background
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 38, 38))
    $graphics.FillRectangle($brush, 0, 0, 1920, 1080)
    
    # White text
    $font = New-Object System.Drawing.Font("Arial", 48, [System.Drawing.FontStyle]::Bold)
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    
    $graphics.DrawString("🔒 DEVICE LOCKED", $font, $whiteBrush, 500, 400)
    
    $font2 = New-Object System.Drawing.Font("Arial", 24)
    $graphics.DrawString($LockMessage, $font2, $whiteBrush, 500, 500)
    
    if ($ContactInfo) {
        $graphics.DrawString("Contact: $ContactInfo", $font2, $whiteBrush, 500, 550)
    }
    
    # Save wallpaper
    $wallpaperPath = "$env:TEMP\lapso-lock-screen.bmp"
    $bitmap.Save($wallpaperPath, [System.Drawing.Imaging.ImageFormat]::Bmp)
    
    # Set as wallpaper
    $regPath = "HKCU:\Control Panel\Desktop"
    Set-ItemProperty -Path $regPath -Name "Wallpaper" -Value $wallpaperPath
    rundll32.exe user32.dll, UpdatePerUserSystemParameters
    
    Write-Host "✅ Lock screen wallpaper set" -ForegroundColor Green
    
    $graphics.Dispose()
    $bitmap.Dispose()
} catch {
    Write-Host "⚠️ Could not create lock screen wallpaper" -ForegroundColor Yellow
}

# 5. Log the lock event
$logPath = "$env:APPDATA\LAPSO\lock-log.txt"
$logEntry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Device locked by LAPSO`r`n"
Add-Content -Path $logPath -Value $logEntry

# 6. Show notification (before lock)
$notification = New-Object -ComObject Wscript.Shell
$notification.Popup("Your device has been locked by LAPSO security system.", 5, "LAPSO Security", 16)

Write-Host "🔒 Enhanced lock applied successfully" -ForegroundColor Green
Write-Host "📝 Lock event logged to: $logPath" -ForegroundColor Cyan
