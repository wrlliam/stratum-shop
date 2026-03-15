'use client'

import Link from 'next/link'
import * as motion from 'motion/react-client'
import { cn } from '@/lib/utils'
import { ProductCard } from '@/components/shop/ProductCard'
import { BundleCard } from '@/components/shop/BundleCard'
import { ScrollReveal3D } from '@/components/ui/ScrollReveal3D'
import type { BundleWithProducts, ProductWithImages } from '@/types'

// ─── Value Props Strip ──────────────────────────────────────────────────────────
export function ValueProps() {
  const items = [
    { label: 'Layer by Layer', detail: 'FDM precision with the finest detail in every print' },
    { label: 'Fast Turnaround', detail: 'Most items dispatched within 2-3 business days' },
    { label: 'Quality Filament', detail: 'PLA from trusted brands — reliable and eco-friendly' },
  ]

  return (
    <section className="relative border-y border-brand-border bg-brand-surface">
      {/* Blue gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-blue/40 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-brand-border">
          {items.map((item, i) => (
            <motion.div
              key={item.label}
              className="py-8 sm:px-8 first:sm:pl-0 last:sm:pr-0"
              initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <p className="text-sm font-bold text-brand-text mb-1">{item.label}</p>
              <p className="text-xs text-brand-muted leading-relaxed">{item.detail}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Featured Products ──────────────────────────────────────────────────────────
export function FeaturedProducts({
  featuredProducts,
  displayProducts,
}: {
  featuredProducts: ProductWithImages[]
  displayProducts: ProductWithImages[]
}) {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="flex items-end justify-between mb-10"
          initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <p className="text-[10px] font-mono text-brand-blue uppercase tracking-[0.2em] mb-2">Collection</p>
            <h2 className="text-3xl sm:text-4xl font-display text-brand-text">
              {featuredProducts.length > 0 ? 'Featured Prints' : 'Latest Prints'}
            </h2>
          </div>
          <Link
            href="/products"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-brand-muted hover:text-brand-blue transition-colors"
          >
            View all →
          </Link>
        </motion.div>

        {displayProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {displayProducts.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-brand-muted">No products yet. Check back soon!</p>
          </div>
        )}

        <div className="mt-10 text-center sm:hidden">
          <Link href="/products" className="text-sm font-medium text-brand-blue">
            View all products →
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─── How It Works / Process ─────────────────────────────────────────────────────
export function ProcessSection() {
  const steps = [
    {
      number: '01',
      title: 'Pick your print',
      description:
        'Browse our catalogue of ready-made designs or submit a custom request with reference images.',
    },
    {
      number: '02',
      title: 'We print it',
      description:
        'Your item is printed on demand using high-quality filament with optimised settings for strength and finish.',
    },
    {
      number: '03',
      title: 'Quality check',
      description:
        'Every print is inspected for layer adhesion, surface quality, and dimensional accuracy before packing.',
    },
    {
      number: '04',
      title: 'Shipped to you',
      description:
        'Securely packed and dispatched via Royal Mail. Most orders ship within 2-3 business days.',
    },
  ]

  return (
    <section className="py-20 bg-gradient-to-b from-brand-surface to-brand-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="max-w-2xl mb-14"
          initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-[10px] font-mono text-brand-blue uppercase tracking-[0.2em] mb-2">
            How it works
          </p>
          <h2 className="text-3xl sm:text-4xl font-display text-brand-text mb-3">From file to front door</h2>
          <p className="text-brand-muted text-sm leading-relaxed">
            Every order is printed fresh. No warehoused stock, no mass production — just
            careful, on-demand manufacturing.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <ScrollReveal3D
              key={step.number}
              className="relative"
              delay={i * 0.1}
              rotateX={10}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl text-brand-blue/30 font-display leading-none shrink-0">
                  {step.number}
                </span>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block flex-1 h-px border-t border-dashed border-brand-blue/20" />
                )}
              </div>
              <h3 className="text-base font-bold text-brand-text mb-2">{step.title}</h3>
              <p className="text-xs text-brand-muted leading-relaxed">{step.description}</p>
            </ScrollReveal3D>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Materials ──────────────────────────────────────────────────────────────────

// Add new materials here — they'll automatically appear in the section
const MATERIALS = [
  {
    name: 'PLA',
    subtitle: 'Plant-based thermoplastic',
    color: 'bg-brand-blue',
    properties: [
      'Smooth surface finish',
      'Eco-friendly & biodegradable',
      'Excellent detail reproduction',
      'Wide colour range available',
      'Low warping & easy to print',
      'Great for decorative & functional items',
    ],
  },
  // To add PETG, uncomment below:
  // {
  //   name: 'PETG',
  //   subtitle: 'Tough & chemical-resistant',
  //   color: 'bg-emerald-500',
  //   properties: [
  //     'High impact resistance',
  //     'Chemical & moisture resistant',
  //     'Food-safe options available',
  //     'Semi-flexible with good strength',
  //     'UV resistant for outdoor use',
  //     'Great for functional & mechanical parts',
  //   ],
  // },
]

export function MaterialsSection() {
  const materialNames = MATERIALS.map((m) => m.name).join(' & ')

  return (
    <section className="py-20 border-t border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="max-w-2xl mb-14"
          initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-[10px] font-mono text-brand-blue uppercase tracking-[0.2em] mb-2">
            {MATERIALS.length === 1 ? 'Material' : 'Materials'}
          </p>
          <h2 className="text-3xl sm:text-4xl font-display text-brand-text mb-3">
            Printed with {materialNames}
          </h2>
          <p className="text-brand-muted text-sm leading-relaxed">
            {MATERIALS.length === 1
              ? 'All our prints use PLA — a plant-based, biodegradable thermoplastic sourced from trusted brands. It delivers a smooth finish with excellent detail, and is available in a wide range of colours.'
              : `We use ${materialNames} — high-quality thermoplastics sourced from trusted brands. Each material is chosen for its specific strengths to deliver the best result for your print.`}
          </p>
        </motion.div>

        <div className={cn(
          'grid gap-6',
          MATERIALS.length === 1 ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'
        )}>
          {MATERIALS.map((material, i) => (
            <motion.div
              key={material.name}
              className="bg-brand-surface border border-brand-border rounded-sm p-8 hover:border-brand-blue/30 hover:shadow-card-hover transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className={cn('w-12 h-12 rounded-sm shadow-inner', material.color)} />
                <div>
                  <h3 className="text-xl font-bold text-brand-text">{material.name} Filament</h3>
                  <p className="text-xs text-brand-muted">{material.subtitle}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {material.properties.map((prop) => (
                  <div key={prop} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-blue shrink-0" />
                    <span className="text-sm text-brand-muted">{prop}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Bundles ────────────────────────────────────────────────────────────────────
export function BundleSection({ activeBundles }: { activeBundles: BundleWithProducts[] }) {
  if (activeBundles.length === 0) return null

  return (
    <section className="py-20 bg-brand-surface border-y border-brand-blue/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="flex items-end justify-between mb-10"
          initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <p className="text-[10px] font-mono text-brand-blue uppercase tracking-[0.2em] mb-2">Save More</p>
            <h2 className="text-3xl sm:text-4xl font-display text-brand-text">Bundle Deals</h2>
            <p className="text-brand-muted mt-2 text-sm">Get multiple prints at a discounted price</p>
          </div>
          <Link
            href="/bundles"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-brand-muted hover:text-brand-blue transition-colors"
          >
            View all bundles →
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeBundles.map((bundle, i) => (
            <motion.div
              key={bundle.id}
              initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <BundleCard bundle={bundle} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Shipping Info ──────────────────────────────────────────────────────────────
export function ShippingSection() {
  const options = [
    { name: 'Royal Mail 2nd Class', speed: '2-3 days', price: '2.85' },
    { name: 'Royal Mail 1st Class', speed: '1-2 days', price: '3.85' },
    { name: 'Tracked 48', speed: '2-3 days', price: '3.50', note: 'Tracked' },
    { name: 'Tracked 24', speed: '1-2 days', price: '4.50', note: 'Tracked' },
  ]

  return (
    <section className="py-20 bg-brand-surface border-t border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-start">
          <motion.div
            className="mb-10 lg:mb-0"
            initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-[10px] font-mono text-brand-blue uppercase tracking-[0.2em] mb-2">
              Delivery
            </p>
            <h2 className="text-3xl sm:text-4xl font-display text-brand-text mb-3">UK shipping via Royal Mail</h2>
            <p className="text-brand-muted text-sm leading-relaxed mb-6">
              All orders are carefully packed and shipped from the UK. Choose the speed
              that suits you at checkout.
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-brand-muted">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Payment secured by Stripe
              </div>
              <div className="flex items-center gap-2 text-xs text-brand-muted">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Order confirmation sent by email
              </div>
              <div className="flex items-center gap-2 text-xs text-brand-muted">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Tracking available on selected options
              </div>
            </div>
          </motion.div>

          <ScrollReveal3D
            className="bg-brand-arctic border border-brand-border rounded-sm overflow-hidden"
            delay={0.15}
            rotateX={10}
          >
            <div className="px-5 py-3 border-b border-brand-border bg-brand-arctic">
              <p className="text-xs font-semibold text-brand-text">Shipping Options</p>
            </div>
            <div className="divide-y divide-brand-border">
              {options.map((opt) => (
                <div key={opt.name} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-brand-text">{opt.name}</p>
                    <p className="text-2xs text-brand-muted">
                      {opt.speed}
                      {opt.note && <span className="ml-1.5 text-brand-blue">· {opt.note}</span>}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-brand-text font-mono">
                    &pound;{opt.price}
                  </span>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-brand-border">
              <p className="text-2xs text-brand-muted italic">
                Delivery times are rough estimates and may vary
              </p>
            </div>
          </ScrollReveal3D>
        </div>
      </div>
    </section>
  )
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────────
export function FAQSection() {
  const faqs = [
    {
      q: 'How long does printing take?',
      a: 'Most items are printed and dispatched within 2-3 business days. Complex or large prints may take a little longer — we\'ll let you know if so.',
    },
    {
      q: 'What materials do you use?',
      a: 'We use PLA from trusted brands like Bambu Lab, Polymaker, and eSUN. It\'s plant-based, delivers a smooth finish, and is available in a wide range of colours.',
    },
    {
      q: 'Can I request a custom print?',
      a: 'Absolutely. Head to our "Request a Print" page, describe what you need, and attach any reference images. We\'ll review it and get back to you.',
    },
    {
      q: 'Do you ship internationally?',
      a: 'Currently we only ship within the UK via Royal Mail. We\'re looking into international shipping for the future.',
    },
    {
      q: 'What if my print arrives damaged?',
      a: 'Get in touch with your order number and photos of the damage. We\'ll arrange a replacement or refund — no hassle.',
    },
    {
      q: 'Can I choose a specific colour?',
      a: 'Many of our products offer colour options. If a listing has a "Color" selector, pick your preference before adding to cart. The price may vary by option.',
    },
  ]

  return (
    <section className="py-20 border-t border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-16">
          <motion.div
            className="mb-10 lg:mb-0"
            initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-[10px] font-mono text-brand-blue uppercase tracking-[0.2em] mb-2">
              FAQ
            </p>
            <h2 className="text-3xl sm:text-4xl font-display text-brand-text mb-3">Common questions</h2>
            <p className="text-brand-muted text-sm leading-relaxed">
              Can&apos;t find what you&apos;re looking for? Drop us a message and we&apos;ll get back to you.
            </p>
          </motion.div>

          <div className="lg:col-span-2 divide-y divide-brand-border">
            {faqs.map((faq, i) => (
              <motion.details
                key={i}
                className="group py-5"
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
              >
                <summary className="flex items-center justify-between cursor-pointer list-none text-sm font-semibold text-brand-text hover:text-brand-blue transition-colors">
                  {faq.q}
                  <span className="ml-4 text-brand-muted group-open:rotate-45 transition-transform duration-200 text-lg leading-none">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-brand-muted leading-relaxed pr-8">
                  {faq.a}
                </p>
              </motion.details>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── CTA ────────────────────────────────────────────────────────────────────────
export function CTASection() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal3D
          className="relative overflow-hidden rounded-sm bg-[#080c12] border border-brand-blue/20 p-12 sm:p-16"
          rotateX={12}
        >
          {/* Strata accent lines */}
          <svg className="absolute inset-0 w-full h-full opacity-15" preserveAspectRatio="none" viewBox="0 0 800 400">
            <path d="M0 80 Q200 60 400 100 T800 70" stroke="#6CBCE3" strokeWidth="1.5" fill="none" />
            <path d="M0 160 Q250 140 500 180 T800 150" stroke="#6CBCE3" strokeWidth="1" fill="none" />
            <path d="M0 240 Q180 220 450 260 T800 230" stroke="#6CBCE3" strokeWidth="1.5" fill="none" />
            <path d="M0 320 Q300 300 550 340 T800 310" stroke="#6CBCE3" strokeWidth="1" fill="none" />
          </svg>

          <div className="relative z-10 max-w-xl">
            <motion.p
              className="text-xs font-semibold text-brand-blue tracking-widest uppercase mb-4"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              Custom Prints
            </motion.p>
            <motion.h2
              className="text-3xl sm:text-4xl font-display text-white mb-4 leading-tight"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              Got something specific in mind?
            </motion.h2>
            <motion.p
              className="text-brand-slate max-w-md mb-8 text-sm leading-relaxed"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              Send us a description and reference images. We&apos;ll review your idea
              and let you know if we can bring it to life.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <Link
                href="/recommendations"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-brand-blue text-white font-semibold rounded-sm hover:bg-brand-blue-dark transition-all hover:shadow-blue"
              >
                Submit a Request
                <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
            </motion.div>
          </div>
        </ScrollReveal3D>
      </div>
    </section>
  )
}
