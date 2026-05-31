import { chromium } from 'playwright';

interface AppTestConfig {
  name: string;
  url: string;
  email: string;
  password: string;
  expectedPageTitle?: string;
}

const testConfigs: AppTestConfig[] = [
  {
    name: 'Admin App',
    url: 'http://localhost:4201/login',
    email: 'admin@playground.com',
    password: 'admin123',
    expectedPageTitle: 'Dashboard',
  },
  {
    name: 'Cashier App',
    url: 'http://localhost:4202/login',
    email: 'cashier@playground.com',
    password: 'cashier123',
    expectedPageTitle: 'Point of Sale',
  },
  {
    name: 'Gamer App',
    url: 'http://localhost:4203/login',
    email: 'gamer@playground.com',
    password: 'gamer123',
    expectedPageTitle: 'Playground',
  },
];

async function testLoginFlow() {
  const browser = await chromium.launch({ headless: true });
  let passedTests = 0;
  let failedTests = 0;

  console.log('\n🧪 Testing Login Flow for All Apps\n');
  console.log('═'.repeat(80));

  for (const config of testConfigs) {
    try {
      console.log(`\n📱 Testing: ${config.name}`);
      console.log('─'.repeat(80));

      const context = await browser.newContext();
      const page = await context.newPage();

      // Navigate to login page
      console.log(`  1️⃣  Navigating to ${config.url}...`);
      await page.goto(config.url, { waitUntil: 'load' });
      await page.waitForTimeout(2000); // Wait for Angular to bootstrap

      // Check login form is visible
      const credentialInput = page.locator('#credential-input');
      const passwordInput = page.locator('#password');

      try {
        await credentialInput.waitFor({ timeout: 10000 });
        await passwordInput.waitFor({ timeout: 10000 });
      } catch (e) {
        // If elements don't load, try refreshing
        console.log('  ⚠️  Elements not loading, refreshing page...');
        await page.reload({ waitUntil: 'load' });
        await page.waitForTimeout(3000);
        await credentialInput.waitFor({ timeout: 10000 });
        await passwordInput.waitFor({ timeout: 10000 });
      }
      console.log('  ✅ Login form loaded');

      // Fill email using correct selector
      console.log(`  2️⃣  Entering email: ${config.email}`);
      await credentialInput.fill(config.email);
      await page.waitForTimeout(300);

      // Find and fill password
      console.log(`  3️⃣  Entering password...`);
      await passwordInput.fill(config.password);
      await page.waitForTimeout(300);

      // Submit form
      const submitButton = page.locator('button[type="submit"]');
      console.log('  4️⃣  Clicking login button...');
      await submitButton.click();

      // Wait for navigation
      console.log('  5️⃣  Waiting for redirect...');
      await page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => null);
      await page.waitForTimeout(2000);

      // Check if we're on the dashboard/landing page
      const url = page.url();
      const isLoggedIn = !url.includes('/login');

      if (isLoggedIn) {
        console.log('  ✅ Login successful! Redirected to dashboard');
        console.log(`     Current URL: ${url}`);

        // Take a screenshot
        const screenshotPath = `./test-login-${config.name.replace(/\s+/g, '-').toLowerCase()}.png`;
        await page.screenshot({ path: screenshotPath });
        console.log(`  📸 Screenshot saved: ${screenshotPath}`);

        passedTests++;
      } else {
        console.log('  ❌ Login failed! Still on login page');
        failedTests++;
      }

      await context.close();
    } catch (error) {
      console.log(`  ❌ Error testing ${config.name}: ${error instanceof Error ? error.message : String(error)}`);
      failedTests++;
    }
  }

  await browser.close();

  // Print summary
  console.log('\n' + '═'.repeat(80));
  console.log('\n📊 Test Summary:');
  console.log(`   ✅ Passed: ${passedTests}/${testConfigs.length}`);
  console.log(`   ❌ Failed: ${failedTests}/${testConfigs.length}`);
  console.log('');

  process.exit(failedTests > 0 ? 1 : 0);
}

testLoginFlow().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
