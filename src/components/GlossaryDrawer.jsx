import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen } from 'lucide-react';

const glossaryTerms = [
    { term: 'CABPOE', definition: 'Chaos-Augmented Bayesian Prediction and Optimization Engine. A system designed for decision intelligence in complex, nonlinear environments.' },
    { term: 'Decision Run', definition: 'A single execution of the CABPOE engine, which takes inputs, simulates outcomes using chaotic models, and provides recommendations.' },
    { term: 'Stability Score', definition: 'A primary output metric (0.0 to 1.0) indicating the predicted stability of a system. Higher scores suggest a more predictable and stable state.' },
    { term: 'Lyapunov Exponent', definition: 'A measure of sensitivity to initial conditions, a key concept from chaos theory. Higher positive values indicate a greater potential for chaotic, unpredictable behavior.' },
    { term: 'Attractor', definition: 'In chaos theory, an attractor is a set of states toward which a system tends to evolve. The engine identifies the current attractor to understand the system\'s long-term behavior.' },
    { term: 'Orchestrator', definition: 'The component of the system responsible for executing recommended actions in the real world and monitoring their outcomes.' },
];

export default function GlossaryDrawer() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="fixed bottom-4 right-4 z-50 bg-indigo-600 text-white rounded-full p-3 shadow-lg hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">
            <BookOpen className="h-6 w-6" />
            <span className="sr-only">Open Glossary</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Glossary of Terms</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
           <dl className="space-y-6">
              {glossaryTerms.map(item => (
                  <div key={item.term}>
                      <dt className="font-semibold text-gray-900">{item.term}</dt>
                      <dd className="mt-1 text-sm text-gray-600">{item.definition}</dd>
                  </div>
              ))}
           </dl>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}