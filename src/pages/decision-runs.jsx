
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Play, CheckCircle, XCircle, Clock, ChevronRight, Settings, AlertTriangle } from 'lucide-react';
import { useProjectsSafe } from '@/components/portal/useProjectsContext';
import { NewRunDialog } from '@/components/runs/NewRunDialog';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { useRole } from '@/components/auth/RoleProvider';
import { can } from '@/components/auth/permissions';
import { subDays } from 'date-fns';
import { TermBadge } from '@/components/ui/TermBadge';
import { listDecisionRuns } from '@/components/data/metricsService';
import { useToast } from "@/components/ui/use-toast";

const statusInfo = {
  completed: { icon: <CheckCircle className="h-5 w-5 text-green-500" />, color: "bg-green-100 text-green-800" },
  running: { icon: <Play className="h-5 w-5 text-blue-500 animate-pulse" />, color: "bg-blue-100 text-blue-800" },
  failed: { icon: <XCircle className="h-5 w-5 text-red-500" />, color: "bg-red-100 text-red-800" },
  queued: { icon: <Clock className="h-5 w-5 text-gray-500" />, color: "bg-gray-100 text-gray-800" },
};

const RunRow = ({ run, showResearchTerms }) => {
  const location = useLocation();
  const shortId = run.id.substring(0, 10);
  const status = statusInfo[run.status] || statusInfo.queued;
  
  const completedTs = run.completed_at || run.created_date;
  let displayDate = "Invalid Date";
  if (completedTs) {
      try {
          displayDate = new Date(completedTs).toLocaleString('en-GB', {
              timeZone: 'Europe/London',
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          });
      } catch (e) {
          console.warn(`Invalid date for run ${run.id}: ${completedTs}`);
      }
  }

  const stabilityRaw = run.topline?.stability_score;
  const stabilityValue = typeof stabilityRaw === 'string' ? parseFloat(stabilityRaw) : stabilityRaw;
  const stabilityLabel = typeof stabilityValue === 'number' && !isNaN(stabilityValue)
    ? `${(stabilityValue * 100).toFixed(1)}%`
    : "—";

  const attractorId = run.topline?.attractor_id || "—";
  const lyapunovValue = run.topline?.lyapunov || "—";

  return (
    <Link 
      to={createPageUrl(`run-detail?id=${run.id}${location.search}`)}
      state={{
        from: "runs",
        scrollY: window.scrollY,
        queryString: location.search,
      }}
      className="block group"
    >
      <Card className="hover:bg-gray-50/50 hover:shadow-sm transition-all duration-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-12 items-center gap-4">
            <div className="col-span-6 md:col-span-5 flex items-center gap-4">
              {status.icon}
              <div>
                <p className="font-mono font-medium text-gray-800 group-hover:text-indigo-600 transition-colors">
                  {shortId}...
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-sm text-gray-500 cursor-help">
                      Completed: {displayDate}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>UTC: {completedTs ? new Date(completedTs).toISOString() : 'N/A'}</p>
                    <p>London Time</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            <div className="col-span-3 md:col-span-3 flex justify-center">
              <Badge variant="outline" className="text-sm">
                  Stability: {stabilityLabel}
              </Badge>
            </div>
            <div className="col-span-3 md:col-span-3 flex justify-center">
              <Badge className={`${status.color} capitalize`}>{run.status}</Badge>
            </div>
            <div className="hidden md:flex col-span-1 justify-end">
              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
          
          {/* Research terminology meta line */}
          {showResearchTerms && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1">
                <TermBadge term="Attractor" showTooltip={false} />
                <span className="text-gray-600">{attractorId.length > 10 ? `${attractorId.substring(0,10)}...` : attractorId}</span>
              </div>
              <div className="flex items-center gap-1">
                <TermBadge term="Lyapunov" showTooltip={false} />
                <span className="text-gray-600">{lyapunovValue}</span>
              </div>
              <div className="flex items-center gap-1">
                <TermBadge term="Chaotic Oscillator" showTooltip={false} />
                <span className="text-gray-600">—</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

export default function DecisionRunsContent() {
  const { activeProjectId } = useProjectsSafe();
  const [runs, setRuns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isNewRunOpen, setIsNewRunOpen] = useState(false);
  const { effectiveRole } = useRole();
  const { toast } = useToast();
  
  const [timeFilter, setTimeFilter] = useState('90d');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showInvalid, setShowInvalid] = useState(false);

  const location = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const isForceRead = localStorage.getItem('FORCE_READ') === '1';
  const showDebug = urlParams.get('debug') === '1';

  const loadRuns = useCallback(async () => {
    setIsLoading(true);
    try {
      let from = null;
      let to = null;

      if (!isForceRead) {
        const now = new Date(); // Local date/time
        if (timeFilter === '7d') {
          from = subDays(now, 7);
        } else if (timeFilter === '30d') {
          from = subDays(now, 30);
        } else if (timeFilter === '90d') {
          from = subDays(now, 90);
        } else if (timeFilter === 'all') {
          from = null; // Explicitly null for all time
        }
        to = now; // End date is current moment
      }
      
      const fetchedRuns = await listDecisionRuns({ 
        projectId: activeProjectId, 
        from, 
        to,
        limit: 1000 
      });
      
      console.log('[CABPOE] Decision runs loaded:', fetchedRuns.length, 'for project:', activeProjectId);
      setRuns(fetchedRuns);
      
    } catch (error) {
      console.error("Failed to load runs", error);
      toast({
        title: "Load Failed",
        description: `Could not load decision runs: ${error.message}`,
        variant: "destructive",
      });
      setRuns([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeProjectId, timeFilter, toast, isForceRead]);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  // Restore scroll position when returning from run detail
  useEffect(() => {
    const scrollY = location.state?.scrollY;
    if (typeof scrollY === 'number') {
      requestAnimationFrame(() => window.scrollTo(0, scrollY));
    }
  }, [location.state]);

  const { cleanedRuns, invalidRunsCount } = useMemo(() => {
    const seenIds = new Set();
    const validRuns = [];
    const invalidRuns = [];

    // Separate valid and invalid runs based on timestamp validity
    runs.forEach(run => {
        const completedTs = run.completed_at || run.created_date;
        const dateObj = new Date(completedTs);
        if (isNaN(dateObj.getTime()) || dateObj.getTime() < new Date("1971-01-01T00:00:00Z").getTime()) {
            invalidRuns.push(run);
        } else {
            validRuns.push(run);
        }
    });
    
    let filteredValidRuns = validRuns
      .filter(run => {
        // Filter by status
        if (statusFilter !== 'all' && run.status !== statusFilter) return false;
        
        // Time filtering is now handled by the metricsService, so remove it here
        return true;
      })
      .sort((a, b) => {
          // Sort by completion/creation date, newest first
          const timeA = new Date(a.completed_at || a.created_date).getTime();
          const timeB = new Date(b.completed_at || b.created_date).getTime();
          return timeB - timeA;
      })
      .filter(run => {
          // Remove duplicates
          if (seenIds.has(run.id)) return false;
          seenIds.add(run.id);
          return true;
      });

    return { 
        cleanedRuns: showInvalid ? [...filteredValidRuns, ...invalidRuns] : filteredValidRuns,
        invalidRunsCount: invalidRuns.length
    };
  }, [runs, statusFilter, showInvalid]);
  
  const canCreateRun = can(effectiveRole, 'runs', 'create');
  const showResearchTerms = true;

  const timeFilterLabel = {
    '7d': 'last 7 days',
    '30d': 'last 30 days',
    '90d': 'last 90 days',
    'all': 'all time',
  };
  const pageTitle = isForceRead ? "Raw History (Admin)" : (activeProjectId ? 'Decision Runs' : 'All Decision Runs');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{pageTitle}</h1>
        <div className="flex items-center gap-4">
          {showDebug && (
            <div className="text-xs bg-yellow-100 px-2 py-1 rounded border">
              Debug: FORCE_READ={isForceRead ? 'ON' : 'OFF'} (env: prod)
            </div>
          )}
          {!isForceRead && (
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          )}
          {canCreateRun && (
            <Button onClick={() => setIsNewRunOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> New Run
            </Button>
          )}
        </div>
      </div>
      
      {!isForceRead && (
        <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="queued">Queued</SelectItem>
              </SelectContent>
          </Select>
          {effectiveRole === 'admin' && invalidRunsCount > 0 && (
            <div className="flex items-center space-x-2">
                <Checkbox id="show-invalid" checked={showInvalid} onCheckedChange={setShowInvalid} />
                <label htmlFor="show-invalid" className="text-sm font-medium leading-none text-gray-600">
                    Show {invalidRunsCount} invalid runs
                </label>
            </div>
          )}
        </div>
      )}

      {isLoading && cleanedRuns.length === 0 ? (
        <p>Loading runs...</p>
      ) : cleanedRuns.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <CardTitle>No Decision Runs Found</CardTitle>
            <CardDescription>
                {isForceRead ? "FORCE_READ returned no raw data. Check RLS/Connection." : `No runs match your filters for ${timeFilterLabel[timeFilter]}.`}
            </CardDescription>
          </CardHeader>
           <CardContent className="space-y-4">
             {canCreateRun && (
                <Button onClick={() => setIsNewRunOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Start a New Run
                </Button>
             )}
            {effectiveRole === 'admin' && (
                <p className="text-sm text-gray-500">
                    Need demo data?{' '}
                    <Link to={createPageUrl('settings?section=diagnostics')} className="text-indigo-600 hover:underline">
                        Open Admin Diagnostics
                    </Link>
                </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {cleanedRuns.map(run => <RunRow key={run.id} run={run} showResearchTerms={showResearchTerms} />)}
        </div>
      )}

      {invalidRunsCount > 0 && !showInvalid && (
         <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <p className="text-sm text-amber-800">
                {invalidRunsCount} run(s) with missing or invalid timestamps are hidden.
                {effectiveRole === 'admin' ? " Use the toggle to show them." : " Contact an admin for details."}
            </p>
         </div>
      )}

      {canCreateRun && (
        <NewRunDialog
          open={isNewRunOpen}
          onOpenChange={setIsNewRunOpen}
          onRunCreated={loadRuns}
        />
      )}
    </div>
  );
}
