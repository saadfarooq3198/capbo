import React, { useState } from "react";

// Simple inline tabs to avoid import issues
const AccountTab = () => (
  <div className="space-y-3">
    <h2 className="text-lg font-medium">Account</h2>
    <p className="text-sm text-gray-600">Account management settings.</p>
  </div>
);

const ProfileTab = () => (
  <div className="space-y-3">
    <h2 className="text-lg font-medium">Profile</h2>
    <p className="text-sm text-gray-600">Profile settings coming soon.</p>
  </div>
);

const UsersTab = () => (
  <div className="space-y-3">
    <h2 className="text-lg font-medium">Users</h2>
    <p className="text-sm text-gray-600">User management coming soon.</p>
  </div>
);

const SocialLinksTab = () => (
  <div className="space-y-3">
    <h2 className="text-lg font-medium">Social Links</h2>
    <p className="text-sm text-gray-600">Social media links configuration.</p>
  </div>
);

const TABS = [
  { key: "account", label: "Account", comp: AccountTab },
  { key: "profile", label: "Profile", comp: ProfileTab },
  { key: "users", label: "Users", comp: UsersTab },
  { key: "roles", label: "Roles & Access", comp: () => <div><h2>Roles & Access</h2><p>Coming soon</p></div> },
  { key: "social", label: "Social Links", comp: SocialLinksTab },
  { key: "auth", label: "Auth Redirect", comp: () => <div><h2>Auth Redirect</h2><p>Coming soon</p></div> },
  { key: "branding", label: "Branding", comp: () => <div><h2>Branding</h2><p>Coming soon</p></div> },
  { key: "api_keys", label: "API Keys", comp: () => <div><h2>API Keys</h2><p>Coming soon</p></div> },
  { key: "webhooks", label: "Webhooks", comp: () => <div><h2>Webhooks</h2><p>Coming soon</p></div> },
  { key: "notifications", label: "Notifications", comp: () => <div><h2>Notifications</h2><p>Coming soon</p></div> },
  { key: "defaults", label: "Defaults & Presets", comp: () => <div><h2>Defaults & Presets</h2><p>Coming soon</p></div> },
  { key: "project_presets", label: "Project Presets", comp: () => <div><h2>Project Presets</h2><p>Coming soon</p></div> },
  { key: "data_sources", label: "Data Sources", comp: () => <div><h2>Data Sources</h2><p>Coming soon</p></div> },
  { key: "ticker_sources", label: "Ticker Sources", comp: () => <div><h2>Ticker Sources</h2><p>Coming soon</p></div> },
  { key: "integrations", label: "Integrations", comp: () => <div><h2>Integrations</h2><p>Coming soon</p></div> },
  { key: "audit_log", label: "Audit Log", comp: () => <div><h2>Audit Log</h2><p>Coming soon</p></div> },
];

export default function Settings() {
  const [tab, setTab] = useState("account");
  
  const ActiveComponent = (TABS.find(t => t.key === tab) || TABS[0]).comp;

  return (
    <div className="max-w-screen-2xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-semibold mb-4">Settings</h1>
      <div className="flex flex-col md:flex-row gap-6">
        <aside className="w-full md:w-56 shrink-0 border rounded-lg bg-white">
          <nav className="flex flex-col">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`text-left px-3 py-2 text-sm border-b last:border-b-0 hover:bg-zinc-50 transition-colors ${
                  t.key === tab ? "font-semibold bg-zinc-100" : ""
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </aside>
        <main className="flex-1 min-w-0">
          <div className="p-4 border rounded-lg bg-white">
            <ActiveComponent />
          </div>
        </main>
      </div>
    </div>
  );
}