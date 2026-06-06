# Simple Test Data Setup for Gaming Platform
# Creates users, store, stations, and gaming sessions

$ApiUrl = "http://localhost:8080"

Write-Host "`n" + ("="*60) -ForegroundColor Cyan
Write-Host "  Gaming Platform - Test Data Setup" -ForegroundColor Cyan
Write-Host ("="*60) -ForegroundColor Cyan
Write-Host ""

# Test users to create
$TestUsers = @(
    @{ Email = "gamer1@test.com"; Cellphone = "1234567890"; Pass = "Test@123456"; Name = "Gamer 1" }
    @{ Email = "gamer2@test.com"; Cellphone = "0987654321"; Pass = "Test@123456"; Name = "Gamer 2" }
    @{ Email = "gamer3@test.com"; Cellphone = "5555555555"; Pass = "Test@123456"; Name = "Gamer 3" }
    @{ Email = "cashier@test.com"; Cellphone = "9999999999"; Pass = "Test@123456"; Name = "Cashier" }
)

$CreatedUsers = @{}
$Tokens = @{}

# Step 1: Create users
Write-Host "--- Step 1: Creating Users ---" -ForegroundColor Magenta
foreach ($user in $TestUsers) {
    Write-Host "  Creating: $($user.Email)" -ForegroundColor Cyan

    try {
        $body = @{
            email = $user.Email
            cellphone = $user.Cellphone
            password = $user.Pass
        } | ConvertTo-Json

        $response = Invoke-WebRequest -Uri "$ApiUrl/api/auth/register" `
            -Method POST `
            -Headers @{ "Content-Type" = "application/json" } `
            -Body $body `
            -UseBasicParsing `
            -ErrorAction SilentlyContinue

        if ($response.StatusCode -in @(200, 201)) {
            $data = $response.Content | ConvertFrom-Json
            Write-Host "    ✓ Created" -ForegroundColor Green
            $CreatedUsers[$user.Email] = @{ Id = $data.data.id; Email = $user.Email; Name = $user.Name }
        } else {
            Write-Host "    ⚠ Status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        if ($_.Exception.Message -like "*already exists*" -or $_.Exception.Response.StatusCode.Value__ -eq 400) {
            Write-Host "    ⚠ Already exists" -ForegroundColor Yellow
            $CreatedUsers[$user.Email] = @{ Email = $user.Email; Name = $user.Name }
        } else {
            Write-Host "    ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# Step 2: Login users
Write-Host "`n--- Step 2: Authenticating Users ---" -ForegroundColor Magenta
foreach ($user in $TestUsers) {
    Write-Host "  Logging in: $($user.Email)" -ForegroundColor Cyan

    try {
        $body = @{
            email = $user.Email
            password = $user.Pass
        } | ConvertTo-Json

        $response = Invoke-WebRequest -Uri "$ApiUrl/api/auth/login" `
            -Method POST `
            -Headers @{ "Content-Type" = "application/json" } `
            -Body $body `
            -UseBasicParsing `
            -ErrorAction SilentlyContinue

        if ($response.StatusCode -eq 200) {
            $data = $response.Content | ConvertFrom-Json
            Write-Host "    ✓ Authenticated" -ForegroundColor Green
            $Tokens[$user.Email] = $data.data.accessToken
        } else {
            Write-Host "    ✗ Status: $($response.StatusCode)" -ForegroundColor Red
        }
    } catch {
        Write-Host "    ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Step 3: Create store
Write-Host "`n--- Step 3: Creating Store ---" -ForegroundColor Magenta
$StoreId = $null
$Token = $Tokens["cashier@test.com"]

if ($Token) {
    Write-Host "  Creating: Test Gaming Arena" -ForegroundColor Cyan

    try {
        $body = @{
            name = "Test Gaming Arena"
            slug = "test-gaming-arena"
            address = "123 Gaming Street"
            manager = "John Manager"
            contactPerson = "Jane Support"
            contactPhone = "1111111111"
        } | ConvertTo-Json

        $response = Invoke-WebRequest -Uri "$ApiUrl/api/stores" `
            -Method POST `
            -Headers @{
                "Content-Type" = "application/json"
                "Authorization" = "Bearer $Token"
            } `
            -Body $body `
            -UseBasicParsing `
            -ErrorAction SilentlyContinue

        if ($response.StatusCode -in @(200, 201)) {
            $data = $response.Content | ConvertFrom-Json
            $StoreId = $data.data.id
            Write-Host "    ✓ Created" -ForegroundColor Green
        } else {
            Write-Host "    ✗ Status: $($response.StatusCode)" -ForegroundColor Red
        }
    } catch {
        Write-Host "    ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "  ✗ No cashier token available" -ForegroundColor Red
}

# Step 4: Create gaming stations
$StationIds = @()
if ($StoreId -and $Token) {
    Write-Host "`n--- Step 4: Creating Gaming Stations ---" -ForegroundColor Magenta

    foreach ($i in 1..3) {
        Write-Host "  Creating: Station $i" -ForegroundColor Cyan

        try {
            $body = @{
                storeId = $StoreId
                name = "Station $i"
            } | ConvertTo-Json

            $response = Invoke-WebRequest -Uri "$ApiUrl/api/gaming-sessions/stations" `
                -Method POST `
                -Headers @{
                    "Content-Type" = "application/json"
                    "Authorization" = "Bearer $Token"
                } `
                -Body $body `
                -UseBasicParsing `
                -ErrorAction SilentlyContinue

            if ($response.StatusCode -in @(200, 201)) {
                $data = $response.Content | ConvertFrom-Json
                $StationIds += $data.data.id
                Write-Host "    ✓ Created" -ForegroundColor Green
            } else {
                Write-Host "    ✗ Status: $($response.StatusCode)" -ForegroundColor Red
            }
        } catch {
            Write-Host "    ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# Step 5: Create gaming sessions
if ($StoreId -and $StationIds.Count -gt 0) {
    Write-Host "`n--- Step 5: Creating Gaming Sessions ---" -ForegroundColor Magenta

    for ($i = 0; $i -lt 3; $i++) {
        $user = $TestUsers[$i]
        $stationId = $StationIds[$i % $StationIds.Count]
        $token = $Tokens[$user.Email]

        if ($token) {
            Write-Host "  Creating session for: $($user.Email)" -ForegroundColor Cyan

            try {
                $userId = $CreatedUsers[$user.Email].Id
                $body = @{
                    storeId = $StoreId
                    userId = $userId
                    stationId = $stationId
                    durationMins = 30
                    ratePerHour = "10.00"
                    opponentType = "cpu"
                    notes = "Test session"
                } | ConvertTo-Json

                $response = Invoke-WebRequest -Uri "$ApiUrl/api/gaming-sessions" `
                    -Method POST `
                    -Headers @{
                        "Content-Type" = "application/json"
                        "Authorization" = "Bearer $token"
                    } `
                    -Body $body `
                    -UseBasicParsing `
                    -ErrorAction SilentlyContinue

                if ($response.StatusCode -in @(200, 201)) {
                    Write-Host "    ✓ Created" -ForegroundColor Green
                } else {
                    Write-Host "    ✗ Status: $($response.StatusCode)" -ForegroundColor Red
                }
            } catch {
                Write-Host "    ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
}

# Summary
Write-Host "`n" + ("="*60) -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host ("="*60) -ForegroundColor Cyan

Write-Host "`nTest Credentials:" -ForegroundColor Cyan
foreach ($user in $TestUsers) {
    Write-Host "  Email: $($user.Email)" -ForegroundColor White
    Write-Host "  Password: $($user.Pass)" -ForegroundColor Gray
}

Write-Host "`nResources Created:" -ForegroundColor Cyan
Write-Host "  Store: Test Gaming Arena" -ForegroundColor White
Write-Host "  Stations: $($StationIds.Count)" -ForegroundColor White
Write-Host "  Gaming Sessions: 3 (one per gamer)" -ForegroundColor White

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "  1. Open http://localhost:4200 (gamer-app)" -ForegroundColor White
Write-Host "  2. Log in with: gamer1@test.com / Test@123456" -ForegroundColor White
Write-Host "  3. You should see an active gaming session" -ForegroundColor White
Write-Host "  4. Click the session to enter the portal" -ForegroundColor White
Write-Host "  5. Follow TEST_SCENARIOS.md for test cases" -ForegroundColor White

Write-Host ""
