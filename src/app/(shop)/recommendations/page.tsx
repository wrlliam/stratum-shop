'use client'

import { useState } from 'react'
import { UploadIcon, PaperPlaneIcon, CheckCircledIcon, LightningBoltIcon, CubeIcon } from '@radix-ui/react-icons'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import toast from 'react-hot-toast'
import { parseModelFile, type ModelInfo } from '@/lib/model-parser'
import { calculatePrice, estimateFromVolume, PRICING_DEFAULTS } from '@/lib/pricing'
import { formatPrice } from '@/lib/utils'

export default function RecommendationsPage() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingModel, setUploadingModel] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    description: '',
    referenceUrl: '',
    imageUrl: '',
    modelFileUrl: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null)
  const [modelFileName, setModelFileName] = useState<string | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  // Quote calculated from model info
  const quote = modelInfo ? (() => {
    const est = estimateFromVolume(modelInfo.volumeCm3)
    const inputs = {
      ...PRICING_DEFAULTS,
      printTimeHours: est.printTimeHours,
      printTimeMinutes: est.printTimeMinutes,
      filamentUsedGrams: est.filamentGrams,
    }
    const result = calculatePrice(inputs)
    return { ...result, ...est, volumeCm3: modelInfo.volumeCm3, boundingBox: modelInfo.boundingBox, triangleCount: modelInfo.triangleCount }
  })() : null

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('files', file)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')

      const data = await res.json()
      const url = data.urls[0]
      setForm((prev) => ({ ...prev, imageUrl: url }))
      setPreviewUrl(URL.createObjectURL(file))
    } catch {
      toast.error('Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleModelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !['stl', '3mf'].includes(ext)) {
      toast.error('Only STL and 3MF files are accepted')
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File exceeds 50MB limit')
      return
    }

    setUploadingModel(true)
    setParseError(null)
    setModelInfo(null)
    setModelFileName(file.name)

    try {
      // Parse the file client-side first for instant quote
      try {
        const info = await parseModelFile(file)
        setModelInfo(info)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Could not parse file'
        setParseError(msg)
        // Still upload the file even if parsing fails
      }

      // Upload the file to the server
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload/model', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      setForm((prev) => ({ ...prev, modelFileUrl: data.url }))
    } catch {
      toast.error('File upload failed')
      setModelFileName(null)
    } finally {
      setUploadingModel(false)
    }
  }

  const clearModel = () => {
    setModelInfo(null)
    setModelFileName(null)
    setParseError(null)
    setForm((prev) => ({ ...prev, modelFileUrl: '' }))
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!form.name.trim()) newErrors.name = 'Name is required'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Valid email is required'
    }
    if (!form.description.trim() || form.description.trim().length < 10) {
      newErrors.description = 'Please provide at least 10 characters'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          description: form.description,
          ...(form.imageUrl && { imageUrl: form.imageUrl }),
          ...(form.referenceUrl && { referenceUrl: form.referenceUrl }),
          ...(form.modelFileUrl && { modelFileUrl: form.modelFileUrl }),
          ...(modelInfo && { estimatedVolumeCm3: Math.round(modelInfo.volumeCm3) }),
          ...(quote && { estimatedPricePence: quote.priceWithVat }),
        }),
      })

      if (!res.ok) throw new Error('Submission failed')

      setSubmitted(true)
    } catch {
      toast.error('Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-brand-bg">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-6">
            <CheckCircledIcon className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-brand-text mb-3">Request Received!</h1>
          <p className="text-brand-muted mb-6 leading-relaxed">
            Thanks for your submission! We review all requests and will be in touch
            {quote ? ` with a final quote based on your estimated ${formatPrice(quote.priceWithVat)} (inc. VAT).` : ' if we decide to add it to the collection.'}
          </p>
          <Button variant="primary" onClick={() => { setSubmitted(false); clearModel() }}>
            Submit Another
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-brand-bg">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-blue-light border border-brand-blue/20 mb-5">
            <LightningBoltIcon className="w-6 h-6 text-brand-blue" />
          </div>
          <p className="text-xs font-semibold text-brand-blue uppercase tracking-widest mb-2">
            Custom Prints
          </p>
          <h1 className="text-4xl font-bold text-brand-text mb-4">Request a Print</h1>
          <p className="text-brand-muted leading-relaxed max-w-lg mx-auto">
            Upload your STL or 3MF file and get an instant rough quote, or describe what you&apos;d like printed.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-brand-surface border border-brand-border rounded-2xl p-8 space-y-5 shadow-card">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Your Name"
              placeholder="Jane Smith"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              error={errors.name}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="jane@example.com"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              error={errors.email}
            />
          </div>

          <Textarea
            label="What would you like us to print?"
            placeholder="Describe what you have in mind — dimensions, material preferences, colour, quantity, and any other details..."
            rows={4}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            error={errors.description}
          />

          {/* 3D Model Upload */}
          <div>
            <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-1.5">
              Upload 3D Model (STL / 3MF)
            </label>
            {modelFileName ? (
              <div className="border border-brand-border rounded-xl p-4 bg-brand-arctic/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-blue-light flex items-center justify-center">
                      <CubeIcon className="w-5 h-5 text-brand-blue" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-brand-text">{modelFileName}</p>
                      {uploadingModel && <p className="text-xs text-brand-muted">Uploading & analysing...</p>}
                      {modelInfo && (
                        <p className="text-xs text-brand-muted">
                          {modelInfo.triangleCount.toLocaleString()} triangles &middot; {modelInfo.volumeCm3.toFixed(1)} cm&sup3;
                        </p>
                      )}
                      {parseError && (
                        <p className="text-xs text-amber-600">File uploaded but could not parse for quote: {parseError}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearModel}
                    className="text-xs text-brand-muted hover:text-red-500 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label
                className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-brand-border hover:border-brand-blue/40 rounded-xl cursor-pointer transition-all duration-200 bg-brand-arctic/50 hover:bg-brand-arctic"
              >
                <CubeIcon className="w-6 h-6 text-brand-muted mb-2" />
                <p className="text-sm text-brand-muted">
                  Click to upload STL or 3MF file
                </p>
                <p className="text-xs text-brand-muted mt-1">Up to 50MB &middot; We&apos;ll estimate a price instantly</p>
                <input
                  type="file"
                  accept=".stl,.3mf"
                  className="sr-only"
                  onChange={handleModelUpload}
                  disabled={uploadingModel}
                />
              </label>
            )}
          </div>

          {/* Instant Quote */}
          {quote && (
            <div className="border border-brand-blue/30 bg-brand-blue/5 rounded-xl p-5">
              <h3 className="text-sm font-bold text-brand-text mb-3 flex items-center gap-2">
                <LightningBoltIcon className="w-4 h-4 text-brand-blue" />
                Rough Estimate
              </h3>

              {/* Model dimensions */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-2 bg-brand-surface rounded-lg border border-brand-border">
                  <p className="text-[10px] text-brand-muted uppercase tracking-wider">Width</p>
                  <p className="text-sm font-semibold text-brand-text">{quote.boundingBox.x.toFixed(1)}mm</p>
                </div>
                <div className="text-center p-2 bg-brand-surface rounded-lg border border-brand-border">
                  <p className="text-[10px] text-brand-muted uppercase tracking-wider">Depth</p>
                  <p className="text-sm font-semibold text-brand-text">{quote.boundingBox.y.toFixed(1)}mm</p>
                </div>
                <div className="text-center p-2 bg-brand-surface rounded-lg border border-brand-border">
                  <p className="text-[10px] text-brand-muted uppercase tracking-wider">Height</p>
                  <p className="text-sm font-semibold text-brand-text">{quote.boundingBox.z.toFixed(1)}mm</p>
                </div>
              </div>

              {/* Cost breakdown */}
              <div className="space-y-1.5 text-sm mb-3">
                <div className="flex justify-between text-brand-muted">
                  <span>Volume</span>
                  <span>{quote.volumeCm3.toFixed(1)} cm&sup3;</span>
                </div>
                <div className="flex justify-between text-brand-muted">
                  <span>Est. filament</span>
                  <span>~{quote.filamentGrams}g</span>
                </div>
                <div className="flex justify-between text-brand-muted">
                  <span>Est. print time</span>
                  <span>~{quote.printTimeHours}h {quote.printTimeMinutes}m</span>
                </div>
                <div className="flex justify-between text-brand-muted">
                  <span>Material cost</span>
                  <span>{formatPrice(quote.filamentCost)}</span>
                </div>
                <div className="flex justify-between text-brand-muted">
                  <span>Electricity</span>
                  <span>{formatPrice(quote.electricityCost)}</span>
                </div>
                <div className="flex justify-between text-brand-muted">
                  <span>Labour</span>
                  <span>{formatPrice(quote.labourCost)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-brand-border">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-brand-text">Estimated Price (inc. VAT)</span>
                  <span className="text-xl font-bold text-brand-blue">{formatPrice(quote.priceWithVat)}</span>
                </div>
              </div>

              <p className="text-[11px] text-brand-muted mt-3 leading-relaxed">
                This is a rough estimate based on standard PLA at 20% infill. Final price may vary based
                on material choice, complexity, supports needed, and finishing requirements. We&apos;ll
                confirm the exact price before printing.
              </p>
            </div>
          )}

          <Input
            label="Reference URL (optional)"
            type="url"
            placeholder="https://example.com/reference-image"
            value={form.referenceUrl}
            onChange={(e) => setForm((p) => ({ ...p, referenceUrl: e.target.value }))}
            hint="Link to a reference image or similar product"
          />

          {/* Image upload */}
          <div>
            <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-1.5">
              Upload Reference Image (optional)
            </label>
            <label
              className={`relative flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
                previewUrl
                  ? 'border-brand-blue/50 bg-brand-arctic'
                  : 'border-brand-border hover:border-brand-slate bg-brand-arctic/50 hover:bg-brand-arctic'
              }`}
            >
              {previewUrl ? (
                <div className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  <div>
                    <p className="text-sm font-medium text-brand-text">Image uploaded</p>
                    <p className="text-xs text-brand-muted mt-0.5">Click to change</p>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <UploadIcon className="w-5 h-5 text-brand-muted mx-auto mb-1.5" />
                  <p className="text-sm text-brand-muted">
                    {uploading ? 'Uploading...' : 'Click to upload a reference image'}
                  </p>
                  <p className="text-xs text-brand-muted mt-0.5">PNG, JPG, WEBP up to 10MB</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleImageUpload}
                disabled={uploading}
              />
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            className="group mt-2"
          >
            <PaperPlaneIcon className="w-4 h-4" />
            {quote ? 'Submit Request with Quote' : 'Submit Request'}
          </Button>

          <p className="text-xs text-brand-muted text-center">
            We review all requests within 5-7 business days. {quote ? 'The final price will be confirmed before we start printing.' : 'No guarantees, but we love a good challenge!'}
          </p>
        </form>
      </div>
    </div>
  )
}
