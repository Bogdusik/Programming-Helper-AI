'use client'

import Navbar from '../../components/Navbar'
import MinimalBackground from '../../components/MinimalBackground'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <Navbar />
      <MinimalBackground />

      <div className="relative pt-20 pb-16 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
            <p className="text-white/70">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="glass rounded-2xl shadow-xl p-8 border border-white/10">
            <div className="prose prose-invert max-w-none space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
                <p className="text-white/80 leading-relaxed">
                  Programming Helper AI ("we," "our," or "us") is committed to protecting your privacy. 
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                  when you use our AI-powered programming assistance service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-medium text-white mb-2">2.1 Information You Provide</h3>
                    <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                      <li>Account information (user ID, preferences)</li>
                      <li>Programming questions and code snippets</li>
                      <li>Language preferences and learning goals</li>
                      <li>Assessment responses and progress data</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-white mb-2">2.2 Automatically Collected Information</h3>
                    <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                      <li>Usage statistics and interaction patterns</li>
                      <li>Response times and performance metrics</li>
                      <li>Device and browser information</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
                <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                  <li>To provide and improve our AI programming assistance service</li>
                  <li>To personalize your learning experience</li>
                  <li>To track your progress and provide analytics</li>
                  <li>To respond to your inquiries and provide support</li>
                  <li>To ensure service security and prevent abuse</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">4. Data Security</h2>
                <p className="text-white/80 leading-relaxed">
                  We implement appropriate technical and organizational measures to protect your personal information 
                  against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission 
                  over the Internet is 100% secure.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">5. Data Retention</h2>
                <p className="text-white/80 leading-relaxed">
                  We retain your information for as long as necessary to provide our services and fulfill the purposes 
                  described in this policy. You may request deletion of your data at any time by contacting us.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">6. Your Rights</h2>
                <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                  <li>Access your personal data</li>
                  <li>Request correction of inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Object to processing of your data</li>
                  <li>Request data portability</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">7. Third-Party Services</h2>
                <p className="text-white/80 leading-relaxed">
                  We use third-party services (such as authentication providers and AI services) that may collect 
                  information subject to their own privacy policies. We encourage you to review their privacy policies.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">8. Changes to This Policy</h2>
                <p className="text-white/80 leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
                  the new Privacy Policy on this page and updating the "Last updated" date.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">9. Contact Us</h2>
                <p className="text-white/80 leading-relaxed">
                  If you have questions about this Privacy Policy, please contact us at{' '}
                  <a href="/contact" className="text-blue-400 hover:text-blue-300 underline">
                    our contact page
                  </a>.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

