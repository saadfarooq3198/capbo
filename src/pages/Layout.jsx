
import React, { useEffect, useState, Suspense } from "react";
import Header from "@/components/Header";
import PortalSidebar from "@/components/PortalSidebar";
import AppTopbar from "@/components/AppTopbar";
import { RoleProvider } from '@/components/auth/RoleProvider';
import { Toaster } from "@/components/ui/toaster";
import { ProjectsProvider } from "@/components/portal/ProjectsProvider";
import ViewAsBanner from "@/components/rbac/ViewAsBanner";
import { EnvDebugBanner } from "@/components/diagnostics/EnvDebugBanner";
import { useLocation } from "react-router-dom";
import { getBrandingConfig } from "@/components/lib/brandingStore";
import { applyBrandingHead, applySEOHead } from "@/components/lib/seoUtils";
import { initBase44Client } from '@/components/lib/base44Client';

// Import public layout components
import PublicLayoutTW from "@/components/public/PublicLayoutTW";

const Ticker = React.lazy(() =>
  import("@/components/GlobalSignalsTickerV2").catch(() => import("@/components/GlobalSignalsTicker"))
);

// Define sets for known public and portal base paths
const PUBLIC_PATHS = new Set(["/", "/home", "/about", "/terms", "/privacy", "/cookies-policy", "/signin", "/demo-login", "/diag-lite"]);
const PORTAL_PATHS = new Set(["/dashboard", "/projects", "/decision-runs", "/data-ingestion", "/settings", "/run-detail"]);

function isPublicRoute(pathname) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.length > 1 && pathname.endsWith('/')) {
    const withoutSlash = pathname.slice(0, -1);
    if (PUBLIC_PATHS.has(withoutSlash)) return true;
  }
  return false;
}

function LayoutComponent({ children }) {
  const location = useLocation();
  const path = location.pathname;

  // Initialize branding and SEO on mount
  useEffect(() => {
    // Add real Base44 meta tags if they don't exist
    if (!document.querySelector('meta[name="x-base44-app-id"]')) {
      const appIdMeta = document.createElement('meta');
      appIdMeta.setAttribute('name', 'x-base44-app-id');
      appIdMeta.setAttribute('content', '68b2e3b40b04f514a6720113'); // Real app ID from error logs
      document.head.appendChild(appIdMeta);

      const apiBaseMeta = document.createElement('meta');
      apiBaseMeta.setAttribute('name', 'x-base44-api-base');
      apiBaseMeta.setAttribute('content', 'https://app.base44.com'); // Real API base
      document.head.appendChild(apiBaseMeta);

      console.log('[CABPOE] Real Base44 meta tags injected');
    }

    const branding = getBrandingConfig();
    applyBrandingHead(branding);
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const pageKey = pathSegments[0] || 'home';
    applySEOHead(pageKey, branding);
  }, [location.pathname]);

  // HARDCODED check for the new /info and /diag-lite pages
  if (path === '/info' || path === '/diag-lite') {
    return (
        <>
            <PublicLayoutTW>{children}</PublicLayoutTW>
            <EnvDebugBanner />
            <Toaster />
        </>
    );
  }

  // Determine if the current path is public or portal using the robust function
  const isPublic = isPublicRoute(path);
  const isPortal = PORTAL_PATHS.has(path) || Array.from(PORTAL_PATHS).some(p => path.startsWith(p + "/") && p !== "/");

  // Router Logic: Public pages first.
  if (isPublic) {
    return (
      <>
        <PublicLayoutTW>
          {children}
          <EnvDebugBanner />
        </PublicLayoutTW>
        <Toaster />
      </>
    );
  }

  // Then, if it's a portal page, render the portal layout.
  if (isPortal) {
    return (
      <RoleProvider>
        <div className="min-h-screen bg-white text-zinc-900">
          <ViewAsBanner />
          <EnvDebugBanner />
          <div className="cabpoe-portal-root">
            <ProjectsProvider>
              <PortalSidebar />
              <div className="cabpoe-portal-main md:pl-64">
                <AppTopbar />
                <Suspense fallback={null}>
                  <div className="cabpoe-ticker-wrapper border-b bg-[#FAFAFA]">
                    <Ticker />
                  </div>
                </Suspense>
                <div className="cabpoe-portal-content p-4 md:p-8">
                  {children}
                </div>
              </div>
            </ProjectsProvider>
          </div>
          <Toaster />
        </div>
      </RoleProvider>
    );
  }

  // Fallback for any other page (treats them as needing auth by default)
  return (
    <RoleProvider>
      <div className="min-h-screen bg-white text-zinc-900">
        <ViewAsBanner />
        <EnvDebugBanner />
        <Header />
        {children}
        <Toaster />
      </div>
    </RoleProvider>
  );
}

export default function Layout({ children }) {
  // Bootstrap SDK at the true app root - before any providers or layouts
  useEffect(() => {
    if (!window.__CABPOE_SDK_BOOTSTRAP_STARTED) {
      window.__CABPOE_SDK_BOOTSTRAP_STARTED = true;

      initBase44Client()
        .then(() => {
          console.log('[CABPOE] App ready with Base44 SDK');
        })
        .catch((error) => {
          console.error('[CABPOE] SDK bootstrap failed:', error);
          window.__CABPOE_SDK_ERROR = error.message || String(error);
        });
    }
  }, []);

  return <LayoutComponent>{children}</LayoutComponent>;
}
