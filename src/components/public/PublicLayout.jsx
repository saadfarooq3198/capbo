import React, { useEffect } from 'react';
import { isPublicPath } from '@/components/lib/publicRoutes';
import { getBrandingConfig } from '@/components/lib/brandingStore';
import { applyBrandingHead, applySEOHead } from '@/components/lib/seoUtils';
import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import CookiePreferences from '@/components/public/CookiePreferences';

function nukeBlackHeaders(){
  const badSel = '.public-header-black, .public-header-legacy, .public-header-old, [data-cabpoe-header]';
  document.querySelectorAll(badSel).forEach(el => {
    if (!el.classList.contains('pub-header')) {
        el.remove();
    }
  });
}

export default function PublicLayout({ pageKey='home', children }){
  const path=(typeof window!=='undefined' ? window.location.pathname : '/').toLowerCase();
  
  // Hook 1: Always nuke old headers on every page.
  useEffect(() => {
    nukeBlackHeaders();
    const mo = new MutationObserver(nukeBlackHeaders);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);
  
  // Hook 2: Apply branding and SEO effects.
  useEffect(()=>{
    if (isPublicPath(path)) {
      const b = getBrandingConfig();
      applyBrandingHead(b);
      applySEOHead(pageKey,b);
    }
  },[path, pageKey]);

  // Now, conditionally return null *after* all hooks have been called.
  if (!isPublicPath(path)) {
    return null; // Don't render the public layout on portal pages
  }

  // Show header on home and about pages
  const showHeader = path === '/' || path === '/about';
  const showFooter = true; // Show footer on all public pages

  // Render the public layout
  return (
    <div className="pub-shell">
      {showHeader && <PublicHeader/>}
      <main className="pub-main">{children}</main>
      {showFooter && <PublicFooter/>}
      <CookiePreferences />
      <style>{`
        .pub-shell{min-height:100vh;display:flex;flex-direction:column}
        .pub-main{flex:1;display:flex;flex-direction:column}
      `}</style>
    </div>
  );
}