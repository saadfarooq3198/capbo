import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, Database, RefreshCw } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { createDemoRuns } from './dashboard/DemoDataSeeder';
import { useProject } from './ProjectProvider';
import { useRole } from './auth/RoleProvider';

export default function AdminDiagnosticsCard({ onDataRefresh }) {
  const [isSeeding, setIsSeeding] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { selectedProject } = useProject();
  const { effectiveRole } = useRole();
  const { toast } = useToast();

  if (effectiveRole !== 'admin') return null;

  const handleSeedDemo = async () => {
    if (!selectedProject) {
      toast({ title: "Error", description: "No project selected.", variant: "destructive" });
      return;
    }

    setIsSeeding(true);
    try {
      const result = await createDemoRuns(selectedProject, { 
        useProfile: true, 
        withActions: true,
        count: 2 
      });
      
      toast({ 
        title: "Demo Data Created", 
        description: `Inserted ${result.runs?.length || 2} demo runs with actions.` 
      });
      
      if (onDataRefresh) {
        setTimeout(onDataRefresh, 500);
      }
    } catch (error) {
      console.error("Demo seeding failed:", error);
      toast({ 
        title: "Seeding Failed", 
        description: "Could not create demo data.", 
        variant: "destructive" 
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onDataRefresh) {
        await onDataRefresh();
      }
      toast({ title: "Dashboard Refreshed", description: "Data has been reloaded." });
    } catch (error) {
      toast({ 
        title: "Refresh Failed", 
        description: "Could not refresh dashboard.", 
        variant: "destructive" 
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Card className="border-dashed border-2 border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Wrench className="h-4 w-4 text-amber-600" />
          Admin Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={handleSeedDemo}
            disabled={isSeeding || !selectedProject}
            variant="outline"
            size="sm"
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            <Database className="mr-2 h-4 w-4" />
            {isSeeding ? 'Seeding...' : 'Insert 2 Demo Runs'}
          </Button>
          <Button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}