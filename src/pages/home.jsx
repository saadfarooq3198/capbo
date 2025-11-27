
import React from 'react';
import ChipTooltip from '@/components/public/ChipTooltip';

export default function HomePage() {
  const chips = [
    { name: 'Lyapunov', term: 'lyapunov', definition: 'Quantifies stability margins to prefer reliable options.' },
    { name: 'Orchestrator', term: 'orchestrator', definition: 'Executes chosen actions via workflows/APIs.' },
    { name: 'Chaos Core', term: 'chaos-core', definition: 'Detects instability and regime shifts in signals.' },
    { name: 'Chaotic Oscillator', term: 'chaos-core', definition: 'Detects instability and regime shifts in signals.' },
    { name: 'Attractor', term: 'attractors', definition: 'Maps likely future states to anticipate adverse conditions.' },
    { name: 'Strange Attractor', term: 'attractors', definition: 'Maps likely future states to anticipate adverse conditions.' },
    { name: 'Stochastic Resonance', term: 'noise', definition: 'Random fluctuations and exogenous shocks accounted for during scoring.' },
    { name: 'Noise-Resilient Decisioning', term: 'noise', definition: 'Random fluctuations and exogenous shocks accounted for during scoring.' }
  ];
  const colors = ['#7c3aed','#2563eb','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#22c55e'];

  return (
    <>
    <section className="px-4 pt-32 md:pt-40 pb-12">
      <div className="mx-auto max-w-[980px] text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-9 text-gray-900">Welcome to the CABPOE™</h1>
        <h2 className="text-lg md:text-xl text-gray-700 opacity-90 mb-9">Operational resilience for logistics, IT ops, and BPO</h2>
        
        {/* The test box has been removed from here */}
        
        <p className="mx-auto max-w-[860px] leading-7 mb-10 text-[1rem] text-gray-700">
          CABPOE™ (Chaotic AI-Driven Business Process Optimization Engine) turns real-world uncertainty into an advantage. Instead of relying on brittle, rule-based logic, it models operations with strange attractors, chaotic oscillators, and nonlinear dynamics, measuring stability via Lyapunov exponents while exploring outcomes in parallel. Signals are clarified with fractal dimension analysis, chaos filtering, temporal compression, and stochastic resonance; learning is driven by chaotic neural networks (CRNNs) and reinforced through a closed feedback loop. The result is noise-resilient decisioning and dynamic workflow orchestration that adapt in real time—optimizing routes, prices, staffing, and risk in volatile conditions.
        </p>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {chips.map((t,i)=>(
            <ChipTooltip key={i} content={t.definition}>
              <button 
                className="px-3 py-1 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                style={{backgroundColor: colors[i%colors.length]}}
              >
                {t.name}
              </button>
            </ChipTooltip>
          ))}
        </div>

        <button data-open-glossary className="rounded-lg border border-black/15 px-3 py-1.5 font-medium bg-white hover:bg-gray-50 transition-colors">
          📖 Open Glossary
        </button>
      </div>
    </section>
    </>
  );
}
