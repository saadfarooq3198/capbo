import { useEffect, useState } from 'react';
import useBranding from './useBranding';
import { pickLogo, pickFaviconCandidates, pickSocials } from './brandingDeep';

export default function PublicDebugOverlay(){
  const [open, setOpen] = useState(false);
  const branding = useBranding();

  useEffect(()=>{
    const onKey = (e)=>{ if (e.altKey && (e.key==='l' || e.key==='L')) setOpen(v=>!v); };
    window.addEventListener('keydown', onKey);
    return ()=>window.removeEventListener('keydown', onKey);
  },[]);

  if (!open) return null;
  const logo = pickLogo(branding);
  const favs = pickFaviconCandidates(branding);
  const socials = pickSocials(branding);

  return (
    <div className="fixed inset-0 z-[200000] bg-black/40 flex items-center justify-center" onClick={()=>setOpen(false)}>
      <div className="w-[92%] max-w-[720px] rounded-xl bg-white p-5 shadow-2xl" onClick={(e)=>e.stopPropagation()}>
        <h3 className="mb-3 text-lg font-semibold">Public Branding Debug</h3>
        <pre className="max-h-[60vh] overflow-auto bg-black/5 p-3 rounded text-xs">
{JSON.stringify({ logo, faviconCandidates: favs, socials }, null, 2)}
        </pre>
        <p className="mt-3 text-sm opacity-80">Press Alt+L again to hide.</p>
      </div>
    </div>
  );
}