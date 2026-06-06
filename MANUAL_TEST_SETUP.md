# Manual Test Data Setup Guide

Due to API auth requirements, we'll set up test data manually. Follow these steps:

## Step 1: Access the Cashier App

1. Open http://localhost:4201 (cashier-app)
2. You should see a login screen

## Step 2: Find an Existing Admin or Cashier Account

**Option A: Use existing accounts** (if available)
- Try logging in with a known cashier account
- If you have access, skip to Step 3

**Option B: Create admin via database** (if needed)
```sql
-- Check if any admin/cashier users exist:
SELECT id, email, cellphone, role FROM users u
JOIN user_store_memberships usm ON u.id = usm.user_id
WHERE usm.role IN ('admin', 'cashier')
LIMIT 1;
```

## Step 3: Create a Gaming Session (via Cashier App)

Once logged in as cashier:

1. Click the **"Gaming Session"** action card
2. Select a **Player** from the dropdown
   - If no players exist, you may need to create one first
3. Select a **Station**
4. Select **Duration** (30 minutes)
5. Click **Create Session**

This creates an active gaming session that the player can see in gamer-app!

## Step 4: Log In to Gamer App

1. Open http://localhost:4200 (gamer-app)
2. Log in with the **same email** as the player you selected in Step 3
3. You should see the active gaming session on the landing page
4. Click the session card to enter the gaming portal

## Step 5: Test the Game Flow

Now you can follow the **TEST_SCENARIOS.md** test cases!

---

## Troubleshooting

### "No players available" in cashier-app
- Players must be created with a role='gamer' in user_store_memberships
- Check: `SELECT * FROM users WHERE role = 'gamer'`

### "Can't find gaming session" in gamer-app
- Verify session exists: `SELECT * FROM gaming_sessions WHERE status = 'active'`
- Verify player is linked to the store: `SELECT * FROM user_store_memberships WHERE role = 'gamer'`

### "Invalid credentials" on login
- Ensure you're using the correct email/password combination
- Password must match what was set during user creation
- Default test password (if you created it): `Test@123456`

---

## Database Queries for Manual Verification

**Check all active sessions:**
```sql
SELECT s.id, s.game, s.status, u.email as player_email, st.name as station, s.started_at
FROM gaming_sessions s
JOIN users u ON s.user_id = u.id
JOIN gaming_stations st ON s.station_id = st.id
WHERE s.status = 'active'
ORDER BY s.started_at DESC;
```

**Check all gamers:**
```sql
SELECT u.id, u.email, u.cellphone
FROM users u
JOIN user_store_memberships usm ON u.id = usm.user_id
WHERE usm.role = 'gamer'
LIMIT 10;
```

**Check all stores:**
```sql
SELECT id, name, slug FROM stores;
```

**Check all gaming stations:**
```sql
SELECT id, name, store_id FROM gaming_stations;
```

---

## Quick Test Data Via Direct Database Insert

If you have database access and want to create test data directly:

```sql
-- 1. Create test store
INSERT INTO stores (id, name, slug, address, manager, contact_person, contact_phone)
VALUES (gen_random_uuid(), 'Test Arena', 'test-arena', '123 St', 'Manager', 'Contact', '1111111111');

-- 2. Get that store ID
SELECT id FROM stores WHERE slug = 'test-arena';
-- Copy the ID for next steps

-- 3. Create gaming station
INSERT INTO gaming_stations (id, store_id, name)
VALUES (gen_random_uuid(), 'STORE_ID_HERE', 'Test Station');

-- 4. Create test user (gamer)
INSERT INTO users (id, email, cellphone, password_hash)
VALUES (gen_random_uuid(), 'test@test.com', '5555555555', '$2b$12$...');  -- Note: need bcrypt hash
-- Password hashing is complex, better to use the API

-- 5. Link user to store as gamer
INSERT INTO user_store_memberships (user_id, store_id, role)
VALUES ('USER_ID', 'STORE_ID', 'gamer');

-- 6. Create gaming session
INSERT INTO gaming_sessions (id, store_id, user_id, station_id, duration_mins, rate_per_hour, opponent_type, status)
VALUES (gen_random_uuid(), 'STORE_ID', 'USER_ID', 'STATION_ID', 30, '10.00', 'cpu', 'active');
```

---

## Expected Flow for Testing

Once you have an active gaming session:

1. **Landing Page** → Shows active session card
2. **Click Session** → Navigates to `/portal/:storeId`
3. **Enter Game Details** → Type game name, select CPU/Opponent
4. **Save Details** → Form saves game details
5. **End Game** → Opens OCR dialog
6. **Upload/Capture** → Tesseract.js extracts stats
7. **Submit Results** → Results save to database, session ends
8. **Landing Page** → Session no longer visible

---

## Questions?

- Check **DEBUG_GUIDE.md** for detailed troubleshooting
- Check **QUICK_DEBUG_REFERENCE.md** for quick lookups
- Use `.\debug-helper.ps1` (when fixed) for database queries

