import React from 'react';
import PublicLayout from '@/components/public/PublicLayout';

export default function GlossaryPage() {
  const terms = [
    { term: 'CABPOE™', definition: 'A decision intelligence platform for operational resilience' },
    { term: 'Lyapunov', definition: 'A measure of system stability and sensitivity to initial conditions' },
    { term: 'Orchestrator', definition: 'The execution layer that routes decisions into actions' },
    { term: 'Chaos Core', definition: 'The modeling layer that estimates system stability' },
    { term: 'Attractor', definition: 'The long-term state a system tends to evolve toward' }
  ];
  
  return (
    <PublicLayout pageKey="glossary">
      <section className="page-wrap" aria-label="Glossary">
        <h1>Glossary</h1>
        <div className="glossary-list">
          {terms.map((item, i) => (
            <div key={i} className="glossary-item">
              <dt className="glossary-term">{item.term}</dt>
              <dd className="glossary-def">{item.definition}</dd>
            </div>
          ))}
        </div>
      </section>
      <style>{`
        .page-wrap{padding:32px 16px;max-width:900px;margin:0 auto}
        h1{font-size:2rem;font-weight:700;margin-bottom:24px}
        .glossary-list{display:flex;flex-direction:column;gap:16px}
        .glossary-item{border-bottom:1px solid #e5e7eb;padding-bottom:16px}
        .glossary-term{font-weight:600;font-size:1.1rem;margin-bottom:4px}
        .glossary-def{color:#6b7280;line-height:1.5;margin:0}
      `}</style>
    </PublicLayout>
  );
}