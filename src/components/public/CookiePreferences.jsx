import React, { useEffect, useState } from 'react';

export default function CookiePreferences(){
  const [open, setOpen] = useState(false);
  
  useEffect(() => {
    const on = (e) => { 
      const t = e.target;
      if (t?.closest('[data-cookie-prefs]')) setOpen(true); 
    };
    document.addEventListener('click', on);
    return () => document.removeEventListener('click', on);
  }, []);
  
  if (!open) return null;
  
  return (
    <div className="cabpoe-cp-backdrop" onClick={() => setOpen(false)}>
      <div className="cabpoe-cp" onClick={e => e.stopPropagation()}>
        <h3>Cookie Preferences</h3>
        <p>We use cookies to enhance your experience. You can adjust your cookie settings here.</p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button className="cabpoe-btn" onClick={() => setOpen(false)}>Accept All</button>
          <button className="cabpoe-btn" onClick={() => setOpen(false)}>Close</button>
        </div>
      </div>
    </div>
  );
}