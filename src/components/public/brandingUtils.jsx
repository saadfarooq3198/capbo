export function normalizeBranding(raw) {
  const b = raw || {};
  const theme = b.theme || {};
  const logoObj =
    b.logo || b.brand_logo || b.headerLogo || b.header_logo || b.brandingLogo || {};

  // Possible logo paths
  const logoCandidates = [
    logoObj?.light?.file,
    logoObj?.light?.url,
    logoObj?.file,
    logoObj?.url,
    logoObj?.dark?.file,
    logoObj?.dark?.url,
    b?.assets?.logo,
    b?.assets?.logoUrl,
    b?.public?.logo,
    b?.public?.logoUrl,
  ].filter(Boolean);

  // Choose light > file > url > dark
  let logo = logoCandidates[0] || '';

  // If the logo is a relative path, absolutize it
  if (logo && typeof window !== 'undefined' && !/^https?:\/\//i.test(logo)) {
    const origin = window.location.origin || '';
    if (logo.startsWith('/')) logo = origin + logo;
    else logo = origin + '/' + logo;
  }

  // Socials: accept various key names (…_url)
  const s = b.socials || b.social || b.social_links || {};
  const socials = {
    facebook: s.facebook || s.facebook_url || b.facebook || b.facebook_url || '',
    instagram: s.instagram || s.instagram_url || b.instagram || b.instagram_url || '',
    linkedin: s.linkedin || s.linkedin_url || b.linkedin || b.linkedin_url || '',
    twitter:  s.twitter  || s.twitter_url  || s.x || s.x_url || b.twitter || b.x || '',
    youtube:  s.youtube  || s.youtube_url  || b.youtube || b.youtube_url || '',
  };

  // Favicon candidates (NOT logo)
  const fav = b.favicon || b.siteIcon || b.appIcon || b.site_icon || b.app_icon || {};
  const faviconCandidates = [
    fav.file, fav.url,
    fav.ico, fav.png,
    b?.seo?.favicon, b?.seo?.siteIcon,
    b?.assets?.favicon, b?.assets?.faviconUrl,
  ].filter(Boolean);

  return { theme, logo, socials, faviconCandidates };
}