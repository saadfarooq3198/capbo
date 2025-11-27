import React from 'react';
import PublicLayout from '@/components/public/PublicLayout';

export default function CookiesPage() {
  return (
    <PublicLayout pageKey="cookies">
      <section className="page-wrap" aria-label="Cookie Policy">
        <h1>Cookie Policy</h1>
        <p>
          This cookie policy explains how CABPOE™ uses cookies and similar technologies.
        </p>
        <h2>What are cookies?</h2>
        <p>
          Cookies are small text files that are placed on your device when you visit our website.
        </p>
        <h2>How we use cookies</h2>
        <p>
          We use cookies to enhance your experience, analyze usage, and provide personalized content.
        </p>
        <h2>Managing cookies</h2>
        <p>
          You can manage your cookie preferences through your browser settings or our cookie banner.
        </p>
      </section>
      <style>{`
        .page-wrap{padding:32px 16px;max-width:900px;margin:0 auto}
        h1{font-size:2rem;font-weight:700;margin-bottom:24px}
        h2{font-size:1.5rem;font-weight:600;margin:24px 0 12px}
        p{line-height:1.5;margin:16px 0}
      `}</style>
    </PublicLayout>
  );
}