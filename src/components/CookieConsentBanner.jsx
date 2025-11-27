import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { X, Settings, Cookie } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const COOKIE_CONSENT_KEY = 'cabpoe_cookie_consent';

export default function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always required
    functional: true,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setShowBanner(true);
    } else {
      try {
        const parsed = JSON.parse(consent);
        setPreferences(parsed);
      } catch (e) {
        setShowBanner(true);
      }
    }

    // Listen for cookie preferences dialog triggers
    const handleOpenPrefs = () => setShowPreferences(true);
    window.addEventListener('openCookiePrefs', handleOpenPrefs);
    return () => window.removeEventListener('openCookiePrefs', handleOpenPrefs);
  }, []);

  const savePreferences = (prefs = preferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(prefs));
    setShowBanner(false);
    setShowPreferences(false);
  };

  const acceptAll = () => {
    const allAccepted = { necessary: true, functional: true, analytics: true, marketing: true };
    setPreferences(allAccepted);
    savePreferences(allAccepted);
  };

  const acceptNecessary = () => {
    const necessaryOnly = { necessary: true, functional: false, analytics: false, marketing: false };
    setPreferences(necessaryOnly);
    savePreferences(necessaryOnly);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg p-4">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Cookie className="h-5 w-5 text-indigo-600" />
              <h3 className="font-semibold text-gray-900">Cookie Preferences</h3>
            </div>
            <p className="text-sm text-gray-600">
              We use cookies to improve your experience and analyze site usage. 
              You can customize your preferences or accept all cookies.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setShowPreferences(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Preferences
            </Button>
            <Button variant="outline" size="sm" onClick={acceptNecessary}>
              Necessary Only
            </Button>
            <Button size="sm" onClick={acceptAll}>
              Accept All
            </Button>
          </div>
        </div>
      </div>

      {/* Preferences Dialog */}
      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="h-5 w-5" />
              Cookie Preferences
            </DialogTitle>
            <DialogDescription>
              Choose which cookies you're comfortable with. Necessary cookies are required for the site to function.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Strictly Necessary</CardTitle>
                    <p className="text-sm text-gray-600">Required for the website to function</p>
                  </div>
                  <Badge>Always Active</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  These cookies are essential for you to browse the website and use its features, 
                  such as accessing secure areas of the site.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Functional</CardTitle>
                    <p className="text-sm text-gray-600">Remember your preferences</p>
                  </div>
                  <Switch
                    checked={preferences.functional}
                    onCheckedChange={(checked) => 
                      setPreferences({ ...preferences, functional: checked })
                    }
                  />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  These cookies allow the website to remember choices you make and provide enhanced features.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Analytics</CardTitle>
                    <p className="text-sm text-gray-600">Help us understand site usage</p>
                  </div>
                  <Switch
                    checked={preferences.analytics}
                    onCheckedChange={(checked) => 
                      setPreferences({ ...preferences, analytics: checked })
                    }
                  />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  These cookies collect information about how visitors use our site to help us improve it.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Marketing</CardTitle>
                    <p className="text-sm text-gray-600">Personalized content and ads</p>
                  </div>
                  <Switch
                    checked={preferences.marketing}
                    onCheckedChange={(checked) => 
                      setPreferences({ ...preferences, marketing: checked })
                    }
                  />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  These cookies are used to deliver more relevant advertisements and content.
                </p>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={acceptNecessary}>
              Necessary Only
            </Button>
            <Button onClick={() => savePreferences()}>
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}