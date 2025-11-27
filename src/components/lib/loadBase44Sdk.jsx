// Simplified SDK detection for Base44 platform
export function isCustomDomain() {
  return !window.location.hostname.includes('base44.app');
}

export function isProduction() {
  return isCustomDomain() || window.location.hostname === 'cabpoe.com';
}

// Check if Base44 SDK/platform is available
export function checkBase44Availability() {
  return {
    hasBase44SDK: typeof window.Base44SDK !== 'undefined',
    hasBase44Global: typeof window.__BASE44_SDK !== 'undefined',
    hasEntityImports: true, // Assume true since imports work
    environment: isProduction() ? 'production' : 'preview'
  };
}