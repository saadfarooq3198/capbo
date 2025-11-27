
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBrandingConfig } from '@/components/lib/brandingStore';
import { BarChart2, LayoutDashboard, FolderKanban, BrainCircuit, Database, Settings } from 'lucide-react';

const CACHE_BUST_QUERY = '?v=prodfix3';

// Helper to preserve debug params
const preserveParams = (baseUrl) => {
  const currentParams = new URLSearchParams(window.location.search);
  const debug = currentParams.get('debug');
  if (debug) {
    return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}debug=${debug}`;
  }
  return baseUrl + CACHE_BUST_QUERY;
};

const navItems = [
  { href: preserveParams(`/dashboard`), icon: LayoutDashboard, label: 'Dashboard' },
  { href: preserveParams(`/projects`), icon: FolderKanban, label: 'Projects' },
  { href: preserveParams(`/decision-runs`), icon: BrainCircuit, label: 'Decision Runs' },
  { href: preserveParams(`/data-ingestion`), icon: Database, label: 'Data Ingestion' },
  { href: preserveParams(`/settings`), icon: Settings, label: 'Settings' },
];

export default function PortalSidebar() {
    const [branding, setBranding] = useState(getBrandingConfig());

    useEffect(() => {
        const onUpdate = () => setBranding(getBrandingConfig());
        window.addEventListener('public-assets-updated', onUpdate);
        return () => window.removeEventListener('public-assets-updated', onUpdate);
    }, []);

    const logoUrl = branding.logo?.light?.file || null;
    const consoleName = branding.seoGlobal?.title || 'CABPOE Pilot Console';

    return (
        <div className="hidden border-r bg-muted/40 md:block fixed h-full w-64">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-16 items-center border-b px-6">
                    <Link to="/home" className="flex items-center gap-2 font-semibold">
                        {logoUrl ? (
                            <img src={logoUrl} alt={consoleName} className="h-8 w-auto object-contain" />
                        ) : (
                            <BarChart2 className="h-6 w-6" />
                        )}
                        <span className="">{consoleName}</span>
                    </Link>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <nav className="grid items-start px-4 text-sm font-medium">
                        {navItems.map((item, index) => (
                            <Link
                                key={index}
                                to={item.href}
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>
        </div>
    );
}
