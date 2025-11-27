import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Save, Shield, Users, Mail, Loader2 } from 'lucide-react';
import { useRole } from '../auth/RoleProvider';
import { can } from '../auth/permissions';

export default function AuthTab() {
  const [settings, setSettings] = useState({
    allow_self_signup: false,
    require_admin_approval: true,
    default_role: 'reviewer',
    support_email: 'support@example.com'
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { effectiveRole } = useRole();
  const canEdit = can(effectiveRole, 'org:users');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        // TODO: In a real implementation, this would fetch from a settings API
        const saved = localStorage.getItem('auth_settings');
        if (saved) {
          setSettings(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Failed to load auth settings:', error);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // TODO: In a real implementation, this would save to a settings API
      localStorage.setItem('auth_settings', JSON.stringify(settings));
      
      toast({
        title: 'Settings saved',
        description: 'Authentication settings have been updated.',
      });
    } catch (error) {
      console.error('Failed to save auth settings:', error);
      toast({
        title: 'Couldn’t save',
        description: 'Please check the fields and try again.',
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
            <Users className="h-5 w-5" />
            User Registration
          </CardTitle>
          <CardDescription>
            Control how new users can join your organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="allow-signup" className="font-semibold">Allow Self-Signup</Label>
              <p className="text-sm text-gray-500">
                Let users create accounts without admin invitation.
              </p>
            </div>
            <Switch
              id="allow-signup"
              checked={settings.allow_self_signup}
              onCheckedChange={(checked) => 
                setSettings({ ...settings, allow_self_signup: checked })
              }
              disabled={!canEdit}
            />
          </div>

          {settings.allow_self_signup && (
            <div className="pl-6 border-l-2 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="require-approval" className="font-semibold">Require Admin Approval</Label>
                  <p className="text-sm text-gray-500">
                    New signups must be approved by an admin before gaining access.
                  </p>
                </div>
                <Switch
                  id="require-approval"
                  checked={settings.require_admin_approval}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, require_admin_approval: checked })
                  }
                  disabled={!canEdit}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-role" className="font-semibold">Default Role for New Users</Label>
                <Select
                  value={settings.default_role}
                  onValueChange={(value) => 
                    setSettings({ ...settings, default_role: value })
                  }
                  disabled={!canEdit}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reviewer">Reviewer</SelectItem>
                    <SelectItem value="reader">Reader</SelectItem>
                    <SelectItem value="operator">Operator</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  New users will be assigned this role automatically on signup.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Support Contact
          </CardTitle>
          <CardDescription>
            Contact information shown to users when signup is disabled.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="support-email">Support Email</Label>
            <Input
              id="support-email"
              type="email"
              value={settings.support_email}
              onChange={(e) => 
                setSettings({ ...settings, support_email: e.target.value })
              }
              placeholder="support@yourcompany.com"
              disabled={!canEdit}
            />
            <p className="text-sm text-gray-500">
              This email will be displayed on the home page when self-signup is disabled.
            </p>
          </div>
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