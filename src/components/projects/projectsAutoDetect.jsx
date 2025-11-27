import { b44JSON, getAuthMode } from './base44Client';
import { getSniffLogs } from './netSniffer';
import { setProjectsSource } from './projectsSourceConfig';

const APP = '68b2e3b40b04f514a6720113';
const ENT_CANDIDATES = ['Project','Projects','project','CABPOEProject'];

function normSlug(x){ 
  return String(x||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') || 'proj'; 
}

function pickFields(sample){
  const keys = Object.keys(sample||{});
  const idField = ['id','_id','project_id'].find(k=>keys.includes(k)) || 'id';
  const nameField = ['name','project_name','title'].find(k=>keys.includes(k)) || 'name';
  const slugField = ['slug', nameField, idField].find(k=>keys.includes(k)) || 'slug';
  const statusField = keys.includes('status') ? 'status' : null;
  return { idField, nameField, slugField, statusField };
}

async function tryEntity(entity){
  const url = `https://app.base44.com/api/apps/${APP}/entities/${entity}`;
  const json = await b44JSON(url);
  const arr = Array.isArray(json) ? json : (Array.isArray(json?.items) ? json.items : []);
  if (!arr.length) return null;
  const fields = pickFields(arr[0]);
  // Quick sanity: name exists on first row
  const name = arr[0][fields.nameField];
  if (name == null) return null;
  return { entity, fields, count: arr.length, auth:getAuthMode(), urlTried:url };
}

export async function autoDetectProjectsSource(){
  // A) Use sniffer if available
  const logs = getSniffLogs().filter(l=>/entities\//.test(l.url) && l.ok);
  if (logs.length){
    // pick the latest "entities/<X>"
    const last = logs[logs.length-1];
    const entity = last.url.split('/entities/')[1].split(/[?\/]/)[0];
    const probe = await tryEntity(entity).catch(()=>null);
    if (probe){
      setProjectsSource({
        appId: APP,
        entity: probe.entity,
        ...probe.fields,
      });
      return { source: 'sniffer', ...probe };
    }
  }
  // B) Probe common candidates
  for (const e of ENT_CANDIDATES){
    const probe = await tryEntity(e).catch(()=>null);
    if (probe){
      setProjectsSource({ appId: APP, entity: probe.entity, ...probe.fields });
      return { source: 'probe', ...probe };
    }
  }
  throw new Error('Unable to auto-detect Projects entity. Open Data → Projects once, then retry.');
}