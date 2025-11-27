import React from 'react';
import PublicSocialBar from './PublicSocialBar';

export default function PublicFooterTW() {
    return (
        <footer className="bg-gray-50 border-t border-gray-200">
            <div className="mx-auto max-w-7xl px-4 py-8">
                <div className="flex justify-center">
                    <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
                        <a href="/home" className="text-gray-600 hover:text-gray-900 transition-colors">
                            Home
                        </a>
                        <a href="/about" className="text-gray-600 hover:text-gray-900 transition-colors">
                            About
                        </a>
                        <a href="/terms" className="text-gray-600 hover:text-gray-900 transition-colors">
                            Terms
                        </a>
                        <a href="/privacy" className="text-gray-600 hover:text-gray-900 transition-colors">
                            Privacy
                        </a>
                        <a href="/cookies-policy" className="text-gray-600 hover:text-gray-900 transition-colors">
                            Cookies
                        </a>
                        <button 
                            data-open-cookie-prefs 
                            className="text-gray-600 hover:text-gray-900 transition-colors bg-transparent border-none cursor-pointer p-0"
                        >
                            Cookie Preferences
                        </button>
                    </nav>
                </div>
                <div 
                    className="text-center text-xs text-gray-500 mt-6"
                    aria-label="legal notice"
                >
                    CABPOE™ is a proprietary, research-based product of Gigsgen® Digital Innovations Ltd. — UK patent pending. © 2025
                </div>
            </div>
            <PublicSocialBar />
        </footer>
    );
}