import React, { useEffect, useState } from "react";
async function tryFetch(u,o={}){ try{ const r=await fetch(u,{cache:"no-store",...o}); if(!r.ok) throw 0; return await r.json().catch(()=>({})); }catch{ return null; } }
async function trySave(u,p){ try{ const r=await fetch(u,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)}); return r.ok? await r.json().catch(()=>({})) : null; }catch{ return null; } }
export default function WebhooksTab(){
  const [hooks,setHooks]=useState([]); const [url,setUrl]=useState(""); const [event,setEvent]=useState("run.completed");
  const load=async()=>{ const j= await tryFetch("/api/webhooks"); setHooks(Array.isArray(j)?j:(j?.hooks||[])); };
  useEffect(()=>{ load(); },[]);
  const add=async()=>{ if(!url) return; await trySave("/api/webhooks",{url, event}); setUrl(""); load(); };
  const del=async(id)=>{ await tryFetch(`/api/webhooks/${id}`,{method:"DELETE"}); load(); };
  const test=async(id)=>{ await tryFetch(`/api/webhooks/${id}/test`,{method:"POST"}); alert('Test event sent.'); };
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">Webhooks</h2>
      <div className="grid md:grid-cols-3 gap-2 text-sm">
        <input className="px-2 py-1 border rounded md:col-span-2" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://example.com/webhook"/>
        <select className="px-2 py-1 border rounded" value={event} onChange={e=>setEvent(e.target.value)}>
          <option value="run.completed">run.completed</option>
          <option value="run.failed">run.failed</option>
          <option value="project.updated">project.updated</option>
        </select>
        <button onClick={add} className="px-3 py-2 text-sm border rounded md:col-span-3">Add Webhook</button>
      </div>
      <div className="mt-3 border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-zinc-50"><th className="text-left p-2">Event</th><th className="text-left p-2">URL</th><th className="p-2 text-right">Actions</th></tr></thead>
          <tbody>
            {hooks.map(h=>(
              <tr key={h.id||h.url}><td className="p-2">{h.event}</td><td className="p-2 truncate">{h.url}</td>
                <td className="p-2 text-right space-x-2">
                  <button onClick={()=>test(h.id||h.url)} className="px-2 py-1 border rounded">Test</button>
                  <button onClick={()=>del(h.id||h.url)} className="px-2 py-1 border rounded text-red-600">Delete</button>
                </td></tr>
            ))}
            {!hooks.length && <tr><td className="p-2" colSpan={3}>No webhooks configured.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}