
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PlusCircle, Download, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react';
import { useProjectsSafe } from '@/components/portal/useProjectsContext';
import { NewProjectDialog } from '@/components/projects/NewProjectDialog';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectFilters from '@/components/projects/ProjectFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { Project } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import { subDays } from 'date-fns';
import { useRole } from '@/components/auth/RoleProvider';
import { can } from '@/components/auth/permissions';
import { projectMetrics } from '@/components/data/metricsService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Placeholder for whenSdkReady. In a real application, this would typically
// be imported from an SDK initialization utility or context.
// For the purpose of providing a functional file, we define a simple
// mock version that resolves after a short delay or rejects on timeout.
const whenSdkReady = (timeoutMs) => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      console.error('[CABPOE] SDK initialization timed out.');
      reject(new Error('SDK initialization timeout'));
    }, timeoutMs);

    // Simulate SDK being ready after some async operation
    // In a real scenario, this would depend on actual SDK initialization events
    setTimeout(() => {
      clearTimeout(timeoutId);
      console.log('[CABPOE] SDK simulated as ready.');
      resolve();
    }, 100); // Simulate 100ms for SDK to become ready
  });
};


const ProjectCardSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4 h-full flex flex-col">
    <div className="flex justify-between items-start">
        <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-24" />
            </div>
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
    </div>
    <Skeleton className="h-10 w-full" />
    <div className="grid grid-cols-2 gap-4 mt-4">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-20" />
    </div>
    <div className="border-t pt-4 mt-auto">
        <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-28" />
            <div className="flex gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
            </div>
        </div>
    </div>
  </div>
);

