import { useContext } from 'react';
import { ProjectsContext } from './ProjectsProvider';

export const useProjects = () => {
    const context = useContext(ProjectsContext);
    if (!context) {
        throw new Error('useProjects must be used within a ProjectsProvider. Make sure your component is inside the portal layout.');
    }
    return context;
};

export function useProjectsSafe() {
    try {
        const context = useContext(ProjectsContext);
        if (!context) {
            return {
                projects: [],
                activeProjectId: null,
                setActiveProjectId: () => {},
                reloadProjects: async () => ({ ok: false }),
                loadStatus: 'unknown',
                loading: false
            };
        }
        return context;
    } catch {
        return {
            projects: [],
            activeProjectId: null,
            setActiveProjectId: () => {},
            reloadProjects: async () => ({ ok: false }),
            loadStatus: 'unknown',
            loading: false
        };
    }
}