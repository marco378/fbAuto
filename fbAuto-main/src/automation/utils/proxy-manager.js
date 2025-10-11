// Proxy rotation to avoid 2FA detection
export const getRandomProxy = () => {
  // Free proxy list (replace with premium proxies for production)
  const proxies = [
    null, // No proxy (direct connection)
    // Add proxy servers here if needed
    // { server: 'proxy1.example.com:8080' },
    // { server: 'proxy2.example.com:8080' },
  ];
  
  return proxies[Math.floor(Math.random() * proxies.length)];
};

export const createContextWithProxy = async (browser) => {
  const proxy = getRandomProxy();
  
  const contextOptions = {
    viewport: { width: 1366, height: 768 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    locale: "en-US",
    geolocation: { latitude: 40.7128, longitude: -74.0060 },
    permissions: ['geolocation'],
  };
  
  if (proxy) {
    contextOptions.proxy = proxy;
    console.log(`🌐 Using proxy: ${proxy.server}`);
  }
  
  return await browser.newContext(contextOptions);
};