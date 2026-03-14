import type { DeliveryAddress } from '@/types'

interface Sender {
  name: string
  line1: string
  city: string
  postcode: string
  country: string
}

export function getSender(): Sender {
  return {
    name: process.env.NEXT_PUBLIC_SENDER_NAME || 'Stratum',
    line1: process.env.NEXT_PUBLIC_SENDER_LINE1 || '',
    city: process.env.NEXT_PUBLIC_SENDER_CITY || '',
    postcode: process.env.NEXT_PUBLIC_SENDER_POSTCODE || '',
    country: process.env.NEXT_PUBLIC_SENDER_COUNTRY || 'GB',
  }
}

export function classicLabelHtml(
  orderNumber: string,
  deliveryLabel: string,
  address: DeliveryAddress,
  sender: Sender
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

export function brandedLabelHtml(
  orderNumber: string,
  deliveryLabel: string,
  address: DeliveryAddress,
  sender: Sender
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

export function bulkLabelsHtml(
  labels: { orderNumber: string; deliveryLabel: string; address: DeliveryAddress }[],
  style: 'classic' | 'branded',
  sender: Sender
): string {
  const labelBodies = labels.map((l) => {
    if (style === 'branded') {
      return `<div class="label">
    <div class="header">
      <span class="brand">STRATUM</span>
      <span class="order-num">${l.orderNumber}</span>
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
          <div class="name">${l.address.name}</div>
          <div>${l.address.line1}</div>
          ${l.address.line2 ? `<div>${l.address.line2}</div>` : ''}
          <div>${l.address.city}</div>
          ${l.address.county ? `<div>${l.address.county}</div>` : ''}
        </div>
      </div>
      <div class="footer">
        <span class="postcode">${l.address.postcode}</span>
        <span class="badge">${l.deliveryLabel}</span>
      </div>
    </div>
  </div>`
    }
    return `<div class="label">
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
        <div class="name">${l.address.name}</div>
        <div>${l.address.line1}</div>
        ${l.address.line2 ? `<div>${l.address.line2}</div>` : ''}
        <div>${l.address.city}</div>
        ${l.address.county ? `<div>${l.address.county}</div>` : ''}
        <div class="postcode">${l.address.postcode}</div>
      </div>
    </div>
    <div class="order-info">
      <span class="order-number">${l.orderNumber}</span>
      <span class="delivery-method">${l.deliveryLabel}</span>
    </div>
  </div>`
  })

  const cssBlock = style === 'branded'
    ? `* { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f4f8; display: flex; flex-direction: column; align-items: center; padding: 20mm; gap: 10mm; }
    .label { background: #fff; border-radius: 12px; overflow: hidden; width: 105mm; box-shadow: 0 4px 24px rgba(0,0,0,0.12); page-break-after: always; }
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
    @media print { body { background: none; padding: 0; } .label:last-child { page-break-after: avoid; } }`
    : `* { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; padding: 20mm; display: flex; flex-direction: column; align-items: flex-start; gap: 10mm; }
    .label { border: 2px solid #000; padding: 8mm; width: 100mm; page-break-after: always; }
    .section { margin-bottom: 6mm; }
    .section-title { font-size: 8pt; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 2mm; border-bottom: 1px solid #ccc; padding-bottom: 1mm; }
    .address { font-size: 12pt; line-height: 1.5; }
    .address .name { font-weight: bold; font-size: 13pt; }
    .address .postcode { font-weight: bold; font-size: 14pt; letter-spacing: 1px; }
    .order-info { display: flex; justify-content: space-between; align-items: center; border-top: 2px solid #000; padding-top: 4mm; margin-top: 4mm; }
    .order-number { font-weight: bold; font-size: 11pt; font-family: monospace; }
    .delivery-method { font-size: 9pt; background: #000; color: #fff; padding: 2mm 4mm; font-weight: bold; }
    @media print { body { padding: 0; } .label:last-child { page-break-after: avoid; } }`

  return `<!DOCTYPE html>
<html>
<head>
  <title>Shipping Labels (${labels.length})</title>
  <style>${cssBlock}</style>
</head>
<body>
  ${labelBodies.join('\n  ')}
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`
}
