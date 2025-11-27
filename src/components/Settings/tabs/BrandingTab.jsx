import React, { useEffect, useState } from "react";
async function tryFetch(url, opts={}){ try{ const r=await fetch(url,{cache:"no-store",...opts}); if(!r.ok) throw 0; return await r.json().catch(()=>({})); }catch{ return null; } }
async function trySave(url,p){ try{ const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)}); return r.ok? await r.json().catch(()=>({})) : null; }catch{ return null; } }
export default function BrandingTab(){
  const [logo,setLogo]=useState(""); const [msg,setMsg]=useState("");
  useEffect(()=>{ (async()=>{ const s= await (tryFetch("/api/settings/branding")||tryFetch("/api/org/settings")); if(s){ const v=s.logo_url||s.branding?.logo_url||s.data?.branding?.logo_url; if(v) setLogo(v); }})(); },[]);
  const save=async()=>{ setMsg(""); const ok=await trySave("/api/settings/branding",{ logo_url: logo }); setMsg(ok?"Saved ✓":"Could not save (endpoint missing)."); };
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">Branding & Logo</h2>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Logo URL</span>
        <input className="px-2 py-1 border rounded" value={logo} onChange={e=>setLogo(e.target.value)} placeholder="https://…/logo.svg" />
      </label>
      {logo && <div className="p-3 border rounded"><img src={logo} alt="Logo preview" className="h-12" /></div>}
      <button onClick={save} className="px-3 py-2 text-sm border rounded">Save</button> {msg && <span className="text-sm ml-2">{msg}</span>}
    </div>
  );
}