const chromium = require('playwright').chromium;

async function test() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Navigate to admin app
    await page.goto('http://localhost:4200');
    console.log('✓ Admin app loaded');
    
    // Wait for navigation and click Events
    await page.waitForTimeout(2000);
    
    // Look for Events link in navigation
    const eventsLink = await page.$('a:has-text("Events"), span:has-text("🎮"), [class*="Events"]');
    if (eventsLink) {
      await eventsLink.click();
      console.log('✓ Navigated to Events');
    } else {
      console.log('⚠ Could not find Events navigation');
    }
    
    // Wait for events page to load
    await page.waitForTimeout(2000);
    
    // Check if "Manage Results" button exists
    const manageButtons = await page.$$('button:has-text("Manage Results")');
    console.log(`✓ Found ${manageButtons.length} "Manage Results" buttons`);
    
    if (manageButtons.length > 0) {
      // Click first manage results button
      await manageButtons[0].click();
      console.log('✓ Clicked "Manage Results"');
      
      // Wait for modal to appear
      await page.waitForTimeout(1000);
      
      // Check the player dropdown
      const playerSelect = await page.$('select[formControlName="playerUsername"]');
      if (playerSelect) {
        const options = await page.$$eval('select[formControlName="playerUsername"] option', els => 
          els.map(el => el.textContent)
        );
        console.log(`✓ Player dropdown found with ${options.length} options`);
        console.log(`  Options: ${options.slice(0, 3).join(', ')}${options.length > 3 ? '...' : ''}`);
        
        if (options.length > 1) {
          console.log('\n✅ SUCCESS: Players are displayed in the dropdown!');
        } else {
          console.log('\n❌ FAIL: No players in dropdown');
        }
      } else {
        console.log('❌ Player dropdown not found');
      }
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    await browser.close();
  }
}

test();
