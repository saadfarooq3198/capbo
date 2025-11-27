import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useRole } from '../auth/RoleProvider';
import { Facebook, Instagram, Twitter, Linkedin, Youtube } from 'lucide-react';

const SOCIAL_PLATFORMS = {
  facebook: { icon: Facebook, domain: 'facebook.com', example: 'https://facebook.com/yourbrand' },
  instagram: { icon: Instagram, domain: 'instagram.com', example: 'https://instagram.com/yourbrand' },
  x: { icon: Twitter, domain: 'x.com', example: 'https://x.com/yourbrand' },
  linkedin: { icon: Linkedin, domain: 'linkedin.com', example: 'https://www.linkedin.com/company/yourbrand' },
  youtube: { icon: Youtube, domain: 'youtube.com', example: 'https://www.youtube.com/@yourbrand' }
};

const normalizeUrl = (url, platform) => {
  if (!url || !url.trim()) return '';
  
  url = url.trim();
  
  // Handle @ mentions (convert to full URLs)
  if (url.startsWith('@')) {
    const handle = url.slice(1);
    switch (platform) {
      case 'facebook': return `https://facebook.com/${handle}`;
      case 'instagram': return `https://instagram.com/${handle}`;
      case 'x': return `https://x.com/${handle}`;
      case 'linkedin': return `https://www.linkedin.com/company/${handle}`;
      case 'youtube': return `https://www.youtube.com/@${handle}`;
      default: return url;
    }
  }
  
  // Ensure HTTPS protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  // Normalize Twitter/X URLs
  if (platform === 'x' && url.includes('twitter.com')) {
    url = url.replace('twitter.com', 'x.com');
  }
  
  // Expand YouTube short URLs
  if (platform === 'youtube' && url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    if (videoId) {
      url = `https://www.youtube.com/watch?v=${videoId}`;
    }
  }
  
  return url;
};

const validateUrl = (url, platform) => {
  if (!url || !url.trim()) return null; // Empty is valid
  
  try {
    const normalized = normalizeUrl(url, platform);
    const urlObj = new URL(normalized);
    
    // Must be HTTPS
    if (urlObj.protocol !== 'https:') {
      return 'Must use HTTPS';
    }
    
    // Must match expected domain
    const expectedDomain = SOCIAL_PLATFORMS[platform]?.domain;
    if (expectedDomain && !urlObj.hostname.includes(expectedDomain.split('.')[0])) {
      return `Must be a ${expectedDomain} URL`;
    }
    
    return null; // Valid
  } catch (e) {
    return 'Invalid URL format';
  }
};

export default function SocialLinksTab() {
  const { user, setOptimisticProfile } = useRole();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    show_social_bar: true,
    links: {
      facebook: '',
      instagram: '',
      x: '',
      linkedin: '',
      youtube: ''
    }
  });
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user?.social_settings) {
      setSettings({
        show_social_bar: user.social_settings.show_social_bar ?? true,
        links: {
          facebook: user.social_settings.links?.facebook || '',
          instagram: user.social_settings.links?.instagram || '',
          x: user.social_settings.links?.x || '',
          linkedin: user.social_settings.links?.linkedin || '',
          youtube: user.social_settings.links?.youtube || ''
        }
      });
    }
  }, [user?.social_settings]);

  const handleLinkChange = (platform, value) => {
    const normalized = normalizeUrl(value, platform);
    const error = validateUrl(normalized, platform);
    
    setSettings(prev => ({
      ...prev,
      links: { ...prev.links, [platform]: normalized }
    }));
    
    setErrors(prev => ({
      ...prev,
      [platform]: error
    }));
  };

  const handleToggleChange = (checked) => {
    setSettings(prev => ({ ...prev, show_social_bar: checked }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const socialData = {
        social_settings: settings
      };
      
      setOptimisticProfile(socialData);
      toast({ title: "Social Links Saved", description: "Your social media settings have been updated." });
      
    } catch (error) {
      console.error('Failed to save social settings:', error);
      toast({ title: "Error", description: "Failed to save social settings.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const defaultSettings = {
      show_social_bar: true,
      links: { facebook: '', instagram: '', x: '', linkedin: '', youtube: '' }
    };
    setSettings(defaultSettings);
    setErrors({});
  };

  const isSaveDisabled = isSaving || Object.values(errors).some(Boolean);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Links</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="show-social-bar">Show Social Bar on Public Pages</Label>
            <p className="text-sm text-gray-500">Display social media icons in the header</p>
          </div>
          <Switch
            id="show-social-bar"
            checked={settings.show_social_bar}
            onCheckedChange={handleToggleChange}
          />
        </div>

        <div className="space-y-4">
          {Object.entries(SOCIAL_PLATFORMS).map(([platform, { icon: Icon, example }]) => (
            <div key={platform} className="space-y-2">
              <Label htmlFor={platform} className="flex items-center gap-2 capitalize">
                <Icon className="h-4 w-4" />
                {platform === 'x' ? 'X (Twitter)' : platform}
              </Label>
              <Input
                id={platform}
                placeholder={example}
                value={settings.links[platform]}
                onChange={(e) => handleLinkChange(platform, e.target.value)}
                className={errors[platform] ? 'border-red-300' : ''}
              />
              {errors[platform] && (
                <p className="text-sm text-red-500">{errors[platform]}</p>
              )}
              <p className="text-xs text-gray-500">
                Supports @handle or full URL. Must be HTTPS and from {SOCIAL_PLATFORMS[platform].domain}.
              </p>
            </div>
          ))}
        </div>

        <div>
          <Label>Live Preview</Label>
          <div className="flex items-center gap-4 mt-2 p-4 border rounded-lg justify-center">
            {Object.entries(SOCIAL_PLATFORMS).map(([key, { icon: Icon }]) => {
              const isValid = settings.links?.[key] && !errors[key];
              return (
                <a
                  key={key}
                  href={isValid ? settings.links[key] : '#'}
                  target={isValid ? "_blank" : undefined}
                  rel={isValid ? "noopener noreferrer nofollow external" : undefined}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    isValid && settings.show_social_bar
                      ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200 cursor-pointer'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  aria-label={`${key} ${isValid ? 'link' : '(no valid URL)'}`}
                  onClick={!isValid ? (e) => e.preventDefault() : undefined}
                >
                  <Icon className="h-5 w-5" />
                </a>
              );
            })}
          </div>
          {!settings.show_social_bar && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Social bar is disabled. Toggle "Show Social Bar" to display icons.
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={isSaveDisabled}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}