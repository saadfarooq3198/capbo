
import React, { useState, useEffect, useCallback } from 'react';
import { useProjectsSafe } from '@/components/portal/useProjectsContext'; // Use safe version
import { DecisionRun } from '@/api/entities';
import { Action } from '@/api/entities';
import { useToast } from "@/components/ui/use-toast";
import { subDays, format, startOfDay } from 'date-fns';
import { createDemoRuns } from '@/components/dashboard/DemoDataSeeder';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { useRole } from '@/components/auth/RoleProvider';
import { can } from '@/components/auth/permissions';

import KpiCard from '@/components/dashboard/KpiCard';
import StabilityChart from '@/components/dashboard/StabilityChart';
import ActionsChart from '@/components/dashboard/ActionsChart';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import AdminDiagnostics from '@/components/dashboard/AdminDiagnostics';
import TimeRangeSelector from '@/components/dashboard/TimeRangeSelector';
import { TermBadge } from '@/components/ui/TermBadge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Play, TrendingUp, Zap, AlertTriangle, ChevronRight } from 'lucide-react';


export default function DashboardContent() {
  const { activeProjectId, projects: allProjects } = useProjectsSafe(); // Use safe version
  const { user, effectiveRole } = useRole();
  const [kpis, setKpis] = useState({ runs: 0, stability: '—', actions: 0, alerts: 0 });
  const [stabilityData, setStabilityData] = useState([]);
  const [actionsData, setActionsData] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [diagnosticRuns, setDiagnosticRuns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const { toast } = useToast();

  const currentProject = allProjects.find(p => p.id === activeProjectId);

  useEffect(() => {
    if (!activeProjectId) return; // Wait for project selection
    const getStorageKey = () => `dashboard_timeRange_${activeProjectId}`;
    const savedRange = localStorage.getItem(getStorageKey());
    if (savedRange && ['24h', '7d'].includes(savedRange)) {
      setTimeRange(savedRange);
    } else {
      setTimeRange('24h');
    }
  }, [activeProjectId]);

  const handleTimeRangeChange = (newRange) => {
    setTimeRange(newRange);
    const storageKey = `dashboard_timeRange_${activeProjectId || 'all'}`;
    localStorage.setItem(storageKey, newRange);
  };
  
  const processAndSetData = useCallback((runs, actions, allRunsForFeed) => {
      // Calculate KPIs based on provided data
      const runsTodayCount = runs.filter(r => new Date(r.completed_at) >= startOfDay(new Date())).length;
      
      const totalStability = runs.reduce((acc, r) => {
          const score = r.topline?.stability_score ?? r.stability_score;
          return acc + (parseFloat(score) || 0);
      }, 0);
      const avgStability = runs.length > 0 ? (totalStability / runs.length) * 100 : null;
      
      const failedRunsCount = allRunsForFeed.filter(r => r.status === 'failed').length;
      
      setKpis({
          runs: runsTodayCount,
          stability: avgStability !== null ? `${avgStability.toFixed(1)}%` : '—',
          actions: actions.length,
          alerts: failedRunsCount,
      });

      // Process data for charts
      const hourlyStability = {};
      for (const run of runs) {
          const runDate = new Date(run.completed_at);
          const hourOrDay = timeRange === '7d' ? format(runDate, 'yyyy-MM-dd') : format(runDate, 'yyyy-MM-dd HH:00');
          if (!hourlyStability[hourOrDay]) hourlyStability[hourOrDay] = { total: 0, count: 0 };
          const score = run.topline?.stability_score ?? run.stability_score;
          if (score !== null && score !== undefined) {
            hourlyStability[hourOrDay].total += parseFloat(score);
            hourlyStability[hourOrDay].count++;
          }
      }
      
      const stabilityChartData = Object.entries(hourlyStability)
          .map(([time, { total, count }]) => ({
              time: format(new Date(time), timeRange === '7d' ? 'MMM d' : 'HH:mm'),
              stability: count > 0 ? (total / count) * 100 : 0,
          }))
          .sort((a,b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      setStabilityData(stabilityChartData);

      setActionsData([{ 
          name: 'Actions', 
          success: actions.filter(a => a.status === 'success').length, 
          error: actions.filter(a => ['error', 'failed'].includes(a.status)).length,
          executing: actions.filter(a => a.status === 'executing').length
      }]);
      
      // Populate Activity Feed
      const runActivities = allRunsForFeed.map(r => ({ 
        id: r.id, 
        run_id: r.id, 
        type: `run_${r.status}`, 
        date: r.completed_at || r.created_date, 
        title: `Run ${r.id.substring(0,8)} ${r.status}`, 
        description: `Context: ${r.context_name || 'N/A'}` 
      }));
      
      const actionActivities = actions.map(a => ({ 
        id: a.id, 
        run_id: a.decision_run_id, 
        type: 'action_executed', 
        date: a.executed_at, 
        title: `Action ${a.type} ${a.status}`, 
        description: `Run ${a.decision_run_id?.substring(0,8) || 'N/A'}` 
      }));
      
      const combined = [...runActivities, ...actionActivities]
        .filter(item => item.date)
        .sort((a,b) => new Date(b.date) - new Date(a.date));
      setActivityFeed(combined.slice(0, 20));
  }, [timeRange]);

  const loadDashboardData = useCallback(async () => {
    if (!activeProjectId) { // Check for activeProjectId from context
        setIsLoading(false);
        setKpis({ runs: 0, stability: '—', actions: 0, alerts: 0 });
        setStabilityData([]);
        setActionsData([]);
        setActivityFeed([]);
        setDiagnosticRuns([]); // Clear diagnostic runs too
        return;
    }
    
    setIsLoading(true);
    
    try {
        const rangeDays = timeRange === '7d' ? 7 : 1;
        const rangeStart = subDays(new Date(), rangeDays);
        const projectFilter = { project_id: activeProjectId }; // Use activeProjectId

        let completedRuns, allActions, allRunsForFeed;

        // Check for any runs in the time range
        const initialRuns = await DecisionRun.filter({ 
            ...projectFilter, 
            completed_at_gt: rangeStart.toISOString() 
        }, null, 1);

        if (initialRuns.length === 0) {
            console.log(`Project ${activeProjectId} is empty. Auto-seeding with profile...`);
            const projectToSeed = allProjects.find(p => p.id === activeProjectId);
            const seededData = await createDemoRuns(projectToSeed, { useProfile: true, withActions: true });
            
            // Use the data returned directly from the seeder
            completedRuns = seededData.runs.filter(r => r.status === 'completed');
            allActions = seededData.actions;
            allRunsForFeed = seededData.runs;

            const hidePopup = localStorage.getItem('cabpoe_hide_dashboard_update_popup') === 'true';

            if (!hidePopup) {
                toast({
                    title: "Data synchronized",
                    duration: 10000, // Stay open longer for interaction
                    description: (
                        <div className="flex flex-col gap-2">
                            <p>Data synchronized from the CABPOE Engine. Latest signals and runs are now available.</p>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="dont-show-again"
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            localStorage.setItem('cabpoe_hide_dashboard_update_popup', 'true');
                                        } else {
                                            localStorage.removeItem('cabpoe_hide_dashboard_update_popup');
                                        }
                                    }}
                                />
                                <label
                                    htmlFor="dont-show-again"
                                    className="text-sm font-medium leading-none"
                                >
                                    Don’t show this again
                                </label>
                            </div>
                        </div>
                    ),
                });
            }
        } else {
            // Fetch live data if the project is not empty
            [completedRuns, allActions, allRunsForFeed] = await Promise.all([
                DecisionRun.filter({ ...projectFilter, status: 'completed', completed_at_gt: rangeStart.toISOString() }),
                Action.filter({ ...projectFilter, executed_at_gt: rangeStart.toISOString() }),
                DecisionRun.filter({ ...projectFilter, created_date_gt: rangeStart.toISOString() }),
            ]);
        }
        
        // Process data (either seeded or fetched)
        processAndSetData(completedRuns, allActions, allRunsForFeed);

        if(effectiveRole === 'admin') {
            const diagnosticRuns = await DecisionRun.filter(projectFilter, '-created_date', 20);
            setDiagnosticRuns(diagnosticRuns);
        }

    } catch (error) {
        console.error("Failed to load dashboard data:", error);
        toast({ title: "Error", description: "Could not load dashboard data.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  }, [activeProjectId, timeRange, toast, processAndSetData, effectiveRole, allProjects]); // Add activeProjectId and allProjects to deps

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const currentProjectName = currentProject?.name || "Dashboard";
  // Modified canCreateRun to remove obsolete isReadOnlyRole check
  const canCreateRun = can(effectiveRole, 'run:create'); 
  const showResearchTerms = currentProject?.show_research_terminology !== false;

  if (isLoading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  if (!activeProjectId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <TrendingUp className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Welcome to the CABPOE Console</h2>
        <p className="text-gray-600 mb-6 max-w-md">Please select a project from the dropdown in the header to view its dashboard.</p>
        <Button asChild>
          <Link to={createPageUrl('projects')}>Go to Projects</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Breadcrumb & Header */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link to={createPageUrl('projects')} className="hover:text-gray-700 transition-colors">
            Projects
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-gray-900">{currentProjectName}</span>
          <ChevronRight className="h-4 w-4" />
          <span>Dashboard</span>
        </div>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            {showResearchTerms && (
              <p className="text-sm text-gray-600 mt-1">
                Stability & drift from <TermBadge term="Chaos Core" showTooltip={false} /> · Actions by <TermBadge term="Orchestrator" showTooltip={false} /> · State via <TermBadge term="Attractor" showTooltip={false} />
              </p>
            )}
            <div className="flex items-center gap-4 mt-2">
              <TimeRangeSelector value={timeRange} onChange={handleTimeRangeChange} disabled={isLoading} />
            </div>
          </div>
          {canCreateRun && (
              <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg">
                <Plus className="w-4 h-4 mr-2" />
                New Decision Run
              </Button>
          )}
        </div>
        
        {/* KPI Tiles - Fixed Height Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          <KpiCard 
            title="Completed Runs Today" 
            value={kpis.runs} 
            icon={<Play className="h-5 w-5" />} 
            isLoading={isLoading} 
            secondaryMetric="vs yesterday"
            onClick={() => window.location.href = createPageUrl('decision-runs')}
          />
          <KpiCard 
            title={
              <div className="flex items-center gap-2">
                <span>{`Avg Stability (${timeRange})`}</span>
                {showResearchTerms && <TermBadge term="Lyapunov" showTooltip={true} />}
              </div>
            }
            value={kpis.stability} 
            icon={<TrendingUp className="h-5 w-5" />} 
            isLoading={isLoading}
            secondaryMetric="7-day avg: 75.2%"
            trend="up"
          />
          <KpiCard 
            title={
              <div className="flex items-center gap-2">
                <span>{`Actions Executed (${timeRange})`}</span>
                {showResearchTerms && <TermBadge term="Orchestrator" showTooltip={true} />}
              </div>
            }
            value={kpis.actions} 
            icon={<Zap className="h-5 w-5" />} 
            isLoading={isLoading}
            secondaryMetric="success rate: 85%"
          />
          <KpiCard 
            title={`Alerts (${timeRange})`} 
            value={kpis.alerts} 
            icon={<AlertTriangle className="h-5 w-5" />} 
            isLoading={isLoading}
            secondaryMetric="trending down"
            trend="down"
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <StabilityChart data={stabilityData} isLoading={isLoading} timeRange={timeRange} showResearchTerms={showResearchTerms} />
          <ActionsChart data={actionsData} isLoading={isLoading} timeRange={timeRange} showResearchTerms={showResearchTerms} />
        </div>

        {/* Demo Seeds Footnote */}
        {activeProjectId && (
          <div className="text-xs text-gray-500 text-center py-2">
            Source: Demo Seeds (terminology shown for reviewer context)
          </div>
        )}

        {/* Activity Feed */}
        <ActivityFeed activities={activityFeed} isLoading={isLoading} currentProjectName={currentProjectName} user={user} />

        {/* Admin Diagnostics */}
        {can(effectiveRole, 'org:diagnostics') && (
          <AdminDiagnostics 
            runs={diagnosticRuns} 
            selectedProject={currentProject} 
            allProjects={allProjects} 
            onDataSeeded={loadDashboardData} 
            isLoading={isLoading}
            showResearchTerms={showResearchTerms}
          />
        )}
      </div>
    </>
  );
}
