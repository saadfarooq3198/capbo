import { useEffect, useState } from 'react';

const KEY = 'cabpoe_cookie_consent_v1';

export default function PublicCookieBanner(){
  const [open, setOpen] = useState(false);
  
  useEffect(()=>{
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!v || v.status !== 'accepted') setOpen(true);
    } catch { setOpen(true); }
  },[]);
  
  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[1000] bg-white/95 backdrop-blur-sm border-t border-black/10">
      <div className="mx-auto max-w-[1200px] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-700">
          We use cookies to operate the site, understand usage, and improve performance. Manage your choices anytime in Cookie Preferences.
        </p>
        <div className="flex items-center gap-2">
          <button className="rounded-lg border border-black/15 px-3 py-1.5 bg-white hover:bg-gray-50 transition-colors text-sm font-medium"
                  onClick={()=>{
                    localStorage.setItem(KEY, JSON.stringify({ status: 'accepted', necessary:true, analytics:false, marketing:false }));
                    setOpen(false);
                  }}>Accept necessary</button>
          <button className="rounded-lg border border-black/15 px-3 py-1.5 bg-white hover:bg-gray-50 transition-colors text-sm font-medium"
                  onClick={()=>{
                    const ev = new Event('open-cookie-prefs'); window.dispatchEvent(ev);
                  }}>Preferences</button>
          <button className="rounded-lg border border-black/15 px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium"
                  onClick={()=>{
                    localStorage.setItem(KEY, JSON.stringify({ status: 'accepted', necessary:true, analytics:true, marketing:true }));
                    setOpen(false);
                  }}>Accept all</button>
        </div>
      </div>
    </div>
  );
}