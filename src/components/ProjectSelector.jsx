import React from 'react';
import { useProjects } from '@/components/portal/useProjectsContext';

export const ProjectSelector = () => {
  const { projects: allProjects, activeProjectId, setActiveProjectId, loading: isLoading } = useProjects();

  if (isLoading) {
    return <div className="text-sm text-gray-500 w-auto">Loading projects...</div>;
  }

  const handleSelect = (projectId) => {
    if (!projectId) {
        setActiveProjectId(null);
        return;
    }
    const project = allProjects.find(p => p.id === projectId);
    if (project) {
      setActiveProjectId(project.id);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="project-selector" className="text-sm font-medium text-zinc-700 whitespace-nowrap">Project:</label>
      <select
        id="project-selector"
        value={activeProjectId || ''}
        onChange={(e) => handleSelect(e.target.value)}
        className="h-9 px-3 rounded-md border border-zinc-300 bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        style={{ minWidth: '220px' }}
      >
        {!allProjects || allProjects.length === 0 ? (
            <option value="">No projects exist</option>
        ) : (
            <>
                <option value="">Select a project...</option>
                {allProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                ))}
            </>
        )}
      </select>
    </div>
  );
};

export default ProjectSelector;