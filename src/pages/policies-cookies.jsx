import React from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Cookie Policy</h1>
          <div className="prose prose-gray max-w-none">
            <p>Cookie policy content will be added here.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}