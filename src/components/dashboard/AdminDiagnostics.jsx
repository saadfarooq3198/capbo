
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronDown, ChevronRight, TestTube2, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import DemoDataSeeder from './DemoDataSeeder';
import { useRole } from '../auth/RoleProvider';
import { can } from '../auth/permissions';

export default function AdminDiagnostics({ 
  runs, 
  selectedProject,
  allProjects,
  onDataSeeded,
  isLoading 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showRawData, setShowRawData] = useState(false);
  const { effectiveRole } = useRole();

  if (!can(effectiveRole, 'org:diagnostics')) {
    return null;
  }

  return (
    <Card className="border-dashed border-amber-300 bg-amber-50/50" data-admin-diagnostics>
      <Alert className="mb-4 border-amber-200 bg-amber-50">
        <Shield className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Admin Tools</strong> — This section is only visible to administrators and contains development/demo controls.
        </AlertDescription>
      </Alert>
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-amber-100/50 transition-colors rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-amber-900">
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <TestTube2 className="h-5 w-5" />
              Admin Diagnostics
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            {/* Demo Data Management */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-amber-900">Demo Data Management</h4>
              <p className="text-xs text-amber-700 mb-3">
                All demo controls are consolidated here. Auto-seeding occurs when projects are empty.
              </p>
              <DemoDataSeeder
                selectedProject={selectedProject}
                allProjects={allProjects}
                onDataSeeded={onDataSeeded}
                showAllProjectsButton={true}
                showInsertDemo={true}
                showClearDemo={true}
              />
            </div>
            
            {/* Raw Data Viewer - Collapsible */}
            <Collapsible open={showRawData} onOpenChange={setShowRawData}>
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 text-sm font-medium text-amber-700 hover:text-amber-900 transition-colors">
                  {showRawData ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  Raw Data Viewer ({runs.length} runs)
                </button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-3">
                <div className="bg-white rounded-lg border border-amber-200">
                  <div className="p-3 border-b bg-amber-50/50 rounded-t-lg">
                    <h5 className="text-sm font-semibold text-amber-900">Last 20 Runs (Development View)</h5>
                    <p className="text-xs text-amber-700 mt-1">Technical data for debugging purposes</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {isLoading ? (
                      <div className="p-4 space-y-2">
                        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                      </div>
                    ) : runs.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No runs found for current project
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {runs.map(run => (
                          <div key={run.id} className="p-3 hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start text-xs">
                              <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-medium truncate">{run.id.substring(0, 12)}...</span>
                                  {run.meta?.is_demo && (
                                    <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded text-xs font-medium">
                                      DEMO
                                    </span>
                                  )}
                                  {run.meta?.profile && (
                                    <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs">
                                      {run.meta.profile}
                                    </span>
                                  )}
                                </div>
                                <div className="text-gray-500">
                                  {format(new Date(run.created_date), 'MMM d, HH:mm')} • Status: {run.status}
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <div className="font-mono font-semibold">
                                  {run.topline?.stability_score ? 
                                    (run.topline.stability_score * 100).toFixed(1) + '%' : 
                                    'N/A'
                                  }
                                </div>
                                <div className="text-gray-400 text-xs">
                                  {typeof (run.topline?.stability_score) !== 'undefined' ? 
                                    typeof (run.topline.stability_score) : 
                                    'undefined'
                                  }
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
