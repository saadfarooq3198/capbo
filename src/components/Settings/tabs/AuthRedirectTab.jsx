import React, { useEffect, useState } from "react";
async function tryFetch(u,o={}){ try{ const r=await fetch(u,{cache:"no-store",...o}); if(!r.ok) throw 0; return await r.json().catch(()=>({})); }catch{ return null; } }
async function trySave(u,p){ try{ const r=await fetch(u,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)}); return r.ok? await r.json().catch(()=>({})) : null; }catch{ return null; } }
export default function AuthRedirectTab(){
  const [redir,setRedir]=useState("dashboard"); const [msg,setMsg]=useState("");
  useEffect(()=>{ (async()=>{ const a= await (tryFetch("/api/settings/auth-redirect")||tryFetch("/api/org/settings")); if(a){ const v = a.redirect||a.data?.redirect||a.settings?.redirect||a.default_redirect; if(typeof v==="string") setRedir(v.includes("project")?"projects":"dashboard"); }})(); },[]);
  const save=async()=>{ setMsg(""); const ok=await trySave("/api/settings/auth-redirect",{redirect: redir==="projects"?"/projects":"/dashboard"}); setMsg(ok?"Saved ✓":"Could not save (endpoint missing)."); };
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">After-login default page</h2>
      <div className="flex flex-col gap-1">
        <label className="inline-flex items-center gap-2 text-sm"><input type="radio" name="r" checked={redir==="dashboard"} onChange={()=>setRedir("dashboard")}/>Dashboard</label>
        <label className="inline-flex items-center gap-2 text-sm"><input type="radio" name="r" checked={redir==="projects"} onChange={()=>setRedir("projects")}/>Projects</label>
      </div>
      <div><button onClick={save} className="px-3 py-2 text-sm border rounded">Save</button> {msg && <span className="text-sm ml-2">{msg}</span>}</div>
    </div>
  );
}