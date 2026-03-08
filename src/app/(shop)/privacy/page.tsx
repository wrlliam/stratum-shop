import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Stratum 3D Prints.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold text-brand-blue uppercase tracking-widest mb-2">Legal</p>
        <h1 className="text-3xl font-bold text-brand-text mb-2">Privacy Policy</h1>
        <p className="text-sm text-brand-muted mb-10">Last updated: March 2026</p>

        <div className="prose prose-sm max-w-none text-brand-muted space-y-6">
          <section>
            <h2 className="text-lg font-bold text-brand-text mb-2">1. Information We Collect</h2>
            <p>We collect information you provide directly, including name, email address, delivery address, and payment information (processed securely by Stripe — we do not store card details).</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-brand-text mb-2">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To process and fulfil your orders</li>
              <li>To send order confirmations and updates</li>
              <li>To send marketing emails (with your consent)</li>
              <li>To improve our products and services</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-brand-text mb-2">3. Data Sharing</h2>
            <p>We do not sell your personal data. We share data only with service providers necessary to operate our business (Stripe for payments, Resend for email, Neon for database hosting) under appropriate data processing agreements.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-brand-text mb-2">4. Marketing Emails</h2>
            <p>If you opt in to marketing emails, we may send you product updates and offers. You can unsubscribe at any time via the link in any marketing email, or by updating your account preferences.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-brand-text mb-2">5. Cookies</h2>
            <p>We use essential cookies to keep you signed in and remember your cart. We do not use tracking or advertising cookies.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-brand-text mb-2">6. Your Rights</h2>
            <p>Under UK GDPR you have the right to access, correct, or delete your personal data. To exercise these rights, please <a href="/contact" className="text-brand-blue hover:underline">contact us</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-brand-text mb-2">7. Data Retention</h2>
            <p>We retain your data for as long as your account is active or as required by law. Order records are retained for 7 years for accounting purposes.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-brand-text mb-2">8. Contact</h2>
            <p>For privacy-related queries, please <a href="/contact" className="text-brand-blue hover:underline">contact us</a>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
