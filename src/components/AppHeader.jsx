import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Branding } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { BarChart2, Facebook, Instagram, Twitter, Linkedin, Youtube } from 'lucide-react';
import { useRole } from './auth/RoleProvider';
import { User } from '@/api/entities';

const SOCIAL_ICONS = {
  facebook: <Facebook className="h-5 w-5" />,
  instagram: <Instagram className="h-5 w-5" />,
  x: <Twitter className="h-5 w-5" />,
  twitter: <Twitter className="h-5 w-5" />,
  linkedin: <Linkedin className="h-5 w-5" />,
  youtube: <Youtube className="h-5 w-5" />
};

const SocialIcons = () => {
  const [socialSettings, setSocialSettings] = useState(null);

  useEffect(() => {
    const fetchSocialSettings = async () => {
      try {
        const brandings = await Branding.list();
        const activeBranding = brandings.length > 0 ? brandings[0] : null;
        setSocialSettings(activeBranding?.social_media || null);
      } catch (error) {
        console.error('Failed to fetch social settings:', error);
      }
    };
    fetchSocialSettings();
  }, []);

  if (!socialSettings?.show_social_bar || !socialSettings?.links) {
    return null;
  }

  const validLinks = Object.entries(socialSettings.links)
    .filter(([_, url]) => url && url.trim())
    .map(([platform, url]) => ({ platform, url }));

  if (validLinks.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      {validLinks.map(({ platform, url }) => (
        <a
          key={platform}
          href={url}
          target="_blank"
          rel="noopener noreferrer nofollow external"
          className="text-gray-600 hover:text-indigo-600 transition-colors p-1"
          aria-label={`Visit our ${platform} page`}
          style={{ minHeight: '40px', minWidth: '40px' }}
        >
          {SOCIAL_ICONS[platform] || SOCIAL_ICONS.facebook}
        </a>
      ))}
    </div>
  );
};

export function AppHeader() {
  const { user } = useRole();
  const navigate = useNavigate();
  const [branding, setBranding] = useState(null);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await Branding.list();
        const activeBranding = res.length > 0 ? res[0] : null;
        setBranding(activeBranding);
        setShowFallback(!activeBranding?.light_logo_url);
      } catch (error) {
        console.error("Failed to load branding:", error);
        setShowFallback(true);
      }
    };
    fetchBranding();
  }, []);

  const handleImageError = () => {
    setShowFallback(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('demoSession');
    window.dispatchEvent(new Event('auth-change'));
    navigate('/home', { replace: true });
  };

  return (
    <header className="w-full border-b bg-white">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4">
        {/* Left: Logo */}
        <div className="flex-[0_0_auto] min-w-0">
          <Link to="/home" className="flex items-center gap-2 shrink-0" aria-label="Home">
            {branding?.light_logo_url && !showFallback ? (
              <img
                src={branding.light_logo_url}
                alt={branding?.logo_alt_text || 'App Logo'}
                className="h-10 md:h-12 max-h-[40px] md:max-h-[48px] w-auto block"
                onError={handleImageError}
              />
            ) : (
              <>
                <BarChart2 className="h-8 md:h-10 w-8 md:w-10 text-indigo-600" />
                <span className="font-semibold text-lg md:text-xl">CABPOE Console</span>
              </>
            )}
          </Link>
        </div>

        {/* Center: Social Icons */}
        <div className="flex-1 flex justify-center">
          <SocialIcons />
        </div>

        {/* Right: Navigation */}
        <nav className="flex-[0_0_auto] flex items-center gap-3">
          <Link to="/about" className="text-sm font-medium hover:text-indigo-600 transition-colors">
            About
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm font-medium hover:text-indigo-600 transition-colors">
                Dashboard
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Link to="/demo-login">
              <Button size="sm">Login</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}