let enabled = false;
let logs = [];

export function getSniffLogs(){ return logs.slice(-20); }

export function enableSniffer(){
  if (enabled || !window.fetch) return;
  enabled = true;
  const orig = window.fetch;
  window.fetch = async function(url, opts){
    const u = (typeof url==='string'? url : (url?.url || ''));
    const isEntities = /\/api\/apps\/[^/]+\/entities\//.test(u);
    let status = null, ok = null;
    try{
      const res = await orig.apply(this, arguments);
      status = res.status; ok = res.ok;
      if (isEntities){
        logs.push({ ts: Date.now(), url: u, status, ok });
      }
      return res;
    } catch(e){
      if (isEntities){
        logs.push({ ts: Date.now(), url: u, status:'ERR', ok:false, msg: String(e) });
      }
      throw e;
    }
  };
}