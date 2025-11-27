import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from "react";
import { User } from "@/api/entities";
import { isPreview } from "@/components/preview";
import { Loader2 } from "lucide-react";
import { normalizeRole, getEffectiveRole } from '@/components/auth/permissions';
import { useLocation, useNavigate } from 'react-router-dom';

const RoleCtx = createContext(null);

export function RoleProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const fetchUser = useCallback(async () => {
    try {
        let rawUser = await User.me();
        
        // New user onboarding logic - Set defaults for new users
        if (rawUser && (!rawUser.status || !rawUser.app_role)) {
            const defaultData = {
                status: rawUser.status || 'pending',
                app_role: rawUser.app_role || 'viewer'
            };
            await User.updateMyUserData(defaultData);
            // Re-fetch user data to get the latest state
            rawUser = await User.me();
        }

        if (rawUser) {
            setUser({
              ...rawUser,
              app_role: normalizeRole(rawUser.app_role || 'reviewer')
            });
        } else {
            setUser(null);
        }
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Auth Guard Logic: redirect non-active users
  useEffect(() => {
    if (!isLoading && user && user.status !== 'active') {
      // Allow access to the awaiting-activation page itself
      if (location.pathname !== '/awaiting-activation') {
        navigate('/awaiting-activation');
      }
    }
  }, [user, isLoading, location.pathname, navigate]);

  const realRole = useMemo(() => normalizeRole(user?.app_role || 'reviewer'), [user]);
  const allowOverride = !isPreview && realRole === "admin";

  const [override, setOverride] = useState(() => {
    if (!allowOverride) return null;
    try {
      const viewAsRole = sessionStorage.getItem('cabpoe.viewAsRole');
      return viewAsRole || null;
    } catch (e) { return null; }
  });

  // If user isn't an admin, purge any stale override from sessionStorage
  useEffect(() => {
    if (!allowOverride) {
      if (sessionStorage.getItem("cabpoe.viewAsRole")) {
          sessionStorage.removeItem("cabpoe.viewAsRole");
      }
      if (override) setOverride(null);
    }
  }, [allowOverride, override]);

  // Listen for view-as changes
  useEffect(() => {
    if (!allowOverride) return;
    
    const handleViewAsChange = () => {
      const viewAsRole = sessionStorage.getItem('cabpoe.viewAsRole');
      setOverride(viewAsRole || null);
    };

    window.addEventListener('cabpoe:viewAsRoleChanged', handleViewAsChange);
    return () => window.removeEventListener('cabpoe:viewAsRoleChanged', handleViewAsChange);
  }, [allowOverride]);

  // Persist override only when allowed
  useEffect(() => {
    if (!allowOverride) return;
    try {
      if (override) sessionStorage.setItem("cabpoe.viewAsRole", override);
      else sessionStorage.removeItem("cabpoe.viewAsRole");
    } catch (e) { /* ignore */ }
  }, [override, allowOverride]);
  
  const effectiveRole = useMemo(() => {
    if (allowOverride && override) return override;
    return realRole;
  }, [allowOverride, override, realRole]);

  const setViewAs = useCallback((role) => {
    if (!allowOverride) return;
    if (role === 'admin' || !role) {
      sessionStorage.removeItem('cabpoe.viewAsRole');
      setOverride(null);
    } else {
      sessionStorage.setItem('cabpoe.viewAsRole', role);
      setOverride(role);
    }
    window.dispatchEvent(new CustomEvent('cabpoe:viewAsRoleChanged'));
  }, [allowOverride]);

  const value = useMemo(() => ({
    user,
    realRole,
    effectiveRole,
    setViewAs,
    refreshUser: fetchUser,
  }), [user, realRole, effectiveRole, setViewAs, fetchUser]);

  if (isLoading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
    );
  }
  
  // For portal pages that require authentication
  if (!user && !isPreview && location.pathname !== '/awaiting-activation') {
      const returnTo = location.pathname + location.search;
      const callbackUrl = new URL(returnTo, window.location.origin).href;
      User.loginWithRedirect(callbackUrl);
      return null;
  }

  // If user is not active, the hook above will redirect them.
  // We can render children here, and the redirect will handle it.
  // Exception for the activation page itself.
  if (user && user.status !== 'active' && location.pathname !== '/awaiting-activation') {
    return null; // Render nothing while redirecting
  }

  return <RoleCtx.Provider value={value}>{children}</RoleCtx.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleCtx);
  if (!ctx) {
    // Return safe defaults when used outside of RoleProvider (e.g., on public pages)
    return {
      user: null,
      realRole: 'reviewer',
      effectiveRole: 'reviewer', 
      setViewAs: () => {},
      refreshUser: async () => {},
    };
  }
  return ctx;
}