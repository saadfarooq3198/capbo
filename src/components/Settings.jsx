import React, { useEffect, useState } from "react";

// Utility: safe fetch (no-throw)
async function tryFetch(url, opts = {}) {
  try {
    const r = await fetch(url, { cache: "no-store", ...opts });
    if (!r.ok) throw new Error(String(r.status));
    return await r.json().catch(() => ({}));
  } catch {
    return null;
  }
}

export default function Settings() {
  // Account
  const [me, setMe] = useState(null);

  // Social links
  const [showBar, setShowBar] = useState(true);
  const [links, setLinks] = useState({ facebook:"", instagram:"", x:"", linkedin:"", youtube:"" });
  const [savingSocial, setSavingSocial] = useState(false);
  const [socialMsg, setSocialMsg] = useState("");

  // After-login redirect
  const [redirect, setRedirect] = useState("dashboard");
  const [savingRedirect, setSavingRedirect] = useState(false);
  const [redirectMsg, setRedirectMsg] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      // 1) Load account (best-effort)
      const who = await (tryFetch("/api/me") || tryFetch("/api/user/me") || Promise.resolve(null));
      if (alive) setMe(who);

      // 2) Load org social settings (best-effort; accept several shapes)
      const s = await (tryFetch("/api/settings/social") || tryFetch("/api/org/settings") || Promise.resolve(null));
      if (alive && s) {
        const cfg = s.social || s.data?.social || s.settings?.social || s;
        if (cfg) {
          setShowBar(Boolean(cfg.show_social_bar ?? cfg.showBar ?? true));
          const l = cfg.links || cfg.social_links || {};
          setLinks({
            facebook: l.facebook || "",
            instagram: l.instagram || "",
            x: l.x || l.twitter || "",
            linkedin: l.linkedin || "",
            youtube: l.youtube || ""
          });
        }
      }

      // 3) Load auth redirect (best-effort)
      const a = await (tryFetch("/api/settings/auth-redirect") || tryFetch("/api/org/settings") || Promise.resolve(null));
      if (alive && a) {
        const val = a.redirect || a.data?.redirect || a.settings?.redirect || a.default_redirect;
        if (typeof val === "string") setRedirect(val.includes("project") ? "projects" : "dashboard");
      }
    })();
    return () => { alive = false; };
  }, []);

  // Save handlers (graceful if API missing)
  const saveSocial = async () => {
    setSavingSocial(true); setSocialMsg("");
    const body = JSON.stringify({
      social: { show_social_bar: showBar, links }
    });
    const ok = await tryFetch("/api/settings/social", { method:"POST", headers:{ "Content-Type":"application/json" }, body });
    setSavingSocial(false);
    setSocialMsg(ok ? "Saved ✓" : "Could not save (endpoint missing).");
  };

  const saveRedirect = async () => {
    setSavingRedirect(true); setRedirectMsg("");
    const body = JSON.stringify({ redirect: redirect === "projects" ? "/projects" : "/dashboard" });
    const ok = await tryFetch("/api/settings/auth-redirect", { method:"POST", headers:{ "Content-Type":"application/json" }, body });
    setSavingRedirect(false);
    setRedirectMsg(ok ? "Saved ✓" : "Could not save (endpoint missing).");
  };

  const signOut = () => {
    // Try common sign-out endpoints; fall back to homepage
    fetch("/api/logout", { method:"POST" }).finally(() => { window.location.href = "/"; });
  };

  const onLink = (k, v) => setLinks(prev => ({ ...prev, [k]: v }));

  return (
    <div className="max-w-screen-lg mx-auto p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {/* Account */}
      <section className="p-4 border rounded-lg space-y-2">
        <h2 className="text-lg font-medium">Account</h2>
        <p className="text-sm text-zinc-700">
          {me?.email ? <>Signed in as <span className="font-medium">{me.email}</span></> : "Signed-in user info unavailable."}
        </p>
        <button onClick={signOut} className="px-3 py-2 text-sm border rounded focus:outline-none focus:ring">
          Sign out
        </button>
      </section>

      {/* Social Links */}
      <section className="p-4 border rounded-lg space-y-3">
        <h2 className="text-lg font-medium">Social Links (Header Center)</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showBar} onChange={e => setShowBar(e.target.checked)} />
          Show social icons in header
        </label>

        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <label className="grid gap-1">
            <span className="font-medium">Facebook</span>
            <input className="px-2 py-1 border rounded" value={links.facebook} onChange={e => onLink("facebook", e.target.value)} placeholder="https://facebook.com/…" />
          </label>
          <label className="grid gap-1">
            <span className="font-medium">Instagram</span>
            <input className="px-2 py-1 border rounded" value={links.instagram} onChange={e => onLink("instagram", e.target.value)} placeholder="https://instagram.com/…" />
          </label>
          <label className="grid gap-1">
            <span className="font-medium">X (Twitter)</span>
            <input className="px-2 py-1 border rounded" value={links.x} onChange={e => onLink("x", e.target.value)} placeholder="https://x.com/…" />
          </label>
          <label className="grid gap-1">
            <span className="font-medium">LinkedIn</span>
            <input className="px-2 py-1 border rounded" value={links.linkedin} onChange={e => onLink("linkedin", e.target.value)} placeholder="https://linkedin.com/company/…" />
          </label>
          <label className="grid gap-1 md:col-span-2">
            <span className="font-medium">YouTube</span>
            <input className="px-2 py-1 border rounded" value={links.youtube} onChange={e => onLink("youtube", e.target.value)} placeholder="https://youtube.com/…" />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={saveSocial} disabled={savingSocial} className="px-3 py-2 text-sm border rounded focus:outline-none focus:ring">
            {savingSocial ? "Saving…" : "Save"}
          </button>
          {socialMsg && <span className="text-sm">{socialMsg}</span>}
        </div>
      </section>

      {/* After-login redirect */}
      <section className="p-4 border rounded-lg space-y-3">
        <h2 className="text-lg font-medium">After-login default page</h2>
        <div className="flex flex-col gap-2 text-sm">
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="redir" value="dashboard" checked={redirect === "dashboard"} onChange={() => setRedirect("dashboard")} />
            Dashboard
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="redir" value="projects" checked={redirect === "projects"} onChange={() => setRedirect("projects")} />
            Projects
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={saveRedirect} disabled={savingRedirect} className="px-3 py-2 text-sm border rounded focus:outline-none focus:ring">
            {savingRedirect ? "Saving…" : "Save"}
          </button>
          {redirectMsg && <span className="text-sm">{redirectMsg}</span>}
        </div>
      </section>
    </div>
  );
}