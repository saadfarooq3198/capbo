
import React, { useState, useEffect, useCallback } from 'react';
import { useProject } from './ProjectProvider';
import { DecisionRun } from '@/api/entities';
import { Action } from '@/api/entities';
import { subDays, format, startOfDay } from 'date-fns';
import { getDashboardSummary } from './api/dashboardApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Zap, AlertTriangle, Plus, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useRole } from './auth/RoleProvider';
import { can } from './auth/permissions';
import KpiCard from './dashboard/KpiCard';
import StabilityChart from './dashboard/StabilityChart';
import ActionsChart from './dashboard/ActionsChart';
import AdminDiagnosticsCard from './AdminDiagnosticsCard';

export default function DashboardOverview() {
  const { selectedProject } = useProject();
  const { effectiveRole } = useRole();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboardData = useCallback(async () => {
    if (!selectedProject) {
      setDashboardData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try to get data from API first
      let apiData = await getDashboardSummary();
      
      if (!apiData) {
        // Fallback to direct entity queries
        const [runs, actions] = await Promise.all([
          DecisionRun.filter({ project_id: selectedProject.id, status: 'completed' }, '-completed_at', 50),
          Action.filter({ project_id: selectedProject.id }, '-executed_at', 50)
        ]);

        // Calculate basic metrics from entity data
        const today = startOfDay(new Date());
        const runsToday = runs.filter(r => new Date(r.completed_at || r.created_date) >= today);
        
        const totalStability = runs.reduce((acc, r) => {
          const score = r.topline?.stability_score;
          return acc + (parseFloat(score) || 0);
        }, 0);
        const avgStability = runs.length > 0 ? (totalStability / runs.length) * 100 : null;

        const last24h = subDays(new Date(), 1);
        const recentActions = actions.filter(a => new Date(a.executed_at || a.created_date) >= last24h);
        const failedRuns = runs.filter(r => r.status === 'failed').length;

        apiData = {
          kpis: {
            runs: runsToday.length,
            stability: avgStability !== null ? `${avgStability.toFixed(1)}%` : '—',
            actions: recentActions.length,
            alerts: failedRuns
          },
          charts: {
            stability: runs.slice(0, 10).map((r, i) => ({
              time: format(new Date(r.completed_at || r.created_date), 'HH:mm'),
              stability: (parseFloat(r.topline?.stability_score) || 0) * 100
            })),
            actions: [{
              name: 'Actions',
              success: recentActions.filter(a => a.status === 'success').length,
              error: recentActions.filter(a => a.status === 'error').length,
              executing: recentActions.filter(a => a.status === 'executing').length
            }]
          }
        };
      }

      setDashboardData(apiData);
    } catch (error) {
      console.error("Dashboard data load failed:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const canCreateRun = can(effectiveRole, 'run:create');

  if (!selectedProject) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8">
        <TrendingUp className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Welcome to CABPOE Console</h2>
        <p className="text-gray-600 mb-6 max-w-md">
          Please select a project to view its dashboard, or create a new one to get started.
        </p>
        <Button asChild>
          <Link to={createPageUrl('projects')}>Go to Projects</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>
        
        {/* Empty State */}
        <Card className="text-center py-12">
          <CardHeader>
            <CardTitle>No Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Create a run or seed demo data to populate the dashboard.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {canCreateRun && (
                <Button asChild>
                  <Link to={createPageUrl('projects')}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Decision Run
                  </Link>
                </Button>
              )}
              <Button variant="outline" onClick={() => window.location.reload()}>
                <Play className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Admin Diagnostics */}
        <AdminDiagnosticsCard onDataRefresh={loadDashboardData} />
      </div>
    );
  }

  const { kpis, charts } = dashboardData;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        {canCreateRun && (
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            New Decision Run
          </Button>
        )}
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Runs Today" 
          value={kpis?.runs || 0} 
          icon={<Play className="h-5 w-5" />} 
          isLoading={false} 
        />
        <KpiCard 
          title="Avg Stability" 
          value={kpis?.stability || '—'} 
          icon={<TrendingUp className="h-5 w-5" />} 
          isLoading={false}
        />
        <KpiCard 
          title="Actions (24h)" 
          value={kpis?.actions || 0} 
          icon={<Zap className="h-5 w-5" />} 
          isLoading={false}
        />
        <KpiCard 
          title="Alerts" 
          value={kpis?.alerts || 0} 
          icon={<AlertTriangle className="h-5 w-5" />} 
          isLoading={false}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <StabilityChart 
          data={charts?.stability || []} 
          isLoading={false} 
          timeRange="24h"
        />
        <ActionsChart 
          data={charts?.actions || []} 
          isLoading={false} 
          timeRange="24h"
        />
      </div>

      {/* Admin Diagnostics */}
      <AdminDiagnosticsCard onDataRefresh={loadDashboardData} />
    </div>
  );
}
