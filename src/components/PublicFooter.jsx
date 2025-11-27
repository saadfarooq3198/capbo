import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { BarChart2 } from 'lucide-react';
import { getBrandingConfig } from '@/components/lib/brandingStore';
import SocialIcons from './public/icons/SocialIcons';

export default function PublicFooter() {
  const branding = getBrandingConfig();
  const logoUrl = branding.theme?.darkMode ? (branding.logo?.dark?.file || branding.logo?.light?.file) : branding.logo?.light?.file;
  const logoAlt = branding.seoGlobal?.title || 'App Logo';

  const legalLinks = [
    { name: 'Terms of Service', path: 'legal-terms' },
    { name: 'Privacy Policy', path: 'legal-privacy' },
    { name: 'Cookie Policy', path: 'legal-cookies' },
    { name: 'Accessibility', path: 'legal-accessibility' },
  ];

  const mainLinks = [
    { name: 'About Us', path: 'about' },
    { name: 'Contact', path: 'contact' },
  ];

  return (
    <footer className="bg-gray-800 text-gray-300">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <Link to={createPageUrl('home')} className="flex items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt={logoAlt} className="h-8 w-auto" />
              ) : (
                <BarChart2 className="h-8 w-8 text-indigo-500" />
              )}
              <span className="font-semibold text-2xl text-white">{branding.seoGlobal?.title || 'CABPOE Console'}</span>
            </Link>
            <p className="text-gray-400 text-sm">
              {branding.seoGlobal?.description || 'Advanced decision intelligence for complex systems.'}
            </p>
            <SocialIcons socialLinks={branding.social} />
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">Navigation</h3>
                <ul className="mt-4 space-y-4">
                  {mainLinks.map((item) => (
                    <li key={item.name}>
                      <Link to={createPageUrl(item.path)} className="text-base text-gray-300 hover:text-white">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">Legal</h3>
                <ul className="mt-4 space-y-4">
                  {legalLinks.map((item) => (
                    <li key={item.name}>
                      <Link to={createPageUrl(item.path)} className="text-base text-gray-300 hover:text-white">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-700 pt-8">
          <p className="text-base text-gray-400 xl:text-center">&copy; {new Date().getFullYear()} {branding.seoGlobal?.title || 'CABPOE Systems'}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}