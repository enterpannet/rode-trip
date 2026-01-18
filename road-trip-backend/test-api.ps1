# Road Trip Buddy API Test Script for PowerShell
# Make sure the server is running on localhost:3000

$BaseUrl = "http://localhost:3000"
$CookieFile = "cookies.txt"

# Clean up old cookies
if (Test-Path $CookieFile) {
    Remove-Item $CookieFile
}

Write-Host "=== Road Trip Buddy API Test ===" -ForegroundColor Blue
Write-Host ""

# 1. Health Check
Write-Host "1. Health Check" -ForegroundColor Green
$health = Invoke-RestMethod -Uri "$BaseUrl/api/health" -Method Get
$health | ConvertTo-Json
Write-Host ""

# 2. Register User
Write-Host "2. Register User" -ForegroundColor Green
$registerBody = @{
    name = "Test User"
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

$registerResponse = Invoke-RestMethod -Uri "$BaseUrl/api/auth/register" `
    -Method Post `
    -Body $registerBody `
    -ContentType "application/json" `
    -SessionVariable session

$registerResponse | ConvertTo-Json -Depth 10
$userId = $registerResponse.id
Write-Host "User ID: $userId" -ForegroundColor Cyan
Write-Host ""

# 3. Get Current User
Write-Host "3. Get Current User" -ForegroundColor Green
$currentUser = Invoke-RestMethod -Uri "$BaseUrl/api/auth/me" `
    -Method Get `
    -WebSession $session
$currentUser | ConvertTo-Json -Depth 10
Write-Host ""

# 4. Create Room
Write-Host "4. Create Room" -ForegroundColor Green
$roomBody = @{
    name = "Road Trip to Beach"
    description = "Weekend trip to the beach"
} | ConvertTo-Json

$roomResponse = Invoke-RestMethod -Uri "$BaseUrl/api/rooms" `
    -Method Post `
    -Body $roomBody `
    -ContentType "application/json" `
    -WebSession $session

$roomResponse | ConvertTo-Json -Depth 10
$roomId = $roomResponse.id
Write-Host "Room ID: $roomId" -ForegroundColor Cyan
Write-Host ""

# 5. Get User Rooms
Write-Host "5. Get User Rooms" -ForegroundColor Green
$rooms = Invoke-RestMethod -Uri "$BaseUrl/api/rooms" `
    -Method Get `
    -WebSession $session
$rooms | ConvertTo-Json -Depth 10
Write-Host ""

# 6. Get Room Members
Write-Host "6. Get Room Members" -ForegroundColor Green
$members = Invoke-RestMethod -Uri "$BaseUrl/api/rooms/$roomId/members" `
    -Method Get `
    -WebSession $session
$members | ConvertTo-Json -Depth 10
Write-Host ""

# 7. Send Message
Write-Host "7. Send Text Message" -ForegroundColor Green
$messageBody = @{
    text = "Hello everyone! Let's meet at the parking lot at 8 AM."
    message_type = "text"
} | ConvertTo-Json

$messageResponse = Invoke-RestMethod -Uri "$BaseUrl/api/rooms/$roomId/messages" `
    -Method Post `
    -Body $messageBody `
    -ContentType "application/json" `
    -WebSession $session

$messageResponse | ConvertTo-Json -Depth 10
$messageId = $messageResponse.id
Write-Host "Message ID: $messageId" -ForegroundColor Cyan
Write-Host ""

# 8. Get Messages
Write-Host "8. Get Messages" -ForegroundColor Green
$messages = Invoke-RestMethod -Uri "$BaseUrl/api/rooms/$roomId/messages?page=0&page_size=20" `
    -Method Get `
    -WebSession $session
$messages | ConvertTo-Json -Depth 10
Write-Host ""

# 9. Send Another Message
Write-Host "9. Send Another Message" -ForegroundColor Green
$messageBody2 = @{
    text = "Don't forget to bring sunscreen!"
    message_type = "text"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$BaseUrl/api/rooms/$roomId/messages" `
    -Method Post `
    -Body $messageBody2 `
    -ContentType "application/json" `
    -WebSession $session | ConvertTo-Json -Depth 10
Write-Host ""

# 10. Update Location
Write-Host "10. Update Location (Bangkok)" -ForegroundColor Green
$locationBody = @{
    latitude = 13.7563
    longitude = 100.5018
} | ConvertTo-Json

$locationResponse = Invoke-RestMethod -Uri "$BaseUrl/api/rooms/$roomId/location" `
    -Method Post `
    -Body $locationBody `
    -ContentType "application/json" `
    -WebSession $session

$locationResponse | ConvertTo-Json -Depth 10
Write-Host ""

# 11. Get Locations
Write-Host "11. Get Locations" -ForegroundColor Green
$locations = Invoke-RestMethod -Uri "$BaseUrl/api/rooms/$roomId/locations" `
    -Method Get `
    -WebSession $session
$locations | ConvertTo-Json -Depth 10
Write-Host ""

# 12. Update Location Again
Write-Host "12. Update Location Again" -ForegroundColor Green
$locationBody2 = @{
    latitude = 13.7565
    longitude = 100.5020
} | ConvertTo-Json

Invoke-RestMethod -Uri "$BaseUrl/api/rooms/$roomId/location" `
    -Method Post `
    -Body $locationBody2 `
    -ContentType "application/json" `
    -WebSession $session | ConvertTo-Json -Depth 10
Write-Host ""

# 13. Logout
Write-Host "13. Logout" -ForegroundColor Green
Invoke-RestMethod -Uri "$BaseUrl/api/auth/logout" `
    -Method Post `
    -WebSession $session | ConvertTo-Json
Write-Host ""

Write-Host "=== All Tests Completed! ===" -ForegroundColor Green
