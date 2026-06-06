# Gamer App Debug Helper - PowerShell Version
# Usage: .\debug-helper.ps1 -Command status

param(
    [Parameter(Position = 0)]
    [ValidateSet('status', 'sessions', 'results', 'test-api', 'clear-test-data', 'help')]
    [string]$Command = 'help',

    [Parameter(Position = 1)]
    [string]$Arg1,

    [Parameter(Position = 2)]
    [string]$Arg2
)

# Configuration
$ApiUrl = "http://localhost:8080"
$DbHost = $env:DB_HOST ?? "localhost"
$DbPort = $env:DB_PORT ?? "5432"
$DbName = $env:DB_NAME ?? "gaming_platform"
$DbUser = $env:DB_USER ?? "postgres"

# Color functions
function Write-Info { Write-Host "ℹ $args" -ForegroundColor Cyan }
function Write-Success { Write-Host "✓ $args" -ForegroundColor Green }
function Write-Error-Custom { Write-Host "✗ $args" -ForegroundColor Red }
function Write-Warning-Custom { Write-Host "⚠ $args" -ForegroundColor Yellow }

# Check if service is running
function Test-Service {
    param([int]$Port, [string]$Name)
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Success "$Name is running (port $Port)"
            return $true
        }
    } catch {
        Write-Error-Custom "$Name is NOT running (port $Port)"
        return $false
    }
}

# Show service status
function Show-Status {
    Write-Info "Checking services..."
    Test-Service 8080 "API" | Out-Null
    Test-Service 4200 "Gamer App" | Out-Null
    Test-Service 4201 "Cashier App" | Out-Null

    try {
        $result = psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c "SELECT 1" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Database is running (port $DbPort)"
        } else {
            Write-Error-Custom "Database connection failed"
        }
    } catch {
        Write-Error-Custom "Database is NOT running (port $DbPort)"
    }
}

# List active sessions
function Show-Sessions {
    Write-Info "Fetching active gaming sessions..."
    psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c @"
        SELECT
            s.id,
            s.game,
            s.status,
            s.started_at,
            u.email as gamer_email,
            st.name as station
        FROM gaming_sessions s
        JOIN users u ON s.user_id = u.id
        JOIN gaming_stations st ON s.station_id = st.id
        WHERE s.status = 'active'
        ORDER BY s.started_at DESC;
"@
}

# Show results for a session
function Show-Results {
    param([string]$SessionId)

    if (-not $SessionId) {
        Write-Error-Custom "Usage: .\debug-helper.ps1 results [session_id]"
        return
    }

    Write-Info "Results for session: $SessionId"
    psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c @"
        SELECT
            game,
            score,
            placement,
            result,
            kills,
            deaths,
            assists,
            created_at
        FROM game_session_results
        WHERE session_id = '$SessionId';
"@
}

# Test API endpoint
function Test-ApiEndpoint {
    param([string]$Endpoint)

    if (-not $Endpoint) {
        Write-Error-Custom "Usage: .\debug-helper.ps1 test-api [endpoint]"
        Write-Host "Examples:"
        Write-Host "  .\debug-helper.ps1 test-api /health"
        Write-Host "  .\debug-helper.ps1 test-api /api/players"
        return
    }

    Write-Info "Testing: $Endpoint"

    try {
        $response = Invoke-WebRequest -Uri "$ApiUrl$Endpoint" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
        Write-Success "HTTP $($response.StatusCode)"
        try {
            $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
        } catch {
            Write-Host $response.Content
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.Value__
        Write-Error-Custom "HTTP $statusCode"
        $_.Exception.Message
    }
}

# Clear test data
function Clear-TestData {
    Write-Warning-Custom "Clearing all test sessions and results..."
    $confirm = Read-Host "Are you sure? (yes/no)"

    if ($confirm -eq "yes") {
        psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c @"
            DELETE FROM game_session_results;
            DELETE FROM gaming_sessions WHERE status = 'ended';
            COMMIT;
"@
        Write-Success "Test data cleared"
    } else {
        Write-Info "Cancelled"
    }
}

# Show help
function Show-Help {
    @"
$(Write-Host 'Gamer App Debug Helper - PowerShell' -ForegroundColor Cyan)

Usage: .\debug-helper.ps1 -Command <command> [args]

Commands:
    status              Show status of all services
    sessions            List all active gaming sessions
    results [id]        Show results for a session
    test-api [path]     Test API endpoint
    clear-test-data     Clear all test sessions/results
    help                Show this help message

Examples:
    .\debug-helper.ps1 -Command status
    .\debug-helper.ps1 -Command sessions
    .\debug-helper.ps1 -Command results "123e4567-e89b-12d3-a456-426614174000"
    .\debug-helper.ps1 -Command test-api "/api/players"
    .\debug-helper.ps1 -Command clear-test-data

Environment Variables:
    `$env:DB_HOST     Database host (default: localhost)
    `$env:DB_PORT     Database port (default: 5432)
    `$env:DB_NAME     Database name (default: gaming_platform)
    `$env:DB_USER     Database user (default: postgres)

Shorthand (positional arguments):
    .\debug-helper.ps1 status
    .\debug-helper.ps1 sessions
    .\debug-helper.ps1 results "session-id"
    .\debug-helper.ps1 test-api "/api/players"
"@
}

# Main
switch ($Command) {
    'status' {
        Show-Status
    }
    'sessions' {
        Show-Sessions
    }
    'results' {
        Show-Results -SessionId $Arg1
    }
    'test-api' {
        Test-ApiEndpoint -Endpoint $Arg1
    }
    'clear-test-data' {
        Clear-TestData
    }
    'help' {
        Show-Help
    }
    default {
        Write-Error-Custom "Unknown command: $Command"
        Show-Help
    }
}
