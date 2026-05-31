const chromium = require('playwright').chromium;
const fs = require('fs');

async function test() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // First, get the app URL and take a screenshot
    await page.goto('http://localhost:4200');
    await page.screenshot({ path: 'app-home.png' });
    console.log('✓ Screenshot saved: app-home.png');
    
    // Check page content
    const content = await page.content();
    if (content.includes('dashboard') || content.includes('Dashboard')) {
      console.log('✓ Page contains dashboard');
    }
    
    // Try to find Events by looking at all text
    const allText = await page.innerText('body');
    if (allText.includes('Events')) {
      console.log('✓ Page contains "Events" text');
    }
    
    // Try navigating directly to /events
    console.log('\nAttempting direct navigation to /events...');
    await page.goto('http://localhost:4200/events');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'events-page.png' });
    console.log('✓ Screenshot saved: events-page.png');
    
    // Now check for the manage results button
    const buttons = await page.$$('button');
    let manageResultsFound = false;
    for (const btn of buttons) {
      const text = await btn.innerText();
      if (text.includes('Manage Results')) {
        manageResultsFound = true;
        console.log('✓ Found "Manage Results" button');
        
        // Click it
        await btn.click();
        await page.waitForTimeout(1000);
        
        // Take screenshot of modal
        await page.screenshot({ path: 'manage-results-modal.png' });
        console.log('✓ Screenshot saved: manage-results-modal.png');
        
        // Check player dropdown
        const selects = await page.$$('select');
        for (const sel of selects) {
          const formControl = await sel.getAttribute('formControlName');
          if (formControl === 'playerUsername') {
            const options = await sel.$$eval('option', els => els.map(el => el.textContent));
            console.log(`\n✓ Player dropdown found with ${options.length} options:`);
            console.log(`  Options: ${options.slice(0, 5).join('\n  ')}`);
            
            if (options.length > 1) {
              console.log('\n✅ SUCCESS: Players are displayed in the dropdown!');
            }
            break;
          }
        }
        break;
      }
    }
    
    if (!manageResultsFound) {
      console.log('⚠ No "Manage Results" button found');
      console.log('Available buttons:', await Promise.all(buttons.map(btn => btn.innerText())));
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

test();
