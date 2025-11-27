import React from 'react';
import PublicFooter from '../components/PublicFooter';

export default function LegalAccessibilityPage() {
  return (
    <div className="bg-white">
      <main className="mx-auto max-w-4xl px-6 lg:px-8 py-24 sm:py-32">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Accessibility Statement</h1>
        <div className="mt-8 prose prose-indigo lg:prose-lg text-gray-600">
          <p>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <p>CABPOE Systems is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.</p>

          <h2>Conformance status</h2>
          <p>The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and developers to improve accessibility for people with disabilities. We are partially conformant with WCAG 2.1 level AA. Partially conformant means that some parts of the content do not fully conform to the accessibility standard.</p>

          <h2>Feedback</h2>
          <p>We welcome your feedback on the accessibility of CABPOE Console. Please let us know if you encounter accessibility barriers:</p>
          <ul>
            <li>E-mail: accessibility@cabpoe.example.com</li>
          </ul>

          <h2>Technical specifications</h2>
          <p>Accessibility of our service relies on the following technologies to work with the particular combination of web browser and any assistive technologies or plugins installed on your computer: HTML, WAI-ARIA, CSS, and JavaScript.</p>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}