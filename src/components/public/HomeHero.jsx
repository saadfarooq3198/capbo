import React from 'react';
import { getBrandingConfig } from '@/components/lib/brandingStore';
import Tooltip from '@/components/public/Tooltip';

export default function HomeHero(){
  const b=getBrandingConfig();
  const h1='Welcome to the CABPOE™'; // EXACT per spec
  const h2='Operational resilience for logistics, IT ops, and BPO';
  const intro=`CABPOE™ (Chaotic AI-Driven Business Process Optimization Engine) turns real-world uncertainty into an advantage. Instead of relying on brittle, rule-based logic, it models operations with strange attractors, chaotic oscillators, and nonlinear dynamics, measuring stability via Lyapunov exponents while exploring outcomes in parallel. Signals are clarified with fractal dimension analysis, chaos filtering, temporal compression, and stochastic resonance; learning is driven by chaotic neural networks (CRNNs) and reinforced through a closed feedback loop. The result is noise-resilient decisioning and dynamic workflow orchestration that adapt in real time—optimizing routes, prices, staffing, and risk in volatile conditions. By embracing the “butterfly effect” and leveraging ergodicity to search vast state spaces, CABPOE™ delivers faster, more stable decisions than traditional tools, making it a genuinely revolutionary engine for complex, high-noise environments.`;

  const chips=[
    { term:'Lyapunov',               color:(b?.theme?.accent||'#7c3aed'), tip:'Stability/divergence rate (exponent).' },
    { term:'Orchestrator',           color:(b?.theme?.primary||'#2563eb'), tip:'Coordinates workflows & runs.' },
    { term:'Chaos Core',             color:(b?.theme?.secondary||'#10b981'), tip:'Core engine exploiting structured chaos.' },
    { term:'Chaotic Oscillator',     color:'#f59e0b',                       tip:'Nonlinear oscillator; rich dynamics.' },
    { term:'Attractor',              color:'#ef4444',                       tip:'States the system tends toward.' },
    { term:'Strange Attractor',      color:'#8b5cf6',                       tip:'Fractal, bounded complex behavior.' },
    { term:'Stochastic Resonance',   color:'#06b6d4',                       tip:'Noise-aided weak signal boosting.' },
    { term:'Noise-Resilient Decisioning', color:'#22c55e',                  tip:'Robust under volatility & gaps.' }
  ];

  return (
    <section className="home" aria-label="Home">
      <div className="wrap">
        <h1>{h1}</h1>
        <h2>{h2}</h2>
        <p className="intro">{intro}</p>
        <div className="chips">
          {chips.map((c,i)=>(<Tooltip key={i} label={c.tip}><span className="chip" style={{background:c.color}}>{c.term}</span></Tooltip>))}
        </div>
      </div>
      <style>{`
        .home{padding:84px 16px 56px}
        .wrap{max-width:980px;margin:0 auto;text-align:center}
        .home h1{font-size:2.6rem;font-weight:800;margin:0 0 22px}
        .home h2{font-size:1.35rem;opacity:.92;margin:28px 0 26px; color: #333;}
        .home .intro{max-width:860px;margin:0 auto 28px;line-height:1.68;font-size:1rem;letter-spacing:.01em}
        .home .chips{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin:24px 0 0}
        .home .chip{color:#fff;padding:8px 12px;border-radius:999px;font-size:.92rem;font-weight:700;cursor:default}
        @media (max-width:900px){.home h1{font-size:2.2rem}.home .chip{font-size:.9rem}}
      `}</style>
    </section>
  );
}