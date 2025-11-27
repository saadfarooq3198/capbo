import { useEffect, useState } from 'react';

const KEY = 'cabpoe_cookie_consent_v1';

export default function PublicCookiePrefs(){
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState({ necessary: true, analytics: false, marketing: false });

  useEffect(()=>{
    const handler = ()=>setOpen(true);
    
    // Handle clicks on cookie preferences buttons
    document.addEventListener('click', (e)=>{
      const t = e.target; 
      if (t && t.closest && t.closest('[data-cookie-prefs]')) {
        e.preventDefault();
        setOpen(true);
      }
    });
    
    window.addEventListener('open-cookie-prefs', handler);
    
    // Load existing preferences
    try{
      const v = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (v) setPrefs({ necessary: true, analytics: !!v.analytics, marketing: !!v.marketing });
    } catch {}
    
    return ()=>window.removeEventListener('open-cookie-prefs', handler);
  },[]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1100] bg-black/40 flex items-center justify-center" onClick={()=>setOpen(false)}>
      <div className="w-[92%] max-w-[560px] rounded-xl bg-white p-5 shadow-xl" onClick={(e)=>e.stopPropagation()}>
        <h3 className="mb-2 text-lg font-semibold">Cookie Preferences</h3>
        <p className="mb-4 text-[0.95rem] text-gray-600">
          Choose which categories to allow. Necessary cookies are always on.
        </p>
        
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked readOnly className="accent-black"/>
            <span><strong>Necessary</strong> — required for core functionality.</span>
          </label>
          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={prefs.analytics} 
              onChange={e=>setPrefs(p=>({...p, analytics:e.target.checked}))} 
              className="accent-black"
            />
            <span><strong>Analytics</strong> — helps us measure usage.</span>
          </label>
          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={prefs.marketing} 
              onChange={e=>setPrefs(p=>({...p, marketing:e.target.checked}))} 
              className="accent-black"
            />
            <span><strong>Marketing</strong> — personalization where applicable.</span>
          </label>
        </div>
        
        <div className="mt-4 flex justify-end gap-2">
          <button className="rounded-lg border border-black/15 px-3 py-1.5 hover:bg-gray-50 transition-colors" onClick={()=>setOpen(false)}>
            Cancel
          </button>
          <button className="rounded-lg border border-black/15 px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            onClick={()=>{
              localStorage.setItem(KEY, JSON.stringify({ status:'accepted', necessary:true, analytics:prefs.analytics, marketing:prefs.marketing }));
              setOpen(false);
            }}>Save</button>
        </div>
      </div>
    </div>
  );
}