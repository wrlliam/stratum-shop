import { NextResponse } from 'next/server'
import { requireAdminOrSupport } from '@/lib/api-guard'
import { createSubscriber, EVENTS_CHANNEL } from '@/lib/redis'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const authResult = await requireAdminOrSupport()
  if (authResult instanceof NextResponse) return authResult

  const subscriber = createSubscriber()
  const encoder = new TextEncoder()

  let cleanup: (() => void) | undefined

  const stream = new ReadableStream({
    start(controller) {
      let hb: ReturnType<typeof setInterval> | undefined

      const doCleanup = () => {
        if (hb) clearInterval(hb)
        subscriber?.unsubscribe().catch(() => {})
        subscriber?.quit().catch(() => {})
      }
      cleanup = doCleanup

      // Initial connected ping
      try {
        controller.enqueue(encoder.encode('event: connected\ndata: {}\n\n'))
      } catch {}

      if (subscriber) {
        subscriber.subscribe(EVENTS_CHANNEL, (err) => {
          if (err) console.error('[SSE] Redis subscribe error:', err)
        })

        subscriber.on('message', (_channel: string, message: string) => {
          try {
            controller.enqueue(encoder.encode(`data: ${message}\n\n`))
          } catch {
            // Stream closed — clean up
            doCleanup()
          }
        })

        subscriber.on('error', () => {
          doCleanup()
        })
      }

      // Keep-alive heartbeat every 25s (Cloudflare/nginx timeout avoidance)
      hb = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch {
          doCleanup()
        }
      }, 25_000)
    },
    cancel() {
      cleanup?.()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
