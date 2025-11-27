import React, { useEffect, useState } from 'react';
import { getSession, findUserById, clearSession, getUsers } from './authUtils';

// A simple component to run the one-time migration
function AuthMigration() {
  useEffect(() => {
    if (typeof window === 'undefined' || localStorage.getItem('cabpoe_auth_migrated_v1') === 'true') {
      return;
    }
    
    console.warn("Running one-time auth migration: Wiping all users and sessions.");
    
    try {
      localStorage.removeItem('cabpoe_users');
      localStorage.removeItem('cabpoe_session');
      localStorage.removeItem('cabpoe_auth_attempts');
      localStorage.removeItem('cabpoe_reset_tokens');
      
      // Mark migration as done
      localStorage.setItem('cabpoe_auth_migrated_v1', 'true');
      console.log("Auth migration complete. Users must re-register.");

      // Force a redirect to start fresh
      window.location.href = '/first-admin';

    } catch (e) {
      console.error("Auth migration failed:", e);
    }
  }, []);
  
  return null; // This component does not render anything
}


export default function AuthGuard({ children, portalRoutes = [] }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const path = window.location.pathname;
    const isPortalRoute = portalRoutes.some(p => path.startsWith(p));
    
    const session = getSession();
    const usersExist = getUsers().length > 0;

    if (!isPortalRoute) {
        // For public pages, no auth check needed
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
    }

    // Portal route logic
    if (!session) {
      if (usersExist) {
        window.location.href = '/signin';
      } else {
        window.location.href = '/first-admin';
      }
      return;
    }
    
    const user = findUserById(session.user_id);
    if (!user || user.status === 'deactivated') {
      clearSession();
      window.location.href = '/signin';
      return;
    }
    
    if (user.must_change_password && path !== '/change-password') {
      window.location.href = '/change-password';
      return;
    }

    setIsAuthenticated(true);
    setIsLoading(false);

  }, [portalRoutes]);

  // For portal routes, we show a loader while checking auth, then render children
  // For public routes, we render children immediately.
  const isPortalRoute = typeof window !== 'undefined' && portalRoutes.some(p => window.location.pathname.startsWith(p));

  if (isPortalRoute && isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  if (isPortalRoute && !isAuthenticated) {
    // This should ideally not be reached due to redirects, but as a fallback
    return null;
  }

  return (
    <>
      <AuthMigration />
      {children}
    </>
  );
}