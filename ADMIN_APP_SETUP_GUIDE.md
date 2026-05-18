# Admin App Setup & Testing Guide

## Quick Start

### 1. Admin User Credentials

Use the following credentials to login to the admin app:

```
Email:    admin@playground.local
Password: Admin@Playground123
```

These credentials grant `admin` role access to all cashier management APIs.

### 2. Login to Admin App

1. Navigate to `http://localhost:4200` (admin app)
2. Click the **Email** tab (default)
3. Enter: `admin@playground.local`
4. Enter password: `Admin@Playground123`
5. Click **Login**

### 3. Test Cashier Management

Once logged in:

1. Click on **Cashiers** in the sidebar
2. Click **Add Cashier** button
3. Fill in the form with test cashier data:
   - First Name: John
   - Last Name: Doe
   - Email: john.doe@test.com
   - Phone: +1-555-1234567
   - Assign to Store: Main Store
   - Initial Password: TestPassword123
4. Click **Add Cashier**

Expected result: ✅ Success message appears

### 4. Verify Network Requests

1. Open browser **DevTools** (F12)
2. Go to **Network** tab
3. Filter by `cashiers`
4. Try to add/edit a cashier
5. Click on the POST request
6. Go to **Headers** tab
7. Verify **Authorization** header contains:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

If Authorization header is missing, the interceptor is not working correctly.

### 5. Verify Token Storage

1. Open browser **DevTools** (F12)
2. Go to **Application** tab
3. Click **Local Storage**
4. Click on the admin app URL
5. Find `auth_state` entry
6. Verify it contains:
   ```json
   {
     "accessToken": "...",
     "refreshToken": "...",
     "userId": "...",
     "storeId": "895ea4d9-d031-4820-82d6-868a0ddb0de4",
     "role": "admin",
     "expiresAt": 1779066533000,
     "email": "admin@playground.local"
   }
   ```

### 6. Test Protected Operations

#### Add Cashier
```
Expected: 201 Created
Response: { "success": true, "data": { "id": "...", ... } }
```

#### List Cashiers
```
Expected: 200 OK
Response: { "success": true, "data": [ { "id": "...", ... } ] }
```

#### Edit Cashier
```
Expected: 200 OK
Response: { "success": true, "data": { "id": "...", ... } }
```

#### Delete Cashier
```
Expected: 200 OK
Response: { "success": true, "message": "Cashier deleted successfully" }
```

## Troubleshooting

### Issue: "Insufficient permissions" Error

**Symptoms:**
- Cashier operations return 403 error
- Error message: "Insufficient permissions"

**Causes & Solutions:**

1. **Wrong Role in Token**
   - Check: Browser DevTools → Application → Local Storage → auth_state
   - Verify: `"role": "admin"`
   - If not: Re-login with `admin@playground.local` credentials

2. **Token Not Sent in Requests**
   - Check: Browser DevTools → Network → POST request
   - Go to Headers tab
   - Verify: `Authorization: Bearer ...` header exists
   - If missing: AuthInterceptor not configured (check app.config.ts)

3. **Admin User Not Set Up**
   - Run the setup script:
   ```bash
   node -e "
   const bcrypt = require('bcryptjs');
   const { Pool } = require('pg');
   const pool = new Pool({ connectionString: process.env.DATABASE_URL });
   
   (async () => {
     const passwordHash = await bcrypt.hash('Admin@Playground123', 12);
     const stores = await pool.query('SELECT id FROM stores LIMIT 1');
     const storeId = stores.rows[0].id;
     
     const user = await pool.query(
       'INSERT INTO users (email, password_hash) VALUES (\$1, \$2) RETURNING id',
       ['admin@playground.local', passwordHash]
     );
     
     await pool.query(
       'INSERT INTO user_store_memberships (user_id, store_id, role) VALUES (\$1, \$2, \$3)',
       [user.rows[0].id, storeId, 'admin']
     );
     
     console.log('✅ Admin user setup complete');
     await pool.end();
   })();
   "
   ```

### Issue: "Invalid or expired token" Error

**Symptoms:**
- 401 Unauthorized error
- Error message: "Invalid or expired token"

**Solutions:**

1. **Token Expired**
   - Tokens expire after 15 minutes
   - Solution: Re-login to get a fresh token
   - Auto-refresh should happen automatically via refresh token

2. **JWT Secret Mismatch**
   - Check .env file has `JWT_SECRET` set
   - Verify API is using same secret
   - Ensure database tokens are valid

### Issue: "Missing or malformed Authorization header" Error

**Symptoms:**
- 401 Unauthorized error
- Error message: "Missing or malformed Authorization header"

**Causes:**

1. **AuthInterceptor Not Configured**
   - Check: `apps/admin-app/src/app/app.config.ts`
   - Should have: `withInterceptors([authInterceptor])`
   - If missing: Add it to `provideHttpClient()`

2. **Token Not Stored**
   - Check: Browser LocalStorage `auth_state`
   - If empty: LoginComponent not storing tokens correctly
   - Solution: Verify AuthService.storeTokens() is called

## API Endpoints Overview

### Auth Endpoints
- `POST /api/auth/login` - Login with email/cellphone + password
- `POST /api/auth/refresh` - Get new access token using refresh token
- `POST /api/auth/logout` - Revoke refresh token
- `GET /api/auth/stores` - Get user's stores (requires auth)

### Cashier Endpoints (Require admin role)
- `POST /api/cashiers` - Create cashier
- `GET /api/cashiers` - List all cashiers
- `GET /api/cashiers/:storeId` - Get cashiers by store
- `PUT /api/cashiers/:id` - Update cashier
- `DELETE /api/cashiers/:id` - Delete cashier

## Token Lifecycle

1. **Login**: User provides credentials
2. **Token Generation**: API generates access token (15 min) + refresh token (7 days)
3. **Token Storage**: AuthService stores both tokens in localStorage
4. **Token Usage**: AuthInterceptor adds access token to all requests
5. **Token Refresh**: When access token expires, interceptor automatically uses refresh token
6. **Token Revocation**: Logout endpoint revokes refresh token

## Architecture

```
Login Component
    ↓
AuthService.login()
    ↓
API: /api/auth/login
    ↓
AuthService.storeTokens()
    ↓
localStorage.auth_state
    ↓
AuthInterceptor (every HTTP request)
    ↓
Authorization: Bearer <token>
    ↓
API Middleware (authenticate + requireRole)
    ↓
Success ✅ or Error ❌
```

## Development Mode Setup

For development, you may want to configure the rate limiter:

```bash
# In .env file
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # Allow 100 requests per window

# Or disable for development:
# RATE_LIMIT_MAX_REQUESTS=999999
```

## Security Notes

- Access tokens expire after 15 minutes
- Refresh tokens expire after 7 days  
- Tokens are JWT signed with HS256
- Passwords are hashed with bcryptjs (12 rounds)
- Tokens are stored in localStorage (vulnerable to XSS)
  - Consider moving to secure HttpOnly cookie in production
- Rate limiting is enabled on auth endpoints

## Contact

For issues or questions about the authentication system:
1. Check the test reports: `LOGIN_ENDPOINT_TEST_REPORT.md`
2. Check the fix guide: `FIX_ADMIN_APP_CASHIER_ERROR.md`
3. Review token claims in browser DevTools
