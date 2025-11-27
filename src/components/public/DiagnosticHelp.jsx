import React from 'react';

/* 
 * DIAGNOSTIC TOOL FOR PUBLIC HEADER ISSUES
 * 
 * Paste this in the browser console on "/" to diagnose header problems:
 * 
 * (function(){
 *   const path=(location.pathname||'').toLowerCase();
 *   const el=(sel)=>document.querySelector(sel);
 *   const style=(n)=>n?getComputedStyle(n):{};
 *   function present(n){ return !!(n && style(n).display!=='none' && style(n).visibility!=='hidden' && +style(n).opacity!==0 && n.getBoundingClientRect().height>0); }
 * 
 *   const out = {};
 *   out.path = path;
 *   out.hasRoot = !!document.getElementById('root') || !!document.getElementById('__next');
 *   out.hasFallback = !!document.getElementById('pub-header-fallback');
 *   out.hasForced = !!document.getElementById('pub-header-forced');
 *   out.anyHeaderEl = !!el('header.pub-header, #pub-header-forced, #pub-header-fallback');
 *   const hdrEl = el('#pub-header-forced') || el('#pub-header-fallback') || el('header.pub-header');
 *   out.headerVisible = present(hdrEl);
 *   out.headerZ = hdrEl ? style(hdrEl).zIndex : '(none)';
 *   out.bodyOverflow = style(document.body).overflow;
 *   out.csp = [...document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]')].map(m=>m.content);
 *   out.layoutHeaderExists = !!el('header, .Header, .site-header, [role="banner"]');
 *   console.log('[CABPOE DIAG]', out);
 * })();
 */

export default function DiagnosticHelp() {
  return (
    <div style={{ display: 'none' }}>
      This component contains diagnostic instructions in comments above.
    </div>
  );
}