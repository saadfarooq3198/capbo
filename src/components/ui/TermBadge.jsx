import React from 'react';
import { Badge } from '@/components/ui/badge';
import { InfoTooltip } from './InfoTooltip';

const termColors = {
  'Chaos Core': 'bg-purple-100 text-purple-800',
  'Attractor': 'bg-blue-100 text-blue-800',
  'Lyapunov': 'bg-red-100 text-red-800',
  'Chaotic Oscillator': 'bg-green-100 text-green-800',
  'Orchestrator': 'bg-orange-100 text-orange-800',
  'Noise Handling': 'bg-gray-100 text-gray-800',
};

const glossary = {
  'Chaos Core': 'The modeling layer that estimates system stability from nonlinear dynamics.',
  'Attractor': 'The long-term state a system tends to evolve toward; we label the current attractor ID.',
  'Lyapunov': 'A measure of sensitivity to initial conditions; higher values indicate instability risk.',
  'Chaotic Oscillator': 'A dynamical system (e.g., Lorenz/Rössler) used to model complex behavior.',
  'Orchestrator': 'The execution layer that routes decisions into actions and monitors their outcomes.',
  'Noise Handling': 'Preprocessing that characterizes/filters noisy inputs (entropy, fractal dimension).',
};

export function TermBadge({ term, children, className = "", showTooltip = true }) {
  const colorClass = termColors[term] || 'bg-gray-100 text-gray-800';
  const tooltipText = glossary[term];
  
  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <Badge className={`text-xs ${colorClass}`}>
        {children || term}
      </Badge>
      {showTooltip && tooltipText && <InfoTooltip>{tooltipText}</InfoTooltip>}
    </div>
  );
}