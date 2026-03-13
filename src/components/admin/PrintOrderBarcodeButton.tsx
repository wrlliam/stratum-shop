'use client'

import { Button } from '@/components/ui/Button'

interface Props {
  orderId: string
  orderNumber: string
}

function barcodeLabelHtml(orderId: string, orderNumber: string) {
  const scanUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/admin/inventory/scan?order=${orderId}`

  return `<!DOCTYPE html>
<html>
<head>
  <title>Order Barcode - ${orderNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: flex-start; justify-content: center; padding: 10mm; }
    .label { text-align: center; width: 60mm; padding: 4mm; border: 1px dashed #ccc; }
    .order-number { font-size: 14pt; font-weight: 900; font-family: monospace; letter-spacing: 1px; margin-bottom: 3mm; color: #1a1a2e; }
    #qr-canvas { margin: 0 auto 3mm; display: block; }
    #barcode-svg { display: block; margin: 0 auto; }
    @media print { body { padding: 0; } .label { border: none; } }
  </style>
</head>
<body>
  <div class="label">
    <div class="order-number">${orderNumber}</div>
    <canvas id="qr-canvas"></canvas>
    <svg id="barcode-svg"></svg>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
  <script>
    QRCode.toCanvas(document.getElementById('qr-canvas'), ${JSON.stringify(scanUrl)}, {
      width: 160,
      margin: 2,
      color: { dark: '#111127', light: '#ffffff' },
    }, function() {
      try {
        JsBarcode('#barcode-svg', ${JSON.stringify(orderId)}, {
          format: 'CODE128',
          width: 1.5,
          height: 40,
          displayValue: false,
          margin: 2,
        });
      } catch(e) {}
      setTimeout(function() { window.print(); }, 300);
    });
  <\/script>
</body>
</html>`
}

function bulkBarcodeLabelHtml(orders: { id: string; orderNumber: string }[]) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  const labelsHtml = orders
    .map(
      (o) => `
    <div class="label" data-id="${o.id}" data-url="${origin}/admin/inventory/scan?order=${o.id}">
      <div class="order-number">${o.orderNumber}</div>
      <canvas class="qr-canvas"></canvas>
      <svg class="barcode-svg"></svg>
    </div>`
    )
    .join('')

  return `<!DOCTYPE html>
<html>
<head>
  <title>Order Barcodes</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 10mm; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6mm; }
    .label { text-align: center; padding: 4mm; border: 1px dashed #ccc; break-inside: avoid; }
    .order-number { font-size: 12pt; font-weight: 900; font-family: monospace; letter-spacing: 1px; margin-bottom: 2mm; color: #1a1a2e; }
    .qr-canvas { display: block; margin: 0 auto 2mm; }
    .barcode-svg { display: block; margin: 0 auto; }
    @media print { body { padding: 0; } .label { border: none; } }
  </style>
</head>
<body>
  <div class="grid">${labelsHtml}</div>
  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
  <script>
    var labels = document.querySelectorAll('.label');
    var done = 0;
    labels.forEach(function(label) {
      var canvas = label.querySelector('.qr-canvas');
      var svg = label.querySelector('.barcode-svg');
      var url = label.dataset.url;
      var id = label.dataset.id;
      QRCode.toCanvas(canvas, url, { width: 120, margin: 2, color: { dark: '#111127', light: '#ffffff' } }, function() {
        try { JsBarcode(svg, id, { format: 'CODE128', width: 1.2, height: 30, displayValue: false, margin: 2 }); } catch(e) {}
        done++;
        if (done === labels.length) setTimeout(function() { window.print(); }, 300);
      });
    });
  <\/script>
</body>
</html>`
}

export function PrintOrderBarcodeButton({ orderId, orderNumber }: Props) {
  const handlePrint = () => {
    const html = barcodeLabelHtml(orderId, orderNumber)
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={handlePrint}>
      Print Barcode
    </Button>
  )
}

export function printBulkBarcodes(orders: { id: string; orderNumber: string }[]) {
  const html = bulkBarcodeLabelHtml(orders)
  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}
