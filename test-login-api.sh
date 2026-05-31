#!/bin/bash

echo "🧪 Testing Login Flow via API"
echo "════════════════════════════════════════════════════════════════════════════════"

# Test Admin Login
echo ""
echo "📱 Testing Admin Login"
echo "────────────────────────────────────────────────────────────────────────────────"
echo "POST /api/auth/login with admin@playground.com"

ADMIN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@playground.com",
    "password": "admin123"
  }')

echo "Response:"
echo "$ADMIN_RESPONSE" | grep -o '"success":\|"accessToken":\|"error":' | head -1

if echo "$ADMIN_RESPONSE" | grep -q '"accessToken"'; then
  echo "✅ Admin login successful"
  ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
  echo "   Token obtained: ${ADMIN_TOKEN:0:20}..."
else
  echo "❌ Admin login failed"
fi

# Test Cashier Login
echo ""
echo "📱 Testing Cashier Login"
echo "────────────────────────────────────────────────────────────────────────────────"
echo "POST /api/auth/login with cashier@playground.com"

CASHIER_RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cashier@playground.com",
    "password": "cashier123"
  }')

echo "Response:"
echo "$CASHIER_RESPONSE" | grep -o '"success":\|"accessToken":\|"error":' | head -1

if echo "$CASHIER_RESPONSE" | grep -q '"accessToken"'; then
  echo "✅ Cashier login successful"
  CASHIER_TOKEN=$(echo "$CASHIER_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
  echo "   Token obtained: ${CASHIER_TOKEN:0:20}..."
else
  echo "❌ Cashier login failed"
fi

# Test Gamer Login
echo ""
echo "📱 Testing Gamer Login"
echo "────────────────────────────────────────────────────────────────────────────────"
echo "POST /api/auth/login with gamer@playground.com"

GAMER_RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "gamer@playground.com",
    "password": "gamer123"
  }')

echo "Response:"
echo "$GAMER_RESPONSE" | grep -o '"success":\|"accessToken":\|"error":' | head -1

if echo "$GAMER_RESPONSE" | grep -q '"accessToken"'; then
  echo "✅ Gamer login successful"
  GAMER_TOKEN=$(echo "$GAMER_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
  echo "   Token obtained: ${GAMER_TOKEN:0:20}..."
else
  echo "❌ Gamer login failed"
fi

echo ""
echo "════════════════════════════════════════════════════════════════════════════════"
echo "✅ API Login Tests Complete"
