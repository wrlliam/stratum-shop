'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Cart, CartItem } from '@/types'
import toast from 'react-hot-toast'

interface CartContextType {
  cart: Cart
  hydrated: boolean
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
}

const CartContext = createContext<CartContextType | null>(null)

function optionsKey(options?: CartItem['selectedOptions']): string {
  if (!options || options.length === 0) return ''
  return options
    .map((o) => `${o.groupName}:${o.choiceLabel}`)
    .sort()
    .join('|')
}

function calcCart(items: CartItem[]): Cart {
  return {
    items,
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  }
}

const CART_KEY = 'stratum_cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_KEY)
      if (stored) setItems(JSON.parse(stored))
    } catch {}
    setHydrated(true)
  }, [])

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  }, [items])

  const addItem = useCallback((item: Omit<CartItem, 'id'>) => {
    setItems((prev) => {
      const itemOptKey = optionsKey(item.selectedOptions)
      const existing = prev.find((i) => {
        if (item.productId && i.productId === item.productId) {
          return optionsKey(i.selectedOptions) === itemOptKey
        }
        if (item.bundleId && i.bundleId === item.bundleId) return true
        return false
      })
      if (existing) {
        return prev.map((i) =>
          i.id === existing.id ? { ...i, quantity: i.quantity + item.quantity } : i
        )
      }
      return [...prev, { ...item, id: crypto.randomUUID() }]
    })
    toast.success(`${item.name} added to cart`, {
      style: {
        background: '#111127',
        color: '#f9fafb',
        border: '1px solid #2d2d55',
      },
      iconTheme: { primary: '#f59e0b', secondary: '#0a0a10' },
    })
    setIsOpen(true)
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== id))
    } else {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)))
    }
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const cart = calcCart(items)

  return (
    <CartContext.Provider
      value={{
        cart,
        hydrated,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        toggleCart: () => setIsOpen((o) => !o),
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
