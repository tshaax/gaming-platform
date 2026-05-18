#!/bin/bash

BASE_URL="http://localhost:3333/api"
TEST_EMAIL="login-test@example.com"
TEST_PASSWORD="TestPassword123!"

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Gaming Platform - Login Endpoint Test Suite              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Helper function to make requests and parse responses
test_login() {
  local test_name=$1
  local email=$2
  local password=$3
  local store_id=$4
  local expected_success=$5

  echo -e "${BLUE}Test: $test_name${NC}"
  echo "─────────────────────────────────────────────────────────────"

  local payload="{\"email\": \"$email\", \"password\": \"$password\""
  if [ -n "$store_id" ]; then
    payload="$payload, \"storeId\": \"$store_id\""
  fi
  payload="$payload}"

  local response=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "$payload")

  local success=$(echo "$response" | grep -o '"success":[^,}]*' | cut -d':' -f2)
  local error=$(echo "$response" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)

  if [ "$success" = "true" ] && [ "$expected_success" = "true" ]; then
    echo -e "${GREEN}✅ PASS${NC}: Login successful"
    local access_token=$(echo "$response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    local expires_in=$(echo "$response" | grep -o '"expiresIn":[0-9]*' | cut -d':' -f2)
    echo "   Access Token: ${access_token:0:40}..."
    echo "   Expires In: $expires_in seconds"
  elif [ "$success" = "false" ] && [ "$expected_success" = "false" ]; then
    echo -e "${GREEN}✅ PASS${NC}: Login correctly rejected"
    echo "   Error: $error"
  else
    echo -e "${RED}❌ FAIL${NC}: Unexpected result (expected_success=$expected_success, success=$success)"
    echo "   Response: $response"
  fi
  echo ""
}

# Test scenarios
echo -e "${YELLOW}Scenario 1: Valid Credentials${NC}"
echo "============================================================="
test_login "Valid email and password" "$TEST_EMAIL" "$TEST_PASSWORD" "" "true"

echo -e "${YELLOW}Scenario 2: Invalid Credentials${NC}"
echo "============================================================="
test_login "Wrong password" "$TEST_EMAIL" "WrongPassword" "" "false"
test_login "Non-existent user" "nonexistent@example.com" "AnyPassword123" "" "false"
test_login "Empty password" "$TEST_EMAIL" "" "" "false"
test_login "Empty email" "" "$TEST_PASSWORD" "" "false"

echo -e "${YELLOW}Scenario 3: Payload Validation${NC}"
echo "============================================================="

echo "Test: Missing email and cellphone"
echo "─────────────────────────────────────────────────────────────"
response=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"password": "SomePassword"}')
if echo "$response" | grep -q "email.*cellphone"; then
  echo -e "${GREEN}✅ PASS${NC}: Validation error for missing email/cellphone"
else
  echo -e "${RED}❌ FAIL${NC}: Expected validation error"
fi
echo ""

echo "Test: Invalid email format"
echo "─────────────────────────────────────────────────────────────"
response=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid-email", "password": "SomePassword"}')
if echo "$response" | grep -q "error"; then
  echo -e "${GREEN}✅ PASS${NC}: Validation error for invalid email format"
else
  echo -e "${RED}❌ FAIL${NC}: Expected validation error"
fi
echo ""

echo -e "${YELLOW}Scenario 4: Token Usage${NC}"
echo "============================================================="

echo "Test: Using access token for protected endpoint"
echo "─────────────────────────────────────────────────────────────"
login_response=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$TEST_EMAIL\", \"password\": \"$TEST_PASSWORD\"}")

access_token=$(echo "$login_response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -n "$access_token" ]; then
  protected_response=$(curl -s -X GET "$BASE_URL/auth/stores" \
    -H "Authorization: Bearer $access_token")

  if echo "$protected_response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ PASS${NC}: Protected endpoint accessible with access token"
    echo "   Stores returned: $(echo "$protected_response" | grep -o '"name":"[^"]*"' | wc -l)"
  else
    echo -e "${RED}❌ FAIL${NC}: Could not access protected endpoint"
  fi
else
  echo -e "${RED}❌ FAIL${NC}: Could not obtain access token"
fi
echo ""

echo "Test: Invalid/missing authorization header"
echo "─────────────────────────────────────────────────────────────"
response=$(curl -s -X GET "$BASE_URL/auth/stores" \
  -H "Authorization: Bearer invalid_token_here")

if echo "$response" | grep -q "error"; then
  echo -e "${GREEN}✅ PASS${NC}: Protected endpoint correctly rejected invalid token"
else
  echo -e "${RED}❌ FAIL${NC}: Should have rejected invalid token"
fi
echo ""

echo "Test: No authorization header"
echo "─────────────────────────────────────────────────────────────"
response=$(curl -s -X GET "$BASE_URL/auth/stores")

if echo "$response" | grep -q "error"; then
  echo -e "${GREEN}✅ PASS${NC}: Protected endpoint correctly rejected missing authorization"
else
  echo -e "${RED}❌ FAIL${NC}: Should have rejected missing authorization"
fi
echo ""

echo -e "${YELLOW}Scenario 5: Response Format${NC}"
echo "============================================================="

echo "Test: Response structure for successful login"
echo "─────────────────────────────────────────────────────────────"
response=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$TEST_EMAIL\", \"password\": \"$TEST_PASSWORD\"}")

has_success=$(echo "$response" | grep -c '"success"')
has_data=$(echo "$response" | grep -c '"data"')
has_access_token=$(echo "$response" | grep -c '"accessToken"')
has_refresh_token=$(echo "$response" | grep -c '"refreshToken"')
has_expires_in=$(echo "$response" | grep -c '"expiresIn"')

if [ $has_success -eq 1 ] && [ $has_data -eq 1 ] && [ $has_access_token -eq 1 ] && [ $has_refresh_token -eq 1 ] && [ $has_expires_in -eq 1 ]; then
  echo -e "${GREEN}✅ PASS${NC}: Response has all required fields"
  echo "   - success ✓"
  echo "   - data ✓"
  echo "   - data.accessToken ✓"
  echo "   - data.refreshToken ✓"
  echo "   - data.expiresIn ✓"
else
  echo -e "${RED}❌ FAIL${NC}: Response missing required fields"
fi
echo ""

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Test Suite Complete                                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
