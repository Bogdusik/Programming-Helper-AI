'use client'

import Navbar from '../../components/Navbar'
import MinimalBackground from '../../components/MinimalBackground'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <Navbar />
      <MinimalBackground />

      <div className="relative pt-20 pb-16 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
            <p className="text-white/70">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="glass rounded-2xl shadow-xl p-8 border border-white/10">
            <div className="prose prose-invert max-w-none space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
                <p className="text-white/80 leading-relaxed">
                  By accessing and using Programming Helper AI ("the Service"), you accept and agree to be bound by 
                  the terms and provision of this agreement. If you do not agree to these Terms of Service, please 
                  do not use the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
                <p className="text-white/80 leading-relaxed">
                  Programming Helper AI is an AI-powered programming assistance platform that provides coding help, 
                  code reviews, debugging assistance, and educational content. The Service uses artificial intelligence 
                  to assist users with programming-related questions and tasks.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">3. User Accounts</h2>
                <div className="space-y-4">
                  <p className="text-white/80 leading-relaxed">
                    To use certain features of the Service, you must create an account. You agree to:
                  </p>
                  <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                    <li>Provide accurate and complete information</li>
                    <li>Maintain the security of your account credentials</li>
                    <li>Notify us immediately of any unauthorized access</li>
                    <li>Be responsible for all activities under your account</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">4. Acceptable Use</h2>
                <p className="text-white/80 leading-relaxed mb-4">You agree not to:</p>
                <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
                  <li>Use the Service for any illegal or unauthorized purpose</li>
                  <li>Attempt to gain unauthorized access to the Service or its systems</li>
                  <li>Interfere with or disrupt the Service or servers</li>
                  <li>Use automated systems to access the Service without permission</li>
                  <li>Share your account credentials with others</li>
                  <li>Use the Service to generate harmful, offensive, or malicious code</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">5. Intellectual Property</h2>
                <p className="text-white/80 leading-relaxed">
                  The Service and its original content, features, and functionality are owned by Programming Helper AI 
                  and are protected by international copyright, trademark, patent, trade secret, and other intellectual 
                  property laws. You may not copy, modify, distribute, or create derivative works based on the Service 
                  without our express written permission.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">6. User Content</h2>
                <p className="text-white/80 leading-relaxed">
                  You retain ownership of any code, questions, or content you submit to the Service. By submitting content, 
                  you grant us a license to use, process, and analyze your content to provide the Service and improve 
                  our AI models. We do not claim ownership of your code or content.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">7. AI-Generated Content</h2>
                <p className="text-white/80 leading-relaxed">
                  The Service uses AI to generate responses and code suggestions. While we strive for accuracy, AI-generated 
                  content may contain errors. You are responsible for reviewing, testing, and validating any code or 
                  suggestions provided by the Service before using them in production environments.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">8. Limitation of Liability</h2>
                <p className="text-white/80 leading-relaxed">
                  The Service is provided "as is" without warranties of any kind. We shall not be liable for any indirect, 
                  incidental, special, consequential, or punitive damages resulting from your use of the Service. We do not 
                  guarantee that the Service will be error-free, secure, or available at all times.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">9. Termination</h2>
                <p className="text-white/80 leading-relaxed">
                  We reserve the right to terminate or suspend your account and access to the Service immediately, without 
                  prior notice, for any breach of these Terms of Service or for any other reason we deem necessary.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">10. Changes to Terms</h2>
                <p className="text-white/80 leading-relaxed">
                  We reserve the right to modify these Terms of Service at any time. We will notify users of any material 
                  changes by posting the updated terms on this page and updating the "Last updated" date. Your continued 
                  use of the Service after such changes constitutes acceptance of the new terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">11. Governing Law</h2>
                <p className="text-white/80 leading-relaxed">
                  These Terms of Service shall be governed by and construed in accordance with applicable laws, without 
                  regard to conflict of law provisions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">12. Contact Information</h2>
                <p className="text-white/80 leading-relaxed">
                  If you have questions about these Terms of Service, please contact us at{' '}
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

