import React from "react";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/decision-runs", label: "Decision Runs" },
  { href: "/data-ingestion", label: "Data Ingestion" },
  { href: "/settings", label: "Settings" },
];

export default function AppNavItems({ onNavigate }) {
  const here = typeof window !== "undefined" ? window.location.pathname : "";
  return (
    <nav role="navigation" aria-label="Portal" className="flex flex-col">
      {LINKS.map((l) => {
        const active = here.startsWith(l.href);
        return (
          <a
            key={l.href}
            href={l.href}
            onClick={onNavigate}
            className={`px-4 py-2 text-sm ${active ? "font-semibold text-zinc-900 bg-zinc-100" : "text-zinc-700 hover:bg-zinc-50"}`}
          >
            {l.label}
          </a>
        );
      })}
    </nav>
  );
}