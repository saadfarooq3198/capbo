let _auth = 'none';
export function getAuthMode(){ return _auth; }

async function waitForApiKey(ms=2500){
  const t0 = Date.now();
  while (Date.now()-t0 < ms){
    try {
      const me = await (window.User?.me?.());
      if (me?.api_key) return me.api_key;
    } catch(_) {}
    await new Promise(r=>setTimeout(r,150));
  }
  return null;
}

export async function b44JSON(url, opts={}){
  const apiKey = await waitForApiKey();
  if (apiKey){
    _auth = 'api_key';
    const r = await fetch(url, { ...opts, credentials:'include',
      headers:{ 'api_key': apiKey, 'Content-Type':'application/json', ...(opts.headers||{}) }
    });
    if (r.ok) return r.json();
  }
  _auth = 'cookie';
  const r2 = await fetch(url, { ...opts, credentials:'include',
    headers:{ 'Content-Type':'application/json', ...(opts.headers||{}) }
  });
  if (!r2.ok){ const e=new Error(`HTTP ${r2.status}`); e.status=r2.status; e.url=url; throw e; }
  return r2.json();
}