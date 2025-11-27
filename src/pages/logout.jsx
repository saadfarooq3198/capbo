import React, { useEffect } from 'react';
import { User } from '@/api/entities';
import { Loader2 } from 'lucide-react';

export default function LogoutPage() {
  useEffect(() => {
    const performLogout = async () => {
      try {
        await User.logout();
      } catch (error) {
        console.error("Logout failed, redirecting anyway.", error);
      } finally {
        window.location.href = '/home';
      }
    };
    
    performLogout();
  }, []);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-50 space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      <p className="text-lg font-medium text-gray-700">Signing out...</p>
    </div>
  );
}