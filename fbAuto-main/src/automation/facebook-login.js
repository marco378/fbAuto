// src/automation/facebook-login.js
import { FB } from "../config/facebook-config.js";
import { LoginSelectors } from "./utils/selectors.js";
import { humanPause } from "./utils/delays.js";
import fs from "fs";
import path from "path";

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
    
    // Common selectors for 2FA "Continue" or "Skip" buttons
    const autoClickSelectors = [
      'button[name="__CONFIRM__"]',
      '#checkpointSubmitButton',
      'button:has-text("Continue")',
      'button:has-text("Skip")',
      'button:has-text("Not Now")',
      'button:has-text("Skip for now")',
      'a:has-text("Skip")',
      'a:has-text("Not now")',
      '[data-testid="sec_ac_button"]',
      '[role="button"]:has-text("Continue")',
      '[role="button"]:has-text("Skip")',
    ];
    
    for (const selector of autoClickSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          console.log(`🎯 Found auto-clickable element: ${selector}`);
          await element.click();
          await humanPause(2000, 3000);
          
          // Check if this resolved the challenge
          if (await hasFacebookSession(page.context())) {
            console.log("✅ 2FA automatically resolved!");
            return true;
          }
        }
      } catch (err) {
        // Continue to next selector if this one fails
        continue;
      }
    }
    
    // Try to dismiss any overlays or modals
    const dismissSelectors = [
      '[aria-label="Close"]',
      '[data-testid="modal_close_button"]',
      'button:has-text("✕")',
      'button:has-text("×")',
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

  // Try mobile user agent first (often bypasses 2FA)
  await page.setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1");
  
  // Add device fingerprinting
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    delete navigator.__proto__.webdriver;
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

  // Fresh login
  console.log("🔐 Proceeding with fresh login...");
  await page.goto(FB.base, { waitUntil: "load", timeout: 30000 });

  if (await hasFacebookSession(context)) {
    console.log("✅ Session already active, no login form needed");
    await saveCookiesToStorage(context, email);
    return true;
  }

  // Fill login form
  await page.locator(LoginSelectors.email).first().fill(email);
  await humanPause(800);
  await page.locator(LoginSelectors.password).first().fill(password);
  await humanPause(800);
  await page.locator(LoginSelectors.loginButton).first().click();

  await page.waitForTimeout(4000);

  if (await detectChallenges(page)) {
    console.log("⚠️ Challenge detected, attempting automatic resolution...");
    
    // Try to handle common 2FA scenarios automatically
    const handled = await handleCommon2FAScenarios(page);
    
    if (!handled) {
      console.log("🔧 Please complete the 2FA/checkpoint in the browser window");
      console.log("🔧 The automation will automatically continue once completed");

      // Wait up to 10 minutes for manual completion with better feedback
      for (let i = 0; i < 60; i++) {
        await page.waitForTimeout(10000); // Wait 10 seconds

        if (await hasFacebookSession(context)) {
          console.log("✅ Challenge completed, continuing...");
          break;
        }

        // Provide progress feedback every minute
        if (i % 6 === 0 && i > 0) {
          console.log(`⏳ Still waiting for 2FA completion... ${Math.round((i + 1) / 6)} minutes elapsed`);
        }

        if (i === 59) {
          console.log("⚠️ 2FA timeout reached, but continuing anyway...");
          // Don't throw error, just continue and let the system handle it
          break;
        }
      }
    }
  }

  // Re-check session with more tolerance
  try {
    await page.goto("https://www.facebook.com/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(3000);

    if (!(await hasFacebookSession(context))) {
      console.log("⚠️ Session validation failed after 2FA handling");
      console.log("🔄 Attempting one more navigation to establish session...");
      
      // One more attempt with longer timeout
      await page.goto("https://www.facebook.com/", { waitUntil: "load", timeout: 60000 });
      await humanPause(5000, 8000);
      
      if (!(await hasFacebookSession(context))) {
        console.log("❌ Unable to establish valid session - but saving cookies anyway");
        await saveCookiesToStorage(context, email);
        throw new Error("❌ Login session not fully established");
      }
    }
  } catch (navError) {
    console.log("⚠️ Navigation error during session validation:", navError.message);
    // Save cookies even if validation fails
    await saveCookiesToStorage(context, email);
    throw navError;
  }

  console.log("✅ Login successful!");
  await saveCookiesToStorage(context, email);
  return true;
};

// Export wrapper (for compatibility)
export const ensureLoggedInWithStore = async ({ page, context }) => {
  return ensureLoggedIn({ page, context });
};
