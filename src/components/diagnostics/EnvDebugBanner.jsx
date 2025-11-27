import React, { useState, useEffect } from 'react';
import { getAppConfig } from '@/components/lib/base44Client';

export function EnvDebugBanner() {
  const urlParams = new URLSearchParams(window.location.search);
  const showDebug = urlParams.get('debug') === '1';
  
  const [forceRead, setForceRead] = useState(() => localStorage.getItem('FORCE_READ') === '1');

  // Derive config properties for the banner
  const isPreview = window.location.host.includes('base44');
  const config = getAppConfig();

  useEffect(() => {
    if (showDebug) {
      console.log('[CABPOE] Debug mode detected (prod) — banner mounted', {
        host: window.location.host,
        path: window.location.pathname,
        search: window.location.search
      });
    }
  }, [showDebug]);

  // Check FORCE_READ status on mount and when localStorage changes
  useEffect(() => {
    const checkForceRead = () => {
      setForceRead(localStorage.getItem('FORCE_READ') === '1');
    };

    checkForceRead();
    
    // Listen for storage events to sync across tabs
    window.addEventListener('storage', checkForceRead);
    return () => window.removeEventListener('storage', checkForceRead);
  }, []);

  const toggleForceRead = () => {
    if (forceRead) {
      localStorage.removeItem('FORCE_READ');
      console.log('[CABPOE] FORCE_READ disabled');
    } else {
      localStorage.setItem('FORCE_READ', '1');
      console.log('[CABPOE] FORCE_READ enabled');
    }
    setForceRead(!forceRead);
    window.location.reload();
  };

  // REMOVED: Mini indicator when FORCE_READ is on but debug is hidden
  // Only show the debug banner when ?debug=1 is in URL

  // Only show when ?debug=1 is explicitly set
  if (!showDebug) return null;

  const styles = "fixed top-0 left-0 w-full bg-red-600 text-white p-2 flex items-center justify-between z-[9999]";

  return (
    <div className={styles}>
      <div className="flex items-center gap-2">
        <code className="text-xs">
          env:{isPreview ? 'preview' : 'production'} | 
          app:{config.appId?.substring(0, 8)} | 
          arch:single-tenant
        </code>
        {forceRead && (
          <span className="px-2 py-1 bg-yellow-400 text-yellow-900 rounded text-xs font-bold">
            FORCE_READ
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={toggleForceRead}
          className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors"
        >
          {forceRead ? 'Disable' : 'Enable'} FORCE_READ
        </button>
        <button 
          onClick={() => window.location.href = '/diag-lite?debug=1'}
          className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors"
        >
          Diagnostics
        </button>
      </div>
    </div>
  );
}