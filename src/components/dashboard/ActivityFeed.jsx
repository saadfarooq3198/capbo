import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { formatDistanceToNow, format } from 'date-fns';
import { CheckCircle2, AlertTriangle, Play, FileCog, Settings, ChevronDown, ChevronRight, Activity, Clock } from 'lucide-react';

const icons = {
  run_completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  run_failed: <AlertTriangle className="h-4 w-4 text-red-500" />,
  run_running: <Play className="h-4 w-4 text-blue-500 animate-pulse" />,
  action_executed: <FileCog className="h-4 w-4 text-slate-500" />,
};

const actionStatusIcons = {
  success: '✅',
  error: '❌', 
  executing: '⏳'
};

// Group activities by run
const groupActivitiesByRun = (activities) => {
  const grouped = {};
  
  activities.forEach(activity => {
    if (activity.type.startsWith('run_')) {
      if (!grouped[activity.run_id]) {
        grouped[activity.run_id] = {
          run: activity,
          actions: []
        };
      } else {
        grouped[activity.run_id].run = activity;
      }
    } else if (activity.type === 'action_executed') {
      if (!grouped[activity.run_id]) {
        grouped[activity.run_id] = {
          run: null,
          actions: [activity]
        };
      } else {
        grouped[activity.run_id].actions.push(activity);
      }
    }
  });
  
  return Object.values(grouped).sort((a, b) => 
    new Date(b.run?.date || b.actions[0]?.date) - new Date(a.run?.date || a.actions[0]?.date)
  );
};

const RunActivityItem = ({ runGroup }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { run, actions } = runGroup;
  const hasActions = actions.length > 0;
  
  if (!run && !hasActions) return null;

  const mainActivity = run || actions[0];
  const runId = run?.run_id || actions[0]?.run_id;

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <Link 
        to={createPageUrl(`run-detail?id=${runId}`)}
        className="block hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 p-3">
          {run ? icons[run.type] : <FileCog className="h-4 w-4 text-slate-500" />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium leading-none truncate">
                {run ? run.title : `Run ${runId.substring(0, 8)}`}
              </p>
              {hasActions && (
                <div className="flex items-center gap-1">
                  {actions.slice(0, 3).map((action, idx) => (
                    <span key={idx} className="text-xs">
                      {actionStatusIcons[action.title.toLowerCase().includes('success') ? 'success' : 
                                        action.title.toLowerCase().includes('error') ? 'error' : 'executing']}
                    </span>
                  ))}
                  {actions.length > 3 && (
                    <span className="text-xs text-gray-400">+{actions.length - 3}</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-500 truncate">
                {run ? run.description : `${actions.length} actions executed`}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                <span title={format(new Date(mainActivity.date), 'PPpp')}>
                  {formatDistanceToNow(new Date(mainActivity.date), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
      
      {hasActions && actions.length > 1 && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <button className="w-full px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span>{actions.length} actions</span>
              {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t border-gray-100 bg-gray-50">
            <div className="p-2 space-y-1">
              {actions.map((action, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-gray-600 py-1">
                  <span className="text-sm">
                    {actionStatusIcons[action.title.toLowerCase().includes('success') ? 'success' : 
                                      action.title.toLowerCase().includes('error') ? 'error' : 'executing']}
                  </span>
                  <span className="truncate">{action.title}</span>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

export default function ActivityFeed({ 
  activities, 
  isLoading, 
  currentProjectName, 
  user
}) {
  const groupedActivities = groupActivitiesByRun(activities);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-indigo-600" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Activity</h3>
            {user?.role === 'admin' ? (
              <div className="space-y-2">
                <p className="text-gray-500 text-sm">
                  No data for "{currentProjectName}" in the selected time range.
                </p>
                <button 
                  className="text-indigo-600 hover:underline text-sm inline-flex items-center gap-1"
                  onClick={(e) => {
                    e.preventDefault();
                    document.querySelector('[data-admin-diagnostics]')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <Settings className="h-3 w-3" />
                  Admin: manage demo data in Diagnostics
                </button>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                No recent runs in the last 24 hours. New runs will appear here automatically.
              </p>
            )}
          </div>
        ) : (
          <ScrollArea className="h-[320px] w-full pr-4">
            <div className="space-y-3">
              {groupedActivities.map((runGroup, index) => (
                <RunActivityItem key={index} runGroup={runGroup} />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}