import { useEffect, useState } from 'react';
import { resolvePublicBranding } from './brandingPublicProbe';

export default function PublicBrandingDebug(){
  const [open, setOpen] = useState(false);
  const [snap, setSnap] = useState(null);

  useEffect(()=>{
    const onKey = (e)=>{ if (e.altKey && (e.key==='d' || e.key==='D')) {
      e.preventDefault();
      const r = resolvePublicBranding();
      setSnap({ source: r.source, logo: r.logo, favicon: r.favicon });
      setOpen(v=>!v);
    }};
    window.addEventListener('keydown', onKey);
    return ()=>window.removeEventListener('keydown', onKey);
  },[]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[2000] bg-black/40 flex items-center justify-center" onClick={()=>setOpen(false)}>
      <div className="w-[92%] max-w-[720px] rounded-xl bg-white p-5 shadow-2xl" onClick={(e)=>e.stopPropagation()}>
        <h3 className="mb-3 text-lg font-semibold">Public Branding Debug</h3>
        <pre className="max-h-[60vh] overflow-auto bg-black/5 p-3 rounded text-xs">
{JSON.stringify(snap, null, 2)}
        </pre>
        <p className="mt-3 text-sm opacity-80">Press Alt+D again to hide.</p>
      </div>
    </div>
  );
}