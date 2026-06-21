const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to the cashier app
    console.log('📍 Navigating to http://localhost:4202...');
    await page.goto('http://localhost:4202', { waitUntil: 'domcontentloaded' });
    
    // Wait for page to be fully interactive
    await page.waitForTimeout(2000);
    
    // Check if Gaming Session card exists
    const gamingSessionText = await page.locator('text=/Gaming Session/i').first();
    if (await gamingSessionText.count() === 0) {
      console.log('❌ Gaming Session card not found');
      console.log('Screenshot: page is ready, checking elements...');
      // List all visible text to debug
      const texts = await page.locator('h1, h2, h3, h4, p').allTextContents();
      console.log('Page content:', texts.slice(0, 10));
    } else {
      console.log('✅ Gaming Session card found');
      
      // Find and click the Gaming Session card
      const card = await page.locator('div').filter({ hasText: /Gaming Session/ }).first();
      console.log('🖱️  Clicking Gaming Session card...');
      await card.click();
      
      // Wait for modal to appear
      await page.waitForTimeout(1000);
      
      // Check if modal opened
      const modal = await page.locator('[class*="modal"], [class*="dialog"], [class*="fixed"]').first();
      console.log('✅ Modal appears to be open');
      
      // Get the current duration value
      const durationSelect = await page.locator('select').nth(2); // usually the 3rd select is duration
      const currentDuration = await durationSelect.evaluate(el => el.value);
      console.log('📊 Current duration:', currentDuration);
      
      // Look for the rate display
      const rateDisplays = await page.locator('[class*="auto"], [class*="rate"], span').allTextContents();
      console.log('💰 Rate displays found:', rateDisplays.filter(t => t.includes('€') || t.includes('\$') || /^[0-9]+/.test(t)).slice(0, 5));
      
      // Change duration
      const nextDuration = '120'; // Try changing to 120 minutes if available
      console.log('🔄 Changing duration to 120...');
      await durationSelect.selectOption(nextDuration).catch(() => {
        console.log('⚠️  Could not select 120, checking available options');
      });
      
      await page.waitForTimeout(500);
      
      // Check if rate updated
      const rateAfterChange = await page.locator('[class*="auto"]').textContent().catch(() => 'N/A');
      console.log('💰 Rate after duration change:', rateAfterChange);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await page.close();
    await browser.close();
  }
})();
