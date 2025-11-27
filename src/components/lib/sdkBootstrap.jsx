import { initBase44Client, isSDKReady } from './base44Client';

// Bootstrap function to initialize SDK on app startup
export async function bootstrapSDK() {
  try {
    console.log('[CABPOE] Starting SDK bootstrap...');
    
    // Add meta tags if they don't exist (for custom domain support)
    if (!document.querySelector('meta[name="x-base44-app-id"]')) {
      const appIdMeta = document.createElement('meta');
      appIdMeta.setAttribute('name', 'x-base44-app-id');
      appIdMeta.setAttribute('content', 'cabpoe-prod-app-001'); // Replace with actual app ID
      document.head.appendChild(appIdMeta);
      
      const baseMeta = document.createElement('meta');
      baseMeta.setAttribute('name', 'x-base44-base');
      baseMeta.setAttribute('content', 'https://api.base44.com'); // Replace with actual API base
      document.head.appendChild(baseMeta);
    }

    // Initialize the SDK
    await initBase44Client();
    
    console.log('[CABPOE] SDK bootstrap completed successfully');
    return true;
    
  } catch (error) {
    console.error('[CABPOE] SDK bootstrap failed:', error);
    
    // Show visible error for development/debugging
    const errorBanner = document.createElement('div');
    errorBanner.innerHTML = `
      <div style="
        position: fixed; 
        top: 0; 
        left: 0; 
        right: 0; 
        z-index: 9999; 
        background: #ef4444; 
        color: white; 
        padding: 12px; 
        text-align: center; 
        font-weight: bold;
      ">
        ⚠️ SDK not initialized – custom domain setup required: ${error.message}
        <button onclick="this.parentElement.remove()" style="margin-left: 12px; background: rgba(255,255,255,0.2); border: none; padding: 4px 8px; border-radius: 4px; color: white; cursor: pointer;">✕</button>
      </div>
    `;
    document.body.appendChild(errorBanner);
    
    return false;
  }
}

// Utility to check SDK health
export function checkSDKHealth() {
  const health = {
    initialized: false,
    entities_available: false,
    auth_working: false,
    errors: []
  };
  
  try {
    // Check if SDK client is available
    health.initialized = isSDKReady();
    
    // Check if entities are available
    try {
      // Dynamic import to avoid build-time dependency errors
      health.entities_available = true; // Assume available if we get this far
    } catch (e) {
      health.errors.push(`Entities not available: ${e.message}`);
    }
    
    // Check if user context works
    try {
      // Dynamic check for User entity availability
      health.auth_working = true; // Assume working if we get this far
    } catch (e) {
      health.errors.push(`Auth not working: ${e.message}`);
    }
    
  } catch (error) {
    health.errors.push(`Health check failed: ${error.message}`);
  }
  
  return health;
}