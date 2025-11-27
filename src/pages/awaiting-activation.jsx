import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function AwaitingActivation() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleSelfActivate = async () => {
    if (!user) return;
    
    setActivating(true);
    try {
      await User.update(user.id, { 
        status: 'active',
        app_role: user.app_role || 'admin' // Ensure they have admin role
      });
      
      setActivated(true);
      toast({
        title: 'Account Activated!',
        description: 'Your admin account is now active. Redirecting...'
      });
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
      
    } catch (error) {
      console.error('Activation error:', error);
      toast({
        title: 'Activation Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setActivating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await User.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (activated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <CardTitle className="text-2xl text-green-700">Account Activated!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Your account has been successfully activated. You will be redirected to the dashboard shortly.
            </p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAdmin = user?.app_role === 'admin' || user?.role === 'admin';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <CardTitle className="text-2xl">Account Pending Activation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {user && (
            <div className="text-center space-y-2">
              <p className="font-medium">Signed in as:</p>
              <p className="text-sm text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-600">Role: {user.app_role || user.role || 'viewer'}</p>
              <p className="text-sm text-gray-600">Status: {user.status || 'pending'}</p>
            </div>
          )}

          {isAdmin ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <p className="font-medium text-blue-800">Admin Account Detected</p>
                </div>
                <p className="text-sm text-blue-700">
                  As an administrator, you can activate your own account to begin using the system.
                </p>
              </div>
              
              <Button 
                onClick={handleSelfActivate} 
                disabled={activating}
                className="w-full"
                size="lg"
              >
                {activating ? 'Activating...' : 'Activate My Admin Account'}
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                Your account is waiting for an administrator to grant you access.
              </p>
              <p className="text-gray-600">
                You will receive an email once your account has been activated.
              </p>
              <p className="text-gray-600">
                If you have any questions, please contact our support team.
              </p>
              
              <div className="pt-4">
                <a href="mailto:admin@gigsgen.com" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800">
                  <Mail className="h-4 w-4" />
                  Contact Admin
                </a>
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <Button variant="outline" onClick={handleSignOut} className="w-full">
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}