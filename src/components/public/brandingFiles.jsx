export function valToUrl(v) {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') {
    // common shapes: { url }, { file: "..." }, { file: { url: "..." } }, { path: "..." }
    if (v.url) return v.url;
    if (typeof v.file === 'string') return v.file;
    if (v.file && typeof v.file.url === 'string') return v.file.url;
    if (v.path) return v.path;
  }
  return '';
}

export function absolutize(u) {
  if (!u || typeof window === 'undefined') return u;
  if (/^https?:\/\//i.test(u)) return u;
  const origin = window.location.origin || '';
  return u.startsWith('/') ? origin + u : origin + '/' + u;
}

export function getBrandingLogoUrl(branding) {
  const b = branding || {};
  const logo = b.logo || {};
  const light = valToUrl(logo.light?.file) || valToUrl(logo.light?.url);
  const base  = valToUrl(logo.file) || valToUrl(logo.url);
  const chosen = light || base || '';
  return absolutize(chosen);
}

export function getBrandingFavicon(branding) {
  const b = branding || {};
  const fav = b.favicon || {};
  const main = valToUrl(fav.file) || valToUrl(fav.url);
  const variants = fav.variants || {};
  const v16  = valToUrl(variants['16']);
  const v32  = valToUrl(variants['32']);
  const v48  = valToUrl(variants['48']);
  const v180 = valToUrl(variants['180']);
  return {
    main: absolutize(main || ''),
    v16 : absolutize(v16  || ''),
    v32 : absolutize(v32  || ''),
    v48 : absolutize(v48  || ''),
    v180: absolutize(v180 || ''),
  };
}