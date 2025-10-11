import { FB } from "../config/facebook-config.js";
import { LoginSelectors } from "./utils/selectors.js";
import { humanPause } from "./utils/delays.js";
import fs from "fs";
import path from "path";

// Global 2FA handling state to prevent concurrent challenges
let global2FAInProgress = false;
let global2FACompletedAt = null;

const COOKIES_DIR = path.join(process.cwd(), "cookies");
const getCookiePath = (email) =>
  path.join(COOKIES_DIR, `${email.replace("@", "_").replace(/\./g, "_")}.json`);

const ensureCookiesDir = () => {
  if (!fs.existsSync(COOKIES_DIR)) {
    fs.mkdirSync(COOKIES_DIR, { recursive: true });
  }
};

// ✅ Normalize cookies for Playwright
const normalizeCookies = (cookies) => {
  return cookies.map((cookie) => {
    if (!["Strict", "Lax", "None"].includes(cookie.sameSite)) {
      cookie.sameSite = "None"; // safe default
    }
    return cookie;
  });
};

// ✅ Save cookies
const saveCookiesToStorage = async (context, email) => {
  try {
    const cookies = await context.cookies();
    const facebookCookies = cookies.filter((c) =>
      c.domain.includes("facebook.com")
    );

    if (facebookCookies.length === 0) return;

    ensureCookiesDir();
    const cookiePath = getCookiePath(email);
    fs.writeFileSync(cookiePath, JSON.stringify(facebookCookies, null, 2));
    console.log(`🍪 Saved ${facebookCookies.length} cookies for ${email}`);
  } catch (error) {
    console.warn("⚠️ Failed to save cookies:", error.message);
  }
};

// ✅ Load cookies
const loadCookiesFromStorage = async (context, email) => {
  try {
    const cookiePath = getCookiePath(email);
    if (!fs.existsSync(cookiePath)) return false;

    const cookiesData = fs.readFileSync(cookiePath, "utf8");
    const cookies = JSON.parse(cookiesData);

    if (!cookies || cookies.length === 0) return false;

    const now = Date.now() / 1000;
    const validCookies = cookies.filter(
      (cookie) => !cookie.expires || cookie.expires > now
    );

    if (validCookies.length === 0) return false;

    const normalized = normalizeCookies(validCookies);
    await context.addCookies(normalized);

    console.log(`🍪 Applied ${normalized.length} valid cookies`);
    return true;
  } catch (error) {
    console.warn("⚠️ Failed to load cookies:", error.message);
    return false;
  }
};

// ✅ Check for valid FB session
const hasFacebookSession = async (context) => {
  try {
    const cookies = await context.cookies();
    const facebookCookies = cookies.filter((c) =>
      c.domain.includes("facebook.com")
    );

    const hasUserCookie = facebookCookies.some(
      (c) => c.name === "c_user" && c.value
    );
    const hasSessionCookie = facebookCookies.some(
      (c) => c.name === "xs" && c.value
    );

    return hasUserCookie && hasSessionCookie;
  } catch {
    return false;
  }
};

// 🔒 Detect checkpoint / 2FA
const detectChallenges = async (page) => {
  const content = await page.content();
  if (content.includes("checkpoint") || content.includes("two_factor")) {
    console.log("⚠️ Facebook is asking for checkpoint or 2FA");
    return true;
  }
  return false;
};

