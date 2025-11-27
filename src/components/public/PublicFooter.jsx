import React from 'react';
import { footerOn } from '@/components/lib/publicRoutes';

export default function PublicFooter(){
  const path = (typeof window !== 'undefined' ? window.location.pathname : '/').toLowerCase();
  if (!footerOn(path)) return null;

  return (
    <footer className="cabpoe-pub-footer" role="contentinfo" aria-label="Footer">
      <div className="cabpoe-pf-left">
        CABPOE<sup style={{ fontSize: '0.7rem' }}>™</sup> is product of Gigsgen<sup style={{ fontSize: '0.7rem' }}>®</sup> Digital Innovation Ltd. — patent pending © 2025
      </div>
      <nav className="cabpoe-pf-right" aria-label="Footer links">
        <a href="/">Home</a>
        <a href="/about">About Us</a>
        <a href="/terms">Terms &amp; Conditions</a>
        <a href="/privacy">Privacy Policy</a>
        <a href="/cookies-policy">Cookie Policy</a>
        <button className="cabpoe-chip" data-cookie-prefs>Cookie Preferences</button>
      </nav>
    </footer>
  );
}