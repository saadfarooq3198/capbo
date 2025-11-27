const KEY = 'CABPOE_BRANDING_PUBLIC';

export function readBrandingFromLocalStorage() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function hydrateBrandingGlobal() {
  if (typeof window === 'undefined') return;
  const snap = readBrandingFromLocalStorage();
  if (snap && typeof snap === 'object') {
    window.__CABPOE_BRANDING__ = snap;
  }
}

function toAbs(u) {
  if (!u || typeof window === 'undefined') return '';
  if (/^https?:\/\//i.test(u)) return u;
  const origin = window.location.origin || '';
  return u.startsWith('/') ? origin + u : origin + '/' + u;
}

function pickUrl(v) {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') {
    if (typeof v.url === 'string') return v.url;
    if (typeof v.file === 'string') return v.file;
    if (v.file && typeof v.file.url === 'string') return v.file.url;
    if (typeof v.path === 'string') return v.path;
  }
  return '';
}

function getBrandingSource() {
  // prefer hydrated global, else LS
  const g = (typeof window !== 'undefined' ? window.__CABPOE_BRANDING__ : null);
  return g && Object.keys(g).length ? g : readBrandingFromLocalStorage() || {};
}

export function getLogoUrl() {
  const b = getBrandingSource();
  const logo = b.logo || {};
  const light = pickUrl(logo.light?.file) || pickUrl(logo.light);
  const base  = pickUrl(logo.file)       || pickUrl(logo);
  const url = light || base || '';
  return url ? toAbs(url) : '';
}

export function getFaviconSet() {
  const b = getBrandingSource();
  const fav = b.favicon || {};
  const main = pickUrl(fav.file) || pickUrl(fav.url);
  const v = fav.variants || {};
  const v16  = pickUrl(v['16']);
  const v32  = pickUrl(v['32']);
  const v48  = pickUrl(v['48']);
  const v180 = pickUrl(v['180']);
  const abs = (u)=> u ? toAbs(u) : '';
  return { main:abs(main), v16:abs(v16), v32:abs(v32), v48:abs(v48), v180:abs(v180) };
}