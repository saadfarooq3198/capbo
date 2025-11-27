import React from 'react';
import { useProjectsSafe } from './portal/useProjectsContext';

export default function ProjectsDropdown() {
  const { projects = [], activeProjectId, setActiveProjectId } = useProjectsSafe();
  const has = Array.isArray(projects) && projects.length > 0;
  const value = activeProjectId || (has ? projects[0]?.id : '');

  const onChange = (e) => {
    const id = e.target.value;
    try { setActiveProjectId?.(id); } catch {}
    try {
      window.dispatchEvent(new CustomEvent('cabpoe:projectChanged', { detail:{ projectId:id } }));
    } catch {}
  };

  return (
    <div className="cabpoe-dd-wrap">
      <label htmlFor="cabpoe-projects" className="mr-2 whitespace-nowrap">Project</label>
      <select id="cabpoe-projects" className="cabpoe-dd" value={value} onChange={onChange} disabled={!has}>
        {has
          ? projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
          : <option>Loading projects…</option>}
      </select>
      <style>{`
        .cabpoe-dd-wrap{ display:flex; align-items:center; }
        .cabpoe-dd{ min-width:320px; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; }
      `}</style>
    </div>
  );
}