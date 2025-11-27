import React from 'react';
const KEY = 'CABPOE_BRANDING_PUBLIC';

function isBadUrl(u) {
  return typeof u === 'string' && (/^data:/i.test(u) || /^blob:/i.test(u) || u.length > 2048);
}
function takeUrl(v) {
  let u = '';
  if (!v) return '';
  if (typeof v === 'string') u = v;
  else if (typeof v === 'object') {
    u = v.url || v.file || v.path || '';
    if (!u && v.file && typeof v.file === 'object') u = v.file.url || '';
  }
  if (!u) return '';
  if (isBadUrl(u)) return '';   // drop base64/blob/oversized
  return u;
}
function slimBranding(b) {
  const out = {};
  // logo
  if (b?.logo) {
    const L = {};
    const light = takeUrl(b.logo?.light?.file) || takeUrl(b.logo?.light);
    const file  = takeUrl(b.logo?.file)        || takeUrl(b.logo);
    if (light) L.light = { file: light };
    if (file)  L.file  = file;
    if (Object.keys(L).length) out.logo = L;
  }
  // favicon
  if (b?.favicon) {
    const F = {};
    const main = takeUrl(b.favicon?.file) || takeUrl(b.favicon?.url);
    if (main) F.file = main;
    const v = b.favicon?.variants || {};
    const V = {};
    const v16  = takeUrl(v['16']);  if (v16)  V['16']  = v16;
    const v32  = takeUrl(v['32']);  if (v32)  V['32']  = v32;
    const v48  = takeUrl(v['48']);  if (v48)  V['48']  = v48;
    const v180 = takeUrl(v['180']); if (v180) V['180'] = v180;
    if (Object.keys(V).length) F.variants = V;
    if (Object.keys(F).length) out.favicon = F;
  }
  // socials (tiny strings)
  if (b?.socials) {
    const s = {};
    ['facebook','instagram','linkedin','twitter','youtube'].forEach(k=>{
      const u = takeUrl(b.socials[k]);
      if (u) s[k] = u;
    });
    if (Object.keys(s).length) out.socials = s;
  }
  return out;
}
function writeSlimSnapshot(branding) {
  // clean old heavy keys
  try { localStorage.removeItem('preview_' + KEY); } catch {}
  try { localStorage.removeItem(KEY); } catch {}
  const slim = slimBranding(branding || {});
  const json = JSON.stringify(slim);
  localStorage.setItem(KEY, json);
  // publish to global + event
  window.__CABPOE_BRANDING__ = slim;
  window.dispatchEvent(new CustomEvent('branding-updated', { detail: slim }));
}

export default function BrandingPublisher({ branding }) {
  // expose helper
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    window.__publishBrandingToPublicSlim = () => {
      try { writeSlimSnapshot(branding); console.log('[Branding] Slim snapshot synced.'); }
      catch (e) {
        console.error('Branding publish failed', e);
        alert('Branding publish failed. Ensure logo/favicon are real URLs (no base64) and try again.');
      }
    };
  }, [branding]);

  return (
    <div className="mt-6 p-4 border rounded-lg bg-blue-50">
      <h4 className="font-medium mb-2">Public Branding</h4>
      <button
        type="button"
        className="rounded-md border border-blue-600/30 bg-white px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"
        onClick={() => window.__publishBrandingToPublicSlim?.()}
      >
        Sync Branding to Public (Slim)
      </button>
      <p className="mt-2 text-xs text-blue-900/80">
        Stores ONLY small public URLs (no base64). If it fails, remove base64 images from Branding and re-upload so they have proper URLs.
      </p>
    </div>
  );
}