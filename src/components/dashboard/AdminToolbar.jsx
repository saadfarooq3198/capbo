import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bot, TestTube2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from '@/components/ui/card';

const DiagnosticRun = ({ run }) => (
    <div className="flex justify-between items-center p-2 border-b">
        <p className="font-mono text-xs">{run.id}</p>
        <div>
            <span className="text-xs mr-2">Stability:</span>
            <span className="font-mono text-sm font-semibold">{run.topline?.stability_score ?? 'N/A'}</span>
        </div>
    </div>
)

export default function AdminToolbar({
  showDiagnostics,
  onShowDiagnosticsChange,
  onInsertDemoRun,
  isCreatingDemo,
  user,
  isLoading,
  diagnosticRuns
}) {
  if (isLoading) return <Skeleton className="h-10 w-full" />;
  if (user?.role !== 'admin') return null;

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-4 bg-slate-50 border-dashed">
        <CardContent className="p-4">
             <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                    <TestTube2 className="h-5 w-5 text-slate-600" />
                    <Label htmlFor="diagnostics-mode" className="font-semibold text-slate-700">Admin Diagnostics</Label>
                    <Switch
                        id="diagnostics-mode"
                        checked={showDiagnostics}
                        onCheckedChange={onShowDiagnosticsChange}
                    />
                </div>
                <Button onClick={onInsertDemoRun} disabled={isCreatingDemo} size="sm" variant="secondary">
                    <Bot className="mr-2 h-4 w-4" />
                    {isCreatingDemo ? 'Seeding...' : 'Insert Demo Run'}
                </Button>
            </div>
            {showDiagnostics && (
                <div className="mt-4 bg-white rounded-lg p-2 border max-h-48 overflow-y-auto">
                    <h4 className="text-sm font-semibold mb-2 px-2">Last 20 Runs (Raw Data)</h4>
                    {diagnosticRuns.map(run => <DiagnosticRun key={run.id} run={run}/>)}
                </div>
            )}
        </CardContent>
    </Card>
  );
}