#!/bin/bash

# Gamer App Debug Helper Script
# Usage: ./debug-helper.sh [command]

set -e

API_URL="http://localhost:8080"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-gaming_platform}"
DB_USER="${DB_USER:-postgres}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if service is running
check_service() {
    local port=$1
    local name=$2
    if curl -s http://localhost:$port > /dev/null 2>&1; then
        log_success "$name is running (port $port)"
        return 0
    else
        log_error "$name is NOT running (port $port)"
        return 1
    fi
}

# Show status of all services
status() {
    log_info "Checking services..."
    check_service 8080 "API" || true
    check_service 4200 "Gamer App" || true
    check_service 4201 "Cashier App" || true
    check_service 5432 "Database" || true
}

# List active sessions
list_sessions() {
    log_info "Fetching active sessions..."
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
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
    "
}

# Show results for a session
show_results() {
    local session_id=$1
    log_info "Results for session: $session_id"
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
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
        WHERE session_id = '$session_id';
    "
}

# Clear all test data
clear_test_data() {
    log_warning "Clearing all test sessions and results..."
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
            DELETE FROM game_session_results;
            DELETE FROM gaming_sessions WHERE status = 'ended';
            COMMIT;
        "
        log_success "Test data cleared"
    else
        log_info "Cancelled"
    fi
}

# Test API endpoint
test_api() {
    local endpoint=$1
    log_info "Testing: $endpoint"

    if [ -z "$endpoint" ]; then
        log_error "Usage: $0 test-api [endpoint]"
        echo "Examples:"
        echo "  $0 test-api /health"
        echo "  $0 test-api /api/players"
        return 1
    fi

    local response=$(curl -s -w "\n%{http_code}" "$API_URL$endpoint")
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "200" ] || [ "$http_code" = "401" ]; then
        log_success "HTTP $http_code"
        echo "$body" | jq . 2>/dev/null || echo "$body"
    else
        log_error "HTTP $http_code"
        echo "$body"
    fi
}

# Show help
show_help() {
    cat << EOF
${BLUE}Gamer App Debug Helper${NC}

Usage: ./debug-helper.sh [command]

Commands:
    status              Show status of all services
    sessions            List all active gaming sessions
    results [id]        Show results for a session
    test-api [path]     Test API endpoint
    clear-test-data     Clear all test sessions/results
    help                Show this help message

Examples:
    ./debug-helper.sh status
    ./debug-helper.sh sessions
    ./debug-helper.sh results 123e4567-e89b-12d3-a456-426614174000
    ./debug-helper.sh test-api /api/players
    ./debug-helper.sh clear-test-data

Environment Variables:
    DB_HOST     Database host (default: localhost)
    DB_PORT     Database port (default: 5432)
    DB_NAME     Database name (default: gaming_platform)
    DB_USER     Database user (default: postgres)

EOF
}

# Main
case "${1:-help}" in
    status)
        status
        ;;
    sessions)
        list_sessions
        ;;
    results)
        if [ -z "$2" ]; then
            log_error "Usage: $0 results [session_id]"
            exit 1
        fi
        show_results "$2"
        ;;
    test-api)
        test_api "$2"
        ;;
    clear-test-data)
        clear_test_data
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
