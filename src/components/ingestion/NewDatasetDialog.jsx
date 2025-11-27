
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useProjects } from "../portal/useProjectsContext"; // Corrected import
import { Dataset } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Upload } from 'lucide-react';
import { IngestionRun } from '@/api/entities';

export const NewDatasetDialog = ({ open, onOpenChange, onDatasetCreated }) => {
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const { projects, activeProjectId } = useProjects(); // Corrected hook usage
  const selectedProject = activeProjectId ? projects.find(p => p.id === activeProjectId) : null;
  const { toast } = useToast();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv') {
        toast({ title: "Invalid File Type", description: "Please upload a CSV file.", variant: "destructive" });
        return;
      }
      setFile(selectedFile);
      if (!name) {
        setName(selectedFile.name.replace('.csv', ''));
      }
    }
  };

  const handleCreate = async () => {
    if (!name || !file || !selectedProject) {
      toast({ title: "Error", description: "Name and a CSV file are required.", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      const { file_url } = await UploadFile({ file });

      const newDataset = await Dataset.create({
        project_id: selectedProject.id,
        name,
        source_type: 'file_csv',
        status: 'processing',
        file_url,
      });

      toast({ title: "Dataset Created", description: `"${name}" is now being processed.` });
      
      onOpenChange(false);
      setName("");
      setFile(null);

      // Simulate processing and validation run
      setTimeout(async () => {
        await Dataset.update(newDataset.id, { status: 'ready' });
        await IngestionRun.create({
            dataset_id: newDataset.id,
            project_id: selectedProject.id,
            status: 'completed',
            rows_ingested: 100, // Mock value
            rows_failed: 0,
            completed_at: new Date().toISOString()
        });
        if (onDatasetCreated) onDatasetCreated();
      }, 3000);

    } catch (error) {
      console.error("Failed to create dataset:", error);
      toast({ title: "Creation Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Dataset</DialogTitle>
          <DialogDescription>
            Upload a CSV file to create a new dataset for your project.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">File</Label>
            <div className="col-span-3">
              <Button asChild variant="outline" className="w-full justify-start font-normal">
                <label htmlFor="file-upload">
                  <Upload className="mr-2 h-4 w-4" />
                  {file ? file.name : "Choose CSV file..."}
                </label>
              </Button>
              <Input id="file-upload" type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? "Creating..." : "Create Dataset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
