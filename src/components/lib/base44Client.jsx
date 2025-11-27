// Work with existing Base44 platform setup instead of external scripts

let _client = null;
let _ready = false;
let _user = null;

export function getAppConfig() {
  // Try meta tags first (preferred for custom domains)
  let appId = document.querySelector('meta[name="x-base44-app-id"]')?.getAttribute('content');
  let apiBase = document.querySelector('meta[name="x-base44-api-base"]')?.getAttribute('content');
  
  // Fallback to window globals (set by platform)
  if (!appId) appId = window.__BASE44_APP_ID;
  if (!apiBase) apiBase = window.__BASE44_API_BASE;

  // Environment-specific defaults
  if (!appId || !apiBase) {
    if (window.location.hostname.includes('base44.app')) {
      return {
        appId: 'preview-environment',
        apiBase: 'https://base44.app',
        isPreview: true
      };
    } else if (window.location.hostname.includes('cabpoe.com')) {
      appId = appId || '68b2e3b40b04f514a6720113';
      apiBase = apiBase || 'https://app.base44.com';
    }
  }

  if (!appId || !apiBase) {
    return {
      appId: '68b2e3b40b04f514a6720113',
      apiBase: 'https://app.base44.com',
      isProduction: true
    };
  }

  return { appId, apiBase };
}

export function initBase44Client() {
  // Return immediately if already initialized
  if (_ready && _client) {
    console.log('[CABPOE] SDK already ready');
    return Promise.resolve(_client);
  }

  try {
    const config = getAppConfig();
    console.log('[CABPOE] SDK initializing SYNCHRONOUSLY with config:', config);

    // Check if we're in the Base44 platform environment
    if (window.__BASE44_SDK) {
      _client = window.__BASE44_SDK;
      console.log('[CABPOE] Using platform SDK');
    } else if (typeof window.Base44SDK !== 'undefined') {
      _client = window.Base44SDK;
      console.log('[CABPOE] Using global Base44SDK');
    } else {
      // Create a minimal client wrapper
      _client = {
        config,
        initialized: true
      };
      console.log('[CABPOE] Using minimal client wrapper (no global SDK found)');
    }

    // Mark SDK as ready IMMEDIATELY - no async operations
    _ready = true;
    console.log('[CABPOE] SDK marked as ready SYNCHRONOUSLY');

    // Load user in background (non-blocking)
    setTimeout(async () => {
      try {
        const { User } = await import('@/api/entities');
        _user = await User.me();
        console.log('[CABPOE] User loaded in background:', _user?.email);
      } catch (error) {
        console.warn('[CABPOE] Could not load user in background:', error);
      }
    }, 100);

    return Promise.resolve(_client);

  } catch (error) {
    console.error('[CABPOE] SDK initialization failed:', error);
    
    // Create fallback client
    _client = {
      config: getAppConfig(),
      initialized: false,
      error: error.message
    };

    _ready = true;
    
    return Promise.resolve(_client);
  }
}

// NO MORE WAITING - just check if ready
export function whenSdkReady() {
  if (_ready) {
    return Promise.resolve(_client);
  }
  
  // Initialize if not already
  return initBase44Client();
}

export function getClientOrThrow() {
  if (!_ready || !_client) {
    throw new Error("SDK not initialized - call initBase44Client() first");
  }
  return _client;
}

export function isSDKReady() {
  return _ready && _client !== null;
}

export async function getCurrentUser() {
  // If user not loaded yet, try to load it now
  if (!_user) {
    try {
      const { User } = await import('@/api/entities');
      _user = await User.me();
    } catch (error) {
      console.warn('[CABPOE] Could not load user:', error);
    }
  }
  return _user;
}

export function getSDKIdentifiers() {
  try {
    const config = getAppConfig();
    
    return {
      app_id: config.appId || '68b2e3b40b04f514a6720113',
      base_url: config.apiBase || 'https://app.base44.com',
      environment: config.isPreview ? 'preview' : 'production',
      initialized: _ready,
      sdk_version: _ready ? 'platform-sdk' : 'not-loaded',
      user_email: _user?.email || 'not-loaded',
      user_role: _user?.role || 'not-loaded',
      user_app_role: _user?.app_role || 'not-loaded'
    };
  } catch (error) {
    return {
      app_id: '68b2e3b40b04f514a6720113',
      base_url: 'https://app.base44.com',
      environment: 'unknown',
      initialized: false,
      sdk_version: 'error',
      error: error.message
    };
  }
}

export async function pingAPI() {
  try {
    const config = getAppConfig();
    
    const url = `${config.apiBase}/api/health`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    return {
      status: response.status,
      ok: response.ok,
      url,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      ok: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}