import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Project } from '@/api/entities';
import ObjectiveWeightsEditor from './ObjectiveWeightsCard';
import { ChevronUp, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ScrollNavigationHandle = ({ containerRef }) => {
  const [showHandle, setShowHandle] = useState(false);

  useEffect(() => {
    const checkIfScrollNeeded = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const needsScroll = container.scrollHeight > container.clientHeight;
        setShowHandle(needsScroll);
      }
    };

    checkIfScrollNeeded();
    window.addEventListener('resize', checkIfScrollNeeded);
    
    return () => window.removeEventListener('resize', checkIfScrollNeeded);
  }, [containerRef]);

  const scrollUp = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' });
    }
  };

  const scrollDown = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  if (!showHandle) return null;

  return (
    <div className="scroll-handle flex flex-col gap-1 bg-white border rounded-lg shadow-lg p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={scrollToTop}
        className="h-10 w-10 p-0"
        aria-label="Scroll to top"
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={scrollUp}
        className="h-10 w-10 p-0"
        aria-label="Scroll up"
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={scrollDown}
        className="h-10 w-10 p-0"
        aria-label="Scroll down"
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={scrollToBottom}
        className="h-10 w-10 p-0"
        aria-label="Scroll to bottom"
      >
        <ArrowDown className="h-4 w-4" />
      </Button>
    </div>
  );
};

const ObjectiveWeightsGuidance = ({ currentWeights, onWeightsChange }) => {
  const { toast } = useToast();

  const normalizeWeights = (weights) => {
    const sum = weights.time + weights.cost + weights.reliability;
    if (sum === 0) return weights;
    return {
      time: weights.time / sum,
      cost: weights.cost / sum,
      reliability: weights.reliability / sum
    };
  };

  const applyPreset = (preset) => {
    const normalized = normalizeWeights(preset);
    onWeightsChange(normalized);
    toast({ title: "Weights Updated", description: "Objective weights have been applied and normalized." });
  };

  const presets = [
    { name: "Fastest Response", weights: { time: 0.7, cost: 0.1, reliability: 0.2 } },
    { name: "Cost-Sensitive", weights: { time: 0.2, cost: 0.6, reliability: 0.2 } },
    { name: "High Reliability", weights: { time: 0.2, cost: 0.1, reliability: 0.7 } },
    { name: "Balanced", weights: { time: 0.4, cost: 0.3, reliability: 0.3 } }
  ];

  const getInterpretation = (weights) => {
    const highest = Math.max(weights.time, weights.cost, weights.reliability);
    if (weights.time === highest) return "prioritizes faster outcomes";
    if (weights.cost === highest) return "emphasizes cost efficiency";
    return "focuses on reliability";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">How to Read Your Current Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <code className="text-sm font-mono">
            {JSON.stringify({
              time: Math.round(currentWeights.time * 100) / 100,
              cost: Math.round(currentWeights.cost * 100) / 100,
              reliability: Math.round(currentWeights.reliability * 100) / 100
            })}
          </code>
        </div>
        
        <div className="text-sm space-y-1">
          <p>• <strong>Time ({(currentWeights.time * 100).toFixed(0)}%)</strong>: {getInterpretation({ time: currentWeights.time, cost: 0, reliability: 0 })}</p>
          <p>• <strong>Cost ({(currentWeights.cost * 100).toFixed(0)}%)</strong>: {currentWeights.cost > currentWeights.time && currentWeights.cost > currentWeights.reliability ? "primary" : "secondary"} emphasis on cost control</p>
          <p>• <strong>Reliability ({(currentWeights.reliability * 100).toFixed(0)}%)</strong>: {currentWeights.reliability > currentWeights.time && currentWeights.reliability > currentWeights.cost ? "primary" : "secondary"} weight on stability</p>
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">Quick Presets</Label>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <Badge
                key={preset.name}
                variant="outline"
                className="cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                onClick={() => applyPreset(preset.weights)}
              >
                {preset.name}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const NewProjectDialog = ({ open, onOpenChange, onProjectCreated }) => {
  const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset, setValue, watch } = useForm({
    defaultValues: {
      name: '',
      description: '',
      domain: 'supply_chain',
      objective_weights: { time: 0.34, cost: 0.33, reliability: 0.33 }
    }
  });
  const { toast } = useToast();
  const scrollContainerRef = useRef(null);

  const currentWeights = watch('objective_weights');

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        status: 'draft',
      };
      await Project.create(payload);
      toast({ title: "Project Created", description: `${data.name} has been created as a draft.` });
      if (onProjectCreated) onProjectCreated();
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error("Failed to create project:", error);
      toast({ title: "Error", description: error.message || "Could not create the project.", variant: "destructive" });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) reset();
      }}>
        <DialogContent className="sm:max-w-[625px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              A project contains your decision runs and related data.
            </DialogDescription>
          </DialogHeader>
          
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input id="name" {...register("name", { required: "Project name is required" })} />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  {...register("description")} 
                  placeholder="A brief description of the project's goals."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Controller
                  name="domain"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a domain" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="supply_chain">Supply Chain</SelectItem>
                        <SelectItem value="bpo_support">BPO & Support</SelectItem>
                        <SelectItem value="it_ops">IT Operations</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              
              <Controller
                name="objective_weights"
                control={control}
                render={({ field }) => (
                  <ObjectiveWeightsEditor
                    initialWeights={field.value}
                    onWeightsChange={(newWeights) => setValue('objective_weights', newWeights, { shouldDirty: true })}
                  />
                )}
              />

              <ObjectiveWeightsGuidance 
                currentWeights={currentWeights}
                onWeightsChange={(newWeights) => setValue('objective_weights', newWeights, { shouldDirty: true })}
              />

              <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)} type="button">Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Project'}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
      
      <ScrollNavigationHandle containerRef={scrollContainerRef} />
    </>
  );
};