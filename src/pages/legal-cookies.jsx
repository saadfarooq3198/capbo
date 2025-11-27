import React from 'react';
import PublicShell from '@/layouts/PublicShell';

function CookiePolicyContent() {
    return (
        <div className="bg-white px-6 py-16 lg:px-8">
            <div className="mx-auto max-w-3xl text-base leading-7 text-gray-700">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Cookie Policy</h1>

                <p className="mt-6">
                    This page describes how CABPOE Systems ("we", "us", or "our") uses cookies and similar technologies on our website.
                </p>

                <h2 className="mt-12 text-2xl font-bold tracking-tight text-gray-900">What Are Cookies?</h2>

                <p className="mt-6">
                    Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site.
                </p>

                <h2 className="mt-12 text-2xl font-bold tracking-tight text-gray-900">How We Use Cookies</h2>

                <p className="mt-6">
                    We use cookies for the following purposes:
                </p>

                <ul role="list" className="mt-4 space-y-2 pl-6">
                    <li><strong>Essential Cookies:</strong> These cookies are necessary for the website to function and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences, logging in, or filling in forms.</li>
                    <li><strong>Performance Cookies:</strong> These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site.</li>
                    <li><strong>Functional Cookies:</strong> These cookies enable the website to provide enhanced functionality and personalization.</li>
                </ul>

                <h2 className="mt-12 text-2xl font-bold tracking-tight text-gray-900">Your Choices</h2>

                <p className="mt-6">
                    You have the right to decide whether to accept or reject cookies. You can exercise your cookie preferences by using our cookie consent banner. You can also set or amend your web browser controls to accept or refuse cookies.
                </p>
            </div>
        </div>
    );
}

export default function CookiePolicyPage() {
    return (
        <PublicShell>
            <CookiePolicyContent />
        </PublicShell>
    );
}