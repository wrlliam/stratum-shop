'use client'

import { useState, useEffect, use, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { markdownToHtml } from '@/lib/utils'
import { ImageIcon, Cross1Icon } from '@radix-ui/react-icons'

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

const STATUS_OPTS = ['open', 'in_progress', 'resolved', 'closed'] as const
const STATUS_COLORS: Record<string, string> = {
  open: 'bg-amber-50 text-amber-700',
  in_progress: 'bg-blue-50 text-blue-700',
  resolved: 'bg-green-50 text-green-700',
  closed: 'bg-brand-arctic text-brand-muted',
}

function MarkdownBody({ content }: { content: string }) {
  return (
    <div
      className="text-sm text-brand-text leading-relaxed [&_strong]:font-semibold [&_em]:italic [&_code]:bg-brand-arctic [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-xs [&_a]:text-brand-blue [&_a]:underline [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-1 [&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-2"
      dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
    />
  )
}

export default function SupportTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [attachment, setAttachment] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState<string>('open')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/support/tickets/${id}`)
      .then((r) => r.json())
      .then((d) => { setTicket(d); setStatus(d.status) })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (ticket) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
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

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reply.trim() && !attachment) return
    setSending(true)
    try {
      const res = await fetch(`/api/support/tickets/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: reply || '(image attached)',
          status,
          ...(attachment ? { attachmentUrl: attachment } : {}),
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const msg = await res.json()
      setTicket((prev) => prev ? { ...prev, messages: [...prev.messages, msg], status } : prev)
      setReply('')
      setAttachment(null)
      toast.success('Reply sent')
    } catch {
      toast.error('Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await fetch(`/api/support/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      setStatus(newStatus)
      setTicket((prev) => prev ? { ...prev, status: newStatus } : prev)
      toast.success('Status updated')
    } catch {
      toast.error('Failed to update status')
    }
  }

  const [closing, setClosing] = useState(false)
  const handleQuickClose = async () => {
    if (!confirm('Close this ticket? An automated message will be sent to the customer.')) return
    setClosing(true)
    try {
      const closeMessage = 'This ticket has been closed by the support team. If you need further help, feel free to open a new ticket or reply here at any time — we\'re happy to assist!'
      const res = await fetch(`/api/support/tickets/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: closeMessage, status: 'closed' }),
      })
      if (!res.ok) throw new Error('Failed')
      const msg = await res.json()
      setTicket((prev) => prev ? { ...prev, messages: [...prev.messages, msg], status: 'closed' } : prev)
      setStatus('closed')
      toast.success('Ticket closed')
    } catch {
      toast.error('Failed to close ticket')
    } finally {
      setClosing(false)
    }
  }

  if (loading) {
    return <div className="p-8 flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full" /></div>
  }
  if (!ticket) return <div className="p-8 text-brand-muted">Ticket not found</div>

  return (
    <div className="p-8">
      <Link href="/admin/support" className="text-brand-muted hover:text-brand-text text-sm mb-6 inline-block">← Support</Link>

      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-brand-text">{ticket.subject}</h1>
          <p className="text-sm text-brand-muted mt-1">
            {ticket.name} · {ticket.email} · {new Date(ticket.createdAt).toLocaleDateString('en-GB')}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${STATUS_COLORS[ticket.status] ?? ''}`}>
            {ticket.status.replace('_', ' ')}
          </span>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="text-sm border border-brand-border rounded-lg px-2 py-1.5 focus:outline-none"
          >
            {STATUS_OPTS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          {ticket.status !== 'closed' && (
            <button
              onClick={handleQuickClose}
              disabled={closing}
              className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              {closing ? 'Closing…' : 'Close Ticket'}
            </button>
          )}
        </div>
      </div>

      {/* Thread */}
      <div className="space-y-4 mb-6">
        {ticket.messages.map((msg) => {
          const isStaff = !!msg.senderUserId && msg.senderEmail !== ticket.email
          return (
            <div
              key={msg.id}
              className={`rounded-2xl p-5 ${isStaff
                ? 'bg-brand-blue-light border border-brand-blue/20 ml-8'
                : 'bg-brand-surface border border-brand-border'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-brand-text">
                  {isStaff ? 'Support Team' : ticket.name}
                  <span className="font-normal text-brand-muted ml-1">({msg.senderEmail})</span>
                </p>
                <p className="text-xs text-brand-muted">
                  {new Date(msg.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
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
      <form onSubmit={handleReply} className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-card">
        <h2 className="text-sm font-bold text-brand-text mb-3">Reply</h2>
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Write your reply… (Markdown supported: **bold**, *italic*, `code`, [links](url))"
          rows={6}
          className="w-full px-3 py-2.5 text-sm border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue resize-none mb-3"
        />

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
          <div className="flex items-center gap-2">
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
            <div className="flex items-center gap-2">
              <label className="text-xs text-brand-muted">Mark as:</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="text-sm border border-brand-border rounded-lg px-2 py-1 focus:outline-none"
              >
                {STATUS_OPTS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={sending || uploading || (!reply.trim() && !attachment)}
            className="px-5 py-2 text-sm font-semibold bg-brand-blue text-white rounded-xl hover:bg-brand-blue/90 disabled:opacity-50"
          >
            {sending ? 'Sending…' : 'Send Reply'}
          </button>
        </div>
      </form>
    </div>
  )
}
