'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { DeliveryAddress } from '@/types'
import { formatDeliveryMethod } from '@/lib/delivery'
import { classicLabelHtml, brandedLabelHtml, getSender } from '@/lib/label-html'
import type { LabelMeta } from '@/lib/label-html'

interface Props {
  orderNumber: string
  deliveryMethod: string
  address: DeliveryAddress
  meta?: LabelMeta
}

type LabelStyle = 'classic' | 'branded'

export function PrintLabelButton({ orderNumber, deliveryMethod, address, meta }: Props) {
  const [showPicker, setShowPicker] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState<LabelStyle>('branded')

  const deliveryLabel = formatDeliveryMethod(deliveryMethod)

  const handlePrint = () => {
    const sender = getSender()
    const html =
      selectedStyle === 'branded'
        ? brandedLabelHtml(orderNumber, deliveryLabel, address, sender, meta)
        : classicLabelHtml(orderNumber, deliveryLabel, address, sender, meta)

    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
    }
    setShowPicker(false)
  }

  return (
    <div className="relative">
      <Button variant="secondary" size="sm" onClick={() => setShowPicker((v) => !v)}>
        Print Label
      </Button>

      {showPicker && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 bg-brand-surface border border-brand-border rounded-sm shadow-xl p-4 w-72">
            <p className="text-xs font-semibold text-brand-text uppercase tracking-wider mb-3">
              Label Style
            </p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {(
                [
                  { id: 'classic', label: 'Classic', desc: 'Plain black & white' },
                  { id: 'branded', label: 'Branded', desc: 'Stratum design' },
                ] as { id: LabelStyle; label: string; desc: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedStyle(opt.id)}
                  className={`p-3 rounded-sm border-2 text-left transition-colors ${
                    selectedStyle === opt.id
                      ? 'border-brand-blue bg-brand-blue/5'
                      : 'border-brand-border hover:border-brand-slate'
                  }`}
                >
                  <p className={`text-sm font-semibold ${selectedStyle === opt.id ? 'text-brand-blue' : 'text-brand-text'}`}>
                    {opt.label}
                  </p>
                  <p className="text-[11px] text-brand-muted mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
            <Button variant="primary" size="sm" fullWidth onClick={handlePrint}>
              Print
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
