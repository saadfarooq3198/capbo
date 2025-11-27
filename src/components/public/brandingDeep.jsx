function isUrlLike(v) {
  return typeof v === 'string' && /^(https?:)?\/\//i.test(v) || (typeof v === 'string' && v.startsWith('/'));
}
export function absolutize(url) {
  if (!url || typeof window === 'undefined') return url;
  if (/^https?:\/\//i.test(url)) return url;
  const origin = window.location.origin || '';
  return url.startsWith('/') ? origin + url : origin + '/' + url;
}

// Deep-scan for all string urls in the object that match predicate
export function findUrlsDeep(obj, predicate = ()=>true, out = []) {
  if (!obj || typeof obj !== 'object') return out;
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (typeof v === 'string' && isUrlLike(v) && predicate(k, v)) out.push(v);
    else if (v && typeof v === 'object') findUrlsDeep(v, predicate, out);
  }
  return out;
}

export function pickLogo(branding) {
  // Prefer common logo fields first
  const known = [
    branding?.logo?.light?.file, branding?.logo?.light?.url,
    branding?.logo?.file, branding?.logo?.url,
    branding?.logo?.dark?.file, branding?.logo?.dark?.url,
    branding?.assets?.logo, branding?.assets?.logoUrl,
    branding?.public?.logo, branding?.public?.logoUrl,
    branding?.brand_logo, branding?.header_logo
  ].filter(Boolean);

  // Fallback: any image-ish url deep in branding that looks like logo
  const deep = findUrlsDeep(branding, (k,v)=>/(logo|brand)/i.test(k) || /\.(png|svg|jpg|jpeg|webp)(\?|$)/i.test(v));
  const candidates = [...known, ...deep].filter(Boolean);

  return candidates.length ? absolutize(candidates[0]) : '';
}

export function pickFaviconCandidates(branding) {
  const fav = branding?.favicon || branding?.siteIcon || branding?.appIcon || branding?.seo?.favicon || {};
  const known = [
    fav?.file, fav?.url, fav?.ico, fav?.png,
    branding?.seo?.siteIcon,
    branding?.assets?.favicon, branding?.assets?.faviconUrl
  ].filter(Boolean);
  const deep = findUrlsDeep(branding, (k,v)=>/(fav|icon)/i.test(k) || /favicon\.(ico|png)$/i.test(v));
  const candidates = [...known, ...deep].map(absolutize).filter(Boolean);
  return Array.from(new Set(candidates));
}

export function pickSocials(branding) {
  const s = branding?.socials || branding?.social || branding?.social_links || branding || {};
  const fromDeep = (name, hostRegex) => {
    // exact keys first
    const direct = s[name] || s[`${name}_url`] || s[name.toUpperCase()];
    if (direct) return direct;
    // deep scan any URL that contains the host
    const matches = findUrlsDeep(branding, (_k,v)=>hostRegex.test(v));
    return matches[0] || '';
  };
  return {
    facebook: fromDeep('facebook', /facebook\.com/i),
    instagram: fromDeep('instagram', /instagram\.com/i),
    linkedin: fromDeep('linkedin', /linkedin\.com/i),
    twitter:  fromDeep('twitter',  /(twitter|x)\.com/i),
    youtube:  fromDeep('youtube',  /youtube\.com|youtu\.be/i),
  };
}

// Preload an image URL; resolve true if load ok, false otherwise
export function preloadImg(src) {
  return new Promise(res => {
    if (!src) return res(false);
    const img = new Image();
    img.onload  = ()=>res(true);
    img.onerror = ()=>res(false);
    img.src = src;
  });
}