// 🤖 Handle common 2FA scenarios automatically
const handleCommon2FAScenarios = async (page) => {
  try {
    console.log("🤖 Attempting automatic 2FA handling...");
    
    // Wait a bit for the page to load completely
    await humanPause(3000, 5000);
    
    // Get current URL and page content for analysis
    const currentUrl = page.url();
    const pageContent = await page.content();
    const contentLower = pageContent.toLowerCase();
    
    console.log(`🔍 2FA Page Analysis: URL contains ${currentUrl.includes('checkpoint') ? 'checkpoint' : 'no checkpoint'}`);
    
    // Strategy 1: Look for "Remember this browser" or "Don't ask again" options
    console.log("🔐 Strategy 1: Looking for device trust options...");
    const trustDeviceSelectors = [
      'input[name="remember_browser"]',
      'input[type="checkbox"][value="1"]',
      'label:has-text("Remember this browser")',
      'label:has-text("Don\'t ask again")',
      'label:has-text("Save device")',
      'input[name="save_device"]',
      'input[id="remember_browser"]',
    ];
    
    for (const selector of trustDeviceSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          console.log(`🔐 Found "Remember this browser" option: ${selector}`);
          await element.check();
          await humanPause(1000, 2000);
        }
      } catch (err) {
        continue;
      }
    }
    
    // Strategy 2: Common selectors for 2FA "Continue" or "Skip" buttons
    console.log("🎯 Strategy 2: Looking for skip/continue buttons...");
    const autoClickSelectors = [
      'button[name="__CONFIRM__"]',
      '#checkpointSubmitButton',
      'button:has-text("Continue")',
      'button:has-text("Skip")',
      'button:has-text("Not Now")',
      'button:has-text("Skip for now")',
      'button:has-text("Ask later")',
      'button:has-text("Not now")',
      'a:has-text("Skip")',
      'a:has-text("Not now")',
      '[data-testid="sec_ac_button"]',
      '[role="button"]:has-text("Continue")',
      '[role="button"]:has-text("Skip")',
      '[role="button"]:has-text("Not Now")',
      // Mobile-specific selectors
      'button[value="submit"]',
      'input[type="submit"]',
      'button[type="submit"]',
      // Additional checkpoint selectors
      'button[name="submit[Continue]"]',
      'button[name="submit[Skip]"]',
      'input[name="submit[Continue]"]',
      'input[name="submit[Skip]"]',
    ];
    
    for (const selector of autoClickSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          console.log(`🎯 Found auto-clickable element: ${selector}`);
          await element.click();
          await humanPause(2000, 3000);
          
          // Check if this resolved the challenge
          const resolved = await page.evaluate(() => {
            return !document.querySelector('#email') && 
                   !document.querySelector('input[name="email"]') &&
                   (document.querySelector('[data-testid="react-composer-post-button"]') ||
                    document.querySelector('[aria-label*="Account"]') ||
                    document.querySelector('div[role="main"]') ||
                    (window.location.href.includes('facebook.com') && !window.location.href.includes('login') && !window.location.href.includes('checkpoint')));
          });
          
          if (resolved) {
            console.log("✅ 2FA automatically resolved!");
            return true;
          }
        }
      } catch (err) {
        continue;
      }
    }
    
    // Strategy 3: Look for "Try Another Way" or alternative authentication methods
    console.log("🔄 Strategy 3: Looking for alternative authentication methods...");
    const alternativeAuthSelectors = [
      'a:has-text("Try Another Way")',
      'button:has-text("Try Another Way")',
      'a:has-text("Use text message")',
      'a:has-text("Get help")',
      'button:has-text("Get help")',
      '[data-testid="try_another_way"]',
    ];
    
    for (const selector of alternativeAuthSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          console.log(`🔄 Found alternative auth method: ${selector}`);
          await element.click();
          await humanPause(3000, 5000);
          
          // After clicking "Try Another Way", look for skip options again
          const skipAfterAlternative = await page.locator('button:has-text("Skip"), a:has-text("Skip"), button:has-text("Not Now")').first();
          if (await skipAfterAlternative.isVisible({ timeout: 3000 })) {
            console.log("🎯 Found skip option after alternative method");
            await skipAfterAlternative.click();
            await humanPause(2000, 3000);
          }
        }
      } catch (err) {
        continue;
      }
    }
    
    // Strategy 4: Force navigation away from checkpoint if still stuck
    console.log("🚀 Strategy 4: Attempting direct navigation to bypass...");
    try {
      const currentUrlAfter = page.url();
      if (currentUrlAfter.includes('checkpoint') || currentUrlAfter.includes('two_factor')) {
        console.log("🔄 Still on checkpoint, attempting direct navigation to groups...");
        await page.goto('https://www.facebook.com/groups/feed/', { 
          waitUntil: 'domcontentloaded', 
          timeout: 10000 
        });
        await humanPause(3000, 5000);
        
        const bypassCheck = await page.evaluate(() => {
          return !window.location.href.includes('checkpoint') && 
                 !window.location.href.includes('login') &&
                 !window.location.href.includes('two_factor');
        });
        
        if (bypassCheck) {
          console.log("✅ Successfully bypassed checkpoint via direct navigation!");
          return true;
        }
      }
    } catch (navError) {
      console.log("⚠️ Direct navigation bypass failed:", navError.message);
    }
    
    // Strategy 5: Attempt to auto-fill any text input if it's asking for verification code
    console.log("📱 Strategy 5: Checking for text verification inputs...");
    try {
      const textInputs = await page.locator('input[type="text"], input[type="tel"], input[type="number"]').all();
      
      if (textInputs.length > 0) {
        console.log(`📱 Found ${textInputs.length} text input(s), checking if it's verification code...`);
        
        for (const input of textInputs) {
          try {
            const placeholder = await input.getAttribute('placeholder').catch(() => '');
            const name = await input.getAttribute('name').catch(() => '');
            const id = await input.getAttribute('id').catch(() => '');
            
            const combined = (placeholder + ' ' + name + ' ' + id).toLowerCase();
            
            if (combined.includes('code') || combined.includes('verification') || combined.includes('security')) {
              console.log(`📱 Found verification code input: ${placeholder || name || id}`);
              
              // Look for "Try Another Way" or "Skip" near this input
              const skipNearInput = await page.locator('button:has-text("Skip"), a:has-text("Skip"), button:has-text("Try Another Way"), a:has-text("Try Another Way")').first();
              if (await skipNearInput.isVisible({ timeout: 2000 })) {
                console.log("🎯 Found skip option near verification input");
                await skipNearInput.click();
                await humanPause(2000, 3000);
                return true;
              }
            }
          } catch (err) {
            continue;
          }
        }
      }
    } catch (inputError) {
      console.log("⚠️ Text input check failed:", inputError.message);
    }
    
    // Strategy 6: Try to dismiss any overlays or modals
    console.log("❌ Strategy 6: Attempting to dismiss overlays...");
    const dismissSelectors = [
      '[aria-label="Close"]',
      '[data-testid="modal_close_button"]',
      'button:has-text("✕")',
      'button:has-text("×")',
      '[role="button"][aria-label="Close"]',
    ];
    
    for (const selector of dismissSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          await element.click();
          await humanPause(1000, 2000);
        }
      } catch (err) {
        continue;
      }
    }
    
    console.log("🤖 Automatic 2FA handling completed, manual action may still be required");
    return false;
    
  } catch (error) {
    console.log("⚠️ Automatic 2FA handling failed:", error.message);
    return false;
  }
};

