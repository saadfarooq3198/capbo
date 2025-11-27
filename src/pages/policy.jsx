import React from 'react';
import PublicLayout from '@/components/public/PublicLayout';
import { getBrandingConfig } from '@/components/lib/brandingStore';

export default function PolicyPage() {
  const policy = getBrandingConfig()?.publicPages?.policy || {};
  const h1 = policy.h1 || 'Privacy Policy';
  const paras = policy.paragraphs?.length ? policy.paragraphs : [
    'This privacy policy explains how CABPOE™ collects, uses, and protects your information.',
    'We are committed to protecting your privacy and handling your data responsibly.'
  ];
  
  return (
    <PublicLayout pageKey="policy">
      <section className="page-wrap" aria-label="Privacy Policy">
        <h1>
          {h1.replace(/CABPOE/gi, 'CABPOE')}
          <sup className="tm">™</sup>
        </h1>
        {paras.map((p, i) => <p key={i}>{p}</p>)}
      </section>
      <style>{`
        .page-wrap{padding:32px 16px;max-width:900px;margin:0 auto}
        .tm{font-size:10px;margin-left:2px;vertical-align:super}
        p{line-height:1.5;margin:16px 0}
        h1{font-size:2rem;font-weight:700;margin-bottom:24px}
      `}</style>
    </PublicLayout>
  );
}