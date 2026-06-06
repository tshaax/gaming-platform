# Test Data Setup Script for Gaming Platform
# Creates users, store, stations, and gaming sessions for testing

param(
    [string]$ApiUrl = "http://localhost:8080",
    [switch]$Verbose,
    [switch]$DryRun
)

# Configuration
$TestData = @{
    Users = @(
        @{
            Name = "Gamer 1"
            Email = "gamer1@test.com"
            Cellphone = "1234567890"
            Password = "Test@123456"
        }
        @{
            Name = "Gamer 2"
            Email = "gamer2@test.com"
            Cellphone = "0987654321"
            Password = "Test@123456"
        }
        @{
            Name = "Gamer 3"
            Email = "gamer3@test.com"
            Cellphone = "5555555555"
            Password = "Test@123456"
        }
        @{
            Name = "Cashier"
            Email = "cashier@test.com"
            Cellphone = "9999999999"
            Password = "Test@123456"
        }
    )

    Store = @{
        Name = "Test Gaming Arena"
        Slug = "test-gaming-arena"
        Address = "123 Gaming Street, Test City"
        Manager = "John Manager"
        ContactPerson = "Jane Support"
        ContactPhone = "1111111111"
    }

    Stations = @(
        @{ Name = "Station 1" }
        @{ Name = "Station 2" }
        @{ Name = "Station 3" }
    )
}

# Colors for output
$Colors = @{
    Info = "Cyan"
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
}

function Write-Info { Write-Host "ℹ $args" -ForegroundColor $Colors.Info }
function Write-Success { Write-Host "✓ $args" -ForegroundColor $Colors.Success }
function Write-Error-Custom { Write-Host "✗ $args" -ForegroundColor $Colors.Error }
function Write-Warning-Custom { Write-Host "⚠ $args" -ForegroundColor $Colors.Warning }

