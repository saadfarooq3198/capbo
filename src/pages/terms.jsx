
import React from 'react';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="prose prose-lg max-w-none">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        
        <p className="text-gray-600 mb-8">
          <strong>Last updated:</strong> {new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            By accessing and using the CABPOE™ Console ("Service"), you accept and agree to be bound by the terms and provision of this agreement.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            CABPOE™ Console is a web-based platform that provides chaos-native decision optimization tools for business operations. The Service includes access to decision runs, analytics, and related features.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Responsibilities</h2>
          <div className="text-gray-700 leading-relaxed space-y-4">
            <p>Users agree to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide accurate and complete information when using the Service</li>
              <li>Maintain the security of their account credentials</li>
              <li>Use the Service only for lawful purposes</li>
              <li>Not attempt to gain unauthorized access to the Service or its related systems</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data and Privacy</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Service Availability</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            We strive to maintain high availability but cannot guarantee uninterrupted access to the Service. Maintenance windows and updates may temporarily affect Service availability.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Limitation of Liability</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            The Service is provided "as is" without warranty of any kind. We shall not be liable for any indirect, incidental, special, consequential, or punitive damages.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Termination</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            We may terminate or suspend access to our Service immediately, without prior notice, for conduct that we believe violates these Terms of Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Changes to Terms</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            We reserve the right to modify these terms at any time. Changes will be posted on this page with an updated revision date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact Information</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            For questions about these Terms of Service, please contact us at:
          </p>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-800 font-medium">Gigsgen® Digital Innovations Ltd.</p>
            <p className="text-gray-600">Email: <a href="mailto:admin@gigsgen.com" className="text-indigo-600 hover:underline">admin@gigsgen.com</a></p>
          </div>
        </section>
      </div>
    </div>
  );
}
