# Debug Guide for Game Session Flow

## Quick Issue Diagnosis

### Issue: Landing page shows "No active gaming sessions"

**Check:**
1. Verify session was created in cashier-app
   ```sql
   SELECT id, store_id, user_id, status, started_at FROM gaming_sessions 
   WHERE user_id = 'GAMER_UUID' AND status = 'active' LIMIT 5;
   ```

2. Check browser console for API errors
   - Open DevTools (F12)
   - Go to Console tab
   - Look for red error messages

3. Test the API endpoint directly
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8080/api/gaming-sessions/user/active
   ```

4. Verify gamer is logged in
   - Check if localStorage has auth_state
   - Open DevTools → Application → Local Storage
   - Should see auth_state with accessToken, userId, storeId

---

### Issue: Game details form shows but "Save Game Details" button is disabled

**Check:**
1. Verify game name field has text
   - Click in the field and type
   - Button should enable when text is present

2. Check browser console for validation errors

3. Verify form is properly bound
   - Open DevTools → Console
   - Type: `angular.getComponent(document.querySelector('app-gaming-portal'))`
   - Check gameForm.get('gameName').value

---

### Issue: Opponent dropdown is empty or missing

**Check:**
1. Verify players exist in database
   ```sql
   SELECT id, email, cellphone FROM users 
   WHERE id IN (SELECT user_id FROM user_store_memberships WHERE role = 'gamer');
   ```

2. Verify players are linked to same store
   ```sql
   SELECT u.id, u.email, usm.store_id FROM users u
   JOIN user_store_memberships usm ON u.id = usm.user_id
   WHERE usm.store_id = 'STORE_UUID' AND usm.role = 'gamer';
   ```

3. Test the API endpoint
   ```bash
   curl -H "Authorization: Bearer TOKEN" \
     http://localhost:8080/api/players/store/STORE_UUID
   ```

4. Check Network tab in DevTools
   - Go to Network tab
   - Look for GET request to `/api/players/store/...`
   - Check response status (should be 200)
   - Verify response data has players array

---

### Issue: OCR dialog doesn't open or freezes

**Check:**
1. Verify game name is saved before ending session
   - Check session card shows game name
   - Check database: `SELECT game FROM gaming_sessions WHERE id = 'SESSION_UUID'`

2. Check for JavaScript errors
   - DevTools Console should show no red errors
   - Look for Tesseract.js loading errors

3. Test camera access
   - Browser may be blocking camera
   - Check browser notifications/permissions
   - Allow camera access if prompted

4. Verify Tesseract.js is loaded
   - DevTools Console, type: `console.log(typeof Tesseract)`
   - Should print: `object`

---

### Issue: OCR doesn't extract numbers or extracts wrong values

**Check:**
1. Verify image quality
   - Screenshot should have clear, readable text
   - Text should be black on white/light background
   - Numbers should be at least 12pt font size

2. Test OCR directly
   - DevTools Console
   - Paste this code and check extracted text:
   ```javascript
   // Replace 'imageDataUrl' with your base64 image
   Tesseract.recognize(imageDataUrl, 'eng').then(({data: {text}}) => {
     console.log('Extracted text:', text);
   });
   ```

3. Check regex parsing logic
   - If text is extracted but numbers aren't parsed
   - Text parsing happens in OcrCaptureDialogComponent.parseOcrText()
   - Sample extracted text might not match regex patterns

4. Sample image checklist
   - [ ] Has "Score" or "score" label
   - [ ] Has "Kills" or "kills" or "K"
   - [ ] Has "Deaths" or "deaths" or "D"
   - [ ] Has "Assists" or "assists" or "A"
   - [ ] Numbers are clear and unambiguous (not blurry)

---

### Issue: File upload not working

**Check:**
1. File format validation
   - Only PNG, JPG, GIF accepted
   - Check file extension before upload
   - Verify MIME type (image/png, image/jpeg, etc.)

2. File size limit
   - Max 5MB (mentioned in UI)
   - Check DevTools Network tab for upload request
   - If fails, file might be too large

3. Browser permission
   - File API might be blocked
   - DevTools Console: check for permission errors

4. Test with sample image
   - Use a simple screenshot
   - Start with known good image to verify flow

---

### Issue: Camera capture not working

**Check:**
1. Camera permission
   - Browser might be blocking access
   - Check browser address bar for camera icon
   - Click and allow camera access
   - Refresh page after allowing

2. Browser compatibility
   - Camera API requires HTTPS in production
   - HTTP works for localhost development
   - Test in latest Chrome/Firefox/Edge

3. Camera availability
   - Some systems may not have camera
   - Some browsers may have disabled it
   - Try fallback to upload mode

4. Test camera API directly
   ```javascript
   navigator.mediaDevices.getUserMedia({video: true})
     .then(stream => {
       console.log('Camera access granted');
       stream.getTracks().forEach(t => t.stop());
     })
     .catch(err => console.error('Camera error:', err));
   ```

---

### Issue: Results don't save or session doesn't end

**Check:**
1. Verify submit request in Network tab
   ```
   POST /api/gaming-sessions/SESSION_ID/results
   Status: 200
   ```

2. Check database for result record
   ```sql
   SELECT * FROM game_session_results 
   WHERE session_id = 'SESSION_UUID'
   ORDER BY created_at DESC LIMIT 1;
   ```

3. Verify session status changed to 'ended'
   ```sql
   SELECT id, status, ended_at FROM gaming_sessions 
   WHERE id = 'SESSION_UUID';
   ```

4. Check API response
   - DevTools Network tab → POST request
   - Click Response tab
   - Should show: `{"success": true, "data": {...}}`

5. Check for database errors
   - Terminal where API is running
   - Look for SQL errors or constraint violations
   - May see errors like: "foreign key violation" or "not null constraint"

---

### Issue: Opponent not being saved

**Check:**
1. Verify dropdown selection
   - Form should show selected opponent value
   - DevTools Console: `document.querySelector('select').value`
   - Should show opponent UUID

2. Check API request payload
   - Network tab → PUT /api/gaming-sessions/.../details
   - Request body should include: `"opponentUserId": "UUID"`

3. Verify database
   ```sql
   SELECT id, opponent_user_id FROM gaming_sessions 
   WHERE id = 'SESSION_UUID';
   ```

4. Check for validation errors
   - Opponent UUID must be valid (exists in users table)
   - Opponent must be different from current user
   - Opponent must be linked to same store

---

## API Response Debugging

### Test endpoints with curl

**Get active sessions:**
```bash
# Get your token from browser localStorage
TOKEN="your_access_token_here"

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/gaming-sessions/user/active | jq .
```

**Update session details:**
```bash
curl -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"game":"Test Game","opponentUserId":null}' \
  http://localhost:8080/api/gaming-sessions/SESSION_ID/details | jq .
