import React, { useEffect, useState } from 'react';
import { getBrandingConfig } from '@/components/lib/brandingStore';

export default function TermsOfServicePage() {
  const [content, setContent] = useState(null);

  useEffect(() => {
    const branding = getBrandingConfig();
    setContent(branding.publicPages?.terms || {});
  }, []);

  if (!content) return <div>Loading...</div>;

  return (
    <div className="bg-white px-6 py-32 lg:px-8">
      <div className="mx-auto max-w-3xl text-base leading-7 text-gray-700">
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {content.h1 || "Terms of Service"}
        </h1>
        <div className="mt-10 max-w-2xl space-y-6">
          {content.paragraphs?.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </div>
  );
}