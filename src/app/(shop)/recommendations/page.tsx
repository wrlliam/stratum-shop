'use client'

import { useState } from 'react'
import { UploadIcon, PaperPlaneIcon, CheckCircledIcon, LightningBoltIcon } from '@radix-ui/react-icons'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import toast from 'react-hot-toast'

export default function RecommendationsPage() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    description: '',
    referenceUrl: '',
    imageUrl: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

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
        body: JSON.stringify(form),
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
            Thanks for your suggestion! We review all requests and will be in touch if we decide
            to add it to the collection.
          </p>
          <Button variant="primary" onClick={() => setSubmitted(false)}>
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
            Don&apos;t see what you&apos;re looking for? Tell us what you&apos;d like to see
            in the shop. We review all requests and may add popular ones to our collection.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-brand-border rounded-2xl p-8 space-y-5 shadow-card">
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
            placeholder="Describe what you have in mind — dimensions, style, purpose, and any other details that would help us understand your vision..."
            rows={5}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            error={errors.description}
          />

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
              className={`relative flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
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
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                  <div>
                    <p className="text-sm font-medium text-brand-text">Image uploaded</p>
                    <p className="text-xs text-brand-muted mt-0.5">Click to change</p>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <UploadIcon className="w-6 h-6 text-brand-muted mx-auto mb-2" />
                  <p className="text-sm text-brand-muted">
                    {uploading ? 'Uploading...' : 'Click or drag to upload'}
                  </p>
                  <p className="text-xs text-brand-muted mt-1">PNG, JPG, WEBP up to 10MB</p>
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
            Submit Request
          </Button>

          <p className="text-xs text-brand-muted text-center">
            We review all requests within 5-7 business days. No guarantees, but we love a good challenge!
          </p>
        </form>
      </div>
    </div>
  )
}
