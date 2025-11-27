const subs = new Set();
let data = { projects: [], source: 'unknown', debug: [] };

export function getProjects() { return data.projects || []; }
export function getSource() { return data.source || 'unknown'; }
export function getDebug() { return data.debug || []; }

export function subscribe(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

function notify() {
  for (const fn of subs) {
    try { fn(data); } catch (e) { console.error("Subscriber failed", e); }
  }
}

export function publishProjects(projects, source = 'unknown', debugEntry = null) {
  try {
    const list = Array.isArray(projects) ? projects : [];
    const normalized = list.map((p, i) => ({
      id: p.id || p._id || p.project_id || String(i),
      name: p.name || p.project_name || 'Untitled Project',
      slug: (p.slug || p.name || p.project_name || p.id || p._id || 'proj')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    }));

    const newDebug = [...(data.debug || []), { ts: Date.now(), source, ...debugEntry }].slice(-6);

    data = {
      projects: normalized,
      source,
      debug: newDebug
    };

    try {
      localStorage.setItem('cabpoe.projectsCache', JSON.stringify(data.projects));
    } catch (e) {
      console.warn("Failed to write projects to localStorage cache", e);
    }
    
    notify();
    window.dispatchEvent(new CustomEvent('cabpoe:projectsUpdated', { detail: { count: normalized.length, source } }));
  } catch (e) {
    const errorDebug = { ts: Date.now(), source, error: String(e) };
    data = { projects: [], source: 'error', debug: [...(data.debug || []), errorDebug].slice(-6) };
    notify();
  }
}

export function hydrateFromCache() {
  try {
    const raw = localStorage.getItem('cabpoe.projectsCache');
    if (raw) {
      const cachedProjects = JSON.parse(raw);
      if (Array.isArray(cachedProjects) && cachedProjects.length > 0) {
        // Only publish if the store is currently empty to avoid overwriting fresh data
        if (getProjects().length === 0) {
           publishProjects(cachedProjects, 'cache', { note: 'hydrated-from-cache' });
        }
      }
    }
  } catch (e) {
    console.error("Failed to hydrate project cache", e);
  }
}