import React, { useEffect, useState } from 'react';
import { getBrandingConfig } from '@/components/lib/brandingStore';
import { User } from '@/api/entities';

export default function PublicHeaderForced(){
  // Remove the fallback if present (React is now mounted)
  useEffect(()=>{
    const fb = document.getElementById('pub-header-fallback');
    if (fb) fb.remove();
  },[]);

  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const b = getBrandingConfig();
  const t = b?.theme || {};
  const logo = (t.darkMode && b?.logo?.dark?.file) ? b.logo.dark.file : (b?.logo?.light?.file || '');
  
  useEffect(() => {
    User.me().then(u => setAuthed(!!u)).catch(() => setAuthed(false)).finally(() => setLoading(false));
  }, []);

  function goSignIn(){ window.location.assign('/demo-login'); }
  function goDash(){ window.location.assign('/dashboard'); }

  return (
    <header id="pub-header-forced" className="pub-header" role="banner" aria-label="Public header">
      <a href="/" className="pub-left">
        {logo ? <img src={logo} alt="CABPOE™ logo" className="pub-logo"/> : <div className="pub-logo-fallback">C</div>}
        <span className="pub-title">CABPOE<span className="tm">™</span> Console</span>
      </a>
      <div className="pub-right">
        {loading ? ( <div className="pub-btn-placeholder" /> ) :
         authed ? ( <button className="pub-btn" onClick={goDash}>Dashboard</button> ) :
                  ( <button className="pub-btn" onClick={goSignIn}>Sign&nbsp;In</button> )
        }
      </div>
      <style>{`
        .pub-header{position:sticky;top:0;z-index:9999;display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border-bottom:1px solid rgba(0,0,0,.06);background:#fff; min-height: 52px; visibility: visible !important; opacity: 1 !important;}
        .pub-left{display:flex;align-items:center;gap:10px; text-decoration: none; color: inherit;}
        .pub-logo{height:32px;max-width:160px;object-fit:contain}
        .pub-logo-fallback{width:32px;height:32px;border-radius:6px;background:#111;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700}
        .pub-title{font-weight:700}
        .tm{font-size:10px;margin-left:2px;vertical-align:super}
        .pub-right{display:flex;gap:8px}
        .pub-btn{padding:6px 12px;border-radius:8px;border:1px solid rgba(0,0,0,.1);background:#fff;cursor:pointer; font-weight: 500;}
        .pub-btn:hover { background-color: #f3f4f6; }
        .pub-btn-placeholder { width: 80px; height: 32px; background-color: #f3f4f6; border-radius: 8px; }
      `}</style>
    </header>
  );
}