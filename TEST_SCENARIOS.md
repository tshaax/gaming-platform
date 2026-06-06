# Game Session Flow - Test Scenarios

## Prerequisites
- API running: `pnpm nx serve api`
- Gamer-app running: `pnpm nx serve gamer-app` (http://localhost:4200)
- Cashier-app running: `pnpm nx serve cashier-app` (http://localhost:4201)
- Database with test data

### Test Data Setup

**Create test users via API or cashier-app:**
1. Gamer 1: email: `gamer1@test.com` / cellphone: `1234567890`
2. Gamer 2: email: `gamer2@test.com` / cellphone: `0987654321`
3. Cashier: email: `cashier@test.com` / cellphone: `5555555555`

**Create test store:**
- Name: "Test Gaming Arena"
- Slug: "test-arena"

**Create gaming station:**
- Name: "Station 1"
- Store: Test Gaming Arena

---

## Test Scenario 1: Complete Game Session (CPU Mode)

### Setup
1. Log in to cashier-app as cashier
2. Create a gaming session for Gamer 1:
   - Store: Test Gaming Arena
   - Player: Gamer 1
   - Station: Station 1
   - Duration: 30 minutes
   - Rate: $10/hour

### Test Flow
1. **Landing Page**
   - [ ] Log in to gamer-app as Gamer 1
   - [ ] Verify landing shows "Welcome, gamer1@test.com"
   - [ ] Verify session card displays:
     - [ ] Store name: "Test Gaming Arena"
     - [ ] Station: "Station 1"
     - [ ] Duration: "30 min"
     - [ ] Game: "Not set"
   - [ ] Click "Continue Playing" button

2. **Gaming Portal**
   - [ ] Verify page shows store name and station
   - [ ] Verify session card shows all details
   - [ ] Verify game form displays

3. **Game Details Form**
   - [ ] Enter game name: "Counter-Strike 2"
   - [ ] Select "CPU / Practice" radio button
   - [ ] Verify opponent dropdown is NOT visible
   - [ ] Click "Save Game Details"
   - [ ] Verify loading spinner appears
   - [ ] Verify game name updates in session card to "Counter-Strike 2"

4. **OCR Result Capture - Upload Mode**
   - [ ] Click "End Game & Capture Results"
   - [ ] Verify OCR dialog opens
   - [ ] Verify dialog shows "Counter-Strike 2" in header
   - [ ] Click "Upload" tab
   - [ ] Upload a screenshot with game stats (see sample image below)
   - [ ] Verify progress bar shows OCR processing (0-100%)
   - [ ] Verify form fields are pre-filled:
     - [ ] Score: extracted number
     - [ ] Kills: extracted number
     - [ ] Deaths: extracted number
     - [ ] Assists: extracted number
   - [ ] Manually edit score to 1500 (to verify manual override works)
   - [ ] Select result: "Win" 🏆
   - [ ] Click "Save Result"
   - [ ] Verify dialog closes and user returns to landing page

5. **Post-Session Verification**
   - [ ] Landing page no longer shows the session (session ended)
   - [ ] Check database: `SELECT * FROM game_session_results WHERE game = 'Counter-Strike 2'`
   - [ ] Verify result record contains:
     - [ ] game: "Counter-Strike 2"
     - [ ] score: 1500 (manually edited)
     - [ ] result: "win"
     - [ ] kills, deaths, assists from OCR

---

## Test Scenario 2: Game Session with Opponent

### Setup
1. Create gaming session for Gamer 1 (same as Scenario 1)

### Test Flow
1. **Gaming Portal**
   - [ ] Log in to gamer-app as Gamer 1
   - [ ] Select the active session

2. **Game Details Form**
   - [ ] Enter game name: "Valorant"
   - [ ] Select "Other Player" radio button
   - [ ] Verify opponent dropdown appears
   - [ ] Verify dropdown lists other players (should include Gamer 2 if linked to same store)
   - [ ] Select "gamer2@test.com" from dropdown
   - [ ] Click "Save Game Details"
   - [ ] Verify both game name and opponent are saved

3. **Result Capture - Camera Mode**
   - [ ] Click "End Game & Capture Results"
   - [ ] Click "Camera" tab
   - [ ] Click "Start Camera"
   - [ ] Verify video preview appears
   - [ ] Allow camera access when prompted
   - [ ] Point camera at a screen displaying game stats
   - [ ] Click "Capture"
   - [ ] Verify progress bar shows OCR processing
   - [ ] Verify stats are extracted from live camera feed
   - [ ] Verify camera stops after capture
   - [ ] Fill in any missing fields
   - [ ] Select result: "Loss" 😔
   - [ ] Click "Save Result"

4. **Post-Session Verification**
   - [ ] Check database for opponent_user_id was saved
   - [ ] Query: `SELECT * FROM gaming_sessions WHERE game = 'Valorant' AND opponent_user_id IS NOT NULL`

---

## Test Scenario 3: OCR Text Parsing

### Sample Screenshot Text (for testing OCR extraction)

Create a test image with this text and upload:
```
GAME STATS
Score: 2450
Kills: 15
Deaths: 3
Assists: 8
Placement: 1st
Result: WIN
```

### Expected OCR Extraction
- [ ] Score: 2450
- [ ] Kills: 15
- [ ] Deaths: 3
- [ ] Assists: 8
- [ ] Placement: 1
- [ ] Result: win

### Test Alternative Text Formats
Upload screenshots with variations:

**Format 2:**
```
k: 12 | d: 5 | a: 6
Score: 1800
Place: 2nd
Victory!
```
- [ ] Should extract: kills=12, deaths=5, assists=6, score=1800, placement=2, result=win

**Format 3:**
```
DEFEAT
Your Score: 950
Eliminations: 4
Deaths: 8
Support: 2
Rank: 5th
```
- [ ] Should extract: score=950, kills=4, deaths=8, assists=2, placement=5, result=loss

---

## Test Scenario 4: Skip Without Capture

### Setup
1. Create gaming session for Gamer 1

### Test Flow
1. **Gaming Portal**
   - [ ] Enter game name: "League of Legends"
   - [ ] Save details

2. **OCR Dialog**
   - [ ] Click "End Game & Capture Results"
   - [ ] Verify form shows "League of Legends" in game field
   - [ ] Click "Skip" button
   - [ ] Verify dialog closes

3. **Verification**
   - [ ] Landing page is shown
   - [ ] Check database: session should be ended with status='ended'
   - [ ] Query: `SELECT * FROM gaming_sessions WHERE game = 'League of Legends' AND status = 'ended'`
   - [ ] Verify NO record in game_session_results table for this session

---

## Test Scenario 5: Error Handling

### Invalid Game Name
1. **Gaming Portal**
   - [ ] Leave game name empty
   - [ ] Verify "Save Game Details" button is DISABLED (grayed out)
   - [ ] Verify "End Game & Capture Results" button is DISABLED
   - [ ] Enter game name: "Dota 2"
   - [ ] Buttons should now be ENABLED

### Camera Permission Denied
1. **OCR Dialog - Camera Mode**
   - [ ] Click "Start Camera"
   - [ ] Deny camera permission when prompted
   - [ ] Verify alert message appears: "Could not access camera. Please check permissions."
   - [ ] Verify camera mode stays on the start screen
   - [ ] Switch to upload mode and upload an image instead

### Invalid Image Upload
1. **OCR Dialog - Upload Mode**
   - [ ] Try uploading a text file (.txt) - should fail validation
   - [ ] Try uploading a non-image file - should fail validation
   - [ ] Verify only image files (PNG, JPG, GIF) are accepted

---

## Test Scenario 6: API Response Verification

### Network Tab Monitoring
Use browser DevTools Network tab to verify:

**PUT /api/gaming-sessions/:id/details**
- [ ] Request payload:
  ```json
  {
    "game": "Counter-Strike 2",
    "opponentUserId": null
  }
  ```
- [ ] Response status: 200
- [ ] Response includes updated session object

**POST /api/gaming-sessions/:id/results**
- [ ] Request payload:
  ```json
  {
    "game": "Counter-Strike 2",
    "score": 1500,
    "placement": 1,
    "result": "win",
    "kills": 10,
    "deaths": 2,
    "assists": 5
  }
  ```
- [ ] Response status: 200
- [ ] Response confirms session ended (status: "ended")

---

## Test Scenario 7: Multiple Sessions

### Setup
1. Cashier creates 2 gaming sessions for Gamer 1 (at different stations if available)

### Test Flow
1. **Landing Page**
   - [ ] Log in to gamer-app
   - [ ] Verify both sessions are displayed
   - [ ] Verify each session shows correct station name
   - [ ] Click first session

2. **Complete first session** with OCR

3. **Return to Landing**
   - [ ] Verify only second session remains visible
   - [ ] Complete second session

4. **Final Landing**
   - [ ] Verify no sessions are visible
   - [ ] Message shows: "No active gaming sessions. Contact a cashier to start one."

---

## Test Scenario 8: Edge Cases

### Very Long Game Name
- [ ] Enter game name: "This is a very long game name with special characters !@#$%^&*()"
- [ ] Save and complete session
- [ ] Verify game name is stored correctly in database

### Zero Values in OCR
- [ ] Upload screenshot with all stats as 0
- [ ] Verify form accepts zero values
- [ ] Verify database stores zeros (not null)

### Placement > 999
- [ ] Manually edit placement to 12345
- [ ] Verify saves without truncation
- [ ] Verify database accepts large numbers

### Special Characters in Result
- [ ] Manually edit game name to include quotes: `Game "Name" with quotes`
- [ ] Verify no SQL injection or special character issues
- [ ] Verify database stores correctly

---

## Performance Tests

### Image Processing Speed
- [ ] Upload a 5MB screenshot
- [ ] Verify OCR completes in reasonable time (< 30 seconds)
- [ ] Verify progress bar updates smoothly

### Large OCR Text
- [ ] Screenshot with 1000+ characters of text
- [ ] Verify Tesseract.js processes without hanging
- [ ] Verify parsing still extracts correct values

---

## Cleanup

After all tests:
1. Delete test sessions from database
2. Clear browser localStorage if needed
3. Verify no orphaned records in game_session_results
4. Check for any errors in browser console

---

## Known Limitations / Future Improvements

- [ ] Event session routing (currently only inserts to game_session_results, not event_results)
- [ ] Camera flash/brightness adjustment
- [ ] Batch result submission
- [ ] Result history view for gamer
- [ ] Leaderboard integration with game_session_results

