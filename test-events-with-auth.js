const chromium = require('playwright').chromium;

async function test() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('Loading admin app...');
    await page.goto('http://localhost:4200');
    await page.waitForTimeout(1500);
    
    // Click Email button
    console.log('Clicking Email login...');
    await page.click('button:has-text("Email")');
    await page.waitForTimeout(1000);
    
    // Look for email input
    const emailInputs = await page.$$('input[type="email"], input[placeholder*="email" i]');
    if (emailInputs.length > 0) {
      console.log('Found email input, entering credentials...');
      await emailInputs[0].fill('admin@gaming.local');
      await page.waitForTimeout(500);
      
      // Look for password input
      const passwordInputs = await page.$$('input[type="password"]');
      if (passwordInputs.length > 0) {
        await passwordInputs[0].fill('password');
        await page.waitForTimeout(500);
      }
      
      // Click login
      const loginBtn = await page.$('button:has-text("Login"), button:has-text("Sign In")');
      if (loginBtn) {
        await loginBtn.click();
        console.log('Clicked login button');
        await page.waitForTimeout(2000);
      }
    }
    
    // Navigate to events
    console.log('Navigating to events...');
    await page.goto('http://localhost:4200/events');
    await page.waitForTimeout(2000);
    
    // Check for events content
    const content = await page.innerText('body').catch(() => '');
    if (content.includes('Events Management')) {
      console.log('✓ Events Management page loaded');
    }
    
    // Look for "Manage Results" button
    const buttons = await page.$$('button');
    let found = false;
    for (const btn of buttons) {
      const text = await btn.innerText().catch(() => '');
      if (text.includes('Manage Results')) {
        console.log('✓ Found "Manage Results" button');
        await btn.click();
        await page.waitForTimeout(1000);
        found = true;
        
        // Check player dropdown
        const playerSelects = await page.$$('select[formControlName="playerUsername"]');
        if (playerSelects.length > 0) {
          const options = await playerSelects[0].$$eval('option', els => els.map(el => ({ text: el.textContent, value: el.value })));
          console.log(`\n✓ Player dropdown found with ${options.length} options:`);
          options.forEach((opt, i) => {
            if (i < 5) console.log(`  [${i}] ${opt.text}`);
          });
          
          if (options.length > 1) {
            console.log('\n✅ SUCCESS: Players are displayed in the dropdown!');
          } else {
            console.log('\n⚠ Only placeholder option found');
          }
        }
        break;
      }
    }
    
    if (!found) {
      console.log('✗ "Manage Results" button not found');
      console.log('Available buttons:', await Promise.all(buttons.slice(0, 10).map(btn => btn.innerText().catch(() => ''))));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

test();
