import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { BarChart2 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { getBrandingConfig } from '@/components/lib/brandingStore';

export default function Header({ variant = 'public' }) {
  const [branding, setBranding] = useState(getBrandingConfig());
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const config = getBrandingConfig();
    setBranding(config);
    setShowFallback(!config.logo?.light?.file);
  }, []);

  const handleImageError = () => {
    setShowFallback(true);
  };
  
  const logoUrl = branding.theme?.darkMode ? (branding.logo?.dark?.file || branding.logo?.light?.file) : branding.logo?.light?.file;
  const logoAlt = branding.seoGlobal?.title || 'App Logo';

  return (
    <header data-cabpoe-header className="w-full border-b border-zinc-200 bg-white dark:bg-gray-900 dark:border-gray-800">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Logo */}
        <div className="flex-[0_0_auto] min-w-0">
          <Link to={createPageUrl('home')} className="flex items-center gap-2 shrink-0" aria-label="Home">
            {logoUrl && !showFallback ? (
              <img
                src={logoUrl}
                alt={logoAlt}
                className="block h-10 md:h-12 max-h-10 md:max-h-12 w-auto"
                style={{objectFit: 'contain'}}
                onError={handleImageError}
              />
            ) : (
              <>
                <BarChart2 className="h-8 md:h-10 w-8 md:w-10 text-indigo-600" />
                <span className="font-semibold text-lg md:text-xl hidden sm:inline dark:text-white">CABPOE Console</span>
              </>
            )}
          </Link>
        </div>

        {/* Center: Social Icons - Removed for simplicity in this pass, can be re-added via SocialIcons component */}

        {/* Right: Login/CTA - Remove button if inside portal */}
        <div className="flex-[0_0_auto] flex items-center">
          {variant === 'public' && (
            <Link to={createPageUrl('demo-login')} id="access-portal-main">
              <Button size="sm">Access Portal</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}