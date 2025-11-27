import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

const glossaryTerms = [
  { id: 'chaos-core', title: 'Chaos Core', content: 'Detects instability, regime shifts, and non-linear patterns in incoming signals.' },
  { id: 'attractors', title: 'Attractors', content: 'Represents likely future states of the system to anticipate adverse conditions.' },
  { id: 'lyapunov', title: 'Lyapunov Stability', content: 'Measures sensitivity to initial conditions to estimate stability margins.' },
  { id: 'orchestrator', title: 'Orchestrator', content: 'Component that dispatches selected actions to workflows and APIs.' },
  { id: 'noise', title: 'Noise', content: 'Random fluctuations and exogenous shocks accounted for during scoring.' }
];

export default function GlossaryDrawerTW() {
  const [isOpen, setIsOpen] = useState(false);
  const drawerRef = useRef(null);
  const triggerRef = useRef(null);

  const openDrawer = useCallback((triggerElement) => {
    triggerRef.current = triggerElement;
    setIsOpen(true);
    document.body.classList.add('overflow-hidden');
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
        openDrawer(trigger);
      }
    };
    document.addEventListener('click', handleTriggerClick);
    return () => document.removeEventListener('click', handleTriggerClick);
  }, [openDrawer]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeDrawer();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeDrawer]);

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
        className="fixed left-0 top-0 h-full w-[380px] md:w-[420px] bg-white shadow-xl z-[1000] rounded-r-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Glossary</h2>
          <button 
            onClick={closeDrawer}
            className="p-1 rounded-md hover:bg-gray-100"
            aria-label="Close glossary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-full pb-20">
          <p className="text-sm text-gray-600 mb-6">
            Key terms and concepts used in CABPOE™ technology.
          </p>
          
          <div className="space-y-4">
            {glossaryTerms.map((term) => (
              <div 
                key={term.id} 
                id={`term-${term.id}`}
                className="rounded-xl border border-gray-200 p-4"
              >
                <h3 className="font-semibold text-gray-900 mb-2">{term.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{term.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}