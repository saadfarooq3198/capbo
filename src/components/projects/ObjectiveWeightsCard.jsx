import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Info, BarChartHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const normalize = (weights) => {
  const total = Object.values(weights).reduce((sum, v) => sum + v, 0);
  if (total === 0) return weights;
  return Object.keys(weights).reduce((acc, key) => {
    acc[key] = parseFloat((weights[key] / total).toFixed(2));
    return acc;
  }, {});
};

const Guidance = ({ weights }) => {
  const sortedWeights = Object.entries(weights).sort(([, a], [, b]) => b - a);

  return (
    <Card className="bg-gray-50/50 border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Info className="h-4 w-4" />
          How to read your current settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="font-mono text-xs bg-gray-200 p-2 rounded-md mb-3">
          {JSON.stringify(weights)}
        </div>
        <ul className="space-y-1 text-sm text-gray-600">
          {sortedWeights.map(([key, value]) => (
            <li key={key}>
              <strong className="capitalize">{key}</strong> ({value}): {value > 0.5 ? 'Strongly prioritizes' : value > 0.2 ? 'Considers' : 'Secondary emphasis on'} {key}-focused outcomes.
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

const Presets = ({ onSelect }) => {
  const presetList = [
    { label: 'Fastest Response', weights: { time: 0.7, cost: 0.1, reliability: 0.2 } },
    { label: 'Cost-Sensitive', weights: { time: 0.2, cost: 0.6, reliability: 0.2 } },
    { label: 'High Reliability', weights: { time: 0.2, cost: 0.1, reliability: 0.7 } },
    { label: 'Balanced', weights: { time: 0.4, cost: 0.3, reliability: 0.3 } },
  ];

  return (
    <div className="space-y-2">
      <Label>Quick Presets</Label>
      <div className="flex flex-wrap gap-2">
        {presetList.map(p => (
          <Button key={p.label} variant="outline" size="sm" onClick={() => onSelect(p.weights)}>
            {p.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export function ObjectiveWeightsEditor({ initialWeights, onWeightsChange, isReadOnly = false, showGuidance = true }) {
  const [weights, setWeights] = useState(normalize(initialWeights || { time: 0.34, cost: 0.33, reliability: 0.33 }));
  const { toast } = useToast();

  useEffect(() => {
    setWeights(normalize(initialWeights || { time: 0.34, cost: 0.33, reliability: 0.33 }));
  }, [initialWeights]);
  
  const handleSliderChange = (key, value) => {
    const newWeights = { ...weights, [key]: value[0] / 100 };
    setWeights(newWeights);
    onWeightsChange(newWeights);
  };

  const handlePresetSelect = (presetWeights) => {
    const normalized = normalize(presetWeights);
    setWeights(normalized);
    onWeightsChange(normalized);
    toast({ title: 'Weights updated', description: 'Preset values have been applied.' });
  };
  
  const total = Object.values(weights).reduce((sum, v) => sum + v, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChartHorizontal className="h-5 w-5" />
            Objective Weights
          </CardTitle>
          <CardDescription>
            Adjust how the engine prioritizes different objectives.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.keys(weights).map(key => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor={key} className="capitalize">{key}</Label>
                <span className="text-sm font-medium">{Math.round(weights[key] * 100)}%</span>
              </div>
              <Slider
                id={key}
                value={[weights[key] * 100]}
                onValueChange={(val) => handleSliderChange(key, val)}
                max={100}
                step={1}
                disabled={isReadOnly}
              />
            </div>
          ))}
           <div className="flex justify-end pt-2">
             <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                     <Badge variant={Math.abs(total - 1) > 0.02 ? "destructive" : "secondary"}>
                        Total: {Math.round(total * 100)}%
                      </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Weights should sum to 100%. They will be normalized automatically on the back-end.</p>
                  </TooltipContent>
                </Tooltip>
             </TooltipProvider>
           </div>
        </CardContent>
      </Card>
      
      {showGuidance && (
        <div className="space-y-4">
          <Presets onSelect={handlePresetSelect} />
          <Guidance weights={weights} />
        </div>
      )}
    </div>
  );
}

export default ObjectiveWeightsEditor;