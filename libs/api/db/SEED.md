# Database Seed Script

This document explains how to generate test accounts for testing the gaming platform apps.

## Running the Seed Script

Before running the seed script, ensure:
1. PostgreSQL is running
2. Your database is created
3. Database migrations have been applied (if any)
4. `DATABASE_URL` environment variable is set

From the root of the project, run:

```bash
npm run db:seed
```

Or with yarn:
```bash
yarn db:seed
```

## Generated Test Accounts

The seed script creates three test accounts, one for each role:

### Admin Account
- **Email:** `admin@playground.com`
- **Phone:** `+1-555-0001`
- **Password:** `admin123`
- **Role:** Admin
- **Use in:** Admin Portal (`admin-app`)

### Cashier Account
- **Email:** `cashier@playground.com`
- **Phone:** `+1-555-0002`
- **Password:** `cashier123`
- **Role:** Cashier
- **Use in:** Cashier App (`cashier-app`)

### Gamer Account
- **Email:** `gamer@playground.com`
- **Phone:** `+1-555-0003`
- **Password:** `gamer123`
- **Role:** Gamer
- **Use in:** Gamer App (`gamer-app`)

## Testing the Apps

### 1. Admin App
- Navigate to `http://localhost:4201/login`
- Login with:
  - Email: `admin@playground.com`
  - Password: `admin123`

### 2. Cashier App
- Navigate to `http://localhost:4202/login`
- Login with:
  - Email: `cashier@playground.com`
  - Password: `cashier123`

### 3. Gamer App
- Navigate to `http://localhost:4203/login`
- Login with:
  - Email: `gamer@playground.com`
  - Password: `gamer123`

## Alternative Login Methods

All accounts can also login using their phone numbers instead of email:

- Admin: `+1-555-0001`
- Cashier: `+1-555-0002`
- Gamer: `+1-555-0003`

## Notes

- The seed script uses `onConflictDoNothing` to prevent errors if accounts already exist
- All accounts are automatically linked to the "Test Store" created during seeding
- Passwords are hashed using bcryptjs with 12 rounds
- The script is idempotent and can be run multiple times safely
