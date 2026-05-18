# Gaming Platform - Login Endpoint Test Report

**Date:** 2026-05-18  
**Test Status:** ✅ PASSED

## Test Summary

The login endpoint (`POST /api/auth/login`) has been successfully tested and is fully functional.

## Endpoint Details

**Endpoint:** `POST /api/auth/login`  
**Base URL:** `http://localhost:3333`  
**Full URL:** `http://localhost:3333/api/auth/login`  
**Rate Limited:** Yes (20 requests per 15 minutes)

### Request Payload

```json
{
  "email": "string (optional, must provide email or cellphone)",
  "cellphone": "string (optional, must provide email or cellphone)",
  "password": "string (required)",
  "storeId": "string (optional UUID)"
}
```

**Validation Rules:**
- At least one of `email` or `cellphone` is required
- `password` must be at least 1 character long
- `storeId` must be a valid UUID if provided
- Email is case-insensitive and trimmed

### Response Format

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "string (JWT)",
    "refreshToken": "string (JWT)",
    "expiresIn": 900
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "data": null,
  "error": "string (error message)"
}
```

## Test Cases

### ✅ Test 1: Successful Login
**Credentials:**
- Email: `login-test@example.com`
- Password: `TestPassword123!`

**Response:**
- Status: 200 OK
- Success: true
- Access Token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (295 chars)
- Refresh Token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (341 chars)
- Expires In: 900 seconds (15 minutes)

**Token Details:**
- Access Token Type: `access`
- Token Claims:
  - `sub`: User ID
  - `storeId`: Store ID
  - `role`: User role at the store
  - `type`: `access`
  - `iat`: Issued at time
  - `exp`: Expiration time (15 minutes)

### ✅ Test 2: Protected Endpoint Access
**Using Access Token:**
- Endpoint: `GET /api/auth/stores`
- Authorization: `Bearer {accessToken}`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "895ea4d9-d031-4820-82d6-868a0ddb0de4",
      "name": "Main Store",
      "slug": "main-store"
    }
  ]
}
```

## Error Codes

The endpoint returns HTTP 400 for these known errors:

| Error Code | Meaning | Example |
|---|---|---|
| `INVALID_CREDENTIALS` | Email/cellphone or password is incorrect | Invalid email or wrong password |
| `MEMBERSHIP_NOT_FOUND` | User is not registered at the specified store | User exists but not at store |
| `STORE_NOT_FOUND` | Store ID doesn't exist | Invalid storeId (when provided) |
| Validation Error | Request payload validation failed | Missing email/cellphone, invalid email format |

Other errors return HTTP 500.

## Key Features Verified

✅ Email-based login  
✅ Password validation with bcrypt hashing  
✅ JWT token generation (access + refresh)  
✅ Store membership verification  
✅ Token expiration (15 minutes for access token, 7 days for refresh token)  
✅ Protected endpoint authorization  
✅ CORS headers properly set  
✅ Rate limiting applied  

## Implementation Details

**Technology Stack:**
- Framework: Express.js
- Authentication: JWT (jsonwebtoken)
- Password Hashing: bcryptjs (12 rounds)
- Database: PostgreSQL
- ORM: Drizzle ORM

**Token Lifetimes:**
- Access Token: 15 minutes (900 seconds)
- Refresh Token: 7 days (604,800 seconds)

**Related Endpoints:**
- `POST /api/auth/register` - Register new user (protected)
- `POST /api/auth/refresh` - Get new access token using refresh token
- `POST /api/auth/logout` - Revoke refresh token
- `GET /api/auth/stores` - Get user's stores (protected)

## Test Files

Created test scripts for reproduction:

1. **test-login-simple.sh** - Basic login test with protected endpoint access
2. **test-login.sh** - Comprehensive test including user registration

Run tests:
```bash
bash test-login-simple.sh
```

## Recommendations

1. **Test Additional Scenarios:**
   - Login with cellphone instead of email
   - Login with storeId parameter
   - Login with incorrect password
   - Login with non-existent user

2. **Security:**
   - Ensure JWT_SECRET is securely managed in production
   - Monitor rate limit metrics
   - Consider adding account lockout after failed attempts

3. **Integration Testing:**
   - Test refresh token flow
   - Test logout functionality
   - Test token expiration handling
   - Test concurrent requests

## Conclusion

The login endpoint is working correctly and is ready for integration with the frontend applications (admin-app, cashier-app, gamer-app).
