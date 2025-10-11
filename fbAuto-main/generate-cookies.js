// Generate Facebook cookies locally
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const generateFacebookCookies = async () => {
  console.log('🍪 Starting cookie generation...');
  
  const browser = await chromium.launch({ 
    headless: false, // VISIBLE browser
    slowMo: 1000,    // Slow down for easier interaction
  });
  
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    locale: "en-US",
  });
  
  const page = await context.newPage();
  
  console.log('🌐 Navigating to Facebook...');
  await page.goto('https://www.facebook.com/login');
  
  console.log('🔑 Please login manually and complete any 2FA...');
  console.log('⏳ Waiting for you to complete login...');
  
  // Wait for login completion (check for Facebook home page elements)
  await page.waitForFunction(() => {
    return document.querySelector('[data-testid="react-composer-post-button"]') ||
           document.querySelector('[aria-label*="Account"]') ||
           document.querySelector('div[role="main"]');
  }, { timeout: 300000 }); // 5 minutes
  
  console.log('✅ Login detected! Extracting cookies...');
  
  // Get all cookies
  const cookies = await context.cookies();
  const facebookCookies = cookies.filter(c => c.domain.includes('facebook.com'));
  
  // Save cookies to file
  const cookiesDir = path.join(process.cwd(), 'cookies');
  if (!fs.existsSync(cookiesDir)) {
    fs.mkdirSync(cookiesDir, { recursive: true });
  }
  
  const cookieFile = path.join(cookiesDir, 'airecuritement_gmail_com.json');
  fs.writeFileSync(cookieFile, JSON.stringify(facebookCookies, null, 2));
  
  console.log(`🎉 Success! Saved ${facebookCookies.length} cookies to: ${cookieFile}`);
  console.log('📋 Cookie summary:');
  facebookCookies.forEach(cookie => {
    console.log(`   - ${cookie.name}: ${cookie.value.substring(0, 20)}...`);
  });
  
  await browser.close();
  console.log('✅ Browser closed. Cookies are ready for production!');
};

generateFacebookCookies().catch(console.error);