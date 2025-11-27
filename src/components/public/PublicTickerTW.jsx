import React, { Suspense } from 'react';

const GlobalSignalsTickerV2 = React.lazy(() => import('@/components/GlobalSignalsTickerV2'));

export default function PublicTickerTW() {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname.toLowerCase();
  // Only show ticker on these main public pages
  if (!['/', '/home', '/about'].includes(path)) {
      return null;
  }

  return (
    <div className="cabpoe-ticker-wrapper border-b bg-gray-50/75">
       <Suspense fallback={<div className="h-[49px] animate-pulse bg-gray-100" />}>
         <GlobalSignalsTickerV2 />
       </Suspense>
    </div>
  );
}