export default function ProjectsContent() {
  const { projects: allProjects, loading: isLoading, reloadProjects: refreshProjects } = useProjectsSafe();
  const { effectiveRole } = useRole();
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [metrics, setMetrics] = useState({});
  const [isMetricsLoading, setIsMetricsLoading] = useState(false);
  const [metricsProgress, setMetricsProgress] = useState({ loaded: 0, total: 0 });
  const [timeRange, setTimeRange] = useState('90d');
  const [showZeroDataWarning, setShowZeroDataWarning] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [rlsDiagnostics, setRlsDiagnostics] = useState(null);
  const [metricsLoaded, setMetricsLoaded] = useState(false); // Indicates if metrics for current settings have been loaded
  const { toast } = useToast();
  
  // Use ref to track if we've done the initial auto-load
  const hasAutoLoadedRef = useRef(false);

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    domain: 'all',
    sort: 'last_run_at-desc',
  });
  
  const urlParams = new URLSearchParams(window.location.search);
  const showDebug = urlParams.get('debug') === '1';
  const isForceRead = localStorage.getItem('FORCE_READ') === '1';

  // Manual metrics loading function
  const loadMetrics = useCallback(async () => {
    // Filter out dummy UK Pilot projects
    const projectsToLoad = allProjects.filter(p => {
      const name = (p.name || '').toLowerCase();
      return !name.includes('uk pilot a') && 
             !name.includes('uk pilot b') && 
             !name.includes('uk pilot c');
    });
    
    if (projectsToLoad.length === 0) {
      setIsMetricsLoading(false);
      setMetrics({});
      setMetricsProgress({ loaded: 0, total: 0 });
      setRlsDiagnostics(null);
      setMetricsLoaded(true); // Consider metrics loaded even if there are none to load
      toast({
        title: "No Projects to Load",
        description: "All projects are filtered out (UK Pilot dummy data).",
        variant: "default"
      });
      return;
    }
    
    console.log(`[CABPOE] Loading metrics for ${projectsToLoad.length} projects (filtered out ${allProjects.length - projectsToLoad.length} dummy projects)`);
    
    setIsMetricsLoading(true);
    setMetricsProgress({ loaded: 0, total: projectsToLoad.length });
    setShowZeroDataWarning(false);
    setRlsDiagnostics(null);
    
    const domain = window.location.hostname;
    
    // Log user context for debugging
    try {
      const { User } = await import('@/api/entities');
      const currentUser = await User.me();
      const userInfo = {
        domain,
        email: currentUser.email,
        role: currentUser.role,
        app_role: currentUser.app_role,
        status: currentUser.status,
        id: currentUser.id,
        created_by_sample: projectsToLoad[0]?.created_by
      };
      console.log(`[CABPOE] User context on ${domain}:`, userInfo);
      
      setDebugInfo(userInfo);
    } catch (error) {
      console.error('[CABPOE] Failed to load user context:', error);
      setDebugInfo({ domain, email: 'unknown', role: 'unknown', app_role: 'unknown', status: 'unknown', id: 'unknown', created_by_sample: projectsToLoad[0]?.created_by });
    }
    
    console.log(`[CABPOE] Starting metrics load for ${projectsToLoad.length} projects on ${domain}`);
    
    try {
      const now = new Date();
      let from;
      if (timeRange === '7d') from = subDays(now, 7);
      else if (timeRange === '30d') from = subDays(now, 30);
      else from = subDays(now, 90);
      const to = now;

      // Load metrics in BATCHES of 3 to speed up while respecting rate limits
      const BATCH_SIZE = 3;
      const BATCH_DELAY = 2000; // Increased to 2 seconds between batches
      
      const startTime = Date.now();
      const allMetrics = {}; 
      let successCount = 0;
      let failCount = 0;
      
      // Process projects in batches
      for (let batchStart = 0; batchStart < projectsToLoad.length; batchStart += BATCH_SIZE) {
        const batch = projectsToLoad.slice(batchStart, batchStart + BATCH_SIZE);
        
        console.log(`[CABPOE] Loading batch ${Math.floor(batchStart / BATCH_SIZE) + 1}/${Math.ceil(projectsToLoad.length / BATCH_SIZE)}: ${batch.length} projects`);
        
        // Load batch in parallel
        const batchPromises = batch.map(async (project) => {
          try {
            const data = await projectMetrics({ projectId: project.id, from, to });
            return { projectId: project.id, data, success: true };
          } catch (error) {
            console.error(`Metrics failed for project "${project.name}" (ID: ${project.id}):`, error.message);
            return { projectId: project.id, data: null, success: false };
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        
        // Process batch results
        batchResults.forEach(result => {
          allMetrics[result.projectId] = result.data;
          if (result.success) {
            successCount++;
          } else {
            failCount++;
          }
        });
        
        // Update progress
        const totalLoaded = batchStart + batch.length;
        setMetricsProgress({
          loaded: totalLoaded,
          total: projectsToLoad.length
        });
        
        // Update metrics progressively
        setMetrics({ ...allMetrics });
        
        // Wait before next batch (but not after the last batch)
        if (batchStart + BATCH_SIZE < projectsToLoad.length) {
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
        }
      }
      
      const loadTime = Date.now() - startTime;
      
      console.log(`[CABPOE] Metrics loading complete:`, {
        total: projectsToLoad.length,
        success: successCount,
        failed: failCount,
        loadTime: `${(loadTime / 1000).toFixed(1)}s`
      });
      
      // Show warning if some projects failed
      if (failCount > 0) {
        toast({
          title: "Partial Metrics Loaded",
          description: `${successCount} projects loaded successfully, ${failCount} failed.`,
          variant: failCount > successCount ? "destructive" : "default"
        });
      }
      
      // Check if all metrics are zero (RLS issue indicator)
      const successfulMetrics = Object.values(allMetrics).filter(m => m !== null);
      const allZero = successfulMetrics.length > 0 && 
                      successfulMetrics.every(m => 
                        m && m.total_runs === 0 && m.actions === 0
                      );
      
      if (allZero && domain.includes('cabpoe.com')) {
        console.error('[CABPOE] ⚠️ ALL PROJECTS SHOWING ZERO DATA ON CABPOE.COM!');
        console.error('[CABPOE] This indicates RLS is blocking data. Check user context in debug panel.');
        setShowZeroDataWarning(true);
      }
      
      // Set final metrics
      setMetrics(allMetrics);
      
      // Check RLS filtering AFTER metrics are loaded (only for projects we actually loaded)
      const projectsWithZeroData = [];
      const projectsWithData = [];
      
      Object.entries(allMetrics).forEach(([projectId, metric]) => {
        if (metric && metric.total_runs === 0 && metric.actions === 0) {
          const project = projectsToLoad.find(p => p.id === projectId);
          if (project) {
            projectsWithZeroData.push({
              id: project.id,
              name: project.name,
              created_by: project.created_by,
              created_date: project.created_date
            });
          }
        } else if (metric && (metric.total_runs > 0 || metric.actions > 0)) {
          const project = projectsToLoad.find(p => p.id === projectId);
          if (project) {
            projectsWithData.push({
              id: project.id,
              name: project.name,
              created_by: project.created_by
            });
          }
        }
      });

      if (projectsWithZeroData.length > 0 && projectsWithData.length > 0 && debugInfo) {
        setRlsDiagnostics({
          zeroData: projectsWithZeroData,
          hasData: projectsWithData,
          currentUser: debugInfo
        });
      } else {
        setRlsDiagnostics(null);
      }
      
    } catch (error) {
      console.error("Global error: Failed to load project metrics:", error);
      toast({ 
        title: "Metrics Load Failed", 
        description: `Could not load project summary data. ${error.message}`, 
        variant: "destructive" 
      });
    } finally {
      // CRITICAL: Set these flags LAST to prevent re-triggering
      setMetricsLoaded(true);
      setIsMetricsLoading(false);
      setMetricsProgress({ loaded: 0, total: 0 });
    }
  }, [allProjects, timeRange, toast, debugInfo]); // REMOVED 'metrics' from dependencies, and hasAttemptedLoad

  // Auto-load metrics ONCE when projects first load
  useEffect(() => {
    // Only load if:
    // 1. We're not currently loading projects data (isLoading)
    // 2. We have projects to display
    // 3. We haven't already performed the initial auto-load (tracked by hasAutoLoadedRef)
    if (!isLoading && allProjects.length > 0 && !hasAutoLoadedRef.current) {
      console.log('[CABPOE] Auto-loading metrics (ONE TIME ONLY)...');
      hasAutoLoadedRef.current = true; // Mark as loaded BEFORE calling loadMetrics
      loadMetrics();
    }
  }, [isLoading, allProjects.length]); // Removed loadMetrics from dependencies

  // Handle changes to allProjects (e.g., project added/removed)
  useEffect(() => {
    // If projects become empty, reset metrics and auto-load flag.
    if (allProjects.length === 0) {
      setMetrics({});
      setMetricsLoaded(false); 
      setIsMetricsLoading(false);
      setMetricsProgress({ loaded: 0, total: 0 });
      setRlsDiagnostics(null);
      hasAutoLoadedRef.current = false; // Reset the ref so a fresh list of projects will trigger an auto-load
    } 
  }, [allProjects.length]); 

  // Handle changes to timeRange
  useEffect(() => {
    // If timeRange changes, metrics are no longer "freshly loaded" for that time range.
    // Invalidate metricsLoaded state so the user can see the "Load Metrics" button
    // or "Refresh Metrics" (if currently loaded). Do not auto-reload here.
    if (metricsLoaded && !isMetricsLoading) { // Only invalidate if it was considered loaded and not currently loading
      console.log('[CABPOE] Time range changed, metrics invalidated. Click Refresh to reload.');
      setMetricsLoaded(false);
      // We don't reset metrics or progress here, as the user might want to refresh current data
      // or load fresh data. The metrics will be replaced when loadMetrics is called again.
    }
  }, [timeRange, metricsLoaded, isMetricsLoading]); // Added isMetricsLoading to dependencies

  const handleProjectCreated = () => {
    refreshProjects();
    // Invalidate metrics when a project is created to require a manual refresh
    setMetricsLoaded(false); 
    setMetrics({}); // Clear existing metrics for a fresh load
    setMetricsProgress({ loaded: 0, total: 0 });
    setRlsDiagnostics(null);
  };

  const handleStatusChange = async (projectId, newStatus) => {
    if (!can(effectiveRole, 'projects', 'edit')) {
      toast({ title: 'Access Denied', description: 'You do not have permission to edit projects.', variant: 'destructive' });
      return;
    }
    try {
      await Project.update(projectId, { status: newStatus });
      toast({ title: 'Success', description: `Project status updated to ${newStatus}.` });
      refreshProjects();
      setMetricsLoaded(false); // Project data changed, metrics might be stale
      setMetrics({});
      setMetricsProgress({ loaded: 0, total: 0 });
      setRlsDiagnostics(null);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update project status.', variant: 'destructive' });
    }
  };

  const handleDelete = async (projectId) => {
    if (!can(effectiveRole, 'projects', 'archive')) {
      toast({ title: 'Access Denied', description: 'You do not have permission to delete projects.', variant: 'destructive' });
      return;
    }
    if (window.confirm('Are you sure you want to permanently delete this project? This action cannot be undone.')) {
      try {
        await Project.delete(projectId);
        toast({ title: 'Success', description: 'Project deleted successfully.' });
        refreshProjects();
        setMetricsLoaded(false); // Project data changed, metrics might be stale
        setMetrics({});
        setMetricsProgress({ loaded: 0, total: 0 });
        setRlsDiagnostics(null);
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to delete project.', variant: 'destructive' });
      }
    }
  };

  const filteredAndSortedProjects = useMemo(() => {
    // Filter out dummy UK Pilot projects from display
    const projectsToFilter = allProjects.filter(p => {
      const name = (p.name || '').toLowerCase();
      return !name.includes('uk pilot a') && 
             !name.includes('uk pilot b') && 
             !name.includes('uk pilot c');
    });
    
    return projectsToFilter
      .filter(p => {
        const searchMatch = filters.search ? 
            p.name.toLowerCase().includes(filters.search.toLowerCase()) || 
            (p.description || '').toLowerCase().includes(filters.search.toLowerCase()) : true;
        const statusMatch = filters.status === 'all' || p.status === filters.status;
        const domainMatch = filters.domain === 'all' || p.domain === 'all' || p.domain === filters.domain;
        return searchMatch && statusMatch && domainMatch;
      })
      .sort((a, b) => {
        const [key, dir] = filters.sort.split('-');
        
        let aVal, bVal;
        if (key === 'last_run_at') {
            // Metrics might not be loaded, so handle undefined gracefully
            aVal = metrics[a.id]?.last_run_at;
            bVal = metrics[b.id]?.last_run_at;
            const dateA = aVal ? new Date(aVal) : null;
            const dateB = bVal ? new Date(bVal) : null;
            let comparison = 0;
            if (dateA === null && dateB !== null) comparison = -1; // null (no run) comes before actual date
            else if (dateA !== null && dateB === null) comparison = 1; // actual date comes after null
            else if (dateA === null && dateB === null) comparison = 0; // both null are equal
            else comparison = dateA.getTime() - dateB.getTime();
            return dir === 'desc' ? -comparison : comparison;
        } else if (key === 'avg_stability') {
            aVal = metrics[a.id]?.avg_stability;
            bVal = metrics[b.id]?.avg_stability;
            // Handle undefined/null stability scores. Assume undefined means "worst" or "lowest" for sorting purposes
            // This ensures projects with metrics bubble up if sorting desc, or down if sorting asc.
            const valA = aVal ?? (dir === 'desc' ? -Infinity : Infinity);
            const valB = bVal ?? (dir === 'desc' ? -Infinity : Infinity);
            return dir === 'desc' ? valB - valA : valA - bVal;
        } else if (key === 'name') {
            aVal = a.name;
            bVal = b.name;
        } else { // Default or other fields
            aVal = a[key] ?? a.updated_date; // Fallback to updated_date if other key not present
            bVal = b[key] ?? b.updated_date;
        }
        
        let comparison = 0;
        if (aVal == null && bVal != null) comparison = -1;
        else if (aVal != null && bVal == null) comparison = 1;
        else if (typeof aVal === 'string' && typeof bVal === 'string') {
            comparison = aVal.localeCompare(bVal);
        } else if (aVal > bVal) comparison = 1;
        else if (aVal < bVal) comparison = -1;

        return dir === 'desc' ? -comparison : comparison;
      });
  }, [allProjects, filters, metrics]);
  
  const canCreateProject = can(effectiveRole, 'projects', 'create');

  const handleExport = () => {
    const timestamp = new Date().toISOString().slice(0, 16).replace(/[-:]/g, '').replace('T', '_');
    const filename = `projects_backup_${timestamp}.json`;
    const data = JSON.stringify(allProjects, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: `Downloaded ${allProjects.length} projects.` });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        <div className="flex items-center gap-2">
            {showDebug && debugInfo && (
              <div className="text-xs bg-blue-100 px-3 py-2 rounded border border-blue-300 max-w-md">
                <div className="font-bold mb-1">Debug Info:</div>
                <div className="space-y-1">
                  <div>Domain: <code>{debugInfo.domain}</code></div>
                  <div>User: <code>{debugInfo.email}</code></div>
                  <div>ID: <code className="text-xs">{debugInfo.id?.substring(0, 12)}...</code></div>
                  <div>App Role: <code>{debugInfo.app_role}</code></div>
                  <div>Status: <code>{debugInfo.status}</code></div>
                  {debugInfo.created_by_sample && (
                    <div>Sample created_by: <code className="text-xs">{debugInfo.created_by_sample}</code></div>
                  )}
                </div>
              </div>
            )}
            {showDebug && (
              <div className="text-xs bg-yellow-100 px-2 py-1 rounded border">
                Debug: FORCE_READ={isForceRead ? 'ON' : 'OFF'} (env: prod)
              </div>
            )}
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Conditional render for metrics loading button */}
            {allProjects.length > 0 && (
                <Button 
                    onClick={loadMetrics} 
                    variant={metricsLoaded && !isMetricsLoading ? "ghost" : "outline"} 
                    size="sm" 
                    disabled={isLoading || isMetricsLoading}
                >
                    {isMetricsLoading ? (
                        <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Loading...
                        </>
                    ) : metricsLoaded ? (
                        <>
                            <RefreshCw className="mr-2 h-4 w-4" /> Refresh Metrics
                        </>
                    ) : (
                        <>
                            <TrendingUp className="mr-2 h-4 w-4" /> Load Metrics
                        </>
                    )}
                </Button>
            )}
            
            <Button onClick={handleExport} variant="outline" disabled={isLoading}>
                <Download className="mr-2 h-4 w-4" /> Export JSON
            </Button>
            {canCreateProject && (
                <Button onClick={() => setIsNewProjectOpen(true)} disabled={isLoading}>
                    <PlusCircle className="mr-2 h-4 w-4" /> New Project
                </Button>
            )}
        </div>
      </div>
      
      {/* Zero Data Warning Banner */}
      {showZeroDataWarning && (
        <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-red-900 mb-1">⚠️ All Projects Showing Zero Data</h3>
              <p className="text-sm text-red-800 mb-2">
                All projects are returning zero runs and actions on cabpoe.com. This indicates Row Level Security (RLS) is filtering your data.
              </p>
              <div className="text-sm text-red-700 space-y-2">
                <p><strong>Quick Checks:</strong></p>
                <ol className="list-decimal list-inside ml-2 space-y-1">
                  <li>Open F12 → Console tab</li>
                  <li>Look for "[CABPOE] User context" log message</li>
                  <li>Compare user.id and user.email between base44.app and cabpoe.com</li>
                  <li>Check if you're logged in as the same user on both domains</li>
                </ol>
                <p className="mt-2"><strong>If user IDs differ:</strong> You're logged in as different users. Try logging out and back in on cabpoe.com.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RLS Diagnostics Panel - ONLY show when mixed results */}
      {showDebug && rlsDiagnostics && (
        <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-amber-900 mb-2">🔍 RLS Filtering Detected</h3>
              <div className="space-y-3 text-sm text-amber-800">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-50 p-3 rounded border border-red-200">
                    <div className="font-semibold text-red-900 mb-1">
                      ❌ {rlsDiagnostics.zeroData.length} Projects with Zero Data
                    </div>
                    <div className="text-xs text-red-700 space-y-1 max-h-32 overflow-y-auto">
                      {rlsDiagnostics.zeroData.slice(0, 5).map(p => (
                        <div key={p.id} className="flex justify-between items-center">
                          <span className="font-mono">{p.name.substring(0, 20)}{p.name.length > 20 ? '...' : ''}</span>
                          <span className="text-red-600">created_by: {p.created_by?.substring(0, 15)}{p.created_by && p.created_by.length > 15 ? '...' : ''}</span>
                        </div>
                      ))}
                      {rlsDiagnostics.zeroData.length > 5 && (
                        <div className="text-red-600 font-semibold">... and {rlsDiagnostics.zeroData.length - 5} more</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <div className="font-semibold text-green-900 mb-1">
                      ✅ {rlsDiagnostics.hasData.length} Projects with Data
                    </div>
                    <div className="text-xs text-green-700 space-y-1 max-h-32 overflow-y-auto">
                      {rlsDiagnostics.hasData.slice(0, 5).map(p => (
                        <div key={p.id} className="flex justify-between items-center">
                          <span className="font-mono">{p.name.substring(0, 20)}{p.name.length > 20 ? '...' : ''}</span>
                          <span className="text-green-600">created_by: {p.created_by?.substring(0, 15)}{p.created_by && p.created_by.length > 15 ? '...' : ''}</span>
                        </div>
                      ))}
                      {rlsDiagnostics.hasData.length > 5 && (
                        <div className="text-green-600 font-semibold">... and {rlsDiagnostics.hasData.length - 5} more</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <div className="font-semibold text-blue-900 mb-1">Current User</div>
                  <code className="text-xs text-blue-800 block">
                    email: {rlsDiagnostics.currentUser?.email}<br/>
                    id: {rlsDiagnostics.currentUser?.id?.substring(0, 24)}{rlsDiagnostics.currentUser?.id && rlsDiagnostics.currentUser?.id.length > 24 ? '...' : ''}<br/>
                    app_role: {rlsDiagnostics.currentUser?.app_role}
                  </code>
                </div>

                <div className="pt-2 border-t border-amber-300">
                  <p className="font-semibold mb-1">⚠️ The Issue:</p>
                  <p>RLS rules in DecisionRun and Action entities are filtering data based on `created_by` field. Projects showing zero data were likely created by a different user or have mismatched ownership.</p>
                  
                  <p className="mt-2 font-semibold">💡 Solutions:</p>
                  <ol className="list-decimal list-inside ml-2 space-y-1">
                    <li>Update RLS rules to allow admins to see ALL data regardless of `created_by`</li>
                    <li>Use FORCE_READ mode to bypass RLS temporarily (click button above)</li>
                    <li>Reassign project ownership to match your user</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* The "Metrics not loaded" info banner has been removed as metrics now load automatically. */}
      
      <ProjectFilters filters={filters} setFilters={setFilters} />

      {/* Show metrics loading progress with accurate timing */}
      {isMetricsLoading && metricsProgress.total > 0 && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between text-sm text-blue-700 mb-2">
            <span>
              {metricsProgress.loaded === 0 
                ? 'Initializing metrics load...' 
                : `Loading project metrics (${metricsProgress.loaded}/${metricsProgress.total})`}
            </span>
            <span>{metricsProgress.loaded}/{metricsProgress.total}</span>
          </div>
          <div className="bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(metricsProgress.loaded / metricsProgress.total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-blue-600 mt-1">
            {metricsProgress.loaded === 0 
              ? 'Loading projects in batches to respect API rate limits.' 
              : `Loading projects in batches of 3, with 2s delay between batches.`}
          </p>
        </div>
      )}

      {isLoading && allProjects.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5 items-stretch">
          {[...Array(8)].map((_, i) => <ProjectCardSkeleton key={i} />)}
        </div>
      ) : filteredAndSortedProjects.length === 0 ? (
        <Card className="text-center py-20 rounded-2xl">
          <h2 className="text-xl font-semibold mb-2">No Projects Found</h2>
          <p className="text-gray-500 mb-6">
            {canCreateProject ? 'Create your first project to get started.' : 'No projects match your current filters.'}
          </p>
          {canCreateProject && (
              <Button onClick={() => setIsNewProjectOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Project
              </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5 items-stretch">
          {filteredAndSortedProjects.map(p => (
            <ProjectCard 
              key={p.id} 
              project={p} 
              metrics={metrics[p.id]}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {canCreateProject && (
        <NewProjectDialog
          open={isNewProjectOpen}
          onOpenChange={setIsNewProjectOpen}
          onProjectCreated={handleProjectCreated}
          allProjects={allProjects}
        />
      )}
    </div>
  );
}
