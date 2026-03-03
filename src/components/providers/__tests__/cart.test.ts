import { describe, it, expect, beforeEach, vi } from 'vitest'

// Test the pure cart logic functions directly
// These mirror the internal functions in CartProvider.tsx

function optionsKey(options?: { groupName: string; choiceLabel: string }[]): string {
  if (!options || options.length === 0) return ''
  return options
    .map((o) => `${o.groupName}:${o.choiceLabel}`)
    .sort()
    .join('|')
}

interface CartItem {
  id: string
  productId?: string
  bundleId?: string
  name: string
  price: number
  quantity: number
  isBundle: boolean
  selectedOptions?: { groupName: string; choiceLabel: string; priceModifier: number }[]
}

function calcCart(items: CartItem[]) {
  return {
    items,
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  }
}

function addItem(
  items: CartItem[],
  item: Omit<CartItem, 'id'>
): CartItem[] {
  const itemOptKey = optionsKey(item.selectedOptions)
  const existing = items.find((i) => {
    if (item.productId && i.productId === item.productId) {
      return optionsKey(i.selectedOptions) === itemOptKey
    }
    if (item.bundleId && i.bundleId === item.bundleId) return true
    return false
  })
  if (existing) {
    return items.map((i) =>
      i.id === existing.id ? { ...i, quantity: i.quantity + item.quantity } : i
    )
  }
  return [...items, { ...item, id: crypto.randomUUID() }]
}

function removeItem(items: CartItem[], id: string): CartItem[] {
  return items.filter((i) => i.id !== id)
}

function updateQuantity(items: CartItem[], id: string, quantity: number): CartItem[] {
  if (quantity <= 0) {
    return items.filter((i) => i.id !== id)
  }
  return items.map((i) => (i.id === id ? { ...i, quantity } : i))
}

describe('Cart Logic', () => {
  const baseItem: Omit<CartItem, 'id'> = {
    productId: 'prod-1',
    name: 'Test Product',
    price: 1999,
    quantity: 1,
    isBundle: false,
  }

  describe('optionsKey', () => {
    it('returns empty string for no options', () => {
      expect(optionsKey(undefined)).toBe('')
      expect(optionsKey([])).toBe('')
    })

    it('generates consistent key regardless of order', () => {
      const opts1 = [
        { groupName: 'Color', choiceLabel: 'Red' },
        { groupName: 'Size', choiceLabel: 'Large' },
      ]
      const opts2 = [
        { groupName: 'Size', choiceLabel: 'Large' },
        { groupName: 'Color', choiceLabel: 'Red' },
      ]
      expect(optionsKey(opts1)).toBe(optionsKey(opts2))
    })
  })

  describe('calcCart', () => {
    it('returns zero totals for empty cart', () => {
      const cart = calcCart([])
      expect(cart.subtotal).toBe(0)
      expect(cart.itemCount).toBe(0)
    })

    it('calculates subtotal correctly', () => {
      const items: CartItem[] = [
        { id: '1', name: 'A', price: 1000, quantity: 2, isBundle: false },
        { id: '2', name: 'B', price: 500, quantity: 3, isBundle: false },
      ]
      const cart = calcCart(items)
      expect(cart.subtotal).toBe(3500)
      expect(cart.itemCount).toBe(5)
    })
  })

  describe('addItem', () => {
    it('adds a new item', () => {
      const result = addItem([], baseItem)
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Test Product')
      expect(result[0].id).toBeDefined()
    })

    it('merges duplicate products by incrementing quantity', () => {
      const items: CartItem[] = [{ ...baseItem, id: 'existing-1' }]
      const result = addItem(items, baseItem)
      expect(result).toHaveLength(1)
      expect(result[0].quantity).toBe(2)
    })

    it('treats products with different options as separate items', () => {
      const items: CartItem[] = [
        { ...baseItem, id: 'existing-1', selectedOptions: [{ groupName: 'Color', choiceLabel: 'Red', priceModifier: 0 }] },
      ]
      const newItem = {
        ...baseItem,
        selectedOptions: [{ groupName: 'Color', choiceLabel: 'Blue', priceModifier: 0 }],
      }
      const result = addItem(items, newItem)
      expect(result).toHaveLength(2)
    })

    it('merges bundle duplicates', () => {
      const bundleItem: Omit<CartItem, 'id'> = {
        bundleId: 'bundle-1',
        name: 'Bundle',
        price: 5000,
        quantity: 1,
        isBundle: true,
      }
      const items: CartItem[] = [{ ...bundleItem, id: 'existing-bundle' }]
      const result = addItem(items, bundleItem)
      expect(result).toHaveLength(1)
      expect(result[0].quantity).toBe(2)
    })
  })

  describe('removeItem', () => {
    it('removes an item by id', () => {
      const items: CartItem[] = [
        { ...baseItem, id: '1' },
        { ...baseItem, id: '2', name: 'Other' },
      ]
      const result = removeItem(items, '1')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('2')
    })

    it('returns same array if id not found', () => {
      const items: CartItem[] = [{ ...baseItem, id: '1' }]
      const result = removeItem(items, 'nonexistent')
      expect(result).toHaveLength(1)
    })
  })

  describe('updateQuantity', () => {
    it('updates quantity for existing item', () => {
      const items: CartItem[] = [{ ...baseItem, id: '1' }]
      const result = updateQuantity(items, '1', 5)
      expect(result[0].quantity).toBe(5)
    })

    it('removes item when quantity is 0', () => {
      const items: CartItem[] = [{ ...baseItem, id: '1' }]
      const result = updateQuantity(items, '1', 0)
      expect(result).toHaveLength(0)
    })

    it('removes item when quantity is negative', () => {
      const items: CartItem[] = [{ ...baseItem, id: '1' }]
      const result = updateQuantity(items, '1', -1)
      expect(result).toHaveLength(0)
    })
  })
})
