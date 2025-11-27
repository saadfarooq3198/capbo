import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Upload, Database, Settings } from 'lucide-react';
import { useProjects } from '@/components/portal/useProjectsContext';
import { Dataset } from '@/api/entities';
import { NewDatasetDialog } from '@/components/ingestion/NewDatasetDialog';
import DatasetCard from '@/components/ingestion/DatasetCard';
import { useRole } from '@/components/auth/RoleProvider';
import { can } from '@/components/auth/permissions';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function DataIngestionContent() {
  const { activeProjectId } = useProjects();
  const { effectiveRole } = useRole();
  const [datasets, setDatasets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewDatasetOpen, setIsNewDatasetOpen] = useState(false);

  const loadDatasets = useCallback(async () => {
    if (!activeProjectId) {
        setDatasets([]);
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
      const projectDatasets = await Dataset.filter({ project_id: activeProjectId });
      setDatasets(projectDatasets);
    } catch (error) {
      console.error("Failed to load datasets:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeProjectId]);

  useEffect(() => {
    loadDatasets();
  }, [loadDatasets]);
  
  const canCreateDataset = can(effectiveRole, 'dataset:create');

  if (!activeProjectId) {
    return (
      <Card className="text-center py-12">
        <CardHeader>
          <CardTitle>No Project Selected</CardTitle>
          <CardDescription>Please select a project from the header to manage its data sources.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Data Ingestion</h1>
        {canCreateDataset && (
            <Button onClick={() => setIsNewDatasetOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> New Data Source
            </Button>
        )}
      </div>
      
      {isLoading ? (
        <p>Loading data sources...</p>
      ) : datasets.length === 0 ? (
        <Card className="text-center py-20">
          <Database className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-6 text-xl font-semibold">No Data Sources Configured</h2>
          <p className="mt-2 text-sm text-gray-500">
            {canCreateDataset ? 'Get started by creating a new data source.' : 'This project does not have any data sources yet.'}
          </p>
          {canCreateDataset && (
            <div className="mt-6">
                <Button onClick={() => setIsNewDatasetOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Data Source
                </Button>
            </div>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {datasets.map(dataset => (
            <DatasetCard key={dataset.id} dataset={dataset} onUpdate={loadDatasets} />
          ))}
        </div>
      )}

      {canCreateDataset && (
        <NewDatasetDialog 
            open={isNewDatasetOpen}
            onOpenChange={setIsNewDatasetOpen}
            onDatasetCreated={loadDatasets}
        />
      )}

      {effectiveRole === 'admin' && (
         <Card className="mt-8">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Admin: Ingestion Settings
                </CardTitle>
                <CardDescription>Configure global data ingestion settings and connectors.</CardDescription>
            </CardHeader>
            <CardContent>
                <Link to={createPageUrl('settings?section=datasources')}>
                    <Button variant="outline">Go to Ingestion Settings</Button>
                </Link>
            </CardContent>
        </Card>
      )}
    </div>
  );
}