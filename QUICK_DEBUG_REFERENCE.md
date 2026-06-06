# Quick Debug Reference Card

## 🚀 One-Minute Diagnostics

### "Nothing is working"
```powershell
# 1. Check all services are running
.\debug-helper.ps1 status

# 2. Check for active sessions
.\debug-helper.ps1 sessions

# 3. Check API directly
.\debug-helper.ps1 test-api "/api/gaming-sessions/user/active"
```

### "Login works but no sessions appear"
```sql
-- Check sessions exist in DB
SELECT COUNT(*) FROM gaming_sessions WHERE status = 'active';

-- Check current user ID matches
SELECT id, email FROM users WHERE email = 'your-email@test.com';
```

### "Save button is disabled"
- [ ] Type something in the game name field
- [ ] If still disabled: Check browser console (F12 → Console tab)
- [ ] Look for errors like "gameForm is undefined"

### "OCR isn't working"
1. Check console: `typeof Tesseract` should return `"object"`
2. If undefined: `npm install tesseract.js` and rebuild
3. Test with clear, high-contrast text image (black text on white)

### "Results didn't save"
```powershell
# Check if result record was created
.\debug-helper.ps1 results "your-session-id"

# If empty, check API response in Network tab (F12)
# Should show: {"success": true, "data": {...}}
```

---

## 🔍 Browser DevTools Essentials

### Monitor These 3 Things While Testing

**1. Console Tab (F12)**
- Errors appear in red
- Look for: "404", "401", "TypeError", "Cannot read"
- Run command: `localStorage.getItem('auth_state')`

**2. Network Tab (F12)**
- Filter by XHR/Fetch
- Perform action (save, submit)
- Click request → check Response status and body

**3. Application Tab (F12)**
- Local Storage → gamer-app
- Verify `auth_state` exists
- Check `userId` and `storeId` are present

---

## 📊 Database Queries (Copy-Paste Ready)

### Check if sessions exist
```sql
SELECT s.id, s.game, s.status, u.email, st.name 
FROM gaming_sessions s
JOIN users u ON s.user_id = u.id
JOIN gaming_stations st ON s.station_id = st.id
WHERE s.status = 'active'
LIMIT 10;
```

### Check if results were saved
```sql
SELECT * FROM game_session_results 
ORDER BY created_at DESC LIMIT 5;
```

### Check specific session
```sql
SELECT * FROM gaming_sessions 
WHERE id = 'YOUR_SESSION_ID_HERE';
```

### Check all users
```sql
SELECT id, email, cellphone FROM users LIMIT 10;
```

### Check user-store membership
```sql
SELECT u.email, usm.role, s.name as store
FROM user_store_memberships usm
JOIN users u ON usm.user_id = u.id
JOIN stores s ON usm.store_id = s.id
LIMIT 10;
```

---

## 🔧 Quick Fixes

| Problem | Quick Fix |
|---------|-----------|
| "401 Unauthorized" | Clear localStorage: `localStorage.clear()`, reload, login again |
| "404 Not Found" | Check API is running: `.\debug-helper.ps1 status` |
| "Cannot read property" | Check browser console, look at line number in error |
| OCR very slow | Reload page, try smaller image |
| Camera not working | Refresh page, check browser permissions |
| Button stays disabled | Type text in game name field, verify 1+ characters |
| Results blank form | That's OK - just manually fill in values |

---

## 📱 Testing Checklist

### Before Starting
- [ ] API running at localhost:8080
- [ ] Gamer App running at localhost:4200
- [ ] Cashier App running at localhost:4201 (if creating sessions)
- [ ] All 3 services show in `.\debug-helper.ps1 status`

### During Testing
- [ ] Keep DevTools open (F12)
- [ ] Check Console after each action
- [ ] Watch Network tab for requests
- [ ] Note any red errors

### After Testing
- [ ] Query database to verify data saved
- [ ] Check session status changed to 'ended'
- [ ] Verify results in game_session_results table

---

## 🆘 Getting Help - What to Include

