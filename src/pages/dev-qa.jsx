import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useProject } from '../components/ProjectProvider';
import { User } from '@/api/entities';
import { DecisionRun } from '@/api/entities';
import { Action } from '@/api/entities';
import { DecisionLog } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, ChevronLeft } from 'lucide-react';
import { subDays, subHours } from 'date-fns';

// Seeder logic, adapted for this page
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const createDemoRuns = async (project, options = {}) => {
  const { count = 1, offsetHours = 0, withActions = false } = options;
  const stabilityScores = [0.82, 0.76, 0.69, 0.74, 0.71, 0.78];
  const createdRuns = [];

  for (let i = 0; i < count; i++) {
    const now = new Date();
    const runTime = subHours(now, offsetHours + (i * 3));
    
    const run = {
      project_id: project.id,
      status: 'completed',
      start_time: runTime.toISOString(),
      end_time: runTime.toISOString(),
      completed_at: runTime.toISOString(),
      topline: {
        stability_score: stabilityScores[i % stabilityScores.length],
        best_option: `OPT-${17 + i}`,
        attractor_id: `demo-attr-${project.id}`,
        lyapunov: Math.round((0.20 + Math.random() * 0.25) * 10000) / 10000
      },
      meta: { is_demo: true }
    };
    
    const createdRun = await DecisionRun.create(run);
    createdRuns.push(createdRun);
    
    await DecisionLog.create({
      decision_run_id: createdRun.id,
      level: 'INFO',
      message: `QA: Demo run created with stability ${run.topline.stability_score}`,
      ts: runTime.toISOString(),
      meta: { is_demo: true }
    });

    if (withActions && i === 0) {
      await Action.create({
        decision_run_id: createdRun.id,
        project_id: project.id,
        type: 'adjust_capacity',
        status: 'success',
        meta: { is_demo: true }
      });
    }
    if (count > 1) await delay(200);
  }
  return createdRuns;
};

const SmokeTestItem = ({ label, status, message }) => {
  const icons = {
    pending: <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />,
    success: <CheckCircle className="h-4 w-4 text-green-500" />,
    error: <XCircle className="h-4 w-4 text-red-500" />,
  };
  const colors = {
    pending: "text-gray-500",
    success: "text-green-600",
    error: "text-red-600",
  }

  return (
    <div className="flex items-start justify-between p-2 border-b">
      <div className="flex items-center gap-2">
        {icons[status]}
        <span className="font-medium">{label}</span>
      </div>
      <span className={`text-sm ${colors[status]}`}>{message}</span>
    </div>
  );
};


