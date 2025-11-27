import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const navItems = [
  { name: 'Dashboard', href: '/?tab=dashboard', path: '/' },
  { name: 'Projects', href: '/projects', path: '/projects' },
  { name: 'Decision Runs', href: '/decision-runs', path: '/decision-runs' },
  { name: 'Data Ingestion', href: '/data-ingestion', path: '/data-ingestion' },
  { name: 'Settings', href: '/settings', path: '/settings' },
  { name: 'About', href: '/about', path: '/about' }
];

export default function AppNav() {
  const location = useLocation();
  
  const isActive = (item) => {
    // Special case for dashboard - active if we're at root with tab=dashboard or root without tab
    if (item.path === '/') {
      const searchParams = new URLSearchParams(location.search);
      const tab = searchParams.get('tab');
      return location.pathname === '/' && (tab === 'dashboard' || !tab);
    }
    
    // For other pages, match the pathname
    return location.pathname.startsWith(item.path);
  };

  return (
    <nav role="navigation" aria-label="Primary" className="cabpoe-nav-wrapper border-b border-zinc-200 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4 h-12 flex items-center gap-6 overflow-x-auto">
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`
                whitespace-nowrap text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-sm px-1 py-1
                ${active 
                  ? 'font-medium text-zinc-900 border-b-2 border-indigo-600' 
                  : 'text-zinc-600 hover:text-zinc-900'
                }
              `}
              aria-current={active ? 'page' : undefined}
            >
              {item.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}