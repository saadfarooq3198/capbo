
import React from 'react';

export default function CookiesPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="prose prose-lg max-w-none">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Cookie Policy</h1>
        
        <p className="text-gray-600 mb-8">
          <strong>Last updated:</strong> {new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">1. What Are Cookies?</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Cookies are small text files that are stored on your device when you visit a website. They help websites remember your preferences and improve your browsing experience.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Cookies</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            CABPOE™ Console uses cookies for the following purposes:
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-3">Essential Cookies</h3>
              <p className="text-green-800 text-sm">
                Required for the website to function properly. These cookies enable core functionality such as security, authentication, and load balancing.
              </p>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Functional Cookies</h3>
              <p className="text-blue-800 text-sm">
                Help us remember your preferences and settings to provide you with a more personalized experience.
              </p>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-900 mb-3">Analytics Cookies</h3>
              <p className="text-yellow-800 text-sm">
                Help us understand how visitors interact with our website by collecting and reporting information anonymously.
              </p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-3">Performance Cookies</h3>
              <p className="text-purple-800 text-sm">
                Allow us to monitor and improve the performance and usability of our website.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Types of Cookies We Use</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cookie Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">cabpoe_session</td>
                  <td className="px-6 py-4 text-sm text-gray-700">User authentication and session management</td>
                  <td className="px-6 py-4 text-sm text-gray-700">Session</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">preferences</td>
                  <td className="px-6 py-4 text-sm text-gray-700">Store user interface preferences</td>
                  <td className="px-6 py-4 text-sm text-gray-700">1 year</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">analytics</td>
                  <td className="px-6 py-4 text-sm text-gray-700">Anonymous usage statistics</td>
                  <td className="px-6 py-4 text-sm text-gray-700">2 years</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Managing Your Cookie Preferences</h2>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Browser Settings</h3>
            <p className="text-gray-700 mb-4">
              You can control and manage cookies through your browser settings. Most browsers allow you to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>View and delete cookies</li>
              <li>Block cookies from specific websites</li>
              <li>Block third-party cookies</li>
              <li>Clear all cookies when you close your browser</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Cookie Preferences</h3>
            <p className="text-blue-800 mb-4">
              You can also manage your cookie preferences directly on our website using our cookie consent banner and preference center.
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Manage Cookie Preferences
            </button>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Third-Party Cookies</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Some cookies on our site are set by third-party services. We use these services to help us analyze website traffic and improve user experience. These third parties may use cookies to collect information about your online activities.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Changes to This Cookie Policy</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Contact Us</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            If you have any questions about our use of cookies, please contact us:
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
