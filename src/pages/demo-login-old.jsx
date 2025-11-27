import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { isPreview } from '@/components/preview';
import { findUserByEmail, verifyPassword, setSession, updateUser, recordFailedAttempt, isAccountLocked, getSession } from '@/components/auth/authUtils';
import { BarChart2, LogIn, UserPlus, Eye, EyeOff, TriangleAlert } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { RequestAccessDialog } from '@/components/RequestAccessDialog';

export default function DemoLoginOld() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleLogin = (e) => {
    e.preventDefault();
    toast({
        title: 'Authentication Retired',
        description: 'This local login method is for demo reference only and is disabled.',
        variant: 'destructive',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
       <Alert variant="destructive" className="max-w-sm w-full mb-8 bg-amber-100 border-amber-300 text-amber-900">
        <TriangleAlert className="h-4 w-4 !text-amber-900" />
        <AlertTitle>Legacy Demo Page</AlertTitle>
        <AlertDescription>
          This login page is for reference only. Production authentication is handled by the secure Base44 login.
          <Button variant="link" className="p-0 h-auto ml-1 text-amber-900 font-bold" asChild>
            <Link to="/signin">Proceed to Secure Sign In</Link>
          </Button>
        </AlertDescription>
      </Alert>
      <Link to="/home" className="flex items-center gap-2 mb-8">
        <BarChart2 className="h-8 w-8 text-indigo-600" />
        <span className="text-2xl font-bold">CABPOE Console</span>
      </Link>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign In (Old Demo)</CardTitle>
          <CardDescription>Enter your credentials to access the console.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@cabpoe.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={true}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={true}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={true}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={true}>
              Sign In (Disabled)
              <LogIn className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="text-center">
            <Link to="/forgot-password" tabIndex={-1} className="text-sm text-indigo-600 hover:text-indigo-500 pointer-events-none opacity-50">
              Forgot your password?
            </Link>
          </div>
          <p className="text-xs text-center text-gray-500">
            Don't have an account?
          </p>
          <Button variant="outline" className="w-full" onClick={() => setIsRequestOpen(true)} disabled={true}>
            Request Access
            <UserPlus className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
      <p className="text-xs text-gray-400 mt-8">
        &copy; {new Date().getFullYear()} CABPOE Initiative. All rights reserved.
      </p>
      <RequestAccessDialog open={isRequestOpen} onOpenChange={setIsRequestOpen} />
    </div>
  );
}