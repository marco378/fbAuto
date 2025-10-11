// Device fingerprinting to bypass 2FA
export const addDeviceFingerprint = async (page) => {
  // Inject consistent device fingerprint
  await page.addInitScript(() => {
    // Override webdriver detection
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
    
    // Add consistent hardware specs
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      get: () => 8,
    });
    
    Object.defineProperty(navigator, 'deviceMemory', {
      get: () => 8,
    });
    
    // Consistent screen resolution
    Object.defineProperty(screen, 'width', {
      get: () => 1366,
    });
    
    Object.defineProperty(screen, 'height', {
      get: () => 768,
    });
    
    // Add trusted plugins
    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        {
          name: 'Chrome PDF Plugin',
          filename: 'internal-pdf-viewer',
          description: 'Portable Document Format',
        },
        {
          name: 'Native Client',
          filename: 'internal-nacl-plugin',
          description: 'Native Client',
        },
      ],
    });
    
    // Remove automation indicators
    delete navigator.__proto__.webdriver;
    
    // Add consistent canvas fingerprint
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type) {
      if (type === '2d') {
        const context = getContext.call(this, type);
        const originalToDataURL = context.canvas.toDataURL;
        context.canvas.toDataURL = function() {
          // Return consistent fingerprint
          return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        };
        return context;
      }
      return getContext.call(this, type);
    };
  });
};

// Simulate trusted user behavior
export const simulateHumanBehavior = async (page) => {
  // Random mouse movements
  await page.mouse.move(100, 100);
  await page.waitForTimeout(500);
  await page.mouse.move(200, 150);
  await page.waitForTimeout(300);
  
  // Simulate typing behavior with natural delays
  const simulateTyping = async (selector, text) => {
    await page.click(selector);
    for (const char of text) {
      await page.keyboard.type(char);
      await page.waitForTimeout(Math.random() * 100 + 50);
    }
  };
  
  return { simulateTyping };
};