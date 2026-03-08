import type { Metadata } from 'next'
import { CubeIcon, LightningBoltIcon, StackIcon } from '@radix-ui/react-icons'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Stratum — precision 3D printed objects, crafted layer by layer.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold text-brand-blue uppercase tracking-widest mb-2">
          About
        </p>
        <h1 className="text-3xl font-bold text-brand-text mb-8">About Stratum</h1>

        <div className="prose prose-sm max-w-none text-brand-muted leading-relaxed space-y-6">
          <p>
            Stratum is a small, independent 3D printing shop built on a simple idea: precision-crafted
            objects, made layer by layer, with care and quality materials.
          </p>

          <p>
            Every product in our shop is designed or curated to be both functional and beautiful.
            We use high-quality filaments — PLA+, PETG, silk blends, and more — to produce prints
            that look and feel premium.
          </p>

          <h2 className="text-lg font-bold text-brand-text mt-10 mb-4">Our Process</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 not-prose">
            {[
              {
                icon: <CubeIcon className="w-5 h-5 text-brand-blue" />,
                title: 'Design',
                desc: 'Each model is carefully selected or designed for print quality and aesthetics.',
              },
              {
                icon: <LightningBoltIcon className="w-5 h-5 text-brand-blue" />,
                title: 'Print',
                desc: 'Printed on calibrated machines with premium filaments for consistent results.',
              },
              {
                icon: <StackIcon className="w-5 h-5 text-brand-blue" />,
                title: 'Finish',
                desc: 'Every print is inspected, cleaned, and packaged with care before shipping.',
              },
            ].map((step) => (
              <div key={step.title} className="p-4 bg-brand-surface border border-brand-border rounded-xl">
                <div className="mb-3">{step.icon}</div>
                <h3 className="text-sm font-bold text-brand-text mb-1">{step.title}</h3>
                <p className="text-xs text-brand-muted leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          <h2 className="text-lg font-bold text-brand-text mt-10 mb-4">Quality Materials</h2>
          <p>
            We primarily use PLA+ for its excellent detail, strength, and eco-friendliness. For items
            that need extra durability or heat resistance, we use PETG or specialty filaments.
            Every material is chosen to give the best result for each specific product.
          </p>

          <h2 className="text-lg font-bold text-brand-text mt-10 mb-4">Made to Order</h2>
          <p>
            Most of our products are printed to order, which means less waste and fresher prints.
            It also means we can offer customisation options — from colors to engravings — on many items.
          </p>
        </div>
      </div>
    </div>
  )
}
