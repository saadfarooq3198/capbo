import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const COOKIE_CONSENT_KEY = 'cabpoe_cookie_consent';

export default function GDPRCookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleConsent = (consentValue) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, consentValue);
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-center sm:text-left">
          We use essential cookies to make our site work. For more details, see our{' '}
          <Link to={createPageUrl('legal-cookies')} className="underline hover:text-gray-200">
            Cookie Policy
          </Link>.
        </p>
        <div className="flex-shrink-0 flex gap-3">
          <Button size="sm" variant="secondary" onClick={() => handleConsent('rejected')}>
            Reject
          </Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => handleConsent('accepted')}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}