#!/bin/bash

BASE_URL="http://localhost:3333/api"
TEST_EMAIL="testuser@example.com"
TEST_PASSWORD="TestPassword123"
STORE_ID="00000000-0000-0000-0000-000000000000"  # We'll get the real one from the API

echo "=== Gaming Platform Login Endpoint Test ==="
echo ""

# Step 1: Try to get stores first
echo "Step 1: Fetching available stores..."
STORES_RESPONSE=$(curl -s "$BASE_URL/stores")
echo "Response: $STORES_RESPONSE"
echo ""

# Extract first store ID if available (or use default)
STORE_ID=$(echo "$STORES_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -z "$STORE_ID" ]; then
  STORE_ID="00000000-0000-0000-0000-000000000000"
  echo "No stores found, using default ID: $STORE_ID"
else
  echo "Using store ID: $STORE_ID"
fi
echo ""

# Step 2: Register a test user
echo "Step 2: Registering test user..."
echo "Email: $TEST_EMAIL"
echo "Password: $TEST_PASSWORD"
echo "Store ID: $STORE_ID"
echo ""

REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"storeId\": \"$STORE_ID\",
    \"role\": \"gamer\"
  }")

echo "Register Response:"
echo "$REGISTER_RESPONSE" | jq . 2>/dev/null || echo "$REGISTER_RESPONSE"
echo ""

# Check if registration was successful
if echo "$REGISTER_RESPONSE" | grep -q '"success":true'; then
  echo "✓ User registration successful"
  # Extract tokens
  ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
  REFRESH_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"refreshToken":"[^"]*"' | cut -d'"' -f4)
  echo "Access Token: ${ACCESS_TOKEN:0:20}..."
  echo "Refresh Token: ${REFRESH_TOKEN:0:20}..."
else
  echo "✗ User registration failed"
  # Check if user already exists
  if echo "$REGISTER_RESPONSE" | grep -q "USER_EXISTS"; then
    echo "User already exists, proceeding to login test..."
  else
    exit 1
  fi
fi
echo ""

# Step 3: Test login endpoint
echo "Step 3: Testing login endpoint..."
echo "Email: $TEST_EMAIL"
echo "Password: $TEST_PASSWORD"
echo ""

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"storeId\": \"$STORE_ID\"
  }")

echo "Login Response:"
echo "$LOGIN_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# Check if login was successful
if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
  echo "✓ Login successful!"
  ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
  REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"refreshToken":"[^"]*"' | cut -d'"' -f4)
  EXPIRES_IN=$(echo "$LOGIN_RESPONSE" | grep -o '"expiresIn":[0-9]*' | cut -d':' -f2)

  echo "  Access Token: ${ACCESS_TOKEN:0:30}..."
  echo "  Expires In: $EXPIRES_IN seconds"
  echo ""

  # Step 4: Test using the access token to access protected endpoint
  echo "Step 4: Testing protected endpoint (/api/auth/stores) with access token..."
  STORES_AUTH_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/stores" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

  echo "Protected Endpoint Response:"
  echo "$STORES_AUTH_RESPONSE" | jq . 2>/dev/null || echo "$STORES_AUTH_RESPONSE"
  echo ""

  if echo "$STORES_AUTH_RESPONSE" | grep -q '"success":true'; then
    echo "✓ Protected endpoint access successful!"
  else
    echo "✗ Protected endpoint access failed"
  fi
else
  echo "✗ Login failed"
  if echo "$LOGIN_RESPONSE" | grep -q "INVALID_CREDENTIALS"; then
    echo "Error: Invalid credentials"
  elif echo "$LOGIN_RESPONSE" | grep -q "MEMBERSHIP_NOT_FOUND"; then
    echo "Error: User not registered at this store"
  fi
fi
echo ""

echo "=== Test Complete ==="
