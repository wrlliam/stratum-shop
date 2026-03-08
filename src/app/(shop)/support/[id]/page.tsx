'use client'

import { useState, useEffect, use, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { markdownToHtml } from '@/lib/utils'
import { ImageIcon, Cross1Icon, CheckCircledIcon, PaperPlaneIcon } from '@radix-ui/react-icons'

interface Message {
  id: string
  senderEmail: string
  senderUserId: string | null
  body: string
  attachmentUrl: string | null
  createdAt: string
}

interface Ticket {
  id: string
  name: string
  email: string
  subject: string
  status: string
  createdAt: string
  messages: Message[]
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-amber-50 text-amber-700 border-amber-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  resolved: 'bg-green-50 text-green-700 border-green-200',
  closed: 'bg-brand-arctic text-brand-muted border-brand-border',
}

function MarkdownBody({ content }: { content: string }) {
  return (
    <div
      className="text-sm text-brand-text leading-relaxed [&_strong]:font-semibold [&_em]:italic [&_code]:bg-brand-arctic [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-xs [&_a]:text-brand-blue [&_a]:underline [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-1 [&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-2"
      dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
    />
  )
}

export default function CustomerTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [attachment, setAttachment] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/support/tickets/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found')
        return r.json()
      })
      .then((d) => setTicket(d))
      .catch(() => setTicket(null))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (ticket) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [ticket?.messages.length])

  const handleImageUpload = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload/support', { method: 'POST', body: fd })
      if (!res.ok) throw new Error((await res.json()).error || 'Upload failed')
      const data = await res.json()
      setAttachment(data.url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reply.trim() && !attachment) return
    setSending(true)
    try {
      const res = await fetch(`/api/support/tickets/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: reply || '(image attached)',
          ...(attachment ? { attachmentUrl: attachment } : {}),
        }),
      })
      if (!res.ok) throw new Error('Failed to send')
      const msg = await res.json()
      setTicket((prev) => prev ? { ...prev, messages: [...prev.messages, msg] } : prev)
      setReply('')
      setAttachment(null)
      toast.success('Reply sent')
    } catch {
      toast.error('Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 pt-24 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 pt-24 text-center">
        <p className="text-brand-muted mb-4">Ticket not found or you don't have access.</p>
        <Link href="/support" className="text-brand-blue hover:underline text-sm">← Back to support</Link>
      </div>
    )
  }

  const isClosed = ['resolved', 'closed'].includes(ticket.status)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pt-24">
      {/* Header */}
      <div className="mb-6">
        <Link href="/support" className="text-sm text-brand-muted hover:text-brand-blue transition-colors mb-4 inline-block">
          ← My Tickets
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-brand-text">{ticket.subject}</h1>
            <p className="text-xs text-brand-muted mt-1">
              Opened {new Date(ticket.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              {' · '}ref <span className="font-mono font-semibold">{ticket.id.slice(0, 8).toUpperCase()}</span>
            </p>
          </div>
          <span className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${STATUS_COLORS[ticket.status] ?? ''}`}>
            {ticket.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Thread */}
      <div className="space-y-4 mb-6">
        {ticket.messages.map((msg) => {
          const isStaff = msg.senderEmail !== ticket.email
          return (
            <div
              key={msg.id}
              className={`rounded-2xl p-5 ${isStaff
                ? 'bg-brand-arctic border border-brand-border'
                : 'bg-brand-surface border border-brand-border'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isStaff ? 'bg-brand-blue text-white' : 'bg-brand-arctic text-brand-text border border-brand-border'}`}>
                    {isStaff ? 'S' : ticket.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-brand-text">
                    {isStaff ? 'Stratum Support' : 'You'}
                  </span>
                </div>
                <span className="text-xs text-brand-muted">
                  {new Date(msg.createdAt).toLocaleString('en-GB', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
              <MarkdownBody content={msg.body} />
              {msg.attachmentUrl && (
                <div className="mt-3">
                  <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer">
                    <Image
                      src={msg.attachmentUrl}
                      alt="Attachment"
                      width={400}
                      height={300}
                      className="max-w-full rounded-xl border border-brand-border object-contain"
                    />
                  </a>
                </div>
              )}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Reply form */}
      {isClosed ? (
        <div className="flex items-center gap-2 p-4 bg-brand-arctic border border-brand-border rounded-2xl text-sm text-brand-muted">
          <CheckCircledIcon className="w-4 h-4 text-green-600 shrink-0" />
          This ticket is {ticket.status}. <Link href="/contact" className="text-brand-blue hover:underline ml-1">Open a new ticket</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-card">
          <h2 className="text-sm font-bold text-brand-text mb-3">Reply</h2>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write your reply… (Markdown supported: **bold**, *italic*, `code`, [links](url))"
            rows={5}
            className="w-full px-3 py-2.5 text-sm border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue resize-none mb-3"
          />

          {/* Attachment preview */}
          {attachment && (
            <div className="relative inline-block mb-3">
              <Image src={attachment} alt="Attachment" width={120} height={90} className="rounded-xl border border-brand-border object-cover" />
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-brand-surface border border-brand-border rounded-full flex items-center justify-center text-brand-muted hover:text-red-500"
              >
                <Cross1Icon className="w-2.5 h-2.5" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <label className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-brand-border cursor-pointer transition-colors ${uploading ? 'text-brand-blue border-brand-blue' : 'text-brand-muted hover:text-brand-text hover:border-brand-slate'}`}>
              {uploading
                ? <div className="animate-spin w-3.5 h-3.5 border-2 border-brand-blue border-t-transparent rounded-full" />
                : <ImageIcon className="w-3.5 h-3.5" />
              }
              {uploading ? 'Uploading…' : 'Attach image'}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f) }}
              />
            </label>
            <button
              type="submit"
              disabled={sending || uploading || (!reply.trim() && !attachment)}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-brand-blue text-white rounded-xl hover:bg-brand-blue-dark disabled:opacity-50 transition-colors"
            >
              <PaperPlaneIcon className="w-3.5 h-3.5" />
              {sending ? 'Sending…' : 'Send Reply'}
            </button>
          </div>
          <p className="text-xs text-brand-muted mt-2">Supports **bold**, *italic*, `code`, and [links](url)</p>
        </form>
      )}
    </div>
  )
}
