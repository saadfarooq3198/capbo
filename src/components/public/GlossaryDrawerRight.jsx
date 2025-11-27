import React, { useEffect, useState } from 'react';
export default function GlossaryDrawerRight({ items=[] }){
  const [open,setOpen]=useState(false);
  useEffect(()=>{
    const btn=document.querySelector('[data-open-glossary]');
    const onClick=()=>setOpen(true);
    btn?.addEventListener('click', onClick);
    return ()=>btn?.removeEventListener('click', onClick);
  },[]);
  function close(){ setOpen(false); }
  return (
    <>
      {open && <div className="gr-backdrop" onClick={close} aria-hidden="true" />}
      <aside className={`gr ${open?'open':''}`} role="dialog" aria-label="CABPOE™ Glossary">
        <div className="gr-head">
          <strong>Glossary</strong>
          <button className="gr-close" onClick={close} aria-label="Close">×</button>
        </div>
        <div className="gr-body">
          {items.map((it,i)=>(
            <div key={i} className="gr-item">
              <div className="gr-term">{it.term}</div>
              <div className="gr-def">{it.definition}</div>
            </div>
          ))}
        </div>
      </aside>
      <style>{`
        .gr-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:1100}
        .gr{position:fixed;top:0;right:0;height:100vh;width:380px;max-width:90vw;background:#fff;
             border-left:1px solid rgba(0,0,0,.08);z-index:1110;transform:translateX(100%);transition:transform .2s ease}
        .gr.open{transform:translateX(0)}
        .gr-head{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-bottom:1px solid rgba(0,0,0,.06)}
        .gr-body{padding:12px 14px;display:flex;flex-direction:column;gap:10px;height:calc(100vh - 56px);overflow:auto}
        .gr-item{padding:8px;border-radius:8px;border:1px solid rgba(0,0,0,.06);background:#fafafa}
        .gr-term{font-weight:700;margin-bottom:4px}
        .gr-def{font-size:14px;line-height:1.5}
        .gr-close{background:transparent;border:0;font-size:20px;cursor:pointer}
      `}</style>
    </>
  );
}