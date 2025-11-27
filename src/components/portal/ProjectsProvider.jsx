import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Project } from '@/api/entities';

const LS_CACHE_KEY = 'cabpoe.projectsCache';
const LS_RATE_LIMIT_KEY = 'cabpoe.rateLimitCooldown';
const RATE_LIMIT_COOLDOWN_MS = 60000;

const SEED_PROJECTS = [
    { id: 'proj-001', name: 'CABPOE Pilot', slug: 'pilot', status: 'active', domain: 'supply_chain' },
    { id: 'proj-002', name: 'IT Infrastructure Upgrade', slug: 'it-infra', status: 'active', domain: 'it_ops' },
];

const normalizeProject = (p) => ({
    id: p.id,
    name: p.name || 'Untitled Project',
    slug: (p.slug || p.name || 'proj').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
    status: (p.status || 'draft').toLowerCase(),
    domain: p.domain || 'custom',
    description: p.description || null,
    objective_weights: p.objective_weights || {},
    oscillator_label: p.oscillator_label || 'Lorenz (demo)',
    show_research_terminology: p.show_research_terminology !== false,
    created_date: p.created_date,
    updated_date: p.updated_date,
    created_by: p.created_by,
});

export const ProjectsContext = createContext(null);

export function ProjectsProvider({ children }) {
    const [projects, setProjects] = useState([]);
    const [loadStatus, setLoadStatus] = useState('unknown');
    const [activeProjectId, _setActiveProjectId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastReloadAt, setLastReloadAt] = useState(null);

    const writeCache = useCallback((projectList) => {
        if (projectList.length > 0) {
            try {
                localStorage.setItem(LS_CACHE_KEY, JSON.stringify(projectList));
                console.log('[CABPOE] ProjectsProvider: Cache updated with', projectList.length, 'projects');
            } catch (e) {
                console.warn('[CABPOE] ProjectsProvider: Cache write failed:', e);
            }
        }
    }, []);

    const isInRateLimitCooldown = () => {
        try {
            const cooldownUntil = localStorage.getItem(LS_RATE_LIMIT_KEY);
            if (cooldownUntil) {
                const until = parseInt(cooldownUntil);
                if (Date.now() < until) {
                    const remaining = Math.ceil((until - Date.now()) / 1000);
                    console.log(`[CABPOE] ProjectsProvider: In rate limit cooldown for ${remaining}s`);
                    return true;
                }
            }
        } catch (e) {
            // Ignore
        }
        return false;
    };

    const setRateLimitCooldown = () => {
        try {
            const cooldownUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
            localStorage.setItem(LS_RATE_LIMIT_KEY, cooldownUntil.toString());
            console.log(`[CABPOE] ProjectsProvider: Rate limit cooldown set for 60s`);
        } catch (e) {
            // Ignore
        }
    };

    const loadAndSetProjects = useCallback(async (forceRefresh = false) => {
        console.log('[CABPOE] ProjectsProvider: loadAndSetProjects called, forceRefresh=', forceRefresh);
        
        // ALWAYS try to load from cache first
        let cachedProjects = [];
        try {
            const cached = JSON.parse(localStorage.getItem(LS_CACHE_KEY) || '[]');
            if (cached.length > 0) {
                cachedProjects = cached;
                setProjects(cachedProjects);
                setLoadStatus('cache');
                setLoading(false);
                console.log('[CABPOE] ProjectsProvider: Loaded', cached.length, 'projects from cache');
                
                // Initialize active project from cache
                const urlParams = new URLSearchParams(window.location.search);
                let currentId = urlParams.get('projectId') || localStorage.getItem('cabpoe.activeProjectId');
                const projectExists = cachedProjects.some(p => p.id === currentId);
                if (!currentId || !projectExists) {
                    currentId = cachedProjects[0]?.id || null;
                }
                _setActiveProjectId(currentId);
                if (currentId) {
                    localStorage.setItem('cabpoe.activeProjectId', currentId);
                }
                
                // If not forcing refresh, stop here
                if (!forceRefresh) {
                    console.log('[CABPOE] ProjectsProvider: Using cache, skipping API');
                    return;
                }
            } else {
                console.log('[CABPOE] ProjectsProvider: No cache found');
            }
        } catch (e) {
            console.warn('[CABPOE] ProjectsProvider: Cache read failed:', e);
        }

        // If no cache and not forcing refresh, use seed data
        if (cachedProjects.length === 0 && !forceRefresh) {
            const seeded = SEED_PROJECTS.map(normalizeProject);
            setProjects(seeded);
            setLoadStatus('seed');
            setLoading(false);
            console.log('[CABPOE] ProjectsProvider: Using seed data (no cache, no API call)');
            
            // Initialize active project from seed
            _setActiveProjectId(seeded[0]?.id || null);
            if (seeded[0]?.id) {
                localStorage.setItem('cabpoe.activeProjectId', seeded[0].id);
            }
            return;
        }

        // Check cooldown before making API call
        if (isInRateLimitCooldown()) {
            console.log('[CABPOE] ProjectsProvider: In cooldown, cannot call API');
            
            if (cachedProjects.length === 0) {
                const seeded = SEED_PROJECTS.map(normalizeProject);
                setProjects(seeded);
                setLoadStatus('seed-cooldown');
                console.log('[CABPOE] ProjectsProvider: Using seed data (cooldown active)');
                
                _setActiveProjectId(seeded[0]?.id || null);
                if (seeded[0]?.id) {
                    localStorage.setItem('cabpoe.activeProjectId', seeded[0].id);
                }
            }
            setLoading(false);
            return;
        }

        // Only try API if explicitly requested (forceRefresh=true)
        if (!forceRefresh) {
            console.log('[CABPOE] ProjectsProvider: No cache, no forceRefresh - using seed');
            const seeded = SEED_PROJECTS.map(normalizeProject);
            setProjects(seeded);
            setLoadStatus('seed');
            setLoading(false);
            _setActiveProjectId(seeded[0]?.id || null);
            return;
        }

        // Try API call (only when forced)
        try {
            console.log('[CABPOE] ProjectsProvider: Calling API (forced refresh)...');
            const sdkProjects = await Project.list('-created_date', 500);
            
            if (sdkProjects && sdkProjects.length > 0) {
                const normalized = sdkProjects.map(normalizeProject);
                setProjects(normalized);
                setLoadStatus('sdk');
                writeCache(normalized);
                console.log('[CABPOE] ProjectsProvider: API returned', normalized.length, 'projects');
                
                // Initialize active project
                const urlParams = new URLSearchParams(window.location.search);
                let currentId = urlParams.get('projectId') || localStorage.getItem('cabpoe.activeProjectId');
                const projectExists = normalized.some(p => p.id === currentId);
                if (!currentId || !projectExists) {
                    currentId = normalized[0]?.id || null;
                }
                _setActiveProjectId(currentId);
                if (currentId) {
                    localStorage.setItem('cabpoe.activeProjectId', currentId);
                }
            } else {
                console.log('[CABPOE] ProjectsProvider: API returned empty, using seed');
                const seeded = SEED_PROJECTS.map(normalizeProject);
                setProjects(seeded);
                setLoadStatus('seed');
                _setActiveProjectId(seeded[0]?.id || null);
            }
        } catch (error) {
            const isRateLimit = error.status === 429 || error.message?.includes('429');
            
            if (isRateLimit) {
                console.warn('[CABPOE] ProjectsProvider: Rate limited');
                setRateLimitCooldown();
            } else {
                console.error('[CABPOE] ProjectsProvider: API error:', error.message);
            }
            
            if (cachedProjects.length > 0) {
                console.log('[CABPOE] ProjectsProvider: Using cache after error');
                setLoadStatus('cache-error');
            } else {
                const seeded = SEED_PROJECTS.map(normalizeProject);
                setProjects(seeded);
                setLoadStatus('seed-error');
                console.log('[CABPOE] ProjectsProvider: Using seed after error');
                _setActiveProjectId(seeded[0]?.id || null);
            }
        }
        
        setLastReloadAt(new Date());
        setLoading(false);
    }, [writeCache]);

    const reloadProjects = useCallback(async () => {
        await loadAndSetProjects(true);
        return { ok: true, source: loadStatus };
    }, [loadAndSetProjects, loadStatus]);

    const setActiveProjectId = useCallback((id) => {
        _setActiveProjectId(id);
        if (id) {
            localStorage.setItem('cabpoe.activeProjectId', id);
        }
    }, []);

    // Initial load - always call API to get fresh data
    useEffect(() => {
        console.log('[CABPOE] ProjectsProvider: Initial mount, loading projects from API...');
        loadAndSetProjects(true); // Force refresh on initial load
    }, []); // Empty deps - only run once on mount

    const value = {
        projects,
        loading,
        loadStatus,
        activeProjectId,
        setActiveProjectId,
        reloadProjects,
        lastReloadAt,
    };

    return (
        <ProjectsContext.Provider value={value}>
            {children}
        </ProjectsContext.Provider>
    );
}