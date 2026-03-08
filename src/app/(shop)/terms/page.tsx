import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for Stratum 3D Prints.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold text-brand-blue uppercase tracking-widest mb-2">Legal</p>
        <h1 className="text-3xl font-bold text-brand-text mb-2">Terms of Service</h1>
        <p className="text-sm text-brand-muted mb-10">Last updated: March 2026</p>

        <div className="prose prose-sm max-w-none text-brand-muted space-y-6">
          <section>
            <h2 className="text-lg font-bold text-brand-text mb-2">1. Agreement to Terms</h2>
            <p>By accessing or using Stratum (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-brand-text mb-2">2. Products & Orders</h2>
            <p>All 3D-printed products are made to order. We reserve the right to refuse or cancel any order at our discretion. Product colours and finishes may vary slightly from images shown.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-brand-text mb-2">3. Payments</h2>
            <p>Payments are processed securely via Stripe. By placing an order you authorise payment for the total amount shown at checkout, including applicable shipping.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-brand-text mb-2">4. Shipping & Delivery</h2>
            <p>Estimated delivery times are provided as guidance only and are not guaranteed. We are not responsible for delays caused by couriers or customs.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-brand-text mb-2">5. Returns & Refunds</h2>
            <p>Please see our <a href="/returns" className="text-brand-blue hover:underline">Returns Policy</a> for full details. Custom and personalised items may not be eligible for return.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-brand-text mb-2">6. Intellectual Property</h2>
            <p>All content on this site, including product designs, images, and branding, is the property of Stratum and may not be reproduced without written permission.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-brand-text mb-2">7. Limitation of Liability</h2>
            <p>To the fullest extent permitted by law, Stratum shall not be liable for any indirect, incidental, or consequential damages arising from use of our products or services.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-brand-text mb-2">8. Changes to Terms</h2>
            <p>We may update these terms from time to time. Continued use of our services after changes constitutes acceptance of the new terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-brand-text mb-2">9. Contact</h2>
            <p>For any questions regarding these terms, please <a href="/contact" className="text-brand-blue hover:underline">contact us</a>.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
