import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBrandingConfig } from '@/components/lib/brandingStore';
import { getSession, signOut } from '@/components/auth/authUtils';

export default function PublicHeaderTW() {
    const [branding, setBranding] = useState(getBrandingConfig());
    const [session, setSession] = useState(null);

    useEffect(() => {
        setSession(getSession());
        
        const onUpdate = () => setBranding(getBrandingConfig());
        window.addEventListener('public-assets-updated', onUpdate);
        return () => window.removeEventListener('public-assets-updated', onUpdate);
    }, []);

    const logoUrl = branding.logo?.light?.file || null;
    const consoleName = branding.seoGlobal?.title || 'CABPOE Pilot Console';

    const renderLogo = () => (
        <Link to="/home" className="flex items-center gap-3 text-gray-800 hover:text-gray-900 transition-colors">
            {logoUrl ? (
                <img src={logoUrl} alt={`${consoleName} Logo`} className="h-16 object-contain" />
            ) : (
                <div className="w-16 h-16 rounded-md bg-gray-800 text-white flex items-center justify-center font-bold text-2xl">
                    {consoleName.charAt(0)}
                </div>
            )}
            <span className="font-semibold text-lg">{consoleName}</span>
        </Link>
    );

    const renderAuthButtons = () => {
        if (session) {
            return (
                <>
                    <Link to="/about" className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                        About Us
                    </Link>
                    <Link to="/dashboard" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                        Dashboard
                    </Link>
                    <button onClick={signOut} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors">
                        Sign Out
                    </button>
                </>
            );
        }
        return (
            <>
                <Link to="/about" className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                    About Us
                </Link>
                <Link to="/signin" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors">
                    Sign In
                </Link>
            </>
        );
    };

    return (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/80">
            <div className="mx-auto max-w-7xl px-4">
                <div className="flex justify-between items-center h-20">
                    <div className="flex-shrink-0">{renderLogo()}</div>
                    <nav className="hidden md:flex items-center gap-2">
                        {renderAuthButtons()}
                    </nav>
                     <div className="md:hidden">
                        {/* Mobile menu could be added here if needed */}
                    </div>
                </div>
            </div>
        </header>
    );
}