import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import slugify from 'slugify'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createSlug(text: string): string {
  return slugify(text, {
    lower: true,
    strict: true,
    trim: true,
  })
}

export function formatPrice(pence: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(pence / 100)
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `STR-${timestamp}-${random}`
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '…'
}

export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural
}

/** Returns true if a product's sale is currently active based on end date and stock threshold */
export function isSaleActive(product: {
  compareAtPrice?: number | null
  price: number
  saleEndsAt?: Date | string | null
  saleStopAtStock?: number | null
  stock: number
}): boolean {
  if (!product.compareAtPrice || product.compareAtPrice <= product.price) return false
  if (product.saleEndsAt && new Date(product.saleEndsAt) < new Date()) return false
  if (product.saleStopAtStock != null && product.stock <= product.saleStopAtStock) return false
  return true
}

/** Converts basic markdown to sanitized HTML. Escapes HTML first to prevent XSS. */
export function markdownToHtml(text: string): string {
  // Escape HTML
  const lines = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .split('\n')

  // Group list items
  const processed: string[] = []
  let inList = false
  for (const line of lines) {
    const listMatch = line.match(/^- (.+)$/)
    if (listMatch) {
      if (!inList) { processed.push('<ul>'); inList = true }
      processed.push(`<li>${listMatch[1]}</li>`)
    } else {
      if (inList) { processed.push('</ul>'); inList = false }
      processed.push(line)
    }
  }
  if (inList) processed.push('</ul>')

  return processed.join('\n')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\n\n+/g, '<br><br>')
    .replace(/\n/g, '<br>')
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}
