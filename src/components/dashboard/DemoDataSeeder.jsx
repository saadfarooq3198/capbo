
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/components/ui/use-toast";
import { DecisionRun } from '@/api/entities';
import { Action } from '@/api/entities';
import { Dataset } from '@/api/entities';
import { DecisionLog } from '@/api/entities';
import { subHours, subDays } from 'date-fns';
import { Bot, Zap, Trash2, Loader2, Plus, RefreshCw } from 'lucide-react';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Demo profiles with distinct personalities
const profiles = [
  {
    name: "Supply Chain Pilot",
    stability_mean: 0.74,
    stability_volatility: 0.10,
    lyap_min: 0.28,
    lyap_max: 0.48,
    runs_per_24h: 8,
    latest_run_actions: ["success", "error", "success"],
    action_error_rate: 0.25,
    context_name: "Lane Balancing",
    attractor_prefix: "sc-attr",
    inputs_template: (rng) => ({
      lane: `A${Math.floor(rng.uniform(0, 5)) + 1}`,
      capacity_pct: Math.round((0.65 + rng.uniform(0, 0.3)) * 100) / 100,
      throughput: Math.round(rng.uniform(800, 1200))
    })
  },
  {
    name: "IT Infrastructure Upgrade",
    stability_mean: 0.82,
    stability_volatility: 0.06,
    lyap_min: 0.18,
    lyap_max: 0.36,
    runs_per_24h: 6,
    latest_run_actions: ["success", "success"],
    action_error_rate: 0.10,
    context_name: "Patch Rollout",
    attractor_prefix: "it-attr",
    inputs_template: (rng) => ({
      server_group: `SG-${Math.floor(rng.uniform(0, 8)) + 1}`,
      patch_level: `v${Math.floor(rng.uniform(1, 5))}.${Math.floor(rng.uniform(0, 10))}`,
      uptime_target: Math.round((0.995 + rng.uniform(0, 0.004)) * 1000) / 1000
    })
  },
  {
    name: "Marketing Optimisation",
    stability_mean: 0.69,
    stability_volatility: 0.12,
    lyap_min: 0.32,
    lyap_max: 0.55,
    runs_per_24h: 10,
    latest_run_actions: ["success", "error", "error"],
    action_error_rate: 0.35,
    context_name: "Campaign Split",
    attractor_prefix: "mk-attr",
    inputs_template: (rng) => ({
      ad_group: `ADG-${Math.floor(rng.uniform(0, 12)) + 1}`,
      budget_allocation: Math.round((0.4 + rng.uniform(0, 0.5)) * 100) / 100,
      conversion_rate: Math.round((0.02 + rng.uniform(0, 0.08)) * 10000) / 10000
    })
  },
  {
    name: "Customer Support Triage",
    stability_mean: 0.76,
    stability_volatility: 0.08,
    lyap_min: 0.22,
    lyap_max: 0.44,
    runs_per_24h: 7,
    latest_run_actions: ["success", "success", "success"],
    action_error_rate: 0.05,
    context_name: "SLA Escalation",
    attractor_prefix: "cs-attr",
    inputs_template: (rng) => ({
      tier: `T${Math.floor(rng.uniform(1, 4))}`,
      queue_depth: Math.floor(rng.uniform(15, 85)),
      avg_response_time: Math.round((2.5 + rng.uniform(0, 4.5)) * 10) / 10
    })
  },
  {
    name: "Finance Ops",
    stability_mean: 0.80,
    stability_volatility: 0.07,
    lyap_min: 0.20,
    lyap_max: 0.40,
    runs_per_24h: 5,
    latest_run_actions: ["success", "success"],
    action_error_rate: 0.08,
    context_name: "Ledger Close",
    attractor_prefix: "fin-attr",
    inputs_template: (rng) => ({
      ledger: `GL-${Math.floor(rng.uniform(1000, 9999))}`,
      variance_threshold: Math.round((0.02 + rng.uniform(0, 0.03)) * 10000) / 10000,
      reconciliation_status: rng.uniform(0, 1) > 0.7 ? "pending" : "complete"
    })
  }
];

// Simple hash function for project ID
const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

// Seeded RNG class
class SeededRNG {
  constructor(seed) {
    this.seed = seed;
  }

  // Linear congruential generator
  uniform(i, min = 0, max = 1) {
    const a = 1664525;
    const c = 1013904223;
    const m = Math.pow(2, 32);
    
    const x = ((a * (this.seed + i) + c) % m) / m;
    return min + (max - min) * Math.abs(x);
  }

