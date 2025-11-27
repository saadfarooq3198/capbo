import React, { useState, Suspense } from "react";
import Header from "@/components/Header";
import PortalSidebar from "@/components/PortalSidebar";
import AppTopbar from "@/components/AppTopbar";

// Lazy-load whichever ticker exists; if none, render nothing.
const Ticker = React.lazy(() =>
  import("@/components/GlobalSignalsTickerV2").catch(() => import("@/components/GlobalSignalsTicker"))
);
function TickerSlot() {
  return (
    <Suspense fallback={null}>
      <div className="cabpoe-ticker-wrapper border-b bg-[#FAFAFA]">
        <Ticker />
      </div>
    </Suspense>
  );
}

export default function AppShell({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <PortalSidebar open={open} onClose={() => setOpen(false)} />
        <div className="flex-1 flex flex-col">
          <AppTopbar onToggleSidebar={() => setOpen((s) => !s)} />
          <TickerSlot />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}