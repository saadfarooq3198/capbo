import React, { useState, useEffect, useCallback } from 'react';

const CONSENT_KEY = 'cabpoe_cookie_consent_v1';

// --- Consent Utility Functions ---
const getConsent = () => {
    try {
        const stored = localStorage.getItem(CONSENT_KEY);
        if (stored) {
            const consent = JSON.parse(stored);
            if (consent.version === 1 && typeof consent.given === 'boolean') {
                return consent;
            }
        }
    } catch (e) {
        console.error("Could not parse cookie consent", e);
    }
    return {
        version: 1,
        given: false,
        date: null,
        categories: { necessary: true, analytics: false, marketing: false },
    };
};

const setConsent = (consentUpdate) => {
    const currentConsent = getConsent();
    const newConsent = {
        ...currentConsent,
        ...consentUpdate,
        categories: {
            ...currentConsent.categories,
            ...consentUpdate.categories,
        },
        version: 1,
        date: new Date().toISOString(),
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(newConsent));
    window.dispatchEvent(new CustomEvent('cabpoe:consentChanged', { detail: newConsent }));
    return newConsent;
};

// --- Script Gating Stubs ---
const enableAnalytics = () => console.log("ANALYTICS ENABLED"); // TODO: Mount GA, Tag Manager, etc.
const disableAnalytics = () => console.log("ANALYTICS DISABLED"); // TODO: Unmount analytics
const enableMarketing = () => console.log("MARKETING ENABLED"); // TODO: Mount marketing pixels
const disableMarketing = () => console.log("MARKETING DISABLED"); // TODO: Unmount marketing

const applyConsent = (consent) => {
    if (consent.categories.analytics) enableAnalytics(); else disableAnalytics();
    if (consent.categories.marketing) enableMarketing(); else disableMarketing();
};

// --- Sub-components ---
const Banner = ({ onAcceptAll, onReject, onOpenPreferences }) => (
    <div role="region" aria-label="Cookie notice" className="fixed bottom-0 inset-x-0 z-[1000] p-4 bg-white/90 backdrop-blur-md border-t border-gray-200 shadow-t-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-gray-800">
                <h3 className="font-semibold text-lg">We use cookies</h3>
                <p className="text-sm">We use necessary cookies to run CABPOE. With your permission, we’ll use analytics and marketing cookies to improve your experience.</p>
            </div>
            <div className="flex-shrink-0 flex flex-wrap items-center justify-center gap-2">
                <button onClick={onAcceptAll} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors">Accept all</button>
                <button onClick={onReject} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors">Reject non-essential</button>
                <button onClick={onOpenPreferences} className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-md transition-colors">Cookie preferences</button>
            </div>
        </div>
    </div>
);

const PreferencesModal = ({ isOpen, onClose, initialCategories }) => {
    const [categories, setCategories] = useState(initialCategories);

    useEffect(() => {
        if (isOpen) {
            setCategories(initialCategories);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        };
    }, [isOpen, initialCategories, onClose]);

    if (!isOpen) return null;

    const handleToggle = (key) => setCategories(prev => ({ ...prev, [key]: !prev[key] }));

    const handleSave = () => {
        setConsent({ given: true, categories });
        onClose();
    };

    const handleAcceptAll = () => {
        setConsent({ given: true, categories: { necessary: true, analytics: true, marketing: true } });
        onClose();
    };

    const Toggle = ({ label, description, checked, onChange, disabled }) => (
        <div className={`p-4 border rounded-lg ${disabled ? 'bg-gray-100' : 'bg-white'}`}>
            <div className="flex justify-between items-start">
                <div className="pr-4">
                    <h4 className={`font-semibold ${disabled ? 'text-gray-500' : 'text-gray-900'}`}>{label}</h4>
                    <p className="text-sm text-gray-600">{description}</p>
                </div>
                <div className="flex items-center h-6">
                    <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="h-5 w-5 rounded-md text-indigo-600 border-gray-300 focus:ring-indigo-500 disabled:opacity-50" />
                </div>
            </div>
        </div>
    );

    return (
        <div role="dialog" aria-modal="true" aria-labelledby="cookie-prefs-title" className="fixed inset-0 z-[12000] flex items-center justify-center">
            <div onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="relative bg-gray-50 rounded-xl shadow-2xl w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b">
                    <h3 id="cookie-prefs-title" className="text-xl font-bold">Cookie Preferences</h3>
                    <p className="text-sm text-gray-600 mt-1">Manage your cookie settings. You can change these at any time from our footer.</p>
                </div>
                <div className="p-6 space-y-4">
                    <Toggle label="Necessary cookies" description="These are required for the site to function and cannot be disabled." checked disabled />
                    <Toggle label="Analytics cookies" description="These help us understand how you use the site to improve our product." checked={categories.analytics} onChange={() => handleToggle('analytics')} />
                    <Toggle label="Marketing cookies" description="These help us tailor our communications and promotions to your interests." checked={categories.marketing} onChange={() => handleToggle('marketing')} />
                </div>
                <div className="p-6 bg-white border-t flex flex-wrap justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-100">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md">Save preferences</button>
                    <button onClick={handleAcceptAll} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md">Accept all</button>
                </div>
            </div>
        </div>
    );
};

export default function PublicCookieConsent() {
    const [consentState, setConsentState] = useState(getConsent());
    const [isModalOpen, setIsModalOpen] = useState(false);

    const refreshState = useCallback(() => setConsentState(getConsent()), []);

    useEffect(() => {
        applyConsent(consentState);
        const handleConsentChange = () => refreshState();
        window.addEventListener('cabpoe:consentChanged', handleConsentChange);
        return () => window.removeEventListener('cabpoe:consentChanged', handleConsentChange);
    }, [consentState, refreshState]);

    useEffect(() => {
        const openModal = () => setIsModalOpen(true);
        const handleClick = (e) => {
            if (e.target.closest('[data-open-cookie-prefs]')) {
                openModal();
            }
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    const handleAcceptAll = () => {
        setConsent({ given: true, categories: { necessary: true, analytics: true, marketing: true } });
    };

    const handleReject = () => {
        setConsent({ given: true, categories: { necessary: true, analytics: false, marketing: false } });
    };

    return (
        <>
            {!consentState.given && <Banner onAcceptAll={handleAcceptAll} onReject={handleReject} onOpenPreferences={() => setIsModalOpen(true)} />}
            <PreferencesModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} initialCategories={consentState.categories} />
        </>
    );
}