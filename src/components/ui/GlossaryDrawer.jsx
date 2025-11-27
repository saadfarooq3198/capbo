import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { BookOpen } from 'lucide-react';

const glossaryTerms = [
  {
    term: 'Chaos Core',
    definition: 'The modeling layer that estimates system stability from nonlinear dynamics.'
  },
  {
    term: 'Attractor',
    definition: 'The long-term state a system tends to evolve toward; we label the current attractor ID.'
  },
  {
    term: 'Lyapunov Exponent',
    definition: 'A measure of sensitivity to initial conditions; higher values indicate instability risk.'
  },
  {
    term: 'Chaotic Oscillator',
    definition: 'A dynamical system (e.g., Lorenz/Rössler) used to model complex behavior.'
  },
  {
    term: 'Orchestrator',
    definition: 'The execution layer that routes decisions into actions and monitors their outcomes.'
  },
  {
    term: 'Noise Handling',
    definition: 'Preprocessing that characterizes/filters noisy inputs (entropy, fractal dimension).'
  }
];

export function GlossaryDrawer({ trigger, children }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="text-xs">
            <BookOpen className="h-3 w-3 mr-1" />
            Glossary
          </Button>
        )}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Research Terminology</SheetTitle>
          <SheetDescription>
            Core concepts in chaos-based business process optimization
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {glossaryTerms.map((item, index) => (
            <div key={index} className="border-b pb-3">
              <h4 className="font-semibold text-sm text-gray-900 mb-1">{item.term}</h4>
              <p className="text-sm text-gray-600">{item.definition}</p>
            </div>
          ))}
        </div>
        {children}
      </SheetContent>
    </Sheet>
  );
}