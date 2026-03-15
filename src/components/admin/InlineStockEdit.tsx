'use client'

import { useState, useRef } from 'react'
import toast from 'react-hot-toast'

export function InlineStockEdit({ productId, stock }: { productId: string; stock: number }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(stock))
  const [displayStock, setDisplayStock] = useState(stock)
  const [flash, setFlash] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const colorClass =
    displayStock === 0 ? 'text-red-500' : displayStock <= 5 ? 'text-amber-600' : 'text-green-600'

  const commit = async () => {
    const newStock = parseInt(value, 10)
    if (isNaN(newStock) || newStock < 0) {
      setValue(String(displayStock))
      setEditing(false)
      return
    }
    setEditing(false)
    if (newStock === displayStock) return

    const prev = displayStock
    setDisplayStock(newStock)
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock }),
      })
      if (!res.ok) throw new Error()
      setFlash(true)
      setTimeout(() => setFlash(false), 800)
    } catch {
      setDisplayStock(prev)
      setValue(String(prev))
      toast.error('Failed to update stock')
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') { setValue(String(displayStock)); setEditing(false) }
        }}
        className="w-16 px-2 py-1 text-sm border border-brand-blue rounded-sm bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
        autoFocus
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => { setValue(String(displayStock)); setEditing(true) }}
      className={`text-sm font-semibold ${colorClass} ${flash ? 'ring-2 ring-green-400 rounded px-1' : ''} hover:underline cursor-pointer`}
      title="Click to edit stock"
    >
      {displayStock}
    </button>
  )
}
