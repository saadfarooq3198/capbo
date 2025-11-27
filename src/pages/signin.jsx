import React, { useEffect } from 'react';
import { User } from '@/api/entities';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export default function SignInPage() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const returnTo = searchParams.get('returnTo') || '/dashboard';
    
    // Construct the full callback URL
    const callbackUrl = new URL(returnTo, window.location.origin).href;

    // Use the platform's login redirect function
    User.loginWithRedirect(callbackUrl);
  }, [searchParams]);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-50 space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      <p className="text-lg font-medium text-gray-700">Redirecting to Secure Sign In...</p>
    </div>
  );
}