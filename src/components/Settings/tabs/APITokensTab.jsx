import React, { useEffect, useState } from "react";
async function tryFetch(u,o={}){ try{ const r=await fetch(u,{cache:"no-store",...o}); if(!r.ok) throw 0; return await r.json().catch(()=>({})); }catch{ return null; } }
async function trySave(u,p){ try{ const r=await fetch(u,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)}); return r.ok? await r.json().catch(()=>({})) : null; }catch{ return null; } }
export default function APITokensTab(){
  const [items,setItems]=useState([]); const [name,setName]=useState(""); const [msg,setMsg]=useState("");
  const load=async()=>{ const j= await (tryFetch("/api/keys")||tryFetch("/api/api-keys")); setItems(Array.isArray(j)?j:(j?.keys||[])); };
  useEffect(()=>{ load(); },[]);
  const create=async()=>{ setMsg(""); if(!name) return; const ok=await trySave("/api/keys",{ name }); setMsg(ok?"Created ✓. Your new key will be shown once.":"Could not create (endpoint missing)."); setName(""); load(); };
  const revoke=async(id)=>{ await tryFetch(`/api/keys/${id}`,{method:"DELETE"}); load(); };
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">API Keys</h2>
      <div className="flex gap-2 text-sm">
        <input className="px-2 py-1 border rounded flex-1" value={name} onChange={e=>setName(e.target.value)} placeholder="Key name"/>
        <button onClick={create} className="px-3 py-2 text-sm border rounded">Create</button>
      </div>
      {msg && <p className="text-sm">{msg}</p>}
      <div className="mt-3 border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-zinc-50"><th className="text-left p-2">Name</th><th className="text-left p-2">Key</th><th className="p-2 text-right">Actions</th></tr></thead>
          <tbody>
            {items.map(k=>(
              <tr key={k.id||k.key}><td className="p-2">{k.name||"—"}</td><td className="p-2 font-mono">{k.key_preview || (k.masked || k.key_last4 ? `••••${k.key_last4}` : "••••••••")}</td><td className="p-2 text-right"><button onClick={()=>revoke(k.id||k.key)} className="px-2 py-1 border rounded text-red-600">Revoke</button></td></tr>
            ))}
            {!items.length && <tr><td className="p-2" colSpan={3}>No keys have been created.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}