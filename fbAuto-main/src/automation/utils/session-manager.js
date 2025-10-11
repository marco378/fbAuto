// Session cloning for 2FA bypass
import fs from 'fs';
import path from 'path';

export const cloneWorkingSession = async (sourceEmail, targetEmail) => {
  try {
    const cookiesDir = path.join(process.cwd(), 'cookies');
    const sourcePath = path.join(cookiesDir, `${sourceEmail.replace('@', '_').replace(/\./g, '_')}.json`);
    const targetPath = path.join(cookiesDir, `${targetEmail.replace('@', '_').replace(/\./g, '_')}.json`);
    
    if (fs.existsSync(sourcePath)) {
      const cookies = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
      fs.writeFileSync(targetPath, JSON.stringify(cookies, null, 2));
      console.log(`✅ Cloned session from ${sourceEmail} to ${targetEmail}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Session cloning failed:', error);
    return false;
  }
};

// Pre-warm session to establish trust
export const prewarmSession = async (context, email) => {
  try {
    console.log('🔥 Pre-warming session to establish trust...');
    
    // Visit Facebook gradually
    const page = await context.newPage();
    
    // Start with basic page
    await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    // Simulate browsing behavior
    await page.mouse.move(200, 200);
    await page.waitForTimeout(1000);
    
    // Check login status
    const isLoggedIn = await page.evaluate(() => {
      return !document.querySelector('#email') && 
             (document.querySelector('[data-testid="react-composer-post-button"]') ||
              document.querySelector('[aria-label*="Account"]'));
    });
    
    await page.close();
    return isLoggedIn;
  } catch (error) {
    console.error('⚠️ Pre-warming failed:', error);
    return false;
  }
};