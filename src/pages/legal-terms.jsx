import React from 'react';
import PublicShell from '@/layouts/PublicShell';

function TermsOfServiceContent() {
    return (
        <div className="bg-white px-6 py-16 lg:px-8">
            <div className="mx-auto max-w-3xl text-base leading-7 text-gray-700">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Terms of Service</h1>
                <p className="mt-2 text-sm text-gray-500">Last Updated: 2024-05-20</p>
                
                <p className="mt-6">
                    Welcome to CABPOE Systems. These Terms of Service ("Terms") govern your access to and use of our Services. Please read them carefully.
                </p>

                <h2 className="mt-12 text-2xl font-bold tracking-tight text-gray-900">1. Acceptance of Terms</h2>

                <p className="mt-6">
                    By accessing or using our Services, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you may not access or use the Services.
                </p>

                <h2 className="mt-12 text-2xl font-bold tracking-tight text-gray-900">2. Use of Services</h2>

                <p className="mt-6">
                    You agree to use the Services only for lawful purposes and in accordance with these Terms. You are responsible for all data and information you input into the Services.
                </p>

                <h2 className="mt-12 text-2xl font-bold tracking-tight text-gray-900">3. Intellectual Property</h2>

                <p className="mt-6">
                    The Services and their original content, features, and functionality are and will remain the exclusive property of CABPOE Systems and its licensors.
                </p>

                <h2 className="mt-12 text-2xl font-bold tracking-tight text-gray-900">4. Termination</h2>

                <p className="mt-6">
                    We may terminate or suspend your access to our Services immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                </p>

                <h2 className="mt-12 text-2xl font-bold tracking-tight text-gray-900">5. Limitation of Liability</h2>

                <p className="mt-6">
                    In no event shall CABPOE Systems, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Services.
                </p>

                <h2 className="mt-12 text-2xl font-bold tracking-tight text-gray-900">6. Governing Law</h2>

                <p className="mt-6">
                    These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which our company is established, without regard to its conflict of law provisions.
                </p>

            </div>
        </div>
    );
}

export default function TermsOfServicePage() {
    return (
        <PublicShell>
            <TermsOfServiceContent />
        </PublicShell>
    );
}