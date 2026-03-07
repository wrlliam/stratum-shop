'use client'

import { useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import { formatPrice } from '@/lib/utils'
import type { AdminEvent } from '@/lib/redis'

interface Props {
  /** Called whenever an event arrives that should invalidate the stats cache */
  onStatsInvalidated?: () => void
  /** Called for new support ticket events so the support page can refresh */
  onTicketEvent?: () => void
}

export function RealtimeAdmin({ onStatsInvalidated, onTicketEvent }: Props) {
  const esRef = useRef<EventSource | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const connect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close()
    }

    const es = new EventSource('/api/admin/events')
    esRef.current = es

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as AdminEvent & { ts?: number }

        switch (event.type) {
          case 'new_order':
            toast.success(
              `New order ${event.orderNumber} — ${formatPrice(event.total)}`,
              { duration: 6000, icon: '🛍️' },
            )
            onStatsInvalidated?.()
            break

          case 'low_stock':
            toast(
              `Low stock: ${event.name} (${event.stock} left)`,
              { duration: 8000, icon: '⚠️' },
            )
            break

          case 'new_ticket':
            toast(
              `New support ticket from ${event.name}`,
              { duration: 8000, icon: '🎫' },
            )
            onTicketEvent?.()
            onStatsInvalidated?.()
            break

          case 'ticket_updated':
            onTicketEvent?.()
            break

          case 'stats_invalidated':
            onStatsInvalidated?.()
            break
        }
      } catch {}
    }

    es.addEventListener('connected', () => {
      // Clear any pending reconnect
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
    })

    es.onerror = () => {
      es.close()
      esRef.current = null
      // Reconnect after 5 seconds
      reconnectTimer.current = setTimeout(connect, 5000)
    }
  }, [onStatsInvalidated, onTicketEvent])

  useEffect(() => {
    connect()
    return () => {
      esRef.current?.close()
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
    }
  }, [connect])

  // Renders nothing — purely side-effect
  return null
}
