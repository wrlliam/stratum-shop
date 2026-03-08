'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

interface QRCodeDisplayProps {
  value: string
  size?: number
  showBarcode?: boolean
}

export function QRCodeDisplay({ value, size = 160, showBarcode = false }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const barcodeRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: { dark: '#111127', light: '#ffffff' },
      })
    }
  }, [value, size])

  useEffect(() => {
    if (!showBarcode || !barcodeRef.current) return
    import('jsbarcode').then(({ default: JsBarcode }) => {
      try {
        JsBarcode(barcodeRef.current!, value, {
          format: 'CODE128',
          width: 2,
          height: 50,
          displayValue: false,
          margin: 4,
        })
      } catch {
        // value may not be encodable as barcode — silently ignore
      }
    })
  }, [value, showBarcode])

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas ref={canvasRef} />
      {showBarcode && <svg ref={barcodeRef} />}
    </div>
  )
}
