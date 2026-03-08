'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { DeliveryAddress } from '@/types'
import { formatDeliveryMethod } from '@/lib/delivery'

interface Props {
  orderNumber: string
  deliveryMethod: string
  address: DeliveryAddress
}

type LabelStyle = 'classic' | 'branded'

function classicLabelHtml(
  orderNumber: string,
  deliveryLabel: string,
  address: DeliveryAddress,
  sender: { name: string; line1: string; city: string; postcode: string; country: string }
) {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Shipping Label - ${orderNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; padding: 20mm; }
    .label { border: 2px solid #000; padding: 8mm; width: 100mm; }
    .section { margin-bottom: 6mm; }
    .section-title { font-size: 8pt; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 2mm; border-bottom: 1px solid #ccc; padding-bottom: 1mm; }
    .address { font-size: 12pt; line-height: 1.5; }
    .address .name { font-weight: bold; font-size: 13pt; }
    .address .postcode { font-weight: bold; font-size: 14pt; letter-spacing: 1px; }
    .order-info { display: flex; justify-content: space-between; align-items: center; border-top: 2px solid #000; padding-top: 4mm; margin-top: 4mm; }
    .order-number { font-weight: bold; font-size: 11pt; font-family: monospace; }
    .delivery-method { font-size: 9pt; background: #000; color: #fff; padding: 2mm 4mm; font-weight: bold; }
    @media print { body { padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="label">
    <div class="section">
      <div class="section-title">From</div>
      <div class="address" style="font-size: 10pt;">
        <div>${sender.name}</div>
        ${sender.line1 ? `<div>${sender.line1}</div>` : ''}
        ${sender.city ? `<div>${sender.city}</div>` : ''}
        ${sender.postcode ? `<div>${sender.postcode}</div>` : ''}
        <div>${sender.country}</div>
      </div>
    </div>
    <div class="section">
      <div class="section-title">To</div>
      <div class="address">
        <div class="name">${address.name}</div>
        <div>${address.line1}</div>
        ${address.line2 ? `<div>${address.line2}</div>` : ''}
        <div>${address.city}</div>
        ${address.county ? `<div>${address.county}</div>` : ''}
        <div class="postcode">${address.postcode}</div>
      </div>
    </div>
    <div class="order-info">
      <span class="order-number">${orderNumber}</span>
      <span class="delivery-method">${deliveryLabel}</span>
    </div>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`
}

function brandedLabelHtml(
  orderNumber: string,
  deliveryLabel: string,
  address: DeliveryAddress,
  sender: { name: string; line1: string; city: string; postcode: string; country: string }
) {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Shipping Label - ${orderNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f4f8; display: flex; align-items: flex-start; justify-content: center; padding: 20mm; min-height: 100vh; }
    .label { background: #fff; border-radius: 12px; overflow: hidden; width: 105mm; box-shadow: 0 4px 24px rgba(0,0,0,0.12); }
    .header { background: #1a1a2e; padding: 5mm 6mm; display: flex; align-items: center; justify-content: space-between; }
    .header .brand { color: #6CBCE3; font-weight: 900; font-size: 14pt; letter-spacing: 3px; }
    .header .order-num { color: #6CBCE3; font-family: monospace; font-size: 9pt; opacity: 0.85; }
    .body { padding: 6mm; }
    .section { margin-bottom: 5mm; }
    .section-title { font-size: 7pt; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; font-weight: 600; margin-bottom: 2mm; }
    .address { font-size: 11pt; line-height: 1.6; color: #1a1a2e; }
    .address .name { font-weight: 700; font-size: 12pt; }
    .from-address { font-size: 9.5pt; color: #475569; }
    .divider { height: 1px; background: #e2e8f0; margin: 4mm 0; }
    .footer { display: flex; align-items: center; justify-content: space-between; margin-top: 4mm; padding-top: 4mm; border-top: 1px solid #e2e8f0; }
    .postcode { font-family: monospace; font-size: 16pt; font-weight: 900; color: #1a1a2e; letter-spacing: 2px; }
    .badge { background: #6CBCE3; color: #fff; padding: 1.5mm 4mm; border-radius: 6px; font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    @media print { body { background: none; padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="label">
    <div class="header">
      <span class="brand">STRATUM</span>
      <span class="order-num">${orderNumber}</span>
    </div>
    <div class="body">
      <div class="section">
        <div class="section-title">From</div>
        <div class="from-address">
          <div>${sender.name}</div>
          ${sender.line1 ? `<div>${sender.line1}</div>` : ''}
          ${sender.city ? `<div>${sender.city}</div>` : ''}
          ${sender.postcode ? `<div>${sender.postcode}</div>` : ''}
          <div>${sender.country}</div>
        </div>
      </div>
      <div class="divider"></div>
      <div class="section">
        <div class="section-title">Deliver to</div>
        <div class="address">
          <div class="name">${address.name}</div>
          <div>${address.line1}</div>
          ${address.line2 ? `<div>${address.line2}</div>` : ''}
          <div>${address.city}</div>
          ${address.county ? `<div>${address.county}</div>` : ''}
        </div>
      </div>
      <div class="footer">
        <span class="postcode">${address.postcode}</span>
        <span class="badge">${deliveryLabel}</span>
      </div>
    </div>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`
}

export function PrintLabelButton({ orderNumber, deliveryMethod, address }: Props) {
  const [showPicker, setShowPicker] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState<LabelStyle>('branded')

  const getSender = () => ({
    name: process.env.NEXT_PUBLIC_SENDER_NAME || 'Stratum',
    line1: process.env.NEXT_PUBLIC_SENDER_LINE1 || '',
    city: process.env.NEXT_PUBLIC_SENDER_CITY || '',
    postcode: process.env.NEXT_PUBLIC_SENDER_POSTCODE || '',
    country: process.env.NEXT_PUBLIC_SENDER_COUNTRY || 'GB',
  })

  const deliveryLabel = formatDeliveryMethod(deliveryMethod)

  const handlePrint = () => {
    const sender = getSender()
    const html =
      selectedStyle === 'branded'
        ? brandedLabelHtml(orderNumber, deliveryLabel, address, sender)
        : classicLabelHtml(orderNumber, deliveryLabel, address, sender)

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
          <div className="absolute right-0 top-full mt-2 z-50 bg-brand-surface border border-brand-border rounded-2xl shadow-xl p-4 w-72">
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
                  className={`p-3 rounded-xl border-2 text-left transition-colors ${
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
