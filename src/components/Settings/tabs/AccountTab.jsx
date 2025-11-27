import React, { useEffect, useState } from "react";
async function tryFetch(u,o={}){ try{ const r=await fetch(u,{cache:"no-store",...o}); if(!r.ok) throw 0; return await r.json().catch(()=>({})); }catch{ return null; } }
export default function AccountTab(){
  const [me,setMe]=useState(null);
  useEffect(()=>{ (async()=>{ const m = await (tryFetch("/api/me")||tryFetch("/api/user/me")||Promise.resolve(null)); setMe(m); })(); },[]);
  const signOut=()=>{ fetch("/api/logout",{method:"POST"}).finally(()=>{ window.location.href="/";}); };
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">Account</h2>
      <p className="text-sm text-zinc-700">{me?.email ? <>Signed in as <span className="font-medium">{me.email}</span></> : "Signed-in user info unavailable."}</p>
      <button onClick={signOut} className="px-3 py-2 text-sm border rounded">Sign out</button>
    </div>
  );
}