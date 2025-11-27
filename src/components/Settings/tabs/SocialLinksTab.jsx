import React, { useEffect, useState } from "react";
async function tryFetch(u,o={}){ try{ const r=await fetch(u,{cache:"no-store",...o}); if(!r.ok) throw 0; return await r.json().catch(()=>({})); }catch{ return null; } }
async function trySave(u,p){ try{ const r=await fetch(u,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)}); return r.ok? await r.json().catch(()=>({})) : null; }catch{ return null; } }
export default function SocialLinksTab(){
  const [show,setShow]=useState(true);
  const [links,setLinks]=useState({facebook:"",instagram:"",x:"",linkedin:"",youtube:""});
  const [msg,setMsg]=useState("");
  useEffect(()=>{ (async()=>{ const s= await (tryFetch("/api/settings/social")||tryFetch("/api/org/settings")); if(s){ const cfg=s.social||s.data?.social||s.settings?.social||s; if(cfg){ setShow(Boolean(cfg.show_social_bar??cfg.showBar??true)); const l=cfg.links||cfg.social_links||{}; setLinks({facebook:l.facebook||"",instagram:l.instagram||"",x:l.x||l.twitter||"",linkedin:l.linkedin||"",youtube:l.youtube||""}); }}})(); },[]);
  const save=async()=>{ setMsg(""); const ok=await trySave("/api/settings/social",{social:{show_social_bar:show,links}}); setMsg(ok?"Saved ✓":"Could not save (endpoint missing)."); };
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">Social Links</h2>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={show} onChange={e=>setShow(e.target.checked)}/> Show social icons in header</label>
      <div className="grid md:grid-cols-2 gap-3 text-sm">
        {["facebook","instagram","x","linkedin","youtube"].map(k=>(
          <label key={k} className={`grid gap-1 ${k==="youtube"?"md:col-span-2":""}`}>
            <span className="font-medium">{k==="x"?"X (Twitter)":k[0].toUpperCase()+k.slice(1)}</span>
            <input className="px-2 py-1 border rounded" value={links[k]} onChange={e=>setLinks(v=>({...v,[k]:e.target.value}))} placeholder={`https://${k==="x"?"x":k}.com/...`} />
          </label>
        ))}
      </div>
      <button onClick={save} className="px-3 py-2 text-sm border rounded">Save</button> {msg && <span className="text-sm">{msg}</span>}
    </div>
  );
}