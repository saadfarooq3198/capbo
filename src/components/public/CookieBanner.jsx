import React, { useState, useEffect } from 'react';
import { isPublicPath } from '@/components/lib/publicRoutes';

export default function CookieBanner() {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    if (!isPublicPath()) return;
    
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now()
    }));
    setShow(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now()
    }));
    setShow(false);
  };

  const handlePreferences = () => {
    const event = new CustomEvent('show-cookie-preferences');
    window.dispatchEvent(event);
  };

  if (!show || !isPublicPath()) return null;

  return (
    <div className="cookie-banner">
      <div className="cb-content">
        <div className="cb-text">
          <p>
            We use cookies to enhance your experience and analyze site usage. 
            By continuing, you consent to our use of cookies.
          </p>
        </div>
        <div className="cb-actions">
          <button className="cb-btn cb-accept" onClick={handleAccept}>
            Accept All
          </button>
          <button className="cb-btn cb-reject" onClick={handleReject}>
            Reject All
          </button>
          <button className="cb-btn cb-prefs" onClick={handlePreferences}>
            Preferences
          </button>
        </div>
      </div>
      <style>{`
        .cookie-banner{position:fixed;bottom:0;left:0;right:0;z-index:50;background:#fff;border-top:1px solid #e5e7eb;padding:16px;box-shadow:0 -4px 6px -1px rgba(0,0,0,0.1)}
        .cb-content{display:flex;justify-content:space-between;align-items:center;gap:16px;max-width:1200px;margin:0 auto}
        .cb-text p{margin:0;font-size:14px;color:#374151}
        .cb-actions{display:flex;gap:8px}
        .cb-btn{padding:8px 16px;border-radius:6px;border:1px solid #d1d5db;background:#fff;cursor:pointer;font-size:14px;transition:all 0.2s}
        .cb-accept{background:#10b981;color:#fff;border-color:#10b981}
        .cb-accept:hover{background:#059669}
        .cb-reject{background:#ef4444;color:#fff;border-color:#ef4444}
        .cb-reject:hover{background:#dc2626} 
        .cb-prefs:hover{background:#f3f4f6}
        @media (max-width:768px){.cb-content{flex-direction:column;text-align:center}.cb-actions{flex-wrap:wrap;justify-content:center}}
      `}</style>
    </div>
  );
}