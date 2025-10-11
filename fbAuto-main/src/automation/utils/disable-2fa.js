// Attempt to disable 2FA programmatically
export const attemptDisable2FA = async (page, context) => {
  try {
    console.log("🔧 Attempting to disable 2FA programmatically...");
    
    // Navigate to security settings
    await page.goto('https://www.facebook.com/settings?tab=security', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    await page.waitForTimeout(3000);
    
    // Look for 2FA settings
    const twoFactorSelectors = [
      'text="Two-factor authentication"',
      'text="Two-Factor Authentication"',
      'text="Login approvals"',
      '[data-testid="two_factor_auth"]',
      'a[href*="two_factor"]',
      'button:has-text("Edit"):near(:text("Two-factor"))',
    ];
    
    for (const selector of twoFactorSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          console.log("🎯 Found 2FA settings, attempting to access...");
          await element.click();
          await page.waitForTimeout(2000);
          
          // Look for disable/turn off options
          const disableSelectors = [
            'button:has-text("Turn Off")',
            'button:has-text("Disable")',
            'button:has-text("Remove")',
            'text="Turn off"',
            'text="Disable"',
            '[data-testid="turn_off_2fa"]',
          ];
          
          for (const disableSelector of disableSelectors) {
            try {
              const disableBtn = await page.locator(disableSelector).first();
              if (await disableBtn.isVisible({ timeout: 2000 })) {
                console.log("✅ Found disable option, attempting to turn off 2FA...");
                await disableBtn.click();
                await page.waitForTimeout(2000);
                
                // Confirm if there's a confirmation dialog
                const confirmSelectors = [
                  'button:has-text("Confirm")',
                  'button:has-text("Turn Off")',
                  'button:has-text("Yes")',
                  '[data-testid="confirm_disable"]',
                ];
                
                for (const confirmSelector of confirmSelectors) {
                  try {
                    const confirmBtn = await page.locator(confirmSelector).first();
                    if (await confirmBtn.isVisible({ timeout: 2000 })) {
                      await confirmBtn.click();
                      console.log("🎉 2FA disable attempted!");
                      return true;
                    }
                  } catch (err) {
                    continue;
                  }
                }
                return true;
              }
            } catch (err) {
              continue;
            }
          }
        }
      } catch (err) {
        continue;
      }
    }
    
    console.log("⚠️ Could not find 2FA disable options");
    return false;
    
  } catch (error) {
    console.log("❌ Failed to access 2FA settings:", error.message);
    return false;
  }
};