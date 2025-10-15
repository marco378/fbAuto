// Facebook login automation helper for server context
import { humanPause } from "./utils/delays.js";
import { prisma } from "../lib/prisma.js";

// --- ensureLoggedIn export added for automation ---
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
  if (typeof loadCookiesFromStorage === 'function') {
    const cookiesLoaded = await loadCookiesFromStorage(context, email);
    if (cookiesLoaded) {
      try {
        if (process.env.NODE_ENV === 'production') {
          await page.goto("https://www.facebook.com/", { waitUntil: "domcontentloaded", timeout: 60000 });
          await humanPause(3000, 5000);
          await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
        } else {
          await page.goto("https://www.facebook.com/", { waitUntil: "load", timeout: 30000 });
        }
        await page.waitForTimeout(2000);
        const isLoggedIn = await page.evaluate(() => {
          const indicators = [
            document.querySelector('[data-testid="react-composer-post-button"]'),
            document.querySelector('[aria-label*="Account"]'),
            document.querySelector('[data-testid="blue_bar"]'),
            document.querySelector('div[role="main"]'),
            !document.querySelector('#email'),
            !document.querySelector('input[name="email"]'),
          ];
          return indicators.filter(Boolean).length >= 3;
        });
        if (isLoggedIn) {
          if (typeof saveCookiesToStorage === 'function') await saveCookiesToStorage(context, email);
          return true;
        }
      } catch (navError) {
        await freshLogin(page, context, email, password);
        return true;
      }
      if (typeof hasFacebookSession === 'function' && await hasFacebookSession(context)) {
        if (typeof saveCookiesToStorage === 'function') await saveCookiesToStorage(context, email);
        return true;
      }
      if (typeof context.clearCookies === 'function') await context.clearCookies();
    }
  }
  // Fallback: just go to Facebook login page
  await page.goto("https://www.facebook.com/login", { waitUntil: "load", timeout: 30000 });
  await humanPause(1000, 2000);
  // You may want to add more login logic here as needed
  return true;
};

// Add any other exports or helpers as needed
