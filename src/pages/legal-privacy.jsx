import React from 'react';
import PublicShell from '@/layouts/PublicShell';

function PrivacyPolicyContent() {
  return (
    <div className="bg-white px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl text-base leading-7 text-gray-700">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Privacy Policy</h1>
        
        <p className="mt-6">
          This Privacy Policy describes how CABPOE Systems ("we", "us", or "our") collects, uses, and discloses your information in connection with your use of our websites, services, and applications (collectively, the "Services").
        </p>

        <h2 className="mt-12 text-2xl font-bold tracking-tight text-gray-900">1. Information We Collect</h2>
        
        <p className="mt-6">
          We may collect the following types of information:
        </p>
        
        <ul role="list" className="mt-4 space-y-2 pl-6">
          <li><strong>Personal Information:</strong> This includes your name, email address, company name, and role, which you provide when you register for an account or contact us.</li>
          <li><strong>Usage Data:</strong> We automatically collect information when you access and use the Services. This may include your IP address, browser type, operating system, pages viewed, and the dates/times of your visits.</li>
          <li><strong>Project Data:</strong> Any data, files, or information you upload or connect to the Services for analysis or processing as part of a project. We treat this as your confidential information.</li>
        </ul>

        <h2 className="mt-12 text-2xl font-bold tracking-tight text-gray-900">2. How We Use Your Information</h2>

        <p className="mt-6">
          We use the information we collect for various purposes, including to:
        </p>

        <ul role="list" className="mt-4 space-y-2 pl-6">
          <li>Provide, operate, and maintain our Services.</li>
          <li>Improve, personalize, and expand our Services.</li>
          <li>Understand and analyze how you use our Services.</li>
          <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the Service, and for marketing purposes.</li>
          <li>Process your transactions.</li>
          <li>Find and prevent fraud.</li>
        </ul>

        <h2 className="mt-12 text-2xl font-bold tracking-tight text-gray-900">3. Data Security</h2>

        <p className="mt-6">
          We implement a variety of security measures to maintain the safety of your personal information. Your Project Data is encrypted at rest and in transit. However, no method of transmission over the Internet or method of electronic storage is 100% secure.
        </p>

        <h2 className="mt-12 text-2xl font-bold tracking-tight text-gray-900">4. Your Data Protection Rights</h2>

        <p className="mt-6">
          Depending on your location, you may have the following rights regarding your personal information:
        </p>
        
        <ul role="list" className="mt-4 space-y-2 pl-6">
            <li>The right to access – You have the right to request copies of your personal data.</li>
            <li>The right to rectification – You have the right to request that we correct any information you believe is inaccurate.</li>
            <li>The right to erasure – You have the right to request that we erase your personal data, under certain conditions.</li>
        </ul>

        <h2 className="mt-12 text-2xl font-bold tracking-tight text-gray-900">Contact Us</h2>
        
        <p className="mt-6">
          If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@cabpoe.example.com" className="text-indigo-600 hover:underline">privacy@cabpoe.example.com</a>.
        </p>

      </div>
    </div>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <PublicShell>
      <PrivacyPolicyContent />
    </PublicShell>
  );
}