export default function DevQAPage() {
  const [user, setUser] = useState(null);
  const { selectedProject, allProjects, isLoading: projectsLoading } = useProject();
  const { toast } = useToast();
  
  const [isSeeding, setIsSeeding] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInserting, setIsInserting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  
  const [smokeResults, setSmokeResults] = useState({
    runCheck: { status: 'pending', message: 'Not run' },
    chartCheck: { status: 'pending', message: 'Not run' },
    actionCheck: { status: 'pending', message: 'Not run' },
    logCheck: { status: 'pending', message: 'Not run' },
  });

  useEffect(() => {
    User.me().then(setUser).catch(() => setUser(null));
  }, []);

  const handleSeedAll = async () => {
    setIsSeeding(true);
    toast({ title: "Seeding all projects..." });
    let seededCount = 0;
    for (const project of allProjects) {
        await createDemoRuns(project, { count: 3, withActions: true });
        seededCount++;
    }
    toast({ title: "Seed Complete", description: `Seeded demo data for ${seededCount} projects.` });
    setIsSeeding(false);
  };

  const handleRefresh = async () => {
    if (!selectedProject) {
        toast({ title: "Error", description: "No project selected.", variant: "destructive" });
        return;
    }
    setIsRefreshing(true);
    toast({ title: `Refreshing ${selectedProject.name}...` });
    const oldRuns = await DecisionRun.filter({ project_id: selectedProject.id, 'meta.is_demo': true });
    // In a real scenario, we might bulk-delete, but for now we just add new ones.
    await createDemoRuns(selectedProject, { count: 6, withActions: true });
    toast({ title: "Refresh Complete", description: `Added 6 new demo runs.` });
    setIsRefreshing(false);
  };

  const handleInsert = async () => {
    if (!selectedProject) {
        toast({ title: "Error", description: "No project selected.", variant: "destructive" });
        return;
    }
    setIsInserting(true);
    await createDemoRuns(selectedProject, { count: 1, withActions: true });
    toast({ title: "Demo Run Inserted" });
    setIsInserting(false);
  };

  const runSmokeTest = useCallback(async () => {
    if (!selectedProject) {
      toast({ title: "Select a project to run tests.", variant: 'destructive'});
      return;
    }
    setIsTesting(true);
    setSmokeResults({
      runCheck: { status: 'pending', message: 'Checking...' },
      chartCheck: { status: 'pending', message: 'Checking...' },
      actionCheck: { status: 'pending', message: 'Checking...' },
      logCheck: { status: 'pending', message: 'Checking...' },
    });
    
    await delay(500); // For UI feel

    // Run Check
    try {
      const oneDayAgo = subDays(new Date(), 1);
      const runs = await DecisionRun.filter({ project_id: selectedProject.id, created_date_gt: oneDayAgo.toISOString() });
      if (runs.length > 0) {
        setSmokeResults(prev => ({ ...prev, runCheck: { status: 'success', message: `${runs.length} runs found in last 24h` }}));
      } else {
        setSmokeResults(prev => ({ ...prev, runCheck: { status: 'error', message: 'No runs found in last 24h' }}));
      }
    } catch(e) {
      setSmokeResults(prev => ({ ...prev, runCheck: { status: 'error', message: e.message }}));
    }

    // Chart Check (simulated)
    try {
      const oneDayAgo = subDays(new Date(), 1);
      const runs = await DecisionRun.filter({ project_id: selectedProject.id, status: 'completed', created_date_gt: oneDayAgo.toISOString() });
      const completedRuns = runs.filter(r => r.topline?.stability_score != null);
      if (completedRuns.length > 0) {
        setSmokeResults(prev => ({ ...prev, chartCheck: { status: 'success', message: `${completedRuns.length} data points available` }}));
      } else {
        setSmokeResults(prev => ({ ...prev, chartCheck: { status: 'error', message: 'No stability data for chart' }}));
      }
    } catch(e) {
      setSmokeResults(prev => ({ ...prev, chartCheck: { status: 'error', message: e.message }}));
    }

    // Action Check
    try {
      const oneDayAgo = subDays(new Date(), 1);
      const actions = await Action.filter({ project_id: selectedProject.id, created_date_gt: oneDayAgo.toISOString() });
      if (actions.length > 0) {
        setSmokeResults(prev => ({ ...prev, actionCheck: { status: 'success', message: `${actions.length} actions found` }}));
      } else {
        setSmokeResults(prev => ({ ...prev, actionCheck: { status: 'error', message: 'No actions found' }}));
      }
    } catch (e) {
      setSmokeResults(prev => ({ ...prev, actionCheck: { status: 'error', message: e.message }}));
    }

    // Log Check
    try {
      const logMessage = `SMOKE_TEST_${Date.now()}`;
      await DecisionLog.create({ decision_run_id: 'smoke-test', level: 'INFO', message: logMessage });
      setSmokeResults(prev => ({ ...prev, logCheck: { status: 'success', message: 'Log entry created successfully' }}));
    } catch (e) {
      setSmokeResults(prev => ({ ...prev, logCheck: { status: 'error', message: e.message }}));
    }

    setIsTesting(false);
  }, [selectedProject, toast]);

  if (!user) {
    return <div className="p-8">Loading user...</div>;
  }
  if (user.role !== 'admin') {
    return (
      <Card className="m-8 text-center">
        <CardHeader><CardTitle>Access Denied</CardTitle></CardHeader>
        <CardContent>
          <p>This page is only available to administrators.</p>
          <Button asChild variant="link" className="mt-4"><Link to={createPageUrl('dashboard')}>Go to Dashboard</Link></Button>
        </CardContent>
      </Card>
    );
  }

  const buttonsDisabled = isSeeding || isRefreshing || isInserting || projectsLoading;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">QA & Developer Tools</h1>
        <Button asChild variant="outline">
          <Link to={createPageUrl('dashboard')}><ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Demo Data Management</CardTitle>
          <CardDescription>Use these actions to populate the environment with sample data.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button onClick={handleSeedAll} disabled={buttonsDisabled}>
            {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Seed All Projects
          </Button>
          <Button onClick={handleRefresh} disabled={buttonsDisabled || !selectedProject}>
            {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Refresh Current Project
          </Button>
          <Button onClick={handleInsert} disabled={buttonsDisabled || !selectedProject} variant="secondary">
            {isInserting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Insert Single Demo Run
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Smoke Test Matrix</CardTitle>
          <CardDescription>
            Run a quick check on the current project ({selectedProject?.name || 'None Selected'}) to verify core functionality.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Button onClick={runSmokeTest} disabled={isTesting || !selectedProject}>
              {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Run Smoke Test
            </Button>
          </div>
          <div className="border rounded-md">
            <SmokeTestItem label="Run Exists (24h)" {...smokeResults.runCheck} />
            <SmokeTestItem label="Chart Data Available" {...smokeResults.chartCheck} />
            <SmokeTestItem label="Action Exists" {...smokeResults.actionCheck} />
            <SmokeTestItem label="DecisionLog Append" {...smokeResults.logCheck} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}