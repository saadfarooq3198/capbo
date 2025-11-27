

export function applyBrandingHead(branding) {
  const head = document.head;
  const fav = branding?.favicon || {};
  
  // Remove old icons
  head.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]').forEach(n => n.remove());
  
  const add = (rel, attrs) => {
    const l = document.createElement('link');
    l.rel = rel;
    Object.entries(attrs).forEach(([k, v]) => l.setAttribute(k, String(v)));
    head.appendChild(l);
  };

  // Prefer .ico if uploaded
  if (fav.file && /\.ico(\?|$)/i.test(fav.file)) {
    add('icon', { href: fav.file });
  }
  
  // PNG variants
  const v = fav.variants || {};
  if (v['16']) add('icon', { type: 'image/png', sizes: '16x16', href: v['16'] });
  if (v['32']) add('icon', { type: 'image/png', sizes: '32x32', href: v['32'] });
  if (v['48']) add('icon', { type: 'image/png', sizes: '48x48', href: v['48'] });
  if (v['180']) add('apple-touch-icon', { sizes: '180x180', href: v['180'] });

  // Theme color
  const theme = branding?.theme || {};
  let meta = head.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    head.appendChild(meta);
  }
  meta.setAttribute('content', theme.primary || '#000000');
}

export function getEffectiveSEO(pageKey, branding) {
    if (!branding || !branding.seoGlobal) return {};
    const globalSEO = branding.seoGlobal;
    const pageSEO = branding.seoPages?.[pageKey] || {};
    
    // Simple deep merge
    const merged = { ...globalSEO, ...pageSEO };
    merged.og = { ...globalSEO.og, ...pageSEO.og };
    merged.twitter = { ...globalSEO.twitter, ...pageSEO.twitter };

    // Fallbacks
    merged.og.title = merged.og.title || merged.title;
    merged.og.description = merged.og.description || merged.description;
    merged.og.url = merged.og.url || merged.canonical;
    merged.og.site_name = merged.og.site_name || merged.title;
    
    return merged;
}

export function applySEOHead(pageKey, branding) {
  const seo = getEffectiveSEO(pageKey, branding);
  if (!seo) return;

  // Remove existing SEO meta tags
  document.querySelectorAll('meta[data-seo], link[data-seo]').forEach(el => el.remove());
  
  // Update title
  if (seo.title) {
    document.title = seo.title;
  }

  // Meta description
  if (seo.description) {
    const desc = document.createElement('meta');
    desc.name = 'description';
    desc.content = seo.description;
    desc.setAttribute('data-seo', 'true');
    document.head.appendChild(desc);
  }

  // Keywords
  if (seo.keywords) {
    const keywords = document.createElement('meta');
    keywords.name = 'keywords';
    keywords.content = seo.keywords;
    keywords.setAttribute('data-seo', 'true');
    document.head.appendChild(keywords);
  }

  // Canonical
  if (seo.canonical) {
    const canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = seo.canonical;
    canonical.setAttribute('data-seo', 'true');
    document.head.appendChild(canonical);
  }

  // Robots
  const robotsContent = `${seo.index !== false ? 'index' : 'noindex'}, ${seo.follow !== false ? 'follow' : 'nofollow'}`;
  const robots = document.createElement('meta');
  robots.name = 'robots';
  robots.content = robotsContent;
  robots.setAttribute('data-seo', 'true');
  document.head.appendChild(robots);

  // OpenGraph tags
  if (seo.og) {
    const ogTags = [
      ['og:title', seo.og.title || seo.title],
      ['og:description', seo.og.description || seo.description],
      ['og:image', seo.og.image?.file],
      ['og:type', seo.og.type || 'website'],
      ['og:url', seo.og.url || seo.canonical],
      ['og:site_name', seo.og.site_name || seo.title]
    ];

    ogTags.forEach(([property, content]) => {
      if (content) {
        const meta = document.createElement('meta');
        meta.setAttribute('property', property);
        meta.content = content;
        meta.setAttribute('data-seo', 'true');
        document.head.appendChild(meta);
      }
    });
  }

  // Twitter Card tags
  if (seo.twitter) {
    const twitterTags = [
      ['twitter:card', seo.twitter.card || 'summary'],
      ['twitter:site', seo.twitter.site],
      ['twitter:creator', seo.twitter.creator],
      ['twitter:title', seo.og?.title || seo.title],
      ['twitter:description', seo.og?.description || seo.description],
      ['twitter:image', seo.og?.image?.file]
    ];

    twitterTags.forEach(([name, content]) => {
      if (content) {
        const meta = document.createElement('meta');
        meta.name = name;
        meta.content = content;
        meta.setAttribute('data-seo', 'true');
        document.head.appendChild(meta);
      }
    });
  }
}
