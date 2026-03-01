'use client'

import { Button } from '@/components/ui/Button'
import type { DeliveryAddress } from '@/types'

interface Props {
  orderNumber: string
  deliveryMethod: string
  address: DeliveryAddress
}

export function PrintLabelButton({ orderNumber, deliveryMethod, address }: Props) {
  const handlePrint = () => {
    const senderName = process.env.NEXT_PUBLIC_SENDER_NAME || 'Stratum'
    const senderLine1 = process.env.NEXT_PUBLIC_SENDER_LINE1 || ''
    const senderCity = process.env.NEXT_PUBLIC_SENDER_CITY || ''
    const senderPostcode = process.env.NEXT_PUBLIC_SENDER_POSTCODE || ''
    const senderCountry = process.env.NEXT_PUBLIC_SENDER_COUNTRY || 'GB'

    const deliveryLabel = deliveryMethod.replace('royal_mail_', '').replace(/_/g, ' ').toUpperCase()

    const html = `<!DOCTYPE html>
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
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="label">
    <div class="section">
      <div class="section-title">From</div>
      <div class="address" style="font-size: 10pt;">
        <div>${senderName}</div>
        ${senderLine1 ? `<div>${senderLine1}</div>` : ''}
        ${senderCity ? `<div>${senderCity}</div>` : ''}
        ${senderPostcode ? `<div>${senderPostcode}</div>` : ''}
        <div>${senderCountry}</div>
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

    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={handlePrint}>
      Print Label
    </Button>
  )
}
