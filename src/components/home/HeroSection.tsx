'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import * as motion from 'motion/react-client'

const stats = [
  { value: 'FDM', label: 'Print Technology' },
  { value: '0.4mm', label: 'Layer Resolution' },
  { value: '48hr', label: 'Avg. Turnaround' },
]

/* Floating hex fragments around the main prism */
const fragments = [
  { x: 40, y: 60, size: 18, delay: 1.2 },
  { x: 320, y: 50, size: 14, delay: 1.4 },
  { x: 50, y: 300, size: 16, delay: 1.6 },
  { x: 310, y: 290, size: 12, delay: 1.3 },
  { x: 100, y: 30, size: 10, delay: 1.8 },
  { x: 280, y: 330, size: 11, delay: 1.5 },
]

function hexPoints(cx: number, cy: number, r: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
  }).join(' ')
}

export function HeroSection() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <section className="relative pt-28 pb-20 lg:pb-32 overflow-hidden bg-brand-bg hex-grid-bg">
      {/* Background glow orb */}
      <motion.div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[450px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(108,188,227,0.10) 0%, transparent 70%)' }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, delay: 0.3 }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left — copy */}
          <div>
            <motion.div
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-brand-surface border border-brand-border mb-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="w-2 h-2 rounded-full bg-brand-blue animate-pulse" />
              <span className="text-xs font-semibold text-brand-text tracking-wide">
                Made to order in the UK
              </span>
            </motion.div>

            <motion.h1
              className="text-[3.5rem] sm:text-[4.5rem] lg:text-[5.5rem] font-bold text-brand-text leading-[0.95] tracking-tight mb-8"
              initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Precision
              <br />
              printed,
              <br />
              <span className="text-brand-blue">layer</span> by{' '}
              <span className="text-brand-blue">layer.</span>
            </motion.h1>

            <motion.p
              className="text-lg text-brand-muted max-w-lg mb-10 leading-relaxed"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              3D printed objects crafted with quality filament and attention to detail.
              Functional parts, art pieces, and everything in between.
            </motion.p>

            <motion.div
              className="flex flex-wrap items-center gap-4 mb-12"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
            >
              <Link
                href="/products"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-brand-blue text-white font-semibold rounded-lg text-base hover:bg-brand-blue-dark transition-all duration-200 shadow-blue-sm"
              >
                Browse Prints
                <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="/recommendations"
                className="inline-flex items-center gap-2 px-8 py-4 text-brand-muted font-semibold rounded-lg text-base border border-brand-border hover:border-brand-blue hover:text-brand-blue transition-all duration-200"
              >
                Request a Custom Print
              </Link>
            </motion.div>

            {/* Stats row — desktop only, under CTA */}
            <motion.div
              className="hidden sm:flex items-center gap-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              {stats.map((s, i) => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className="border-t border-brand-border pt-3 w-20">
                    <p className="text-lg font-bold font-mono text-brand-text leading-tight">{s.value}</p>
                    <p className="text-2xs text-brand-muted">{s.label}</p>
                  </div>
                  {i < stats.length - 1 && (
                    <div className="w-px h-8 bg-brand-border ml-2" />
                  )}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — 3D isometric hexagonal prism */}
          <motion.div
            className="hidden lg:flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="relative w-[380px] h-[380px]">
              <svg viewBox="0 0 380 380" className="w-full h-full" fill="none">
                {/* Isometric hexagonal prism — 3 visible faces */}
                {/* Top face (lightest) */}
                <motion.polygon
                  points="190,100 260,135 190,170 120,135"
                  className="fill-brand-blue/25 stroke-brand-blue/50"
                  strokeWidth="1.5"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  style={{ transformOrigin: '190px 135px' }}
                />
                {/* Left face (mid shade) */}
                <motion.polygon
                  points="120,135 190,170 190,260 120,225"
                  className="fill-brand-blue/15 stroke-brand-blue/40"
                  strokeWidth="1.5"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.75 }}
                />
                {/* Right face (darkest) */}
                <motion.polygon
                  points="260,135 260,225 190,260 190,170"
                  className="fill-brand-blue/8 stroke-brand-blue/30"
                  strokeWidth="1.5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.9 }}
                />

                {/* Layer lines on left face */}
                {[190, 210, 230, 250].map((y, i) => (
                  <motion.line
                    key={`ll-${i}`}
                    x1={120 + (y - 170) * (0 / 90)}
                    y1={135 + (y - 170)}
                    x2={190}
                    y2={y}
                    className="stroke-brand-blue/20"
                    strokeWidth="0.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 1.0 + i * 0.08 }}
                  />
                ))}

                {/* Layer lines on right face */}
                {[190, 210, 230, 250].map((y, i) => (
                  <motion.line
                    key={`rl-${i}`}
                    x1={190}
                    y1={y}
                    x2={260}
                    y2={135 + (y - 170)}
                    className="stroke-brand-blue/15"
                    strokeWidth="0.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 1.0 + i * 0.08 }}
                  />
                ))}

                {/* Floating hex fragments */}
                {mounted && fragments.map((f, i) => (
                  <motion.polygon
                    key={`frag-${i}`}
                    points={hexPoints(f.x, f.y, f.size)}
                    className="fill-brand-blue/5 stroke-brand-blue/25"
                    strokeWidth="0.75"
                    initial={{ opacity: 0, scale: 0, rotate: -30 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ duration: 0.5, delay: f.delay, type: 'spring', stiffness: 120 }}
                    style={{ transformOrigin: `${f.x}px ${f.y}px` }}
                  />
                ))}

                {/* Grid dots in corners for technical feel */}
                {[
                  [30, 30], [60, 30], [30, 60],
                  [350, 30], [320, 30], [350, 60],
                  [30, 350], [60, 350], [30, 320],
                  [350, 350], [320, 350], [350, 320],
                ].map(([x, y], i) => (
                  <motion.circle
                    key={`dot-${i}`}
                    cx={x}
                    cy={y}
                    r="1"
                    className="fill-brand-border"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.5 + i * 0.03 }}
                  />
                ))}

                {/* Thin dashed cross-hair */}
                <motion.line
                  x1="190" y1="40" x2="190" y2="340"
                  className="stroke-brand-muted"
                  strokeWidth="0.5"
                  strokeDasharray="4 4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.15 }}
                  transition={{ duration: 0.5, delay: 1.5 }}
                />
                <motion.line
                  x1="40" y1="180" x2="340" y2="180"
                  className="stroke-brand-muted"
                  strokeWidth="0.5"
                  strokeDasharray="4 4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.15 }}
                  transition={{ duration: 0.5, delay: 1.5 }}
                />
              </svg>

              {/* Floating labels */}
              <motion.div
                className="absolute top-6 left-6 bg-brand-surface/80 backdrop-blur-sm border border-brand-border rounded-lg px-3 py-1.5"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 1.8 }}
              >
                <span className="text-2xs font-mono text-brand-muted">FDM / PLA</span>
              </motion.div>

              <motion.div
                className="absolute bottom-6 right-6 bg-brand-surface/80 backdrop-blur-sm border border-brand-border rounded-lg px-3 py-1.5"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 2.0 }}
              >
                <span className="text-2xs font-mono text-brand-muted">0.4mm layers</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