```

**Submit result:**
```bash
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "game":"Test Game",
    "score":1000,
    "placement":1,
    "result":"win",
    "kills":10,
    "deaths":2,
    "assists":5
  }' \
  http://localhost:8080/api/gaming-sessions/SESSION_ID/results | jq .
```

---

## Browser DevTools Debugging

### Check Network Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by XHR or Fetch
4. Perform action (save details, submit result)
5. Click request in list
6. Check:
   - **Headers** → authorization token present?
   - **Request** → payload correct?
   - **Response** → status 200? error message?

### Check Application State
1. Go to Application tab
2. Local Storage → gamer-app
3. Check auth_state:
   ```json
   {
     "accessToken": "...",
     "refreshToken": "...",
     "userId": "...",
     "storeId": "...",
     "role": "gamer",
     "expiresAt": "..."
   }
   ```

### Check Console for Errors
1. Go to Console tab
2. Look for red error messages
3. Common errors:
   - `Failed to fetch` → API not running
   - `401 Unauthorized` → token expired or invalid
   - `404 Not Found` → wrong endpoint URL
   - `CORS error` → API CORS config issue

---

## Common Fixes

### "Failed to fetch" error
**Problem:** API endpoint unreachable
**Fix:**
```bash
# Verify API is running
curl http://localhost:8080/health

