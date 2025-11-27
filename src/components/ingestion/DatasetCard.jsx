
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, CheckCircle, XCircle, ChevronDown, Play, FileSearch } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from "@/components/ui/use-toast";
import { IngestionRun } from '@/api/entities';
import { useProjects } from '../portal/useProjectsContext'; // Corrected import
import { useRole } from '../auth/RoleProvider';
import { can } from '../auth/permissions';
import { TermBadge } from '../ui/TermBadge';

const statusInfo = {
  ready: { icon: <CheckCircle className="h-4 w-4 text-green-500" />, color: "bg-green-100 text-green-800", label: "Ready" },
  processing: { icon: <Clock className="h-4 w-4 text-blue-500 animate-spin" />, color: "bg-blue-100 text-blue-800", label: "Processing" },
  ingesting: { icon: <Clock className="h-4 w-4 text-blue-500 animate-spin" />, color: "bg-blue-100 text-blue-800", label: "Ingesting" },
  error: { icon: <XCircle className="h-4 w-4 text-red-500" />, color: "bg-red-100 text-red-800", label: "Error" },
  draft: { icon: <FileText className="h-4 w-4 text-gray-500" />, color: "bg-gray-100 text-gray-800", label: "Draft" },
};

const formatRelativeTime = (isoDate) => {
    if (!isoDate) return 'never';
    const now = new Date();
    const date = new Date(isoDate);
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};

const Metric = ({ label, value }) => (
    <div className="space-y-1">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold">{value}</p>
    </div>
);

export default function DatasetCard({ dataset, metrics, refreshData }) {
    const { projects, activeProjectId } = useProjects(); // Corrected hook usage
    const selectedProject = activeProjectId ? projects.find(p => p.id === activeProjectId) : null;
    const { toast } = useToast();
    const [isIngesting, setIsIngesting] = useState(false);
    const { effectiveRole } = useRole();

    const handleIngest = useCallback(async (isDemo = false) => {
        if (!selectedProject) {
            toast({ title: "Error", description: "Cannot ingest data, no project is selected.", variant: "destructive" });
            return;
        }

        setIsIngesting(true);
        try {
            await IngestionRun.create({
                dataset_id: dataset.id,
                project_id: selectedProject.id,
                status: 'running',
            });
            toast({ title: isDemo ? "Seeding Demo Data" : "Ingestion Started", description: "Processing will begin shortly." });

            setTimeout(async () => {
                await IngestionRun.create({
                    dataset_id: dataset.id,
                    project_id: selectedProject.id,
                    status: 'completed',
                    rows_ingested: 100,
                    rows_failed: 0,
                    completed_at: new Date().toISOString(),
                });
                if(refreshData) refreshData();
                setIsIngesting(false);
            }, 3000);

        } catch (e) {
            console.error("Ingestion failed to start:", e);
            toast({ title: "Error", description: "Could not start ingestion.", variant: "destructive" });
            setIsIngesting(false);
        }
    }, [dataset.id, selectedProject, toast, refreshData]);

    useEffect(() => {
        // Auto-seed demo data if dataset is empty
        if (metrics && metrics.total_runs === 0 && !dataset.meta?.is_demo_seeded) {
            handleIngest(true); // isDemo = true
        }
    }, [metrics, dataset, handleIngest]);
    
    const status = statusInfo[dataset.status] || statusInfo.draft;
    const sourceLabel = dataset.source_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    const canIngest = can(effectiveRole, 'dataset:ingestNow');
    const showResearchTerms = selectedProject?.show_research_terminology !== false;

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle className="flex justify-between items-start">
                    <span className="flex items-center gap-2 font-bold text-lg">{dataset.name}</span>
                    <Badge className={`${status.color} capitalize`}>{status.label}</Badge>
                </CardTitle>
                <CardDescription>Source: {sourceLabel}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Metric label="Rows (24h)" value={metrics?.rows_ingested_24h?.toLocaleString() || '0'} />
                    <Metric label="Error % (24h)" value={`${((metrics?.error_rate_24h || 0) * 100).toFixed(1)}%`} />
                    <Metric label="Last Run" value={formatRelativeTime(metrics?.last_run_at)} />
                    <Metric label="Last Updated" value={new Date(dataset.updated_date).toLocaleDateString()} />
                </div>

                {/* Research Terminology & Signal Quality Note */}
                {showResearchTerms && (
                    <div className="mt-3 border-t pt-3 text-xs text-gray-500">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <TermBadge term="Noise Handling" showTooltip={true} />
                            <TermBadge term="Chaos Core" showTooltip={true} />
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="font-medium">Signal Quality (demo):</span>
                            <span>Entropy: —</span>
                            <span>Fractal D: —</span>
                            <span className="hidden sm:inline">·</span>
                            <span>Source: Batch CSV; streaming optional</span>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="border-t p-4 flex justify-between">
                <Button variant="outline" size="sm" onClick={() => toast({title: "Coming Soon!", description: "Data preview will be available here."})}>
                    <FileSearch className="mr-2 h-4 w-4" /> Preview
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="sm">Actions <ChevronDown className="ml-2 h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleIngest()} disabled={isIngesting || !canIngest}>
                            <Play className="mr-2 h-4 w-4"/> {isIngesting ? "Ingesting..." : "Ingest Now"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast({title: "Coming Soon!", description: "Validation reports will be available here."})}>Validate</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast({title: "Coming Soon!", description: "Ingestion history will be available here."})}>History</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardFooter>
        </Card>
    );
}
