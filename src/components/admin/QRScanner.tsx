'use client'

import { useEffect, useRef, useState } from 'react'

interface QRScannerProps {
  onScan: (text: string) => void
}

export function QRScanner({ onScan }: QRScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null)
  const html5QrRef = useRef<import('html5-qrcode').Html5Qrcode | null>(null)
  const [error, setError] = useState<string>('')
  const [active, setActive] = useState(false)

  const start = async () => {
    if (!scannerRef.current || html5QrRef.current) return
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('qr-reader')
      html5QrRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onScan(decodedText)
          scanner.stop().catch(() => {})
          html5QrRef.current = null
          setActive(false)
        },
        () => {}
      )
      setActive(true)
      setError('')
    } catch (err) {
      setError('Camera access denied or not available')
      console.error('QR Scanner error:', err)
    }
  }

  const stop = async () => {
    if (html5QrRef.current) {
      await html5QrRef.current.stop().catch(() => {})
      html5QrRef.current = null
      setActive(false)
    }
  }

  useEffect(() => {
    return () => {
      stop()
    }
  }, [])

  return (
    <div className="space-y-3">
      <div id="qr-reader" ref={scannerRef} className="w-full max-w-sm mx-auto rounded-xl overflow-hidden" />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2">
        {!active ? (
          <button
            onClick={start}
            className="px-4 py-2 text-sm font-medium bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 transition-colors"
          >
            Start Camera
          </button>
        ) : (
          <button
            onClick={stop}
            className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Stop Camera
          </button>
        )}
      </div>
    </div>
  )
}