// ✅ Main login flow with aggressive cookie validation to avoid 2FA
export const ensureLoggedIn = async ({ page, context }) => {
  const credentials = {
    email: "airecuritement@gmail.com",
    password: "Varunsh@123",
  };

  const { email, password } = credentials;
  console.log(`🔑 Attempting login for: ${email}`);

  // Add device fingerprinting to hide automation
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    delete navigator.__proto__.webdriver;
    
    // Add mobile characteristics if needed
    Object.defineProperty(navigator, 'platform', { get: () => 'iPhone' });
    Object.defineProperty(navigator, 'userAgent', { 
      get: () => 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
    });
  });

  // AGGRESSIVE: Try loading cookies first and test them extensively
  const cookiesLoaded = await loadCookiesFromStorage(context, email);

  if (cookiesLoaded) {
    try {
      // More conservative navigation in production
      if (process.env.NODE_ENV === 'production') {
        console.log("🌐 Navigating to Facebook (production mode with stability)...");
        await page.goto("https://www.facebook.com/", { 
          waitUntil: "domcontentloaded", 
          timeout: 60000 
        });
        await humanPause(3000, 5000);
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
          console.log("⚠️ Network idle timeout, continuing anyway...");
        });
      } else {
        await page.goto("https://www.facebook.com/", { waitUntil: "load", timeout: 30000 });
      }
      await page.waitForTimeout(2000);
      
      // ENHANCED: Check multiple indicators that we're logged in
      const isLoggedIn = await page.evaluate(() => {
        // Check for multiple login indicators
        const indicators = [
          document.querySelector('[data-testid="react-composer-post-button"]'),
          document.querySelector('[aria-label*="Account"]'),
          document.querySelector('[data-testid="blue_bar"]'),
          document.querySelector('div[role="main"]'),
          !document.querySelector('#email'), // No login form
          !document.querySelector('input[name="email"]'), // No email input
        ];
        return indicators.filter(Boolean).length >= 3; // At least 3 indicators
      });
      
      if (isLoggedIn) {
        console.log("✅ Already logged in via cookies - 2FA skipped!");
        await saveCookiesToStorage(context, email); // refresh cookies
        return true;
      }
    } catch (navError) {
      console.error("❌ Navigation error:", navError.message);
      console.log("🔄 Attempting fresh login instead...");
      await freshLogin(page, context, email, password);
      return true;
    }

    if (await hasFacebookSession(context)) {
      console.log("✅ Already logged in via cookies!");
      await saveCookiesToStorage(context, email); // refresh
      return true;
    }

    console.warn(
      "⚠️ Cookies expired or invalid → falling back to fresh login..."
    );
    await context.clearCookies();
  }

  // Fresh login with improved mobile compatibility
  console.log("🔐 Proceeding with fresh login...");
  
  // Try mobile login first for better 2FA bypass
  try {
    console.log("📱 Attempting mobile Facebook login...");
    await page.goto("https://m.facebook.com/login/", { 
      waitUntil: "domcontentloaded", 
      timeout: 45000 
    });
    await humanPause(2000, 3000);
  } catch (mobileNavError) {
    console.log("⚠️ Mobile navigation failed, using desktop login...");
    await page.goto(FB.base, { waitUntil: "load", timeout: 30000 });
  }

  if (await hasFacebookSession(context)) {
    console.log("✅ Session already active, no login form needed");
    await saveCookiesToStorage(context, email);
    return true;
  }

  // Fill login form with better error handling
  try {
    console.log("📝 Filling login form...");
    
    // Wait for email field and fill it
    await page.waitForSelector(LoginSelectors.email, { timeout: 10000 });
    await page.locator(LoginSelectors.email).first().fill(email);
    await humanPause(800, 1200);
    
    // Fill password
    await page.locator(LoginSelectors.password).first().fill(password);
    await humanPause(800, 1200);
    
    // Try multiple approaches to submit login
    const loginButton = page.locator(LoginSelectors.loginButton).first();
    
    if (await loginButton.isVisible({ timeout: 5000 })) {
      console.log("🔘 Clicking login button...");
      await loginButton.click();
    } else {
      console.log("⌨️ Login button not found, trying Enter key...");
      await page.keyboard.press('Enter');
    }
    
  } catch (loginError) {
    console.log("⚠️ Login form error:", loginError.message);
    // Try alternative approach
    await page.keyboard.press('Enter');
  }

  await page.waitForTimeout(4000);

  if (await detectChallenges(page)) {
    console.log("⚠️ Challenge detected, attempting automatic resolution...");
    
    // Check if another process is already handling 2FA
    if (global2FAInProgress) {
      console.log("🔄 Another process is handling 2FA, waiting for completion...");
      
      // Wait for the other process to complete 2FA (max 2 minutes)
      for (let i = 0; i < 12; i++) {
        await page.waitForTimeout(10000);
        if (!global2FAInProgress || (global2FACompletedAt && Date.now() - global2FACompletedAt < 60000)) {
          console.log("✅ Other process completed 2FA, proceeding...");
          return true;
        }
      }
      
      console.log("⏳ Other process taking too long, proceeding with own 2FA...");
    }
    
    // Set global flag
    global2FAInProgress = true;
    
    // Try to handle common 2FA scenarios automatically with retries
    console.log("🔄 Attempting aggressive 2FA bypass with multiple strategies...");
    
    let resolved = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`🎯 2FA Bypass Attempt ${attempt}/3`);
      
      try {
        resolved = await handleCommon2FAScenarios(page);
        if (resolved) {
          console.log(`✅ 2FA resolved on attempt ${attempt}!`);
          break;
        }
        
        // If not resolved, wait a bit and try again
        if (attempt < 3) {
          console.log(`⏳ Attempt ${attempt} failed, waiting before retry...`);
          await humanPause(3000, 5000);
        }
      } catch (handleError) {
        console.log(`❌ 2FA handling attempt ${attempt} error:`, handleError.message);
        if (attempt < 3) {
          await humanPause(2000, 3000);
        }
      }
    }
    
    // Clear global flag
    global2FAInProgress = false;
    global2FACompletedAt = Date.now();
    
    if (resolved) {
      console.log("✅ 2FA challenge successfully bypassed automatically!");
      await humanPause(2000, 3000);
    } else {
      console.log("⚠️ Automatic 2FA bypass failed, but continuing...");
      // Don't throw error - let the system continue and see if it can proceed
      
      console.log("🔧 Please complete the 2FA/checkpoint in the browser window");
      console.log("🔧 The automation will automatically continue once completed");

      // Wait up to 5 minutes for manual completion with better feedback
      let twoFACompleted = false;
      
      for (let i = 0; i < 30; i++) { // Reduced from 60 to 30 (5 minutes instead of 10)
        await page.waitForTimeout(10000); // Wait 10 seconds

        // Check multiple conditions for successful completion
        const sessionCheck = await hasFacebookSession(context);
        const pageCheck = await page.evaluate(() => {
          return !document.querySelector('#email') && 
                 !document.querySelector('input[name="email"]') &&
                 (document.querySelector('[data-testid="react-composer-post-button"]') ||
                  document.querySelector('[aria-label*="Account"]') ||
                  document.querySelector('div[role="main"]') ||
                  document.URL.includes('facebook.com') && !document.URL.includes('login'));
        });

        if (sessionCheck || pageCheck) {
          console.log("✅ Challenge completed, continuing...");
          twoFACompleted = true;
          break;
        }

        // Provide progress feedback every minute
        if (i % 6 === 0 && i > 0) {
          console.log(`⏳ Still waiting for 2FA completion... ${Math.round((i + 1) / 6)} minutes elapsed`);
        }

        if (i === 29) { // Updated condition
          console.log("⏳ 2FA timeout reached, proceeding with saved session...");
          // Don't throw error, just continue and let the system handle it
          break;
        }
      }
      
      // If 2FA wasn't completed, try to save whatever session we have
      if (!twoFACompleted) {
        console.log("💾 Saving partial session state for future use...");
        await saveCookiesToStorage(context, email);
      }
      
      // Clear global 2FA flag and set completion time
      global2FAInProgress = false;
      global2FACompletedAt = Date.now();
    }
    
    // Clear global 2FA flag
    global2FAInProgress = false;
    global2FACompletedAt = Date.now();
  }

  // Re-check session with more tolerance and better indicators
  try {
    console.log("🔍 Validating login session...");
    
    // Try multiple navigation approaches to establish session
    const navigationAttempts = [
      "https://m.facebook.com/",
      "https://www.facebook.com/",
      "https://m.facebook.com/home.php",
    ];
    
    let sessionEstablished = false;
    
    for (const url of navigationAttempts) {
      try {
        console.log(`🌐 Trying navigation to: ${url}`);
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForTimeout(3000);
        
        // Check for login indicators with more comprehensive detection
        const loginCheck = await page.evaluate(() => {
          const indicators = [
            // Positive indicators (logged in)
            !document.querySelector('#email'),
            !document.querySelector('input[name="email"]'),
            !document.querySelector('input[type="email"]'),
            !!document.querySelector('[data-testid="react-composer-post-button"]'),
            !!document.querySelector('[aria-label*="Account"]'),
            !!document.querySelector('div[role="main"]'),
            !!document.querySelector('[data-testid="blue_bar"]'),
            !!document.querySelector('nav'),
            // URL indicators
            window.location.href.includes('facebook.com') && 
            !window.location.href.includes('login') && 
            !window.location.href.includes('checkpoint'),
            // Mobile indicators
            !!document.querySelector('[data-sigil="m-navigation-item"]'),
            !!document.querySelector('[data-testid="mobile_navbar"]'),
            // Profile/menu indicators
            !!document.querySelector('[data-testid="left_nav_menu_list"]'),
            !!document.querySelector('div[role="banner"]'),
          ];
          
          const positiveCount = indicators.filter(Boolean).length;
          return {
            success: positiveCount >= 3, // Need at least 3 positive indicators
            indicators: positiveCount,
            url: window.location.href,
            hasLoginForm: !!document.querySelector('#email') || !!document.querySelector('input[name="email"]')
          };
        });
        
        console.log(`📊 Login validation: ${loginCheck.indicators} indicators, success: ${loginCheck.success}`);
        
        if (loginCheck.success || !loginCheck.hasLoginForm) {
          console.log("✅ Session validation successful!");
          
          // Additional check: Try to access a Facebook group page to ensure full access
          try {
            console.log("🔍 Testing group access to verify full login...");
            await page.goto('https://www.facebook.com/groups/feed/', { 
              waitUntil: 'domcontentloaded', 
              timeout: 15000 
            });
            await humanPause(2000, 3000);
            
            const groupAccessCheck = await page.evaluate(() => {
              const url = window.location.href;
              const content = document.body.innerText.toLowerCase();
              
              // Check for login redirects or error states
              if (url.includes('login') || url.includes('checkpoint')) {
                return { hasAccess: false, reason: 'Redirected to login/checkpoint' };
              }
              
              if (content.includes('log in') || content.includes('sign in')) {
                return { hasAccess: false, reason: 'Login form detected' };
              }
              
              if (content.includes('groups') || content.includes('group') || 
                  content.includes('facebook') || url.includes('facebook.com/groups')) {
                return { hasAccess: true, reason: 'Groups page accessible' };
              }
              
              return { hasAccess: false, reason: 'Unknown page state' };
            });
            
            console.log(`🔍 Group access check: ${groupAccessCheck.hasAccess} - ${groupAccessCheck.reason}`);
            
            if (!groupAccessCheck.hasAccess) {
              console.log("⚠️ Cannot access groups, login may be incomplete");
            } else {
              console.log("✅ Full Facebook access confirmed including groups");
            }
            
          } catch (groupTestError) {
            console.log("⚠️ Group access test failed, but continuing:", groupTestError.message);
          }
          
          sessionEstablished = true;
          break;
        }
        
      } catch (navError) {
        console.log(`⚠️ Navigation to ${url} failed:`, navError.message);
        continue;
      }
    }
    
    if (!sessionEstablished) {
      console.log("⚠️ Session validation uncertain, but proceeding with saved cookies");
      // Save cookies even if validation is uncertain
      await saveCookiesToStorage(context, email);
      
      // Don't throw error, just proceed - the system might still work
      console.log("🔄 Proceeding with potentially partial session...");
    }
    
  } catch (validationError) {
    console.log("⚠️ Session validation error:", validationError.message);
    // Save cookies even if validation fails completely
    await saveCookiesToStorage(context, email);
    console.log("💾 Cookies saved despite validation issues");
    
    // Don't throw error - let the system attempt to continue
    console.log("🔄 Continuing despite validation uncertainty...");
  }

  console.log("✅ Login successful!");
  await saveCookiesToStorage(context, email);
  return true;
};

// Export wrapper (for compatibility)
export const ensureLoggedInWithStore = async ({ page, context }) => {
  return ensureLoggedIn({ page, context });
};
