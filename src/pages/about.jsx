import React from 'react';

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">About CABPOE™</h1>
        <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
          Chaotic AI-Driven Business Process Optimization Engine — transforming uncertainty into competitive advantage through chaos theory and advanced decisioning
        </p>
      </div>

      {/* Company Info */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-8 md:p-12 mb-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">Innovation at the Edge of Chaos</h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            CABPOE™ by <strong>Gigsgen® Digital Innovations Ltd.</strong> — UK patent pending. Our research prototype is advancing to pilot phase, focused on stability-aware, explainable decisions under real-world volatility.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            We combine <strong>Chaos Core</strong>, stability scoring, simulation, and orchestration with full auditability to improve resilience, cost, and time outcomes across logistics, IT operations, and business process outsourcing.
          </p>
        </div>
      </div>

      {/* Core Technologies */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Core Technologies</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-purple-600 font-bold text-xl">∞</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Chaos Core</h3>
            <p className="text-gray-600 leading-relaxed">
              Advanced modeling layer using strange attractors and chaotic oscillators to detect instability and regime shifts in complex business signals.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-blue-600 font-bold text-xl">λ</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Lyapunov Analysis</h3>
            <p className="text-gray-600 leading-relaxed">
              Quantifies stability margins and sensitivity to initial conditions, enabling preference for reliable options under uncertainty.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-green-600 font-bold text-xl">⚡</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Stochastic Resonance</h3>
            <p className="text-gray-600 leading-relaxed">
              Sophisticated noise handling that accounts for random fluctuations and exogenous shocks during decision scoring and optimization.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-orange-600 font-bold text-xl">🎯</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Dynamic Orchestration</h3>
            <p className="text-gray-600 leading-relaxed">
              Real-time execution layer that routes decisions into actions via workflows and APIs, with continuous monitoring and adaptation.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-red-600 font-bold text-xl">🧠</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Chaotic Neural Networks</h3>
            <p className="text-gray-600 leading-relaxed">
              Advanced learning systems driven by chaotic neural networks (CRNNs) with reinforced feedback loops for continuous improvement.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-indigo-600 font-bold text-xl">📊</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Fractal Analysis</h3>
            <p className="text-gray-600 leading-relaxed">
              Signal clarification through fractal dimension analysis, chaos filtering, and temporal compression for enhanced pattern recognition.
            </p>
          </div>
        </div>
      </div>

      {/* Applications */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Applications</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 text-2xl">🚚</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Logistics & Supply Chain</h3>
            <p className="text-gray-600">Dynamic route optimization, demand forecasting, and supply chain resilience under volatile conditions.</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-2xl">⚙️</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">IT Operations</h3>
            <p className="text-gray-600">Intelligent resource allocation, performance optimization, and predictive maintenance in complex IT environments.</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-purple-600 text-2xl">🏢</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Business Process Outsourcing</h3>
            <p className="text-gray-600">Adaptive staffing, quality optimization, and cost management with real-time process adjustment capabilities.</p>
          </div>
        </div>
      </div>

      {/* Key Benefits */}
      <div className="bg-gray-50 rounded-2xl p-8 md:p-12 mb-16">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">Why CABPOE™?</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-white text-lg">✓</span>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Noise-Resilient Decisioning</h4>
              <p className="text-gray-600">Make reliable decisions even in noisy, volatile environments where traditional systems fail.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-white text-lg">✓</span>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Real-Time Adaptation</h4>
              <p className="text-gray-600">Continuously adapt to changing conditions with dynamic workflow orchestration.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-white text-lg">✓</span>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Explainable AI</h4>
              <p className="text-gray-600">Full auditability and transparency in decision-making processes for compliance and trust.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-white text-lg">✓</span>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Competitive Advantage</h4>
              <p className="text-gray-600">Transform uncertainty from a challenge into a strategic advantage through chaos theory.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="text-center bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl p-8 md:p-12">
        <h2 className="text-3xl font-bold mb-6">Ready to Harness Chaos?</h2>
        <p className="text-xl mb-8 opacity-90">
          Join the pilot program and discover how CABPOE™ can transform your operations.
        </p>
        <div className="space-y-4">
          <p className="text-lg">
            <strong>Contact:</strong> admin@gigsgen.com
          </p>
          <p className="text-sm opacity-75">
            © 2024 Gigsgen® Digital Innovations Ltd. All rights reserved. CABPOE™ is a trademark of Gigsgen Digital Innovations Ltd.
          </p>
        </div>
      </div>
    </main>
  );
}