import { chromium } from 'playwright';

async function testGamingSessionForm() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('\n🧪 Testing Gaming Session Form\n');
  console.log('═'.repeat(80));

  try {
    // Navigate to cashier app login
    console.log('\n1️⃣ Navigating to cashier app...');
    await page.goto('http://localhost:4202/login', { waitUntil: 'load' });
    await page.waitForTimeout(2000);

    // Login
    console.log('2️⃣ Logging in as cashier...');
    const credentialInput = page.locator('#credential-input');
    const passwordInput = page.locator('#password');

    await credentialInput.fill('cashier@playground.com');
    await passwordInput.fill('cashier123');

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    await page.waitForNavigation({ waitUntil: 'load' }).catch(() => null);
    await page.waitForTimeout(2000);

    // Click Gaming Session card
    console.log('3️⃣ Opening Gaming Session modal...');
    const gamingSessionCard = page.locator('text=Gaming Session').first().locator('..');
    await gamingSessionCard.click();
    await page.waitForTimeout(1000);

    // Check form elements
    console.log('4️⃣ Verifying form structure...');

    // Check that Opponent Type is removed
    const opponentTypeLabel = page.locator('text=Opponent Type');
    const opponentTypeExists = await opponentTypeLabel.count();
    if (opponentTypeExists === 0) {
      console.log('   ✅ Opponent Type dropdown removed');
    } else {
      console.log('   ❌ Opponent Type dropdown still exists!');
    }

    // Check Player field
    const playerInput = page.locator('input[formControlName="playerSearch"]');
    if (await playerInput.count() > 0) {
      console.log('   ✅ Player field present');
    }

    // Check Station dropdown
    const stationSelect = page.locator('select[formControlName="station"]');
    const stationOptions = await stationSelect.locator('option').count();
    console.log(`   ✅ Station dropdown has ${stationOptions} options (including placeholder)`);

    // Check Duration dropdown
    const durationSelect = page.locator('select[formControlName="duration"]');
    const durationOptions = await durationSelect.locator('option').count();
    console.log(`   ✅ Duration dropdown has ${durationOptions} options`);

    // Check Rate dropdown (should now be a select, not an input)
    const rateSelect = page.locator('select[formControlName="rate"]');
    const rateInput = page.locator('input[formControlName="rate"]');

    if (await rateSelect.count() > 0) {
      const rateOptions = await rateSelect.locator('option').count();
      console.log(`   ✅ Rate is now a dropdown with ${rateOptions} options`);
    } else if (await rateInput.count() > 0) {
      console.log('   ⚠️  Rate is still an input field (expected to be dropdown)');
    }

    // Check option background colors
    console.log('\n5️⃣ Checking option styling...');
    const stationOptionStyles = await stationSelect.locator('option').nth(1).getAttribute('class');
    console.log(`   Station option classes: ${stationOptionStyles || 'none'}`);

    if (stationOptionStyles && stationOptionStyles.includes('bg-slate-800')) {
      console.log('   ✅ Options have dark background (bg-slate-800)');
    } else if (stationOptionStyles) {
      console.log(`   ⚠️  Options have different styling: ${stationOptionStyles}`);
    }

    // Test form submission
    console.log('\n6️⃣ Testing form submission...');
    const submitBtn = page.locator('button:has-text("Start Session")');
    if (await submitBtn.count() > 0) {
      console.log('   ✅ Submit button found');

      // Try to submit with required fields
      const playerField = page.locator('input[formControlName="playerSearch"]');
      await playerField.fill('Test Player');

      // Select first available station
      const firstStation = stationSelect.locator('option').nth(1);
      const stationValue = await firstStation.getAttribute('value');
      if (stationValue) {
        await stationSelect.selectOption(stationValue);
      }

      // Select first available duration
      const firstDuration = durationSelect.locator('option').nth(1);
      const durationValue = await firstDuration.getAttribute('value');
      if (durationValue) {
        await durationSelect.selectOption(durationValue);
      }

      // Select first available rate
      const firstRate = rateSelect.locator('option').nth(1);
      const rateValue = await firstRate.getAttribute('value');
      if (rateValue) {
        await rateSelect.selectOption(rateValue);
      }

      console.log('   ✅ Form fields populated');
      console.log('   ✅ Form ready for submission');
    }

    // Take screenshot
    const screenshotPath = './test-gaming-session-form.png';
    await page.screenshot({ path: screenshotPath });
    console.log(`\n📸 Screenshot saved: ${screenshotPath}`);

    console.log('\n' + '═'.repeat(80));
    console.log('✅ Form Testing Complete!\n');

  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await context.close();
    await browser.close();
  }
}

testGamingSessionForm();
