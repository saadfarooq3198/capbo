import React, { useState, useEffect } from 'react';
import { Branding } from '@/api/entities';
import { Facebook, Instagram, Twitter, Linkedin, Youtube } from 'lucide-react';

const SOCIAL_ICONS = {
  facebook: <Facebook className="h-5 w-5" />,
  instagram: <Instagram className="h-5 w-5" />,
  x: <Twitter className="h-5 w-5" />,
  linkedin: <Linkedin className="h-5 w-5" />,
  youtube: <Youtube className="h-5 w-5" />
};

export default function SocialIcons() {
  const [socialSettings, setSocialSettings] = useState(null);

  useEffect(() => {
    const fetchSocialSettings = async () => {
      try {
        const brandings = await Branding.list();
        const activeBranding = brandings.length > 0 ? brandings[0] : null;
        if (activeBranding?.social_media?.show_social_bar) {
          setSocialSettings(activeBranding.social_media.links);
        } else {
          setSocialSettings(null);
        }
      } catch (error) {
        console.error('Failed to fetch social settings:', error);
      }
    };
    fetchSocialSettings();
  }, []);

  if (!socialSettings) return null;

  const enabledLinks = Object.entries(socialSettings).filter(([_, url]) => url);
  if (enabledLinks.length === 0) return null;

  return (
    <div className="flex items-center justify-center gap-x-6">
      {enabledLinks.map(([key, url]) => (
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noopener noreferrer nofollow external"
          aria-label={`Follow us on ${key}`}
          className="text-gray-400 hover:text-gray-500 min-w-[40px] min-h-[40px] flex items-center justify-center"
        >
          {SOCIAL_ICONS[key] || null}
        </a>
      ))}
    </div>
  );
}