  // Box-Muller transform for normal distribution
  randn(i, mean = 0, stddev = 1) {
    const u1 = this.uniform(i * 2);
    const u2 = this.uniform(i * 2 + 1);
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z0 * stddev;
  }
}

// Get profile for a project
const getProjectProfile = (project) => {
  // Check for override in project meta
  if (project.meta?.demo_profile) {
    const override = profiles.find(p => p.name === project.meta.demo_profile);
    if (override) return override;
  }
  
  // Deterministic assignment based on project ID
  const hash = hashString(project.id);
  const idx = hash % profiles.length;
  return profiles[idx];
};

// Create time slots evenly distributed over 24h
const makeTimeSlots = (startTime, endTime, count) => {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const interval = (end - start) / count;
  
  const slots = [];
  for (let i = 0; i < count; i++) {
    const slotTime = new Date(start + (i * interval));
    slots.push(slotTime.toISOString());
  }
  return slots;
};

// Clamp function
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const createDemoRuns = async (project, options = {}) => {
  const { withActions = true, useProfile = true } = options;
  
  if (!project || !project.id) {
    console.error("createDemoRuns called without a valid project.");
    return { runs: [], actions: [], profile: 'N/A' };
  }

  // If count is specified, use legacy mode for backwards compatibility
  // Note: 'count' property is deprecated and will be removed.
  if (options.count) {
    return createLegacyDemoRuns(project, { count: options.count, withActions });
  }
  
  if (!useProfile) {
    return createLegacyDemoRuns(project, { count: 6, withActions });
  }

  const profile = getProjectProfile(project);
  const rng = new SeededRNG(hashString(project.id));
  
  const now = new Date();
  const yesterday = subHours(now, 24);
  const slots = makeTimeSlots(yesterday, now, profile.runs_per_24h);
  
  const runsToCreate = [];

  for (let i = 0; i < slots.length; i++) {
    const slotTime = new Date(slots[i]);
    const stabilityScore = clamp(
      profile.stability_mean + rng.randn(i, 0, profile.stability_volatility),
      0.45, 0.95
    );
    const lyapunov = rng.uniform(i + 100, profile.lyap_min, profile.lyap_max);
    const durationMinutes = Math.round(rng.uniform(i + 500, 30, 75));
    const startTime = new Date(slotTime.getTime() - durationMinutes * 60 * 1000);
    
    const run = {
      project_id: project.id,
      status: 'completed',
      started_at: startTime.toISOString(),
      created_at: startTime.toISOString(),
      completed_at: slotTime.toISOString(),
      topline: {
        stability_score: Math.round(stabilityScore * 1000) / 1000,
        best_option: `OPT-${(11 + i) % 30}`,
        attractor_id: `${profile.attractor_prefix}-${Math.floor(rng.uniform(i + 200, 0, 100))}`,
        lyapunov: Math.round(lyapunov * 10000) / 10000,
      },
      context_name: profile.context_name,
      inputs: profile.inputs_template(rng),
      meta: { is_demo: true, profile: profile.name, auto_seeded: true, demo_duration_min: durationMinutes }
    };
    runsToCreate.push(run);
  }

  const createdRuns = await DecisionRun.bulkCreate(runsToCreate);
  let createdActions = [];

  if (withActions && createdRuns.length > 0) {
    const latestRun = [...createdRuns].sort((a,b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0];
    const actionsToCreate = [];

    for (let j = 0; j < profile.latest_run_actions.length; j++) {
      const actionStatus = profile.latest_run_actions[j];
      const actionType = actionStatus === 'error' ? 'reroute' : 'adjust_capacity';
      const actionExecutedTime = new Date(new Date(latestRun.completed_at).getTime() - rng.uniform(j + 400, 1000, 5000));
      const actionCompletedTime = new Date(actionExecutedTime.getTime() + rng.uniform(j + 450, 100, 400));
      
      actionsToCreate.push({
        decision_run_id: latestRun.id,
        project_id: project.id,
        type: actionType,
        status: actionStatus,
        executed_at: actionExecutedTime.toISOString(),
        completed_at: actionCompletedTime.toISOString(),
        latency_ms: actionCompletedTime.getTime() - actionExecutedTime.getTime(),
        attempts: actionStatus === 'error' ? 2 : 1,
        meta: { is_demo: true, profile: profile.name }
      });
    }
    
    if (actionsToCreate.length > 0) {
      createdActions = await Action.bulkCreate(actionsToCreate);
    }
  }

  return { runs: createdRuns, actions: createdActions, profile: profile.name };
};

// Legacy demo runs for backwards compatibility
const createLegacyDemoRuns = async (project, options = {}) => {
  const { count = 6, withActions = true } = options;
  const stabilityScores = [0.66, 0.72, 0.81, 0.77, 0.69, 0.83];
  
  if (!project || !project.id) {
    console.error("createLegacyDemoRuns called without a valid project.");
    return { runs: [], actions: [] };
  }

  const runsToCreate = [];
  for (let i = 0; i < count; i++) {
    const now = new Date();
    const completedTime = subHours(now, i * 2);
    const startedTime = new Date(completedTime.getTime() - (5 * 60 * 1000));
    
    const run = {
      project_id: project.id,
      status: 'completed',
      started_at: startedTime.toISOString(),
      created_at: startedTime.toISOString(),
      completed_at: completedTime.toISOString(),
      topline: {
        stability_score: stabilityScores[i % stabilityScores.length],
        best_option: `OPT-${17 + i}`,
        attractor_id: `demo-attr-${project.id}`,
        lyapunov: Math.round((0.22 + Math.random() * 0.22) * 10000) / 10000,
      },
      context_name: 'Demo Data',
      inputs: { lane: `A${Math.floor(Math.random() * 5) + 1}`, capacity_pct: Math.round((0.7 + Math.random() * 0.2) * 100) / 100 },
      meta: { is_demo: true }
    };
    runsToCreate.push(run);
  }

  const createdRuns = await DecisionRun.bulkCreate(runsToCreate);
  let createdActions = [];

  if (withActions && createdRuns.length > 0) {
    const latestRun = [...createdRuns].sort((a,b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0];
    const actionsToCreate = [];
    
    const actionExecutedTime1 = new Date(new Date(latestRun.completed_at).getTime() - 2000);
    const actionCompletedTime1 = new Date(actionExecutedTime1.getTime() + 150);
    actionsToCreate.push({ 
      decision_run_id: latestRun.id, project_id: project.id, type: 'adjust_capacity', status: 'success', 
      executed_at: actionExecutedTime1.toISOString(), completed_at: actionCompletedTime1.toISOString(), 
      latency_ms: actionCompletedTime1.getTime() - actionExecutedTime1.getTime(), meta: { is_demo: true } 
    });
      
    const actionExecutedTime2 = new Date(new Date(latestRun.completed_at).getTime() - 1000);
    const actionCompletedTime2 = new Date(actionExecutedTime2.getTime() + 200);
    actionsToCreate.push({ 
      decision_run_id: latestRun.id, project_id: project.id, type: 'notify_ops', status: 'success', 
      executed_at: actionExecutedTime2.toISOString(), completed_at: actionCompletedTime2.toISOString(),
      latency_ms: actionCompletedTime2.getTime() - actionExecutedTime2.getTime(), meta: { is_demo: true } 
    });

    if(actionsToCreate.length > 0) {
        createdActions = await Action.bulkCreate(actionsToCreate);
    }
  }

  return { runs: createdRuns, actions: createdActions };
};

const clearDemoData = async (project = null) => {
    const filter = { "meta.is_demo": true };
    if (project && project.id) {
        filter.project_id = project.id;
    }

    try {
        // Fetch and delete to avoid potential query limitations, with small delays
        const runsToDelete = await DecisionRun.filter(filter);
        for (const run of runsToDelete) { 
            await DecisionRun.delete(run.id); 
            await delay(25);
        }

        const actionsToDelete = await Action.filter(filter);
        for (const action of actionsToDelete) { 
            await Action.delete(action.id); 
            await delay(25);
        }

        const datasetsToDelete = await Dataset.filter(filter);
        for (const dataset of datasetsToDelete) { 
            await Dataset.delete(dataset.id);
            await delay(25);
        }
        
        console.log(`Cleared ${runsToDelete.length} demo runs, ${actionsToDelete.length} demo actions, and ${datasetsToDelete.length} demo datasets.`);

    } catch (e) {
        console.error("Error during demo data cleanup:", e);
        throw e;
    }
};

export default function DemoDataSeeder({ 
  selectedProject, allProjects, onDataSeeded, 
  showAllProjectsButton = true, showInsertDemo = true, showClearDemo = false 
}) {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isInsertingDemo, setIsInsertingDemo] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState('');
  const { toast } = useToast();

  const currentProfile = selectedProject ? getProjectProfile(selectedProject) : null;

  const insertSingleDemoRun = async () => {
    if (!selectedProject) return;
    setIsInsertingDemo(true);
    try {
      const { runs } = await createDemoRuns(selectedProject, { count: 1, withActions: true });
      if (runs.length > 0) {
        toast({ title: "Demo Run Created", description: `Created demo run with stability ${(runs[0].topline.stability_score * 100).toFixed(1)}%` });
      }
      if (onDataSeeded) onDataSeeded();
    } catch (error) {
      console.error("Failed to insert demo run:", error);
      toast({ title: "Insert Failed", description: "Could not create demo run.", variant: "destructive" });
    } finally {
      setIsInsertingDemo(false);
    }
  };

  const refreshProjectData = async () => {
    if (!selectedProject) return;
    setIsRefreshing(true);
    try {
      // Clear existing demo data first
      await clearDemoData(selectedProject);
      
      // Create new data with profile
      const { profile } = await createDemoRuns(selectedProject, { useProfile: true, withActions: true });
      toast({ 
        title: "Project Data Refreshed", 
        description: `Re-seeded with ${profile} profile pattern.`
      });
      if (onDataSeeded) onDataSeeded();
    } catch (error) {
      console.error("Failed to refresh project data:", error);
      toast({ title: "Refresh Failed", description: "Could not refresh project data.", variant: "destructive" });
    } finally {
      setIsRefreshing(false);
    }
  };

  const seedAllProjects = async () => {
    setIsSeeding(true);
    try {
        let seededProjectCount = 0;
        for (const project of allProjects) {
            // Check if the project is empty in the last 24h
            const recentRuns = await DecisionRun.filter({ 
              project_id: project.id, 
              completed_at_gt: subDays(new Date(), 1).toISOString() 
            }, null, 1);
            if (recentRuns.length === 0) {
                await createDemoRuns(project, { useProfile: true, withActions: true });
                seededProjectCount++;
            }
        }
        toast({ title: "Demo Data Seeded", description: `Seeded ${seededProjectCount} empty projects with distinct profiles.` });
        if (onDataSeeded) onDataSeeded();
    } catch (error) {
        console.error("Failed to seed demo data:", error);
        toast({ title: "Seeding Failed", description: "Could not create demo data.", variant: "destructive" });
    } finally {
        setIsSeeding(false);
    }
  };

  const handleClearDemoData = async () => {
    setIsClearing(true);
    try {
      await clearDemoData(selectedProject);
      toast({ title: "Demo Data Cleared", description: "Demo data has been removed from the current project." });
      if (onDataSeeded) onDataSeeded();
    } catch (error) {
      console.error("Failed to clear demo data:", error);
      toast({ title: "Clear Failed", description: "Could not clear demo data.", variant: "destructive" });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Profile Information */}
      {currentProfile && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h5 className="text-sm font-medium text-blue-900 mb-1">
            Current Profile: {currentProfile.name}
          </h5>
          <div className="text-xs text-blue-700 grid grid-cols-2 gap-x-4">
            <div>Stability: {(currentProfile.stability_mean * 100).toFixed(1)}% ± {(currentProfile.stability_volatility * 100).toFixed(1)}%</div>
            <div>Runs/24h: {currentProfile.runs_per_24h}</div>
            <div>Actions: {currentProfile.latest_run_actions.join(', ')}</div>
            <div>Error Rate: {(currentProfile.action_error_rate * 100).toFixed(0)}%</div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {showInsertDemo && (
          <Button onClick={insertSingleDemoRun} disabled={isInsertingDemo || !selectedProject} variant="outline" size="sm" className="text-purple-600 border-purple-200 hover:bg-purple-50">
            {isInsertingDemo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            {isInsertingDemo ? 'Creating...' : 'Insert 1 Demo Run'}
          </Button>
        )}
        
        {selectedProject && (
          <Button onClick={refreshProjectData} disabled={isRefreshing} variant="outline" size="sm" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
            {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {isRefreshing ? 'Refreshing...' : 'Refresh Project Data'}
          </Button>
        )}
        
        {showAllProjectsButton && (
          <Button onClick={seedAllProjects} disabled={isSeeding || !allProjects || allProjects.length === 0} variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
            {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
            {isSeeding ? 'Seeding...' : 'Seed All Empty Projects'}
          </Button>
        )}
        
        {showClearDemo && (
          <Button onClick={handleClearDemoData} disabled={isClearing || !selectedProject} variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
            {isClearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            {isClearing ? 'Clearing...' : 'Clear Project Demo Data'}
          </Button>
        )}
      </div>
    </div>
  );
}
