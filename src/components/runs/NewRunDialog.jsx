import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useProjectsSafe } from "../portal/useProjectsContext"; // Use safe version
import { Dataset } from "@/api/entities";
import { DecisionRun } from "@/api/entities";
import { DecisionLog } from "@/api/entities";

// --- Helper Functions for Stability ---
const num = (x) => {
  if (x == null) return null;
  const s = (typeof x === 'string') ? x.replace('%', '').trim() : x;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return n > 1 && n <= 100 ? n / 100 : Math.max(0, Math.min(1, n));
};

const getStability = (resp, recs) => {
  const pick = (...xs) => xs.find(v => v !== undefined && v !== null);
  const d = pick(
    resp?.stability_score, resp?.stabilityScore,
    resp?.topline?.stability_score, resp?.topline?.stabilityScore,
    resp?.stability, resp?.metrics?.stability, resp?.summary?.stability
  );
  if (d != null) return num(d);
  
  const opts = Array.isArray(resp?.options) ? resp.options : (Array.isArray(recs) ? recs : []);
  if (!opts.length) return null;

  const bestId = pick(resp?.best_option, resp?.topline?.best_option);
  const best = opts.find(o => o?.id === bestId)?.score;
  const top = [...opts].sort((a, b) => (b?.score?.total ?? 0) - (a?.score?.total ?? 0))[0]?.score;
  
  return num(pick(best?.stability, best?.stability_score, top?.stability, top?.stability_score));
};
// --- End Helpers ---

export const NewRunDialog = ({ open, onOpenChange, onRunCreated, scopedProjectId = null }) => {
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState("");
  const [transientJson, setTransientJson] = useState('{}');
  const [isCreating, setIsCreating] = useState(false);
  const { projects, activeProjectId } = useProjectsSafe(); // Use safe version
  const { toast } = useToast();

  const effectiveProjectId = useMemo(() => scopedProjectId || activeProjectId, [scopedProjectId, activeProjectId]);
  const currentProject = useMemo(() => projects.find(p => p.id === effectiveProjectId), [projects, effectiveProjectId]);

  useEffect(() => {
    if (open && effectiveProjectId) {
      const loadDatasets = async () => {
        const projectDatasets = await Dataset.filter({ project_id: effectiveProjectId, status: "ready" });
        setDatasets(projectDatasets);
      };
      loadDatasets();
    }
  }, [open, effectiveProjectId]);

  const onSubmit = async (data) => {
    if (!currentProject) {
      toast({ title: "Error", description: "A project must be selected.", variant: "destructive" });
      return;
    }
    if (!selectedDataset) {
      toast({ title: "Error", description: "Please select a dataset.", variant: "destructive" });
      return;
    }
    let parsedJson;
    try {
      parsedJson = JSON.parse(transientJson);
    } catch (e) {
      toast({ title: "Invalid JSON", description: "The transient data is not valid JSON.", variant: "destructive" });
      return;
    }

    setIsCreating(true);

    // Data integrity guard: always set created_date when creating
    const now = new Date().toISOString();
    const newRun = await DecisionRun.create({
      project_id: effectiveProjectId, // Use effectiveProjectId here
      status: 'running',
      inputs: {
        signal_sources: [
          { type: 'dataset', dataset_id: selectedDataset },
          { type: 'transient', payload: parsedJson }
        ],
      },
      start_time: now,
      created_date: now // Data integrity: always set created_date
    });
    
    await DecisionLog.create({
        decision_run_id: newRun.id,
        level: 'INFO',
        message: `Run ${newRun.id.substring(0,8)} started by user.`,
        ts: now
    });

    toast({ title: "Run Started", description: `Decision run ${newRun.id.substring(0,8)} is now running.` });
    onOpenChange(false);

    setTimeout(async () => {
      const isSuccess = Math.random() > 0.1;
      const completionTime = new Date().toISOString();

      if (isSuccess) {
        const mockApiResponse = {
          stability_score: Math.random() * 0.4 + 0.6,
          best_option: `option_${['A', 'B', 'C'][Math.floor(Math.random() * 3)]}`,
          lyapunov: (Math.random() * 1.2 + 0.1).toString(),
          attractor_id: `attractor_${Math.floor(Math.random() * 10)}`,
          options: [
            { id: 'option_A', score: { total: 85.5, stability: 0.82, time: 10, cost: 500 } },
            { id: 'option_B', score: { total: 72.1, stability: 0.65, time: 15, cost: 300 } }
          ]
        };

        const stabilityScore = getStability(mockApiResponse, mockApiResponse.options);
        
        const pick = (...xs) => xs.find(v => v !== undefined && v !== null);
        const bestOptId = pick(mockApiResponse?.best_option, mockApiResponse?.topline?.best_option);
        const lyap = num(pick(mockApiResponse?.lyapunov, mockApiResponse?.topline?.lyapunov));
        const attractor = pick(mockApiResponse?.attractor_id, mockApiResponse?.topline?.attractor_id);

        const mockTopline = {
          stability_score: stabilityScore,
          lyapunov: lyap,
          attractor_id: attractor,
          best_option: bestOptId
        };
        
        // Data integrity guard: always set completed_at for completed/failed runs
        await DecisionRun.update(newRun.id, {
          status: 'completed',
          topline: mockTopline,
          recommendations: mockApiResponse.options,
          raw_response: mockApiResponse,
          end_time: completionTime,
          completed_at: completionTime // Data integrity: always set completed_at
        });

        if (stabilityScore === null) {
          await DecisionLog.create({
            decision_run_id: newRun.id,
            level: 'WARN',
            message: `no_stability_in_response: Run ${newRun.id.substring(0,8)} completed without valid stability_score.`,
            ts: completionTime
          });
        }
        
        if (onRunCreated) onRunCreated(newRun.id);

      } else {
        // Data integrity guard: always set completed_at for failed runs too
        await DecisionRun.update(newRun.id, {
          status: 'failed',
          raw_response: { "error": "Mocked failure: Solver timed out." },
          end_time: completionTime,
          completed_at: completionTime // Data integrity: always set completed_at
        });
        await DecisionLog.create({
            decision_run_id: newRun.id,
            level: 'ERROR',
            message: `Run ${newRun.id.substring(0,8)} failed. Mocked failure: Solver timed out.`,
            ts: completionTime
        });
      }
    }, 5000);
    
    setIsCreating(false);
    setSelectedDataset("");
    setTransientJson("{}");
  };

  const handleRun = () => onSubmit();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>New Decision Run</DialogTitle>
          <DialogDescription>
            Configure and start a new decision run for project: {currentProject?.name || "..."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dataset" className="text-right">
              Dataset
            </Label>
            <div className="col-span-3">
              <Select onValueChange={setSelectedDataset} value={selectedDataset}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a ready dataset..." />
                </SelectTrigger>
                <SelectContent>
                  {datasets.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="transient-json" className="text-right pt-2">
              Transient JSON
            </Label>
            <Textarea
              id="transient-json"
              value={transientJson}
              onChange={e => setTransientJson(e.target.value)}
              className="col-span-3 h-40 font-mono"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleRun} disabled={isCreating || !currentProject || !selectedDataset}>
            {isCreating ? 'Starting...' : 'Run CABPOE'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};