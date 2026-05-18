# Fix: Admin App Cashier API "Insufficient Permissions" Error

## Problem
The admin app returns "insufficient permissions" error when trying to access the cashier management endpoints.

## Root Cause
The admin app is missing the `storeId` parameter in the login request. When a user logs in without specifying a `storeId`, the backend uses the first store membership found, which may not have the `admin` role.

Additionally, the login component needs to handle store selection to ensure the correct role is used.

## Solution

### Step 1: Update Login Component (apps/admin-app/src/app/login/login.component.ts)

Add store selection to the login form and pass `storeId` to the login request:

```typescript
// In onSubmit() method, modify the request object to include storeId
const request = {
  email: this.credentialType() === 'email' ? email : undefined,
  cellphone: this.credentialType() === 'cellphone' ? cellphone : undefined,
  password,
  storeId: this.selectedStoreId(), // ADD THIS LINE
};
```

Add a store selector signal:
```typescript
selectedStoreId = signal<string>(''); // Add this signal
```

And add a store selection dropdown to the template (before the submit button).

### Step 2: Alternative - Update AuthService to Handle Default Store

Modify `libs/fe/auth/src/lib/auth.service.ts` to store a default store ID:

```typescript
// Add to AuthState interface
interface AuthState {
  // ... existing fields
  defaultStoreId: string | null;
}

// In storeTokens method, get the first store and store it
private storeTokens(...) {
  // After decoding JWT...
  
  // Store the storeId from the token
  this._state.set({
    // ... existing fields
    defaultStoreId: storeId ?? decoded.storeId,
  });
}
```

### Step 3: Verify Admin User Setup

The admin user must be set up correctly in the database:

```bash
# Create admin user with correct role
node -e "
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  const adminEmail = 'admin@playground.local';
  const adminPassword = 'Admin@Playground123';
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  
  // Get the main store ID first
  const storeResult = await pool.query('SELECT id FROM stores LIMIT 1');
  const storeId = storeResult.rows[0].id;
  
  // Insert admin user
  const userResult = await pool.query(
    'INSERT INTO users (email, password_hash) VALUES (\$1, \$2) RETURNING id',
    [adminEmail, passwordHash]
  );
  const userId = userResult.rows[0].id;
  
  // Add admin membership
  await pool.query(
    'INSERT INTO user_store_memberships (user_id, store_id, role) VALUES (\$1, \$2, \$3)',
    [userId, storeId, 'admin']
  );
  
  console.log('Admin user created:', adminEmail);
  await pool.end();
})();
"
```

### Step 4: Test the Flow

1. **Login to admin app** with credentials:
   - Email: `admin@playground.local`
   - Password: `Admin@Playground123`

2. **Navigate to Cashier Management**

3. **Verify the token**:
   - Open browser DevTools > Application > Local Storage
   - Find `auth_state`
   - Check that `role` is `"admin"`
   - Check that `storeId` is set

4. **Test cashier operations**:
   - Add a cashier
   - Edit a cashier
   - Delete a cashier

## Technical Details

### How It Works

1. **Login**: User logs in with email/cellphone + password
2. **Token Generation**: API returns JWT with user's role at their store
3. **Token Storage**: AuthService stores token in localStorage and state signal
4. **HTTP Interceptor**: Automatically adds `Authorization: Bearer <token>` to all requests
5. **Authorization Check**: Cashier API middleware checks if token's role is 'admin'

### Token Structure
```json
{
  "sub": "user-id",
  "storeId": "store-id", 
  "role": "admin",        // Must be 'admin' for cashier API
  "type": "access",
  "iat": 1234567890,
  "exp": 1234571490
}
```

### Cashier API Endpoint Protection
All cashier endpoints require:
- Valid JWT access token
- Token role must be `admin`

```typescript
// From libs/api/cashier/src/lib/cashier.router.ts
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  // Only admin can create cashiers
});
```

## Debugging Checklist

- [ ] Admin user exists in database with `admin` role
- [ ] Login returns token with `role: "admin"`
- [ ] localStorage has `auth_state` after login
- [ ] Browser console shows token in requests (check Network tab)
- [ ] AuthInterceptor is configured in app.config.ts
- [ ] AuthService.getAccessToken() returns a valid token

## Files Modified

- `apps/admin-app/src/app/login/login.component.ts` - Add storeId to login
- `libs/fe/auth/src/lib/auth.service.ts` - (Optional) Improve store handling

## Testing

```bash
# Test login endpoint
curl -X POST http://localhost:3333/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@playground.local",
    "password": "Admin@Playground123"
  }'

# Test cashier endpoint with token
ADMIN_TOKEN="<token-from-login>"
curl -X GET http://localhost:3333/api/cashiers \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Insufficient permissions" error | Token role is not 'admin' | Ensure user is registered with admin role in the store |
| "Invalid or expired token" | Token expired or malformed | Re-login to get a fresh token |
| Token not sent in requests | AuthInterceptor not configured | Verify app.config.ts includes authInterceptor |
| 401 Unauthorized | Missing Authorization header | Check AuthService.getAccessToken() returns value |

