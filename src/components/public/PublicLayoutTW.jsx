
import React, { useEffect, useState } from 'react';
import PublicFooterTW from './PublicFooterTW';
import PublicSocialBar from './PublicSocialBar';
import PublicCookieConsent from './PublicCookieConsent';
import GlossaryDrawerTW from './GlossaryDrawerTW';
import PublicQuickAssetsModal from './PublicQuickAssetsModal';
import { getBrandingConfig } from '../lib/brandingStore';
import { User } from '@/api/entities'; // Import User entity

export default function PublicLayoutTW({ children }) {
  const [branding, setBranding] = useState(() => getBrandingConfig());
  const [logoUrl, setLogoUrl] = useState(null);
  const [sessionUser, setSessionUser] = useState(null);
  const [showAssetsModal, setShowAssetsModal] = useState(false);

  // Custom domain safeguards
  useEffect(() => {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    const search = window.location.search; // PRESERVE THIS
    const isOurHost = hostname === 'cabpoe.com' || hostname === 'www.cabpoe.com';
    
    // A) Root → /home redirect
    if (pathname === '/') {
      window.history.replaceState(null, '', '/home' + search);
    }
    
    // B) Catch accidental platform /login on our domain
    if (isOurHost && pathname === '/login') {
      window.location.replace('/home' + search);
    }
    
    // C) Optional: www → apex redirect
    if (hostname === 'www.cabpoe.com') {
      window.location.replace('https://cabpoe.com' + pathname + search + window.location.hash);
    }
  }, []);

  // Load session from platform (with error handling)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await User.me();
        setSessionUser(user);
      } catch (error) {
        setSessionUser(null);
      }
    };
    checkSession();
  }, []);

  // One-time cleanup of legacy local storage keys
  useEffect(() => {
    try {
      localStorage.removeItem('cabpoe_users');
      localStorage.removeItem('cabpoe_reset_tokens');
      localStorage.removeItem('cabpoe_auth_attempts');
      localStorage.removeItem('cabpoe_session');
      localStorage.removeItem('demoSession');
    } catch (e) {
      console.warn("Could not clear legacy auth keys from localStorage.", e);
    }
  }, []);

  // Load logo and favicon
  useEffect(() => {
    const loadAssets = async () => {
      try {
        const logoData = localStorage.getItem('cabpoe_public_logo');
        if (logoData) {
          setLogoUrl(logoData);
          const logoEl = document.getElementById('publicHeaderLogo');
          if (logoEl) {
            logoEl.src = logoData;
          }
        }

        const faviconData = localStorage.getItem('cabpoe_public_favicon');
        if (faviconData) {
          const existingFavicons = document.querySelectorAll('link[rel="icon"]');
          existingFavicons.forEach(link => link.remove());
          
          const link = document.createElement('link');
          link.rel = 'icon';
          link.href = faviconData;
          document.head.appendChild(link);
        }
      } catch (error) {
        console.warn('Failed to load assets from localStorage:', error);
      }
    };

    loadAssets();
  }, []);

  // Alt+U shortcut for assets modal
  useEffect(() => {
    const handleKeydown = (e) => {
      if (e.altKey && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        setShowAssetsModal(true);
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, []);

  const handleLogoUpdate = (dataUrl) => {
    setLogoUrl(dataUrl);
    const logoEl = document.getElementById('publicHeaderLogo');
    if (logoEl) {
      logoEl.src = dataUrl;
    }
  };

  const hasSocialLinks = branding.social && (
    branding.social.facebook || branding.social.instagram || 
    branding.social.linkedin || branding.social.twitter || branding.social.youtube
  );

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <GlossaryDrawerTW />
      <PublicCookieConsent />
      
      {/* Main content container */}
      <div className="flex-1">
        {/* Header */}
        <header className="w-full border-b bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 items-center py-3">
              
              {/* LEFT: Logo + Title */}
              <div className="flex items-center">
                <a href="/home" className="flex items-center text-decoration-none">
                  {logoUrl && (
                    <img 
                      id="publicHeaderLogo"
                      src={logoUrl} 
                      alt="CABPOE Logo" 
                      className="h-24 md:h-28 max-w-[440px] object-contain inline-block align-middle"
                    />
                  )}
                  <span className="text-xl md:text-2xl font-semibold inline-block align-middle ml-3 text-gray-900">
                    CABPOE™ Console
                  </span>
                </a>
              </div>
              
              {/* CENTER: Empty (socials are in below-header row) */}
              <div></div>
              
              {/* RIGHT: Navigation Buttons */}
              <div className="flex items-center justify-end gap-3">
                <a 
                  href="/about" 
                  className="inline-flex items-center rounded-md px-3.5 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 whitespace-nowrap"
                >
                  About Us
                </a>
                {sessionUser ? (
                  <>
                    <a 
                      href="/dashboard" 
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                    >
                      Dashboard
                    </a>
                    <a 
                      href="/logout"
                      className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-700 whitespace-nowrap"
                    >
                      Sign Out
                    </a>
                  </>
                ) : (
                  <a 
                    href="/signin" 
                    className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-700 whitespace-nowrap"
                  >
                    Sign In
                  </a>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Social/Glossary Row */}
        {hasSocialLinks && (
          <div className="border-b bg-gray-50 mb-8 md:mb-12 lg:mb-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex items-center justify-center gap-4">
                <PublicSocialBar branding={branding} />
                <button 
                  data-open-glossary
                  className="text-sm underline hover:opacity-80 ml-4"
                >
                  📖 Glossary
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="pb-10 md:pb-14">
          {children}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 md:mt-10">
        <PublicFooterTW branding={branding} />
      </div>

      {/* Assets Modal */}
      {showAssetsModal && (
        <PublicQuickAssetsModal 
          onClose={() => setShowAssetsModal(false)}
          onLogoUpdate={handleLogoUpdate}
        />
      )}
    </div>
  );
}
