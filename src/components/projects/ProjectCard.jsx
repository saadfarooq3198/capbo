
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MoreVertical, Play, LineChart, Zap, Clock, Pause, Archive, Trash2, Settings, Eye } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { useRole } from '../auth/RoleProvider';
import { TermBadge } from '../ui/TermBadge';
import { NewRunDialog } from '../runs/NewRunDialog';

// Helper function to safely format dates
const safeFormatDate = (dateValue, formatter = 'relative') => {
  if (!dateValue) return '—';
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return '—';
    
    if (formatter === 'relative') {
      return formatDistanceToNow(date, { addSuffix: true });
    } else if (formatter === 'short') {
      return format(date, 'MMM d');
    }
    return date.toLocaleDateString();
  } catch (error) {
    console.warn('Date formatting error:', error, 'for value:', dateValue);
    return '—';
  }
};

const statusStyles = {
  active: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
  paused: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100",
  draft: "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-100",
  archived: "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100",
};

const domainStyles = {
  supply_chain: "bg-blue-100 text-blue-800",
  bpo_support: "bg-purple-100 text-purple-800",
  it_ops: "bg-indigo-100 text-indigo-800",
  marketing: "bg-pink-100 text-pink-800",
  finance: "bg-teal-100 text-teal-800",
  custom: "bg-gray-200 text-gray-800"
};

