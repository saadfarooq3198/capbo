import React from 'react';
import { getBrandingConfig } from '@/components/lib/brandingStore';
import { Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react';

const socialIcons = {
  facebook: <Facebook size={20} />,
  instagram: <Instagram size={20} />,
  linkedin: <Linkedin size={20} />,
  twitter: <Twitter size={20} />,
  youtube: <Youtube size={20} />,
};

export default function PublicSocialBar() {
  const branding = getBrandingConfig();
  const socialLinks = branding.social || {};

  const enabledLinks = Object.entries(socialLinks)
    .filter(([key, value]) => value && socialIcons[key])
    .map(([key, value]) => ({
      key,
      href: value,
      icon: socialIcons[key],
    }));

  if (enabledLinks.length === 0) {
    return null;
  }

  return (
    <div aria-label="Social links" className="bg-gray-50 border-b border-gray-200/80">
      <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-center gap-4">
        {enabledLinks.map(({ key, href, icon }) => (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-800 transition-colors"
            aria-label={`Follow us on ${key}`}
          >
            {icon}
          </a>
        ))}
      </div>
    </div>
  );
}