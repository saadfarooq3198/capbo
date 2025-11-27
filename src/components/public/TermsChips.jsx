import React from 'react';
import { getBrandingConfig } from '@/components/lib/brandingStore';

export default function TermsChips({ terms }) {
  const t = getBrandingConfig()?.theme || {};
  const palette = {
    'Lyapunov': t.accent || '#7c3aed',
    'Orchestrator': t.primary || '#2563eb',
    'Chaos Core': t.secondary || '#10b981'
  };
  
  return (
    <div className="chips">
      {terms.map((x, i) => (
        <span 
          key={i} 
          className="chip" 
          style={{ background: palette[x] || 'rgba(0,0,0,.06)' }}
        >
          {x}
        </span>
      ))}
      <style>{`
        .chips{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
        .chip{color:#fff;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:600}
      `}</style>
    </div>
  );
}