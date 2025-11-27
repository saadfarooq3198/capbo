import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

const glossaryTerms = [
  { id: 'chaos-core', title: 'Chaos Core', content: 'Detects instability, regime shifts, and non-linear patterns in incoming signals.' },
  { id: 'attractors', title: 'Attractors', content: 'Represents likely future states of the system to anticipate adverse conditions.' },
  { id: 'lyapunov', title: 'Lyapunov Stability', content: 'Measures sensitivity to initial conditions to estimate stability margins.' },
  { id: 'orchestrator', title: 'Orchestrator', content: 'Component that dispatches selected actions to workflows and APIs.' },
  { id: 'noise', title: 'Noise', content: 'Random fluctuations and exogenous shocks accounted for during scoring.' },
  { id: 'ingestion', title: 'Signal Ingestion', content: 'Ingests weather, closures, FX, conflict, and enterprise data.' },
  { id: 'simulation', title: 'Simulation Engine', content: 'Explores outcomes under volatility to reveal fragility.' },
  { id: 'explainability', title: 'Scoring & Explainability', content: 'Ranks by reliability, cost, and time — with reasons.' },
  { id: 'feedback', title: 'Feedback Loop', content: 'Learns from outcomes to improve future recommendations.' },
];

export default function GlossaryDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const drawerRef = useRef(null);
  const triggerRef = useRef(null);

  const openDrawer = useCallback((triggerElement, termId = null) => {
    triggerRef.current = triggerElement;
    setIsOpen(true);
    document.body.classList.add('overflow-hidden');
    
    if (termId) {
      setTimeout(() => {
        const el = document.getElementById(`term-${termId}`);
        if (el && drawerRef.current) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }
  }, []);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
    document.body.classList.remove('overflow-hidden');
    if (triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleTriggerClick = (e) => {
      const trigger = e.target.closest('[data-open-glossary]');
      if (trigger) {
        e.preventDefault();
        const termId = trigger.dataset.term;
        openDrawer(trigger, termId);
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeDrawer();
      }
    };

    document.addEventListener('click', handleTriggerClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('click', handleTriggerClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [openDrawer, closeDrawer, isOpen]);

  useEffect(() => {
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, []);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/40 z-[999]"
        onClick={closeDrawer}
      />
      
      {/* Drawer */}
      <div 
        ref={drawerRef}
        className="fixed left-0 top-0 h-full w-[380px] md:w-[420px] bg-white shadow-xl z-[1000] rounded-r-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Glossary</h2>
          <button
            onClick={closeDrawer}
            className="p-1 hover:bg-gray-100 rounded-full"
            aria-label="Close glossary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Click a technology's "Learn more" to jump to a term.
            </p>
          </div>
          
          {glossaryTerms.map((term) => (
            <div 
              key={term.id}
              id={`term-${term.id}`}
              className="mb-4 p-4 rounded-xl border border-neutral-200 bg-white"
            >
              <h3 className="font-semibold text-lg mb-2">{term.title}</h3>
              <p className="text-sm text-neutral-600 leading-6">{term.content}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}