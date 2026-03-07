import Redis from 'ioredis'

export type AdminEvent =
  | { type: 'new_order'; orderId: string; orderNumber: string; total: number; email: string }
  | { type: 'low_stock'; productId: string; name: string; stock: number }
  | { type: 'new_ticket'; ticketId: string; subject: string; name: string }
  | { type: 'ticket_updated'; ticketId: string; status: string }
  | { type: 'order_status_changed'; orderId: string; orderNumber: string; status: string }
  | { type: 'stats_invalidated' }

export const EVENTS_CHANNEL = 'stratum:admin:events'
const STATS_CACHE_KEY = 'stratum:cache:admin:stats'
const STATS_TTL = 60 // seconds

let _client: Redis | null = null

function getClient(): Redis | null {
  if (!process.env.REDIS_URL) return null
  if (_client) return _client
  try {
    _client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
      connectTimeout: 3000,
    })
    _client.on('error', (err) => {
      console.error('[Redis]', err.message)
    })
  } catch {
    // Redis unavailable — degrade gracefully
  }
  return _client
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const client = getClient()
    if (!client) return null
    const val = await client.get(key)
    return val ? (JSON.parse(val) as T) : null
  } catch {
    return null
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    const client = getClient()
    if (!client) return
    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds)
  } catch {}
}

export async function cacheDel(key: string): Promise<void> {
  try {
    const client = getClient()
    if (!client) return
    await client.del(key)
  } catch {}
}

export async function publishEvent(event: AdminEvent): Promise<void> {
  try {
    const client = getClient()
    if (!client) return
    await client.publish(EVENTS_CHANNEL, JSON.stringify({ ...event, ts: Date.now() }))
  } catch {}
}

export function createSubscriber(): Redis | null {
  if (!process.env.REDIS_URL) return null
  try {
    return new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 3000,
    })
  } catch {
    return null
  }
}

export { STATS_CACHE_KEY, STATS_TTL }