# Make API call
function Invoke-ApiCall {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body,
        [string]$Token
    )

    $url = "$ApiUrl$Endpoint"
    $headers = @{
        "Content-Type" = "application/json"
    }

    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }

    $params = @{
        Uri = $url
        Method = $Method
        Headers = $headers
        UseBasicParsing = $true
        ErrorAction = "SilentlyContinue"
    }

    if ($Body) {
        $params["Body"] = $Body | ConvertTo-Json -Depth 10
    }

    if ($Verbose) {
        Write-Host "  → $Method $Endpoint" -ForegroundColor Gray
    }

    try {
        $response = Invoke-WebRequest @params
        $content = $response.Content | ConvertFrom-Json
        return @{
            StatusCode = $response.StatusCode
            Content = $content
            Success = $true
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.Value__
        $errorBody = $_.Exception.Response.Content.ToString()

        $errorContent = $null
        try {
            $errorContent = $errorBody | ConvertFrom-Json
        } catch {
            $errorContent = $errorBody
        }

        return @{
            StatusCode = $statusCode
            Content = $errorContent
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

# Create or get user
function Create-User {
    param([hashtable]$User, [string]$Role)

    Write-Info "Creating $Role user: $($User.Email)"

    $response = Invoke-ApiCall -Method "POST" -Endpoint "/api/auth/register" -Body @{
        email = $User.Email
        cellphone = $User.Cellphone
        password = $User.Password
    }

    if ($response.Success -and $response.StatusCode -in @(200, 201)) {
        Write-Success "$Role created: $($User.Email)"
        $userId = if ($response.Content.data.id) { $response.Content.data.id } else { $response.Content.data.userId }
        return @{
            Id = $userId
            Email = $User.Email
            Cellphone = $User.Cellphone
            Name = $User.Name
        }
    } else {
        if ($response.Content.message -like "*already exists*") {
            Write-Warning-Custom "$Role already exists: $($User.Email)"
            return @{
                Id = "existing"
                Email = $User.Email
                Name = $User.Name
            }
        } else {
            $errorMsg = if ($response.Content.message) { $response.Content.message } else { $response.Error }
            Write-Error-Custom "Failed to create $Role`: $errorMsg"
            return $null
        }
    }
}

# Login user
function Login-User {
    param([hashtable]$User)

    Write-Info "Logging in: $($User.Email)"

    $response = Invoke-ApiCall -Method "POST" -Endpoint "/api/auth/login" -Body @{
        email = $User.Email
        password = $User.Password
    }

    if ($response.Success -and $response.StatusCode -eq 200) {
        Write-Success "Logged in: $($User.Email)"
        return @{
            AccessToken = $response.Content.data.accessToken
            RefreshToken = $response.Content.data.refreshToken
            ExpiresIn = $response.Content.data.expiresIn
        }
    } else {
        $errorMsg = if ($response.Content.message) { $response.Content.message } else { $response.Error }
        Write-Error-Custom "Login failed: $errorMsg"
        return $null
    }
}

# Create store
function Create-Store {
    param([hashtable]$Store, [string]$CashierToken)

    Write-Info "Creating store: $($Store.Name)"

    $response = Invoke-ApiCall -Method "POST" -Endpoint "/api/stores" -Body $Store -Token $CashierToken

    if ($response.Success -and $response.StatusCode -in @(200, 201)) {
        Write-Success "Store created: $($Store.Name)"
        return $response.Content.data
    } else {
        $errorMsg = if ($response.Content.message) { $response.Content.message } else { $response.Error }
        Write-Error-Custom "Failed to create store: $errorMsg"
        return $null
    }
}

# Create gaming station
function Create-Station {
    param([string]$StoreId, [hashtable]$Station, [string]$Token)

    Write-Info "Creating station: $($Station.Name)"

    $response = Invoke-ApiCall -Method "POST" -Endpoint "/api/gaming-sessions/stations" `
        -Body @{
            storeId = $StoreId
            name = $Station.Name
        } -Token $Token

    if ($response.Success -and $response.StatusCode -in @(200, 201)) {
        Write-Success "Station created: $($Station.Name)"
        return $response.Content.data
    } else {
        $errorMsg = if ($response.Content.message) { $response.Content.message } else { $response.Error }
        Write-Error-Custom "Failed to create station: $errorMsg"
        return $null
    }
}

# Create gaming session
function Create-GameSession {
    param(
        [string]$StoreId,
        [string]$UserId,
        [string]$StationId,
        [string]$Token
    )

    Write-Info "Creating gaming session for user: $UserId"

    $response = Invoke-ApiCall -Method "POST" -Endpoint "/api/gaming-sessions" `
        -Body @{
            storeId = $StoreId
            userId = $UserId
            stationId = $StationId
            durationMins = 30
            ratePerHour = "10.00"
            opponentType = "cpu"
            notes = "Test session"
        } -Token $Token

    if ($response.Success -and $response.StatusCode -in @(200, 201)) {
        Write-Success "Gaming session created: $($response.Content.data.id)"
        return $response.Content.data
    } else {
        $errorMsg = if ($response.Content.message) { $response.Content.message } else { $response.Error }
        Write-Error-Custom "Failed to create gaming session: $errorMsg"
        return $null
    }
}

# Main execution
function Main {
    Write-Host "`n" + ("="*60) -ForegroundColor Cyan
    Write-Host "  Gaming Platform - Test Data Setup" -ForegroundColor Cyan
    Write-Host ("="*60) -ForegroundColor Cyan
    Write-Host ""

    if ($DryRun) {
        Write-Warning-Custom "DRY RUN MODE - No data will be created"
    }

    # Check API is running
    Write-Info "Checking API connection: $ApiUrl"
    try {
        $health = Invoke-WebRequest -Uri "$ApiUrl/health" -UseBasicParsing -ErrorAction SilentlyContinue
        Write-Success "API is running"
    } catch {
        Write-Error-Custom "Cannot connect to API at $ApiUrl"
        Write-Error-Custom "Make sure API is running: pnpm nx serve api"
        exit 1
    }

    # Create users
    Write-Host "`n--- Creating Users ---" -ForegroundColor Magenta
    $users = @{}

    foreach ($user in $TestData.Users) {
        if ($DryRun) {
            Write-Info "[DRY RUN] Would create user: $($user.Email)"
        } else {
            $createdUser = Create-User -User $user -Role "User"
            if ($createdUser) {
                $users[$user.Email] = $createdUser
            }
        }
    }

    # Get tokens for users
    Write-Host "`n--- Authenticating Users ---" -ForegroundColor Magenta
    $tokens = @{}

    foreach ($user in $TestData.Users) {
        if ($DryRun) {
            Write-Info "[DRY RUN] Would login: $($user.Email)"
        } else {
            $loginResult = Login-User -User $user
            if ($loginResult) {
                $tokens[$user.Email] = $loginResult.AccessToken
            }
        }
    }

    # Create store
    Write-Host "`n--- Creating Store ---" -ForegroundColor Magenta
    $storeId = $null
    $stationIds = @()

    if ($DryRun) {
        Write-Info "[DRY RUN] Would create store: $($TestData.Store.Name)"
        $storeId = "test-store-uuid"
    } else {
        $cashierToken = $tokens["cashier@test.com"]
        if (-not $cashierToken) {
            Write-Error-Custom "Cashier token not available"
            exit 1
        }

        $store = Create-Store -Store $TestData.Store -CashierToken $cashierToken
        if ($store) {
            $storeId = $store.id
        } else {
            Write-Error-Custom "Failed to create store"
            exit 1
        }
    }

    # Create gaming stations
    Write-Host "`n--- Creating Gaming Stations ---" -ForegroundColor Magenta
    $cashierToken = $tokens["cashier@test.com"]

    foreach ($station in $TestData.Stations) {
        if ($DryRun) {
            Write-Info "[DRY RUN] Would create station: $($station.Name)"
            $stationIds += "station-uuid"
        } else {
            $createdStation = Create-Station -StoreId $storeId -Station $station -Token $cashierToken
            if ($createdStation) {
                $stationIds += $createdStation.id
            }
        }
    }

    # Create gaming sessions
    Write-Host "`n--- Creating Gaming Sessions ---" -ForegroundColor Magenta

    if ($DryRun) {
        Write-Info "[DRY RUN] Would create gaming sessions for gamers"
    } else {
        for ($i = 0; $i -lt 3; $i++) {
            $gamerEmail = "gamer$($i+1)@test.com"
            $gamerId = $users[$gamerEmail].Id
            $stationId = $stationIds[$i % $stationIds.Count]
            $gamerToken = $tokens[$gamerEmail]

            if ($gamerId -and $stationId -and $gamerToken) {
                Create-GameSession -StoreId $storeId -UserId $gamerId -StationId $stationId -Token $gamerToken
            }
        }
    }

    # Summary
    Write-Host "`n--- Setup Summary ---" -ForegroundColor Magenta

    if ($DryRun) {
        Write-Info "DRY RUN - No data was created"
    } else {
        Write-Success "Test data setup complete!"
    }

    Write-Host ""
    Write-Host "Test Credentials:" -ForegroundColor Cyan
    foreach ($user in $TestData.Users) {
        Write-Host "  Email: $($user.Email)" -ForegroundColor Gray
        Write-Host "    Password: $($user.Password)" -ForegroundColor Gray
    }

    Write-Host ""
    Write-Host "Test Resources:" -ForegroundColor Cyan
    Write-Host "  Store: $($TestData.Store.Name)" -ForegroundColor Gray
    Write-Host "  Stations: $($TestData.Stations.Count)" -ForegroundColor Gray
    Write-Host "  Gaming Sessions: 3 (one per gamer)" -ForegroundColor Gray

    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Log in to gamer-app with: gamer1@test.com / Test@123456" -ForegroundColor Gray
    Write-Host "  2. You should see an active gaming session on the landing page" -ForegroundColor Gray
    Write-Host "  3. Click the session to enter the portal" -ForegroundColor Gray
    Write-Host "  4. Follow TEST_SCENARIOS.md for test cases" -ForegroundColor Gray

    Write-Host ""
}

# Run main
Main
