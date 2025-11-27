
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { DecisionRun } from '@/api/entities';
import { Action } from '@/api/entities';
import { DecisionLog } from '@/api/entities';
import { useProjects, useProjectsSafe } from '@/components/portal/useProjectsContext';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TermBadge } from '../components/ui/TermBadge';

import {
    ArrowLeft, CheckCircle, XCircle, Clock, Play, FileJson, Copy, RefreshCw, Trash2,
    ChevronRight, Info, AlertTriangle, ChevronsUpDown, ArrowUp, X
} from 'lucide-react';

import { createPageUrl } from '@/utils';
import { useToast } from "@/components/ui/use-toast";
import { User } from '@/api/entities';
import { can } from '@/components/auth/permissions';

// --- Helper Functions ---
const toMs = (iso) => (iso ? Date.parse(iso) : NaN);
const iso = (ms) => new Date(ms).toISOString();
const formatNum = (num, decimals = 2) => (typeof num === 'number' && !isNaN(num)) ? num.toFixed(decimals) : '—';
const formatPercent = (num) => {
    if (typeof num === 'string') num = parseFloat(num);
    return (typeof num === 'number' && !isNaN(num)) ? `${(num * 100).toFixed(1)}%` : '—';
};
const formatDuration = (startTime, endTime) => {
    const start = toMs(startTime);
    const end = toMs(endTime);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return "—";
    let ms = end - start;
    if (ms < 1000) return `${ms}ms`;
    const s = Math.floor(ms / 1000) % 60;
    const m = Math.floor(ms / 60000) % 60;
    const h = Math.floor(ms / 3600000);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
};
const formatDateTime = (isoString) => {
    if (!isoString) return { display: '—', tooltip: 'N/A' };
    try {
        const date = new Date(isoString);
        if (date.getTime() < new Date('1971-01-01').getTime()) return { display: '—', tooltip: 'Invalid timestamp' };
        return {
            display: date.toLocaleString('en-GB', { timeZone: 'Europe/London', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            tooltip: date.toISOString()
        };
    } catch { return { display: 'Invalid Date', tooltip: isoString }; }
};
function sanitizeRunTimes(run) {
  if (!run) return { createdISO: null, completedISO: null, startedISO: null };
  const endMs = toMs(run.completed_at ?? run.updated_at ?? null);
  const haveEnd = Number.isFinite(endMs);
  let startMs = toMs(run.started_at ?? null);
  let createdMs = toMs(run.created_date ?? null);
  if (!Number.isFinite(startMs)) {
    const syntheticStart = haveEnd ? endMs - 45 * 60 * 1000 : NaN;
    startMs = syntheticStart;
  }
  if (!Number.isFinite(createdMs)) {
    createdMs = startMs;
  }
  if (haveEnd && Number.isFinite(createdMs) && createdMs > endMs) {
    createdMs = Math.max(Number.isFinite(startMs) ? startMs : 0, endMs - 60 * 1000);
  }
  if (haveEnd && Number.isFinite(startMs) && startMs > endMs) {
    startMs = Math.max(0, endMs - 45 * 60 * 1000);
  }
  return {
    createdISO: Number.isFinite(createdMs) ? iso(createdMs) : null,
    completedISO: haveEnd ? iso(endMs) : null,
    startedISO: Number.isFinite(startMs) ? iso(startMs) : null,
  };
}
const statusInfo = {
  completed: { icon: <CheckCircle className="h-5 w-5 text-green-500" />, color: "bg-green-100 text-green-800" },
  running: { icon: <Play className="h-5 w-5 text-blue-500 animate-pulse" />, color: "bg-blue-100 text-blue-800" },
  failed: { icon: <XCircle className="h-5 w-5 text-red-500" />, color: "bg-red-100 text-red-800" },
  queued: { icon: <Clock className="h-5 w-5 text-gray-500" />, color: "bg-gray-100 text-gray-800" },
};
const logIcons = {
    INFO: <Info className="h-4 w-4 text-blue-500" />,
    WARN: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    ERROR: <XCircle className="h-4 w-4 text-red-500" />,
    SUCCESS: <CheckCircle className="h-4 w-4 text-green-500" />,
};


const JsonViewer = ({ data, title }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium w-full text-left py-2 hover:bg-gray-50 px-2 rounded">
                <ChevronsUpDown className="h-4 w-4" /> {title}
            </CollapsibleTrigger>
            <CollapsibleContent>
                <pre className="bg-slate-900 text-white p-3 md:p-4 rounded-md text-xs overflow-x-auto mt-2">
                    {JSON.stringify(data, null, 2)}
                </pre>
            </CollapsibleContent>
        </Collapsible>
    );
};
const MetadataItem = ({ label, children }) => (
    <div className="flex justify-between items-center py-2 border-b">
        <span className="text-sm text-gray-500">{label}</span>
        <span className="text-sm font-medium text-right">{children}</span>
    </div>
);
const BackToTop = () => (
    <div className="md:hidden flex justify-center pt-4 border-t">
        <Button variant="ghost" size="sm" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <ArrowUp className="mr-2 h-4 w-4" /> Back to top
        </Button>
    </div>
);
const ChaosInsightsCard = ({ run, project, showResearchTerms }) => {
  if (!showResearchTerms) return null;
  const attractorId = run?.topline?.attractor_id || "— (demo)";
  const lyapunovValue = run?.topline?.lyapunov || "—";
  const oscillatorLabel = project?.oscillator_label || "—";
  const entropy = run?.meta?.entropy || "—";
  const fractalD = run?.meta?.fractal_dimension || "—";
  const orchPath = run?.meta?.orchestration_path || "Simulated";
  return (
    <Card className="mb-6">
      <CardHeader><CardTitle className="text-lg flex items-center gap-2">Chaos Insights<TermBadge term="Chaos Core" showTooltip={true} /></CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center justify-between"><div className="flex items-center gap-2"><TermBadge term="Attractor" showTooltip={true} /><span className="font-medium">Attractor:</span></div><span className="font-mono text-xs">{attractorId}</span></div>
          <div className="flex items-center justify-between"><div className="flex items-center gap-2"><TermBadge term="Lyapunov" showTooltip={true} /><span className="font-medium">Lyapunov:</span></div><span className="font-mono">{lyapunovValue}</span></div>
          <div className="flex items-center justify-between"><div className="flex items-center gap-2"><TermBadge term="Chaotic Oscillator" showTooltip={true} /><span className="font-medium">Oscillator:</span></div><span className="font-mono text-xs">{oscillatorLabel}</span></div>
          <div className="flex items-center justify-between"><div className="flex items-center gap-2"><TermBadge term="Orchestrator" showTooltip={true} /><span className="font-medium">Orchestration:</span></div><span className="font-mono text-xs">{orchPath}</span></div>
        </div>
        <div className="pt-2 border-t"><div className="flex items-center gap-4 text-sm"><div className="flex items-center gap-2"><TermBadge term="Noise Handling" showTooltip={true} /><span className="font-medium">Noise Metrics:</span></div><span className="text-gray-600">Entropy: {entropy} · Fractal D: {fractalD}</span></div></div>
      </CardContent>
    </Card>
  );
};


export default function RunDetail() {
  const [searchParams, setSearchParams] = useSearchParams();
  const runId = searchParams.get('id');
  
  const { projects: allProjects, activeProjectId } = useProjectsSafe(); // Use safe version
  
  const [run, setRun] = useState(null);
  const [actions, setActions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoLogged, setAutoLogged] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const project = useMemo(() => {
      if (!run || !allProjects.length) return null;
      return allProjects.find(p => p.id === run.project_id);
  }, [run, allProjects]);

  const showResearchTerms = project?.show_research_terminology !== false;
  
  useEffect(() => {
    if (!searchParams.get('tab')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('tab', 'overview');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const activeTab = searchParams.get('tab') || 'overview';

  const loadAllData = useCallback(async () => {
    if (!runId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
        const [currentUser, runData] = await Promise.all([
            User.me().catch(() => null),
            DecisionRun.get(runId),
        ]);
        setUser(currentUser);
        setRun(runData);

        if(runData) {
            const [actionsData, logsData] = await Promise.all([
                Action.filter({ decision_run_id: runId }),
                DecisionLog.filter({ decision_run_id: runId }),
            ]);
            setActions(actionsData.sort((a,b) => new Date(b.executed_at || b.created_date).getTime() - new Date(a.executed_at || a.created_date).getTime()));
            setLogs(logsData.sort((a,b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()));
        }
    } catch (e) {
      console.error("Failed to load run details", e);
      toast({ title: "Error", description: `Failed to load data for run ${runId}.`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [runId, toast]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);
  
  useEffect(() => {
    if (!run || autoLogged || isLoading) return;
    const isDemo = !!run.meta?.is_demo;
    if (!isDemo) { setAutoLogged(true); return; }
    const hasAutogenLogs = logs.some(l => l.meta?.autogen);
    if (logs.length > 0 && hasAutogenLogs) { setAutoLogged(true); return; }
    const generateAutoLogs = async () => {
        const { createdISO, completedISO } = sanitizeRunTimes(run);
        try {
            await DecisionLog.bulkCreate([
                { decision_run_id: run.id, level: 'INFO', message: `Run created with context ${run.context_name || 'N/A'}.`, ts: createdISO, meta: { autogen: true } },
                { decision_run_id: run.id, level: 'WARN', message: 'Stability score 0.68 is below configured threshold of 0.75.', ts: new Date(toMs(createdISO) + 1000).toISOString(), meta: { autogen: true } },
                { decision_run_id: run.id, level: 'INFO', message: 'Run completed successfully.', ts: completedISO, meta: { autogen: true } }
            ]);
            loadAllData();
        } catch(e) { console.error("Failed to auto-generate logs:", e); }
    };
    if (logs.length === 0) { generateAutoLogs(); }
    setAutoLogged(true);
  }, [run, logs, autoLogged, isLoading, loadAllData]);
  const handleBackToRuns = useCallback(() => {
    const queryString = location.state?.queryString || '';
    if (location.state?.from === "runs") {
      navigate(-1);
    } else {
      navigate(createPageUrl(`decision-runs${queryString}`));
    }
  }, [navigate, location.state]);
  useEffect(() => {
    const handleKeyPress = (e) => { if (e.key === 'Escape') { handleBackToRuns(); } };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleBackToRuns]);
  const handleTabChange = (value) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('tab', value);
      setSearchParams(newParams);
  };
  const copyToClipboard = (text, label) => {
      navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: `${label} copied to clipboard.` });
  };
  const handleExport = () => {
      const timestamp = new Date().toISOString().slice(0, 16).replace(/[-:]/g, '').replace('T', '_');
      const exportData = { id: run.id, project_id: run.project_id, status: run.status, inputs: run.inputs, topline: run.topline, recommendations: run.recommendations, meta: run.meta, created_date: run.created_date, completed_at: run.completed_at };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `run_${run.id.substring(0,8)}_exported_${timestamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
  };
  const handleRerun = async () => {
      try {
          const newRun = await DecisionRun.create({ project_id: run.project_id, status: 'queued', inputs: run.inputs, meta: { re_run_of: run.id, is_demo: true } });
          toast({ title: "Re-run Started", description: `New run ${newRun.id.substring(0,8)} created.` });
          navigate(createPageUrl(`run-detail?id=${newRun.id}`));
      } catch (error) { toast({ title: "Re-run Failed", description: "Could not create new run.", variant: "destructive" }); }
  };
  const handleDelete = async () => {
      if(window.confirm("Are you sure you want to delete this demo run? This action cannot be undone.")) {
          try {
              await DecisionRun.delete(run.id);
              toast({ title: "Run Deleted", description: `Demo run ${run.id.substring(0,8)} has been deleted.` });
              navigate(createPageUrl('decision-runs'));
          } catch(e) { toast({ title: "Delete Failed", description: "Could not delete the run.", variant: "destructive" }); }
      }
  };


  const sanitizedRunTimes = useMemo(() => sanitizeRunTimes(run), [run]);
  const shortId = runId ? `${runId.substring(0, 10)}…${runId.substring(runId.length - 2)}` : '';
  const currentStatus = run ? (statusInfo[run.status] || statusInfo.queued) : {};
  const completedTime = formatDateTime(sanitizedRunTimes.completedISO);
  const createdTime = formatDateTime(sanitizedRunTimes.createdISO);
  const sRaw = run?.topline?.stability_score;
  const sVal = typeof sRaw === "number" ? sRaw : (typeof sRaw === "string" ? parseFloat(sRaw) : NaN);
  const stabilityLabel = Number.isFinite(sVal) ? `${(sVal * 100).toFixed(1)}%` : "—";
  const duration = formatDuration(sanitizedRunTimes.startedISO, sanitizedRunTimes.completedISO);
  const effectiveRole = user?.role || 'viewer';

  if (isLoading) {
      return (
          <div className="space-y-6 p-4 md:p-8">
            <Skeleton className="h-8 w-64" />
            <Card><CardContent className="p-4 md:p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
            <Card><CardContent className="p-4 md:p-6"><Skeleton className="h-96 w-full" /></CardContent></Card>
          </div>
      );
  }

  if (!run) {
    return (
      <Card className="text-center py-12 mx-4 md:mx-0">
        <CardHeader><CardTitle>Run Not Found</CardTitle></CardHeader>
        <CardContent>
            <Button variant="outline" onClick={handleBackToRuns}>
                <span><ArrowLeft className="mr-2 h-4 w-4"/>Back to Runs</span>
            </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
        {/* Mobile sticky back bar */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b shadow-sm">
          <div className="flex items-center justify-between p-4">
            <Button variant="outline" size="sm" onClick={handleBackToRuns}><ArrowLeft className="mr-2 h-4 w-4" />Back to Runs</Button>
            <Button variant="ghost" size="sm" onClick={handleBackToRuns} title="Close run summary"><X className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Desktop content with proper top margin on mobile */}
        <div className="mt-16 md:mt-0">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link to={createPageUrl('projects')} className="hover:text-indigo-600">Projects</Link>
            <ChevronRight className="h-4 w-4" />
            <button
              onClick={handleBackToRuns}
              className="hover:text-indigo-600 transition-colors"
            >
              {project?.name || '...'}
            </button>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-gray-700">Run {shortId}</span>
          </div>

          {/* Header with back navigation */}
          <div className="flex items-center justify-between mt-4 mb-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={handleBackToRuns} className="hidden md:flex"><ArrowLeft className="mr-2 h-4 w-4" />Back to Runs</Button>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Run Summary</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={handleBackToRuns} title="Close run summary" className="hidden md:flex"><X className="h-4 w-4" /></Button>
          </div>

          <Card className="shadow-lg">
              <CardHeader className="pb-4 p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-3 text-xl md:text-2xl"><Badge className={`${currentStatus.color} text-sm md:text-base`}>{currentStatus.icon} <span className="ml-2 capitalize">{run.status}</span></Badge></CardTitle>
                        <TooltipProvider><Tooltip><TooltipTrigger asChild><p className="text-sm text-gray-500 cursor-help mt-1">Completed: {completedTime.display}</p></TooltipTrigger><TooltipContent><p>{completedTime.tooltip}</p></TooltipContent></Tooltip></TooltipProvider>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {can(effectiveRole, 'run:create') && (<Button variant="outline" size="sm" onClick={handleRerun}><RefreshCw className="mr-2 h-4 w-4"/>Re-run</Button>)}
                        <Button variant="outline" size="sm" onClick={handleExport}><FileJson className="mr-2 h-4 w-4"/>Export</Button>
                        {can(effectiveRole, 'org:diagnostics') && run.meta?.is_demo && (<Button variant="destructive" size="sm" onClick={handleDelete}><Trash2 className="mr-2 h-4 w-4"/>Delete</Button>)}
                    </div>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 p-4 md:p-6 pt-0">
                 <div className="p-3 bg-gray-50 rounded-lg text-center"><p className="text-xs font-semibold text-gray-500 uppercase">Stability</p><p className="text-lg md:text-2xl font-bold text-indigo-600">{stabilityLabel}</p></div>
                 <div className="p-3 bg-gray-50 rounded-lg text-center"><p className="text-xs font-semibold text-gray-500 uppercase">Lyapunov</p><p className="text-lg md:text-2xl font-bold">{formatNum(run.topline?.lyapunov, 3)}</p></div>
                 <div className="p-3 bg-gray-50 rounded-lg text-center"><p className="text-xs font-semibold text-gray-500 uppercase">Best Option</p><p className="text-lg md:text-2xl font-bold truncate">{run.topline?.best_option || '—'}</p></div>
                 <div className="p-3 bg-gray-50 rounded-lg text-center"><p className="text-xs font-semibold text-gray-500 uppercase">Duration</p><p className="text-lg md:text-2xl font-bold">{duration}</p></div>
                 <div className="col-span-2 md:col-span-4 flex flex-wrap justify-center md:justify-end gap-2 pt-2">
                      <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" onClick={() => copyToClipboard(run.id, "Run ID")}><Copy className="mr-2 h-4 w-4"/>ID</Button></TooltipTrigger><TooltipContent><p>{run.id}</p></TooltipContent></Tooltip></TooltipProvider>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(window.location.href, "Link")}><Copy className="mr-2 h-4 w-4"/>Link</Button>
                  </div>
              </CardContent>
          </Card>
          <ChaosInsightsCard run={run} project={project} showResearchTerms={showResearchTerms} />
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="actions">Actions ({actions.length})</TabsTrigger><TabsTrigger value="logs">Logs ({logs.length})</TabsTrigger></TabsList>
            <TabsContent value="overview" className="space-y-4 md:space-y-6">
                <div className="grid md:grid-cols-2 gap-4 md:gap-8">
                    <Card><CardHeader className="p-4 md:p-6"><CardTitle className="text-base md:text-lg">Decision Summary</CardTitle></CardHeader><CardContent className="p-4 md:p-6 pt-0 space-y-4"><div className="grid grid-cols-2 gap-x-4 gap-y-5 text-sm"><div><span className="text-gray-500 text-xs">Stability Score</span><p className="font-semibold text-base">{stabilityLabel}</p></div><div><span className="text-gray-500 text-xs">Lyapunov</span><p className="font-semibold text-base">{formatNum(run.topline?.lyapunov, 3)}</p></div><div className="col-span-2"><span className="text-gray-500 text-xs">Best Option</span><p className="font-semibold text-base">{run.topline?.best_option || '—'}</p></div>{run.topline?.attractor_id && (<div className="col-span-2"><div className="text-gray-500 text-xs">Attractor ID</div><div className="mt-1 flex items-start gap-1"><code className="font-mono text-xs break-all" title={run.topline.attractor_id}>{run.topline.attractor_id}</code><Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => copyToClipboard(run.topline.attractor_id, 'Attractor ID')}><Copy className="h-3 w-3" /></Button></div></div>)}{<div className="col-span-2"><div className="text-gray-500 text-xs">Run ID</div><div className="mt-1 flex items-start gap-1"><code className="font-mono text-xs break-all" title={run.id}>{run.id}</code><Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => copyToClipboard(run.id, 'Run ID')}><Copy className="h-3 w-3" /></Button></div></div>}</div></CardContent></Card>
                    <Card><CardHeader className="p-4 md:p-6"><CardTitle className="text-base md:text-lg">Run Metadata</CardTitle></CardHeader><CardContent className="p-4 md:p-6 pt-0 space-y-2"><MetadataItem label="Project"><span className="font-medium">{project?.name || '—'}</span></MetadataItem><MetadataItem label="Created">{createdTime.display}</MetadataItem><MetadataItem label="Completed">{completedTime.display}</MetadataItem><MetadataItem label="Duration">{duration}</MetadataItem>{run.meta?.profile && <MetadataItem label="Demo Profile">{run.meta.profile}</MetadataItem>}</CardContent></Card>
                </div>
                <Card><CardHeader className="p-4 md:p-6"><CardTitle className="text-base md:text-lg">Data & Configuration</CardTitle></CardHeader><CardContent className="p-4 md:p-6 pt-0 space-y-4"><JsonViewer data={run.inputs || {}} title="Inputs" /><JsonViewer data={run.topline || {}} title="Topline Response" />{run.recommendations && run.recommendations.length > 0 ? (<JsonViewer data={run.recommendations} title="All Recommendations" />) : (<div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500 text-sm">No alternative recommendations were returned for this run.</div>)}</CardContent></Card>
                <BackToTop />
            </TabsContent>
            <TabsContent value="actions" className="space-y-4">
                <Card><CardHeader className="p-4 md:p-6"><CardTitle className="text-base md:text-lg">Executed Actions</CardTitle></CardHeader><CardContent className="p-4 md:p-6 pt-0">{actions.length === 0 ? (<div className="text-center py-12 text-gray-500"><Play className="h-16 w-16 mx-auto mb-4 text-gray-300" /><p className="text-lg font-medium text-gray-900 mb-1">No actions recorded</p><p className="text-sm">No actions were executed during this run.</p></div>) : (<div className="space-y-3">{actions.map(action => { const executedTime = formatDateTime(action.executed_at || action.created_date); const statusColor = action.status === 'success' ? 'bg-green-100 text-green-800' : action.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'; const latency = formatDuration(action.created_date, action.updated_date); return (<div key={action.id} className="p-3 md:p-4 border rounded-lg"><div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-start"><div className="md:col-span-4"><p className="font-semibold text-sm md:text-base">{action.type}</p><TooltipProvider><Tooltip><TooltipTrigger asChild><p className="text-xs text-gray-500 cursor-help">{executedTime.display}</p></TooltipTrigger><TooltipContent><p>{executedTime.tooltip}</p></TooltipContent></Tooltip></TooltipProvider></div><div className="md:col-span-2"><Badge className={statusColor}>{action.status}</Badge></div><div className="md:col-span-3 text-sm">Latency: {latency}</div><div className="md:col-span-3">{action.orch_response && Object.keys(action.orch_response).length > 0 && (<JsonViewer data={action.orch_response} title="Response Details" />)}</div></div></div>); })}</div>)}</CardContent></Card>
                <BackToTop />
            </TabsContent>
            <TabsContent value="logs" className="space-y-4">
                <Card><CardHeader className="p-4 md:p-6"><CardTitle className="text-base md:text-lg">Decision Logs</CardTitle></CardHeader><CardContent className="p-4 md:p-6 pt-0">{logs.length === 0 ? (<div className="text-center py-12 text-gray-500"><Info className="h-16 w-16 mx-auto mb-4 text-gray-300" /><p className="text-lg font-medium text-gray-900 mb-1">No logs for this run yet</p><p className="text-sm">Logs will appear here as the run progresses.</p></div>) : (<div className="space-y-2">{logs.map(log => { const logTime = formatDateTime(log.ts); return (<div key={log.id} className="p-2 md:p-3 border-b grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-start text-sm"><div className="md:col-span-3"><TooltipProvider><Tooltip><TooltipTrigger asChild><span className="font-mono text-xs cursor-help">{logTime.display}</span></TooltipTrigger><TooltipContent><p>{logTime.tooltip}</p></TooltipContent></Tooltip></TooltipProvider></div><div className="md:col-span-2 flex items-center gap-2">{logIcons[log.level]}<span className="font-semibold">{log.level}</span></div><div className="md:col-span-7 font-mono text-xs break-words">{log.message}</div></div>); })}</div>)}</CardContent></Card>
                <BackToTop />
            </TabsContent>
          </Tabs>
        </div>
      </div>
  );
}