const MiniMetric = ({ icon, value, label, time }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          {icon}
          <span className="font-semibold">{value ?? '—'}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
        {time && <p className="text-xs text-gray-400">{time}</p>}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const AdminActions = ({ project, onStatusChange, onDelete }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 flex-shrink-0">
        <MoreVertical className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {project.status !== 'active' && <DropdownMenuItem onClick={() => onStatusChange(project.id, 'active')}>
        <Play className="mr-2 h-4 w-4" /> Resume
      </DropdownMenuItem>}
      {project.status === 'active' && <DropdownMenuItem onClick={() => onStatusChange(project.id, 'paused')}>
        <Pause className="mr-2 h-4 w-4" /> Pause
      </DropdownMenuItem>}
      <DropdownMenuItem onClick={() => onStatusChange(project.id, 'archived')}>
        <Archive className="mr-2 h-4 w-4" /> Archive
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Settings className="mr-2 h-4 w-4" /> Settings
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => onDelete(project.id)}>
        <Trash2 className="mr-2 h-4 w-4" /> Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const PERMISSIONS = {
  admin: ['manage:projects', 'run:create', 'view:dashboard'],
  editor: ['run:create', 'view:dashboard'],
  viewer: ['view:dashboard'],
};

const can = (role, action) => {
  if (!role || !PERMISSIONS[role]) {
    return false;
  }
  return PERMISSIONS[role].includes(action);
};

export default function ProjectCard({ project, metrics, onStatusChange, onDelete }) {
  const [showNewRunDialog, setShowNewRunDialog] = useState(false);
  const displayDomain = project.domain || 'custom';
  const { effectiveRole } = useRole();
  const canManageProject = effectiveRole === 'admin';
  const canRun = can(effectiveRole, 'run:create') && (project.status === 'active' || project.status === 'paused');
  const showResearchTerms = project.show_research_terminology !== false;

  const urlParams = new URLSearchParams(window.location.search);
  const showDebug = urlParams.get('debug') === '1';

  // Check if metrics have been loaded for this project
  const hasMetrics = metrics !== undefined && metrics !== null;

  const handleNewRunClick = () => {
    if (!project.id) {
      console.warn('Project card "New Run" clicked but project.id is missing');
      return;
    }
    setShowNewRunDialog(true);
  };

  return (
    <>
      <Card className="h-full flex flex-col overflow-hidden rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="text-base font-bold text-gray-900 truncate">{project.name}</CardTitle>
            <div className="flex items-center flex-wrap gap-2 mt-1.5">
              <Badge className={`${statusStyles[project.status]} capitalize text-xs`}>{project.status}</Badge>
              <Badge className={`${domainStyles[displayDomain]} capitalize text-xs`}>{displayDomain.replace(/_/g, ' ')}</Badge>
            </div>
          </div>
          {canManageProject && (
            <AdminActions project={project} onStatusChange={onStatusChange} onDelete={onDelete} />
          )}
        </CardHeader>

        <CardContent className="flex-1 flex flex-col gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-sm text-gray-600 line-clamp-2 h-10">
                  {project.description || "No description provided."}
                </p>
              </TooltipTrigger>
              <TooltipContent><p className="max-w-xs">{project.description}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Research Terminology Row - Always Visible When Toggle ON */}
          {showResearchTerms && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <TermBadge term="Chaos Core" showTooltip={true} />
              <TermBadge term="Attractor" showTooltip={true} />
              <span className="text-gray-500 max-w-[120px] truncate" title={project.attractor_label || "— (demo)"}>
                {project.attractor_label || "— (demo)"}
              </span>
              <TermBadge term="Chaotic Oscillator" showTooltip={true} />
              <span className="text-gray-500 max-w-[120px] truncate" title={project.oscillator_label || "— (demo)"}>
                {project.oscillator_label || "— (demo)"}
              </span>
              <TermBadge term="Orchestrator" showTooltip={true} />
            </div>
          )}

          {hasMetrics ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <MiniMetric
                icon={<Play className="h-4 w-4 text-blue-500" />}
                value={metrics?.total_runs ?? '—'}
                label="Total Runs"
              />
              <MiniMetric
                icon={<LineChart className="h-4 w-4 text-green-500" />}
                value={metrics?.avg_stability != null ? `${(metrics.avg_stability * 100).toFixed(1)}%` : '—'}
                label="Avg Stability"
              />
              <MiniMetric
                icon={<Zap className="h-4 w-4 text-purple-500" />}
                value={metrics?.actions ?? '—'}
                label="Actions"
              />
               <MiniMetric
                icon={<Clock className="h-4 w-4 text-gray-500" />}
                value={safeFormatDate(metrics?.last_run_at, 'relative')}
                label="Last Run"
                time={metrics?.last_run_at ? safeFormatDate(metrics.last_run_at, 'full') : ''}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 opacity-50">
              <div className="flex items-center gap-1.5 text-sm text-gray-400">
                <Play className="h-4 w-4" />
                <span>—</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-400">
                <LineChart className="h-4 w-4" />
                <span>—</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-400">
                <Zap className="h-4 w-4" />
                <span>—</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-400">
                <Clock className="h-4 w-4" />
                <span>—</span>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 mt-auto pt-2">
            Updated {safeFormatDate(project.updated_date, 'relative')}
            {hasMetrics ? (
              showDebug && metrics?.debug && (
                <p className="text-blue-600 font-mono mt-1" title={JSON.stringify(metrics.debug)}>
                  {metrics.debug.forceRead ? `[FR] r:${metrics.debug.rawRunCount} a:${metrics.debug.rawActionCount}` : `rows:${metrics.total_runs ?? 'N/A'}`}
                </p>
              )
            ) : (
              <p className="text-blue-600 mt-1">Click "Load Metrics" to see stats</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 border-t bg-gray-50/50">
          <div className="flex flex-wrap items-center gap-2">
             <Button asChild size="sm" variant="outline">
                <Link to={createPageUrl(`dashboard?projectId=${project.id}`)}>
                  <Eye className="mr-2 h-4 w-4" /> Dashboard
                </Link>
             </Button>
             <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block">
                    <Button 
                      size="sm" 
                      className="bg-indigo-600 hover:bg-indigo-700" 
                      disabled={!canRun || !project.id}
                      onClick={handleNewRunClick}
                      aria-label="Create new decision run"
                    >
                        <Play className="mr-2 h-4 w-4" /> New Run
                    </Button>
                  </span>
                </TooltipTrigger>
                {!canRun && <TooltipContent><p>Project must be active to start a new run.</p></TooltipContent>}
              </Tooltip>
             </TooltipProvider>
          </div>
        </CardFooter>
      </Card>

      {showNewRunDialog && (
        <NewRunDialog
          open={showNewRunDialog}
          onOpenChange={setShowNewRunDialog}
          onRunCreated={(runId) => {
            setShowNewRunDialog(false);
            // Navigate to the run detail page after creation
            window.location.href = createPageUrl(`run-detail?id=${runId}`);
          }}
          scopedProjectId={project.id}
        />
      )}
    </>
  );
}
