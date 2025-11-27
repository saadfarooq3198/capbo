import React from 'react';
import { Facebook, Instagram, Twitter, Linkedin, Youtube } from 'lucide-react';
import { useRole } from './auth/RoleProvider';

const SOCIAL_ICONS = {
  facebook: Facebook,
  instagram: Instagram,
  x: Twitter,
  linkedin: Linkedin,
  youtube: Youtube
};

export default function SocialBar() {
  const { user } = useRole();
  
  const socialSettings = user?.social_settings;
  const showSocialBar = socialSettings?.show_social_bar !== false;
  const links = socialSettings?.links || {};
  
  // Filter to valid links only
  const validLinks = Object.entries(links).filter(([platform, url]) => 
    url && url.trim() && SOCIAL_ICONS[platform]
  );

  if (!showSocialBar || validLinks.length === 0) {
    return null;
  }

  return (
    <div className="flex justify-center items-center gap-4 mt-8">
      {validLinks.map(([platform, url]) => {
        const Icon = SOCIAL_ICONS[platform];
        return (
          <a
            key={platform}
            href={url}
            target="_blank"
            rel="noopener noreferrer nofollow external"
            className="w-10 h-10 bg-gray-100 hover:bg-indigo-100 text-gray-600 hover:text-indigo-600 rounded-full flex items-center justify-center transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            aria-label={`Visit our ${SOCIAL_ICONS[platform] ? platform : 'social media'} page`}
          >
            <Icon className="h-5 w-5" />
          </a>
        );
      })}
    </div>
  );
}