import React, { useEffect, useState } from 'react';
import { getBrandingConfig } from '@/components/lib/brandingStore';
import { headerOn } from '@/components/lib/publicRoutes';

export default function PublicHeader(){
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Remove any fallback headers
    const fb = document.getElementById('pub-header-fallback');
    if (fb) fb.remove();
    
    // Check if user is authenticated (simple check for demo session)
    const demoSession = localStorage.getItem('demoSession');
    if (demoSession) {
      try {
        const session = JSON.parse(demoSession);
        const now = new Date();
        const exp = new Date(session.exp);
        setAuthed(now < exp);
      } catch (e) {
        setAuthed(false);
      }
    }
    setLoading(false);
  }, []);

  const path = (typeof window !== 'undefined' ? window.location.pathname : '/').toLowerCase();
  
  // Early return after all hooks have been called
  if (!headerOn(path)) return null;

  const b = getBrandingConfig();
  const t = b?.theme || {};
  const logo = (t.darkMode && b?.logo?.dark?.file) ? b.logo.dark.file : (b?.logo?.light?.file || '');

  return (
    <header id="pub-header-forced" className="cabpoe-pub-header" role="banner" aria-label="Public header">
      <a href="/" className="cabpoe-pub-left">
        {logo ? <img src={logo} alt="CABPOE™ logo" className="cabpoe-logo"/> : <div className="cabpoe-logo-fallback">C</div>}
        <span className="cabpoe-title">CABPOE<span className="cabpoe-tm">™</span> Console</span>
      </a>
      <div className="cabpoe-pub-right">
        {loading ? (
          <div className="cabpoe-btn" style={{ opacity: 0.5 }}>...</div>
        ) : authed ? (
          <button className="cabpoe-btn" onClick={() => window.location.assign('/dashboard')}>Dashboard</button>
        ) : (
          <button className="cabpoe-btn" onClick={() => window.location.assign('/demo-login')}>Sign In</button>
        )}
      </div>
    </header>
  );
}