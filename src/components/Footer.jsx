import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Footer() {
  const links = [
    { name: 'About', path: 'about' },
    { name: 'Privacy Policy', path: 'legal-privacy' },
    { name: 'Terms of Service', path: 'legal-terms' },
    { name: 'Cookie Policy', path: 'legal-cookies' },
  ];

  return (
    <footer role="contentinfo" className="bg-white border-t">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} CABPOE Systems. All rights reserved.</p>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2" aria-label="Footer">
          {links.map((link) => (
            <Link key={link.name} to={createPageUrl(link.path)} className="text-sm text-gray-500 hover:text-gray-700">
              {link.name}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}