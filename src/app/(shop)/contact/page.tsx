'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { EnvelopeClosedIcon, UploadIcon, Cross1Icon } from '@radix-ui/react-icons'
import toast from 'react-hot-toast'

const ACCEPTED_MODEL_TYPES = '.stl,.3mf,.obj,.step,.stp,.zip'
const MAX_MODEL_SIZE_MB = 50

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    orderNumber: '',
    message: '',
  })
  const [modelFile, setModelFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (!file) return
    if (file.size > MAX_MODEL_SIZE_MB * 1024 * 1024) {
      toast.error(`File must be under ${MAX_MODEL_SIZE_MB}MB`)
      return
    }
    setModelFile(file)
  }

  const removeFile = () => {
    setModelFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      let modelUrl: string | undefined
      let modelName: string | undefined

      // Upload model file first if present
      if (modelFile) {
        const fd = new FormData()
        fd.append('file', modelFile)
        const uploadRes = await fetch('/api/contact/upload', { method: 'POST', body: fd })
        if (!uploadRes.ok) {
          const err = await uploadRes.json()
          throw new Error(err.error || 'File upload failed')
        }
        const uploadData = await uploadRes.json()
        modelUrl = uploadData.url
        modelName = uploadData.name
      }

      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: form.orderNumber ? `Order enquiry: ${form.orderNumber}` : 'Customer enquiry',
          body: modelUrl
            ? `${form.message}\n\nAttached file: ${modelUrl}`
            : form.message,
          orderNumber: form.orderNumber || undefined,
        }),
      })

      if (!res.ok) throw new Error('Failed to send')

      setSent(true)
      toast.success('Message sent!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send message. Please try emailing us directly.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-[10px] font-mono text-brand-blue uppercase tracking-[0.2em] mb-2">
          Get in Touch
        </p>
        <h1 className="text-3xl font-display text-brand-text mb-8">Contact Us</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Info */}
          <div className="lg:col-span-2 space-y-6">
            <p className="text-sm text-brand-muted leading-relaxed">
              Got a question about an order, a product, or just want to say hello?
              We&apos;d love to hear from you.
            </p>

            <div className="p-4 bg-brand-surface border border-brand-border rounded-sm">
              <div className="flex items-center gap-2 mb-2">
                <EnvelopeClosedIcon className="w-4 h-4 text-brand-blue" />
                <p className="text-sm font-semibold text-brand-text">Email</p>
              </div>
              <p className="text-sm text-brand-muted">hello@stratum3d.co.uk</p>
            </div>

            <div className="p-4 bg-brand-surface border border-brand-border rounded-sm">
              <p className="text-sm font-semibold text-brand-text mb-1">Response Time</p>
              <p className="text-xs text-brand-muted">
                We aim to reply within 24 hours on business days.
              </p>
            </div>

            <div className="p-4 bg-brand-surface border border-brand-border rounded-sm">
              <p className="text-sm font-semibold text-brand-text mb-1">Custom Prints</p>
              <p className="text-xs text-brand-muted">
                Requesting a custom print? Attach your model file (.STL, .3MF, .OBJ, .STEP) to get a faster quote.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            {sent ? (
              <div className="text-center py-12 bg-brand-surface border border-brand-border rounded-sm">
                <div className="text-4xl mb-4">✉️</div>
                <h3 className="text-lg font-semibold text-brand-text mb-2">Message Sent</h3>
                <p className="text-sm text-brand-muted">
                  Thanks for reaching out! We&apos;ll get back to you as soon as possible.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-brand-surface border border-brand-border rounded-sm p-6 space-y-4 shadow-card">
                <Input
                  label="Name *"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                />
                <Input
                  label="Email *"
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                />
                <Input
                  label="Order Number"
                  placeholder="STR-XXXXX (optional)"
                  value={form.orderNumber}
                  onChange={(e) => set('orderNumber', e.target.value)}
                />
                <Textarea
                  label="Message *"
                  placeholder="How can we help?"
                  rows={5}
                  value={form.message}
                  onChange={(e) => set('message', e.target.value)}
                />

                {/* Model file upload */}
                <div>
                  <label className="block text-sm font-medium text-brand-text mb-1.5">
                    Attach Model File
                    <span className="ml-1.5 text-xs font-normal text-brand-muted">(optional)</span>
                  </label>
                  {modelFile ? (
                    <div className="flex items-center gap-3 px-3 py-2.5 bg-brand-arctic border border-brand-border rounded-sm">
                      <span className="text-sm text-brand-text flex-1 truncate">{modelFile.name}</span>
                      <span className="text-xs text-brand-muted shrink-0">
                        {(modelFile.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="p-0.5 text-brand-muted hover:text-red-500 transition-colors shrink-0"
                      >
                        <Cross1Icon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-2 px-3 py-2.5 border border-dashed border-brand-border rounded-sm text-sm text-brand-muted hover:text-brand-text hover:border-brand-slate transition-colors"
                    >
                      <UploadIcon className="w-4 h-4 shrink-0" />
                      <span>Upload .STL, .3MF, .OBJ, .STEP or .ZIP</span>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_MODEL_TYPES}
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                  <p className="text-[11px] text-brand-muted mt-1">Max {MAX_MODEL_SIZE_MB}MB</p>
                </div>

                <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
                  Send Message
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
