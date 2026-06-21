const { chromium } = require('playwright');

(async () => {
  let browser;
  try {
    console.log('🚀 Starting verification of rate auto-population feature...\n');
    
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Navigate to cashier app
    console.log('📍 Step 1: Navigating to cashier app...');
    await page.goto('http://localhost:4202/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log('✅ App loaded');
    
    // Wait for login form
    console.log('📍 Step 2: Waiting for login form...');
    await page.waitForSelector('input[type="email"], input[type="tel"]', { timeout: 10000 });
    console.log('✅ Login form found');
    
    // Login with test cashier account
    console.log('📍 Step 3: Logging in as cashier...');
    const emailInput = await page.\input[placeholder*="@example"];
    if (emailInput) {
      await page.fill('input[placeholder*="@example"]', 'cashier@playground.com');
    } else {
      await page.fill('input[type="email"], input[type="tel"]', 'cashier@playground.com');
    }
    await page.fill('input[type="password"]', 'cashier123');
    await page.click('button:has-text("Login")');
    
    // Wait for navigation to dashboard
    console.log('⏳ Waiting for dashboard to load...');
    await page.waitForURL(/.*\/$|.*\/landing/, { timeout: 15000 });
    console.log('✅ Successfully logged in');
    
    // Wait for page to fully load
    await page.waitForTimeout(1500);
    
    // Find and click Gaming Session card
    console.log('📍 Step 4: Opening Gaming Session dialog...');
    const gamingCard = await page.locator('div').filter({ hasText: /Gaming Session/ }).first();
    if (await gamingCard.count() === 0) {
      console.log('❌ Gaming Session card not found');
      await page.screenshot({ path: 'debug-dashboard.png' });
      process.exit(1);
    }
    
    await gamingCard.click();
    await page.waitForTimeout(800);
    console.log('✅ Gaming Session dialog opened');
    
    // Get all select elements
    const selects = await page.locator('select').all();
    console.log(\📊 Found \ select dropdowns\);
    
    if (selects.length < 3) {
      console.log('⚠️  Expected at least 3 selects, found', selects.length);
    }
    
    // The duration select is typically the 3rd one (after player and station)
    const durationSelect = selects[2];
    
    // Get initial duration value
    const initialDuration = await durationSelect.evaluate(el => el.value);
    console.log(\📍 Step 5: Testing rate auto-population\);
    console.log(\   Current duration: \\);
    
    // Find the rate display (looking for elements containing the rate after "Rate (Auto)")
    let rateDisplay = await page.locator('text=/Rate.*Auto/i').first();
    if (await rateDisplay.count() === 0) {
      // Try alternative selector
      rateDisplay = await page.locator('[class*="auto"]').first();
    }
    
    const initialRate = await rateDisplay.textContent().catch(() => 'N/A');
    console.log(\   Initial rate display: "\"\);
    
    // Change duration to first available option (usually 60 min)
    const options = await durationSelect.evaluate(el => 
      Array.from(el.options).map(opt => ({ value: opt.value, text: opt.text }))
    );
    console.log(\   Available durations: \\);
    
    if (options.length > 1) {
      const nextOption = options[1].value; // Pick the first non-empty option
      console.log(\   ✅ Selecting duration: \\);
      
      await durationSelect.selectOption(nextOption);
      await page.waitForTimeout(600);
      
      // Check if rate updated
      const rateAfterChange = await rateDisplay.textContent().catch(() => 'N/A');
      console.log(\   Rate after selection: "\"\);
      
      // Verify the rate changed or is populated
      if (rateAfterChange && rateAfterChange !== initialRate && rateAfterChange !== 'Select duration to see rate' && rateAfterChange.includes('€')) {
        console.log('✅ PASS: Rate auto-populated correctly!');
      } else if (rateAfterChange && rateAfterChange.match(/[0-9]+(\.[0-9]{2})?/)) {
        console.log('✅ PASS: Rate is now showing a numeric value!');
      } else {
        console.log('⚠️  Rate display: ' + rateAfterChange);
        if (rateAfterChange === 'Select duration to see rate') {
          console.log('❌ FAIL: Rate did not auto-populate');
        }
      }
    } else {
      console.log('⚠️  Only one duration option available, cannot test selection');
    }
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'rate-verification.png' });
    console.log('\n📸 Screenshot saved to rate-verification.png');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
    console.log('\n✅ Verification complete');
  }
})();