# If 404, API might not have health endpoint
# Just verify it's running: pnpm nx serve api
```

### "401 Unauthorized"
**Problem:** Auth token expired or invalid
**Fix:**
```javascript
// Clear auth and re-login
localStorage.removeItem('auth_state');
// Refresh page and login again
```

### "Field game is required" (500 error)
**Problem:** Game name not being sent in request
**Fix:**
- Verify game name field has value before saving
- Check DevTools Request tab payload

### "Foreign key constraint violation"
**Problem:** Opponent UUID doesn't exist
**Fix:**
```sql
-- Verify opponent exists
SELECT id FROM users WHERE id = 'OPPONENT_UUID';

-- Verify opponent is a gamer at this store
SELECT * FROM user_store_memberships 
WHERE user_id = 'OPPONENT_UUID' AND role = 'gamer';
```

### "Tesseract.js is not defined"
**Problem:** Tesseract.js didn't load
**Fix:**
```bash
# Verify package installed
npm ls tesseract.js

# Rebuild if needed
npm install
pnpm nx build gamer-app
```

---

## Database Debugging

### Quick Inspection Queries

**Check all sessions for a user:**
```sql
SELECT s.id, s.game, s.status, s.started_at, s.ended_at, st.name as station
FROM gaming_sessions s
JOIN gaming_stations st ON s.station_id = st.id
WHERE s.user_id = 'USER_UUID'
ORDER BY s.started_at DESC;
```

**Check results for a session:**
```sql
SELECT * FROM game_session_results 
WHERE session_id = 'SESSION_UUID';
```

**Check if opponent was saved:**
```sql
SELECT id, user_id, opponent_user_id, game, status
FROM gaming_sessions
WHERE opponent_user_id IS NOT NULL
LIMIT 10;
```

**Count total results:**
```sql
SELECT COUNT(*) as total_results FROM game_session_results;

SELECT COUNT(*) as total_sessions FROM gaming_sessions 
WHERE status = 'ended';
```

---

## Performance Debugging

### Slow OCR Processing
1. Check image file size (DevTools Network)
   - Large images take longer
   - Try smaller resolution images

2. Check browser tab activity
   - Other heavy tasks running?
   - Close other tabs to free up resources

3. Check Tesseract.js version
   ```javascript
   console.log('Tesseract version:', Tesseract.version);
   ```

### Slow API Requests
1. Check network latency (DevTools Network)
   - Look at "Time" column
   - Normal should be < 500ms

2. Check API server logs
   - Look for slow queries
   - Check database performance

3. Test endpoint directly
   ```bash
   time curl -H "Authorization: Bearer TOKEN" \
     http://localhost:8080/api/gaming-sessions/user/active
   ```

---

## When to Check What

| Symptom | Check First | Then Check |
|---------|------------|-----------|
| Nothing appears on landing | Browser console | DB: sessions exist? |
| Button disabled | Form value | Form validation |
| API error | Network tab | Terminal logs |
| No opponent in dropdown | Network tab → /players | DB: players exist? |
| OCR doesn't extract | Image quality | Console → Tesseract |
| Results not saved | Network response | DB: result record? |
| Camera not working | Browser permissions | DevTools console |

---

## Getting Help

When reporting an issue, include:
1. **What action** caused the issue
2. **Expected vs actual** result
3. **Browser console** errors (if any)
4. **Network tab** request/response
5. **Database query** result (if relevant)
6. **Browser/OS** you're testing on

Example:
```
Issue: Game details won't save
Action: Clicked "Save Game Details" after entering "Valorant"
Expected: Button shows loading, game name saves to form
Actual: Button is disabled, nothing happens
Console: TypeError: gameForm is undefined at line 45
Network: PUT /api/gaming-sessions/.../details - 200 OK, response shows game: null
DB: SELECT game FROM gaming_sessions WHERE id = '...' → NULL
Browser: Chrome 124 on Windows 11
```

