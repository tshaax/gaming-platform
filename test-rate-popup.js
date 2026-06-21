const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the cashier app
    await page.goto('http://localhost:4202', { waitUntil: 'networkidle' });
    console.log('✓ Navigated to cashier app');
    
    // Wait for page to fully load
    await page.waitForLoadState('domcontentloaded');
    
    // Check if we need to login - look for login form
    const loginForm = await page.locator('[class*="login"]').first();
    const isLoginPage = await loginForm.count() > 0 ? true : false;
    
    if (isLoginPage) {
      console.log('✓ Login page detected');
      // For now, we'll just note that login is needed
      // In a real scenario, we'd need test credentials
    } else {
      console.log('✓ Already on dashboard or not login required');
    }
    
    // Look for Gaming Session card
    const gamingSessionCard = await page.locator('text=Gaming Session').first();
    if (await gamingSessionCard.count() > 0) {
      console.log('✓ Found Gaming Session card');
      
      // Click on it to open the modal
      await gamingSessionCard.click();
      await page.waitForTimeout(500);
      console.log('✓ Clicked Gaming Session card');
      
      // Check for modal
      const modal = await page.locator('[class*="modal"], [class*="dialog"]').first();
      if (await modal.count() > 0) {
        console.log('✓ Modal opened');
        
        // Look for Duration select
        const durationSelect = await page.locator('select').filter({ hasText: 'duration' }).first();
        if (await durationSelect.count() === 0) {
          // Try by label
          const labels = await page.locator('label').all();
          for (const label of labels) {
            const text = await label.textContent();
            if (text && text.includes('Duration')) {
              const select = await label.locator('~ select');
              if (await select.count() > 0) {
                console.log('✓ Found Duration select by label');
                break;
              }
            }
          }
        }
      }
    } else {
      console.log('✗ Gaming Session card not found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
