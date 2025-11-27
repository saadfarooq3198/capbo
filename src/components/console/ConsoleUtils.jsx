export function getConsoleSettings() {
  try {
    const saved = localStorage.getItem('console_settings');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to parse console settings:', e);
  }
  
  return {
    consoleBaseUrl: ''
  };
}

export function resolveConsoleLinks(cfg) {
  const consoleUrl = cfg?.consoleBaseUrl?.trim();
  
  if (!consoleUrl) {
    return { safeHref: null, copies: [] };
  }
  
  try {
    const url = new URL(consoleUrl);
    // Remove trailing slash for consistency
    const cleanUrl = url.toString().replace(/\/+$/, '');
    return { 
      safeHref: cleanUrl, 
      copies: [cleanUrl] 
    };
  } catch (e) {
    console.error('Invalid console URL:', consoleUrl);
    return { safeHref: null, copies: [] };
  }
}