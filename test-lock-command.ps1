# Test Lock Command - Bypass UI and directly queue command
# This tests if the command queuing and agent polling works

$deviceId = '0B7ABA31-AD7B-4AE3-8301-C4C6E6EFCE32'
$userEmail = 'jithu@gmail.com'

Write-Host "`n=== Testing Lock Command Flow ===" -ForegroundColor Cyan

# Step 1: Check current queue
Write-Host "`n1. Checking current command queue..." -ForegroundColor Yellow
$pollUrl = "http://localhost:8080/api/device-commands/poll/$deviceId?userEmail=$userEmail"
$beforePoll = curl.exe -s $pollUrl | ConvertFrom-Json
Write-Host "Commands in queue BEFORE: $($beforePoll.commandCount)" -ForegroundColor Gray

# Step 2: Try to login and get session
Write-Host "`n2. Attempting to login via UI..." -ForegroundColor Yellow
Write-Host "   → Open browser to http://localhost:8080/login" -ForegroundColor Gray
Write-Host "   → Login with: jithu@gmail.com" -ForegroundColor Gray
Write-Host "   → Then go to Map view and click Lock button" -ForegroundColor Gray

# Step 3: Instructions for manual test
Write-Host "`n3. After clicking Lock button in UI:" -ForegroundColor Yellow
Write-Host "   → Open browser console (F12)" -ForegroundColor Gray
Write-Host "   → You should see:" -ForegroundColor Gray
Write-Host "      🔒 Sending lock command to: /api/quick-actions/lock/$deviceId" -ForegroundColor Green
Write-Host "      Lock response status: 200" -ForegroundColor Green
Write-Host "      Lock response data: {success: true, ...}" -ForegroundColor Green

Write-Host "`n4. Checking if command was queued (wait 5 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

$afterPoll = curl.exe -s $pollUrl | ConvertFrom-Json
Write-Host "Commands in queue AFTER: $($afterPoll.commandCount)" -ForegroundColor Gray

if ($afterPoll.commandCount -gt 0) {
    Write-Host "`n✅ SUCCESS! Command was queued:" -ForegroundColor Green
    $afterPoll.commands | ForEach-Object {
        Write-Host "   Command ID: $($_.commandId)" -ForegroundColor White
        Write-Host "   Action: $($_.action)" -ForegroundColor White
        Write-Host "   Timestamp: $($_.timestamp)" -ForegroundColor White
    }
} else {
    Write-Host "`n❌ No commands in queue. The Lock button didn't queue the command." -ForegroundColor Red
    Write-Host "   Possible issues:" -ForegroundColor Yellow
    Write-Host "   - Not logged in" -ForegroundColor Gray
    Write-Host "   - Device not selected in ComboBox" -ForegroundColor Gray
    Write-Host "   - JavaScript error (check browser console)" -ForegroundColor Gray
}

Write-Host "`n5. Monitoring agent log for execution..." -ForegroundColor Yellow
Write-Host "   Checking: C:\ProgramData\Lapso\agent.log" -ForegroundColor Gray
Get-Content "C:\ProgramData\Lapso\agent.log" -Tail 10

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
Write-Host "If lock didn't work, share the browser console logs.`n" -ForegroundColor Yellow
