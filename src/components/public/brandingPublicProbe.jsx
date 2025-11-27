export function getPublicBrandingCandidates() {
  // Order matters: most likely first
  const cands = [
    ['window.__CABPOE_BRANDING__', typeof window !== 'undefined' ? window.__CABPOE_BRANDING__ : undefined],
    ['window.Branding',           typeof window !== 'undefined' ? window.Branding : undefined],
    ['window.App?.branding',      typeof window !== 'undefined' && window.App ? window.App.branding : undefined],
    ['window.__APP_CONFIG__?.branding', typeof window !== 'undefined' && window.__APP_CONFIG__ ? window.__APP_CONFIG__.branding : undefined],
    ['window.__BASE44__?.branding',     typeof window !== 'undefined' && window.__BASE44__ ? window.__BASE44__.branding : undefined],
  ];
  return cands.filter(([,v]) => v && typeof v === 'object');
}

// extract string-ish url from known shapes
function valToUrl(v) {
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

function absolutize(u) {
  if (!u || typeof window === 'undefined') return u;
  if (/^https?:\/\//i.test(u)) return u;
  const origin = window.location.origin || '';
  return u.startsWith('/') ? origin + u : origin + '/' + u;
}

export function pickPublicLogoUrl(branding) {
  const logo = branding?.logo || {};
  const light = valToUrl(logo.light?.file) || valToUrl(logo.light?.url);
  const base  = valToUrl(logo.file)       || valToUrl(logo.url);
  const chosen = light || base || '';
  return absolutize(chosen);
}

export function pickPublicFavicon(branding) {
  const fav = branding?.favicon || {};
  const main = valToUrl(fav.file) || valToUrl(fav.url);
  const v = fav.variants || {};
  const v16  = valToUrl(v['16']);
  const v32  = valToUrl(v['32']);
  const v48  = valToUrl(v['48']);
  const v180 = valToUrl(v['180']);
  return {
    main: absolutize(main || ''),
    v16 : absolutize(v16  || ''),
    v32 : absolutize(v32  || ''),
    v48 : absolutize(v48  || ''),
    v180: absolutize(v180 || ''),
  };
}

export function resolvePublicBranding() {
  const cands = getPublicBrandingCandidates();
  for (const [name, obj] of cands) {
    const logo = pickPublicLogoUrl(obj);
    const fav  = pickPublicFavicon(obj);
    const hasLogo = !!logo;
    const hasFav  = !!(fav.main || fav.v16 || fav.v32 || fav.v48 || fav.v180);
    if (hasLogo || hasFav) {
      return { source: name, branding: obj, logo, favicon: fav };
    }
  }
  // If none had usable fields, still return first candidate for visibility
  const [fallbackName, fallbackObj] = cands[0] || ['(none)', undefined];
  return { source: fallbackName, branding: fallbackObj, logo: '', favicon: {main:'',v16:'',v32:'',v48:'',v180:''} };
}