'use client'

import { useState, useEffect } from 'react'
import { Cross2Icon } from '@radix-ui/react-icons'

const STORAGE_KEY = 'hideOrderGuide'

const steps = [
  { num: 1, label: 'Order received', desc: 'Paid', color: 'bg-green-500' },
  { num: 2, label: 'Print label', desc: 'Shipping label', color: 'bg-brand-blue' },
  { num: 3, label: 'Prepare items', desc: 'Pick & print', color: 'bg-purple-500' },
  { num: 4, label: 'Pack order', desc: 'Box & seal', color: 'bg-amber-500' },
  { num: 5, label: 'Add tracking', desc: 'If tracked', color: 'bg-orange-500' },
  { num: 6, label: 'Mark shipped', desc: 'Complete', color: 'bg-emerald-500' },
]

const tips = [
  { title: 'Batch processing', desc: 'Select multiple paid orders and print all labels at once from the orders page.' },
  { title: 'Tracking auto-ships', desc: 'Adding a tracking number automatically marks the order as shipped.' },
  { title: 'Use barcodes', desc: 'Print barcodes and scan when packing to avoid mix-ups between orders.' },
  { title: 'Delivery awareness', desc: 'Tracked 24/48 require a tracking number; standard Royal Mail does not.' },
]

export function OrderProcessingGuide() {
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    setHidden(localStorage.getItem(STORAGE_KEY) === 'true')
  }, [])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setHidden(true)
  }

  if (hidden) return null

  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-card mb-6 relative">
      <button
        onClick={dismiss}
        className="absolute top-4 right-4 p-1.5 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-arctic transition-colors"
        title="Dismiss"
      >
        <Cross2Icon className="w-4 h-4" />
      </button>

      <h3 className="text-sm font-bold text-brand-text mb-1">Order Processing Workflow</h3>
      <p className="text-xs text-brand-muted mb-5">Follow these steps for each order</p>

      {/* Steps */}
      <div className="flex items-start gap-0 mb-6 overflow-x-auto pb-2">
        {steps.map((step, i) => (
          <div key={step.num} className="flex items-start flex-1 min-w-0">
            <div className="flex flex-col items-center text-center min-w-[80px]">
              <div className={`w-8 h-8 rounded-full ${step.color} text-white flex items-center justify-center text-xs font-bold mb-1.5`}>
                {step.num}
              </div>
              <p className="text-xs font-semibold text-brand-text leading-tight">{step.label}</p>
              <p className="text-[10px] text-brand-muted">{step.desc}</p>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 min-w-[16px] h-[2px] bg-brand-border mt-4 mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="border-t border-brand-border pt-4">
        <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-3">Workflow Tips</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tips.map((tip) => (
            <div key={tip.title} className="flex gap-2">
              <div className="w-1 rounded-full bg-brand-blue shrink-0 mt-0.5" style={{ height: '100%' }} />
              <div>
                <p className="text-xs font-semibold text-brand-text">{tip.title}</p>
                <p className="text-[11px] text-brand-muted leading-relaxed">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
