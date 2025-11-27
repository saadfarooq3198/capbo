import React from "react";

export default function SettingsFallback({ state = "missing" }) {
  return (
    <div className="max-w-screen-lg mx-auto p-4 md:p-6">
      <h1 className="text-xl font-semibold mb-3">Settings</h1>
      {state === "loading" ? (
        <p className="text-sm text-zinc-600">Loading settings…</p>
      ) : (
        <>
          <p className="text-sm text-zinc-700 mb-4">
            The Settings component couldn't be located in the usual places.
          </p>
          <div className="space-y-4">
            <section className="p-3 border rounded-lg">
              <h2 className="font-medium mb-2">What you can do now</h2>
              <ol className="list-decimal pl-5 text-sm space-y-1">
                <li>Find where your original Settings page lives (e.g., <code>components/Settings(.js/.tsx)</code>).</li>
                <li>Update the import chain in <code>pages/settings.js</code> to match that path.</li>
                <li>If it used to live in this file, move it to <code>components/Settings</code> and keep this route as a thin wrapper.</li>
              </ol>
            </section>
          </div>
        </>
      )}
    </div>
  );
}