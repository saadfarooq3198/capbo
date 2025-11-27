import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Save, ExternalLink, Info, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRole } from '../auth/RoleProvider';
import { can } from '../auth/permissions';

function getConsoleSettings() {
  try {
    const saved = localStorage.getItem('console_settings');
    return saved ? JSON.parse(saved) : { consoleBaseUrl: '' };
  } catch (e) {
    console.error('Failed to parse console settings:', e);
    return { consoleBaseUrl: '' };
  }
}

export default function ConsoleTab() {
  const [settings, setSettings] = useState(getConsoleSettings);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { effectiveRole } = useRole();
  const canEdit = can(effectiveRole, 'org:users');

  const handleSave = async () => {
    setIsLoading(true);
    try {
      localStorage.setItem('console_settings', JSON.stringify(settings));
      toast({
        title: 'Settings saved',
        description: 'Console integration settings have been updated.',
      });
    } catch (error) {
      toast({
        title: 'Couldn’t save',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Base44 Console URL
          </CardTitle>
          <CardDescription>
            Set your Base44 Console URL to enable one-click user invites.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="console-url">Console URL</Label>
            <Input
              id="console-url"
              type="url"
              value={settings.consoleBaseUrl}
              onChange={(e) => setSettings({ ...settings, consoleBaseUrl: e.target.value })}
              placeholder="https://base44.ai/dashboard"
              disabled={!canEdit}
            />
            <p className="text-sm text-gray-500">
              The URL to your Base44 Console dashboard.
            </p>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              When set, the "Invite User" button will open this URL in a new tab for quick access to user management.
            </AlertDescription>
          </Alert>

          {settings.consoleBaseUrl && (
            <Button asChild>
                <a href={settings.consoleBaseUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" /> Open Console
                </a>
            </Button>
          )}
        </CardContent>
      </Card>

      {canEdit && (
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isLoading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
      )}
    </div>
  );
}