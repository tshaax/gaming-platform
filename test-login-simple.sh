#!/bin/bash

BASE_URL="http://localhost:3333/api"
TEST_EMAIL="login-test@example.com"
TEST_PASSWORD="TestPassword123!"

echo "=== Gaming Platform Login Endpoint Test ==="
echo ""

# Test login endpoint with test credentials
echo "Testing Login Endpoint"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Email:    $TEST_EMAIL"
echo "Password: $TEST_PASSWORD"
echo ""

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

echo "Response:"
echo "$LOGIN_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# Parse response
if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
  echo "✅ TEST PASSED: Login successful!"
  echo ""

  # Extract and display tokens
  echo "Tokens Issued:"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
  REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"refreshToken":"[^"]*"' | cut -d'"' -f4)
  EXPIRES_IN=$(echo "$LOGIN_RESPONSE" | grep -o '"expiresIn":[0-9]*' | cut -d':' -f2)

  if [ -n "$ACCESS_TOKEN" ]; then
    echo "Access Token:  ${ACCESS_TOKEN:0:50}..."
    echo "Token Length:  ${#ACCESS_TOKEN}"
  fi

  if [ -n "$REFRESH_TOKEN" ]; then
    echo "Refresh Token: ${REFRESH_TOKEN:0:50}..."
    echo "Token Length:  ${#REFRESH_TOKEN}"
  fi

  if [ -n "$EXPIRES_IN" ]; then
    echo "Expires In:    $EXPIRES_IN seconds ($(($EXPIRES_IN / 60)) minutes)"
  fi

  echo ""

  # Test protected endpoint with access token
  echo "Testing Protected Endpoint (/api/auth/stores)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  PROTECTED_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/stores" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

  echo "Response:"
  echo "$PROTECTED_RESPONSE" | jq . 2>/dev/null || echo "$PROTECTED_RESPONSE"
  echo ""

  if echo "$PROTECTED_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Protected endpoint access successful!"
  else
    echo "❌ Protected endpoint access failed"
  fi

else
  echo "❌ TEST FAILED: Login unsuccessful"
  echo ""

  if echo "$LOGIN_RESPONSE" | grep -q "INVALID_CREDENTIALS"; then
    echo "Error: Invalid credentials"
    echo "This likely means the seed data hasn't been loaded yet."
    echo "Run: npm run db:seed"
  elif echo "$LOGIN_RESPONSE" | grep -q "error"; then
    ERROR=$(echo "$LOGIN_RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
    echo "Error: $ERROR"
  fi
fi

echo ""
echo "=== Test Complete ==="
