'use client'

import Link from 'next/link'
import * as motion from 'motion/react-client'

const stats = [
  { value: 'FDM', label: 'Print Technology' },
  { value: '0.4mm', label: 'Layer Resolution' },
  { value: '48hr', label: 'Avg. Turnaround' },
]

export function HeroSection() {
  return (
    <section className="relative pt-28 pb-20 lg:pb-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#f0f7fb] via-white to-white" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.07]" preserveAspectRatio="none" viewBox="0 0 1440 800">
          <motion.path d="M0 200 Q360 160 720 220 T1440 180" stroke="#6CBCE3" strokeWidth="2" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, delay: 0.5, ease: 'easeOut' }} />
          <motion.path d="M0 280 Q400 240 800 300 T1440 260" stroke="#6CBCE3" strokeWidth="1.5" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, delay: 0.7, ease: 'easeOut' }} />
          <motion.path d="M0 360 Q300 320 720 380 T1440 340" stroke="#3A9FD4" strokeWidth="1" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, delay: 0.9, ease: 'easeOut' }} />
          <motion.path d="M0 440 Q500 400 900 460 T1440 420" stroke="#6CBCE3" strokeWidth="1.5" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, delay: 1.1, ease: 'easeOut' }} />
          <motion.path d="M0 520 Q350 480 750 540 T1440 500" stroke="#3A9FD4" strokeWidth="1" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, delay: 1.3, ease: 'easeOut' }} />
        </svg>
        <motion.div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-blue/5 rounded-full blur-3xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.3 }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left — copy */}
          <div>
            <motion.div
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border border-brand-border shadow-card mb-8"
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
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
                className="group inline-flex items-center gap-3 px-8 py-4 bg-brand-text text-white font-semibold rounded-2xl text-base hover:bg-brand-charcoal transition-all duration-200 shadow-card-lg"
              >
                Browse Prints
                <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="/recommendations"
                className="inline-flex items-center gap-2 px-8 py-4 text-brand-text font-semibold rounded-2xl text-base hover:text-brand-blue transition-colors duration-200"
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
                  <div>
                    <p className="text-lg font-bold text-brand-text leading-tight">{s.value}</p>
                    <p className="text-2xs text-brand-muted">{s.label}</p>
                  </div>
                  {i < stats.length - 1 && (
                    <div className="w-px h-8 bg-brand-border ml-5" />
                  )}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — abstract topographic contour map */}
          <motion.div
            className="hidden lg:flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="relative w-[380px] h-[380px]">
              <svg viewBox="0 0 380 380" className="w-full h-full" fill="none">
                {/* Topographic contour rings — like a height map / terrain slice */}
                {[
                  { rx: 160, ry: 150, cx: 190, cy: 195, color: '#f0f7fb', width: 1.5, delay: 0.6 },
                  { rx: 140, ry: 132, cx: 188, cy: 192, color: '#e4f1f9', width: 1.5, delay: 0.75 },
                  { rx: 120, ry: 112, cx: 186, cy: 189, color: '#d4ecf6', width: 1.5, delay: 0.9 },
                  { rx: 100, ry: 94, cx: 184, cy: 186, color: '#c0e2f0', width: 1.5, delay: 1.05 },
                  { rx: 82, ry: 76, cx: 182, cy: 183, color: '#a8d5e8', width: 1.5, delay: 1.2 },
                  { rx: 64, ry: 60, cx: 180, cy: 180, color: '#8ec8e0', width: 2, delay: 1.35 },
                  { rx: 46, ry: 44, cx: 178, cy: 177, color: '#7ac0db', width: 2, delay: 1.5 },
                  { rx: 30, ry: 28, cx: 176, cy: 175, color: '#6CBCE3', width: 2.5, delay: 1.65 },
                  { rx: 14, ry: 13, cx: 175, cy: 173, color: '#5db3de', width: 2.5, delay: 1.8 },
                ].map((ring, i) => (
                  <motion.ellipse
                    key={i}
                    cx={ring.cx}
                    cy={ring.cy}
                    rx={ring.rx}
                    ry={ring.ry}
                    stroke={ring.color}
                    strokeWidth={ring.width}
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{
                      pathLength: { duration: 1.2, delay: ring.delay, ease: 'easeOut' },
                      opacity: { duration: 0.3, delay: ring.delay },
                    }}
                  />
                ))}

                {/* Center peak marker */}
                <motion.circle
                  cx="175"
                  cy="173"
                  r="3"
                  fill="#3A9FD4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: 2.0, type: 'spring' }}
                />

                {/* Elevation labels along a diagonal */}
                {[
                  { x: 320, y: 320, text: '0mm', delay: 2.1 },
                  { x: 280, y: 270, text: '2mm', delay: 2.2 },
                  { x: 240, y: 235, text: '4mm', delay: 2.3 },
                ].map((label, i) => (
                  <motion.text
                    key={i}
                    x={label.x}
                    y={label.y}
                    fill="#AEB4BB"
                    fontSize="9"
                    className="font-mono"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    transition={{ duration: 0.4, delay: label.delay }}
                  >
                    {label.text}
                  </motion.text>
                ))}

                {/* Thin dashed cross-hair through peak */}
                <motion.line
                  x1="175" y1="40" x2="175" y2="340"
                  stroke="#AEB4BB"
                  strokeWidth="0.5"
                  strokeDasharray="4 4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.25 }}
                  transition={{ duration: 0.5, delay: 2.0 }}
                />
                <motion.line
                  x1="30" y1="173" x2="340" y2="173"
                  stroke="#AEB4BB"
                  strokeWidth="0.5"
                  strokeDasharray="4 4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.25 }}
                  transition={{ duration: 0.5, delay: 2.0 }}
                />

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
                    fill="#E8EAED"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.5 + i * 0.03 }}
                  />
                ))}
              </svg>

              {/* Floating labels */}
              <motion.div
                className="absolute top-6 left-6 bg-white/80 backdrop-blur-sm border border-brand-border rounded-lg px-3 py-1.5 shadow-card"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 2.2 }}
              >
                <span className="text-2xs font-mono text-brand-muted">TOPO / SECTION A-A&apos;</span>
              </motion.div>

              <motion.div
                className="absolute bottom-6 right-6 bg-white/80 backdrop-blur-sm border border-brand-border rounded-lg px-3 py-1.5 shadow-card"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 2.4 }}
              >
                <span className="text-2xs font-mono text-brand-muted">Scale 1:1</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
