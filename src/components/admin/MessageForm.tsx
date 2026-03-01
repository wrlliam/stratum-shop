'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import toast from 'react-hot-toast'
import type { OrderMessage } from '@/lib/db/schema'

interface MessageFormProps {
  orderId: string
  messages: OrderMessage[]
}

export function MessageForm({ orderId, messages }: MessageFormProps) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error('Subject and message are required')
      return
    }

    setSending(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), body: body.trim() }),
      })

      if (!res.ok) throw new Error('Failed to send')
      toast.success('Message sent to customer')
      setSubject('')
      setBody('')
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      {/* Timeline of sent messages */}
      {messages.length > 0 && (
        <div className="mb-6 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="border-l-2 border-brand-blue/30 pl-4">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-semibold text-brand-text">{msg.subject}</p>
                <span className="text-2xs text-brand-muted">
                  {new Date(msg.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-xs text-brand-muted whitespace-pre-wrap">{msg.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* Send form */}
      <div className="space-y-3">
        <Input
          label="Subject"
          placeholder="e.g. Update on your order"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={200}
        />
        <Textarea
          label="Message"
          placeholder="Write your message to the customer..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          rows={4}
        />
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="sm"
            onClick={handleSend}
            loading={sending}
            disabled={!subject.trim() || !body.trim()}
          >
            Send Message
          </Button>
        </div>
      </div>
    </div>
  )
}
