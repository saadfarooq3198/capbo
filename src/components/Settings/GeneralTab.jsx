import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useProject } from '../ProjectProvider';
import { useRole } from '../auth/RoleProvider';
import { can } from '../auth/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Project } from '@/api/entities';
import { Save, Loader2 } from 'lucide-react';

export default function GeneralTab() {
  const { effectiveRole } = useRole();
  const { selectedProject, refreshProjects } = useProject();
  const [localProject, setLocalProject] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedProject) {
      setLocalProject({ 
        ...selectedProject,
        // Add default research settings if not present
        oscillator_label: selectedProject.oscillator_label || 'Lorenz (demo)',
        show_research_terminology: selectedProject.show_research_terminology !== false, // default ON
      });
      setHasChanges(false);
    }
  }, [selectedProject]);

  const canEdit = can(effectiveRole, 'project:update');

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setLocalProject(prev => ({ ...prev, [id]: value }));
    setHasChanges(true);
  };
  
  const handleSelectChange = (field, value) => {
      setLocalProject(prev => ({ ...prev, [field]: value }));
      setHasChanges(true);
  };

  const handleSwitchChange = (field, checked) => {
      setLocalProject(prev => ({ ...prev, [field]: checked }));
      setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Project.update(localProject.id, {
        name: localProject.name,
        description: localProject.description,
        status: localProject.status,
        oscillator_label: localProject.oscillator_label,
        show_research_terminology: localProject.show_research_terminology,
      });
      toast({ title: "Settings saved", description: "Project details have been updated." });
      refreshProjects();
      setHasChanges(false);
      
      // Trigger a global event to update terminology visibility
      window.dispatchEvent(new CustomEvent('researchTerminologyToggled', { 
        detail: { show: localProject.show_research_terminology } 
      }));
    } catch (error) {
      toast({ title: "Couldn't save", description: "Please check the fields and try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedProject) {
    return (
        <Card>
            <CardContent className="pt-6">
                <p className="text-gray-500">Please select a project to view its settings.</p>
            </CardContent>
        </Card>
    );
  }

  const lastUpdated = selectedProject.updated_date ? 
    new Date(selectedProject.updated_date).toLocaleString('en-GB', { 
        timeZone: 'Europe/London', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : 'N/A';
  const lastUpdatedISO = selectedProject.updated_date ? new Date(selectedProject.updated_date).toISOString() : '';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>
            Manage the name, description, and status of the current project.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input id="name" value={localProject?.name || ''} onChange={handleInputChange} disabled={!canEdit} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={localProject?.description || ''} onChange={handleInputChange} disabled={!canEdit} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={localProject?.status || ''} onValueChange={(val) => handleSelectChange('status', val)} disabled={!canEdit}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select status..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Research Settings</CardTitle>
          <CardDescription>
            Configure how research terminology appears in the console.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="oscillator_label">Oscillator Label</Label>
                <Input 
                    id="oscillator_label" 
                    value={localProject?.oscillator_label || ''} 
                    onChange={handleInputChange} 
                    disabled={!canEdit}
                    placeholder="e.g., Lorenz (demo), Rössler, Custom"
                />
                <p className="text-sm text-gray-500">Used for display only on run pages and insights.</p>
            </div>
            
            <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                    <Label>Show Research Terminology Badges</Label>
                    <p className="text-sm text-gray-500">
                        Display Chaos Core, Attractor, Lyapunov, and other research terms throughout the console.
                    </p>
                </div>
                <Switch
                    checked={localProject?.show_research_terminology}
                    onCheckedChange={(checked) => handleSwitchChange('show_research_terminology', checked)}
                    disabled={!canEdit}
                />
            </div>
        </CardContent>
      </Card>
      
      {canEdit && (
         <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500" title={lastUpdatedISO}>Last updated: {lastUpdated}</p>
            {hasChanges && (
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            )}
        </div>
      )}
    </div>
  );
}