When something breaks, have ready:

1. **Screenshot** of the problem
2. **Console error** (if any) - copy the red text
3. **Network tab** - show HTTP status code and response
4. **Database query result** - what's actually in the DB
5. **Steps to reproduce** - what did you click/enter

Example:
```
ISSUE: Save button won't respond
STEPS: Typed "Valorant" in game field, clicked Save
ERROR: Console shows TypeError: cannot read property 'updateSessionDetails' of undefined
NETWORK: PUT /api/gaming-sessions/uuid/details returns 200 OK
DB: SELECT game FROM gaming_sessions WHERE id='...' → NULL (not saved)
```

---

## 🎯 Success Indicators

### Landing Page ✓
- [ ] Shows "Welcome, [email]"
- [ ] Shows session card with store name, station, duration
- [ ] Game field shows "Not set" or actual game name

### Portal ✓
- [ ] Store name and station visible at top
- [ ] Session card shows all details
- [ ] Game name form is editable

### Save Details ✓
- [ ] Button changes to "Saving..." state
- [ ] Button returns to normal
- [ ] Game name updates in session card

### OCR Dialog ✓
- [ ] Opens when "End Game" clicked
- [ ] Two tabs visible: Camera, Upload
- [ ] Form fields pre-filled (or empty)

### Result Submission ✓
- [ ] Form submits (no error)
- [ ] Dialog closes
- [ ] Back to landing page
- [ ] Previous session no longer visible
- [ ] Database has result record

---

## 📞 Common Error Messages & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Failed to fetch` | API not running | Run `pnpm nx serve api` |
| `401 Unauthorized` | Bad token | Clear localStorage, re-login |
| `404 Not Found` | Wrong endpoint | Check API URL in environment.ts |
| `Cannot read property 'game'` | Form not initialized | Reload page |
| `Tesseract is not defined` | Library not loaded | `npm install tesseract.js` |
| `CORS error` | API CORS config | Check API CORS middleware |
| `File type not allowed` | Wrong image format | Use PNG, JPG, or GIF |
| `Foreign key violation` | Opponent UUID invalid | Use valid user ID |

---

## 🎮 Testing Workflow

### 5-Minute Happy Path Test
```
1. Cashier creates session for Gamer 1 (30 min)
2. Gamer logs in → sees session on landing
3. Click session → portal opens
4. Type "Test Game" → save
5. Click "End Game" → OCR dialog
6. Skip OCR → submit empty result
7. Verify landing shows no sessions
8. DB query: game_session_results has 1 record
✓ PASS
```

### 15-Minute Full Test
```
1. Same as above, but:
5. Click "End Game" → OCR dialog
6. Upload screenshot with numbers
7. Verify form pre-filled with extracted values
8. Edit score, select "Win", submit
9. DB query: result has all fields populated
✓ PASS
```

### With Opponent Test
```
1. Cashier creates session for Gamer 1
2. Gamer logs in → portal
3. Type "Valorant" → select "Other Player" → choose Gamer 2
4. Save details
5. End game → submit result
6. DB query: opponent_user_id is Gamer 2's UUID
✓ PASS
```

---

## 🆘 If Something Breaks

**Step 1: Identify where**
- Landing page issue? → Check API endpoint
- Portal issue? → Check session data
- OCR issue? → Check Tesseract.js console

**Step 2: Check the basics**
```powershell
# Is API running?
.\debug-helper.ps1 status

# Do sessions exist?
.\debug-helper.ps1 sessions

# What's in the database?
.\debug-helper.ps1 results "session-id"
```

**Step 3: Check the logs**
- Browser Console (F12)
- Network tab (F12)
- API terminal output
- Database (psql query)

**Step 4: Isolate the issue**
- Test API endpoint directly
- Verify data is in database
- Check form state in DevTools
- Run minimal reproduction

**Step 5: Fix and retry**
- Most issues are fixed by reloading
- If not, clear localStorage and re-login
- Last resort: restart API and rebuild

