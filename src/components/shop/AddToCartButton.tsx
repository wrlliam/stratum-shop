'use client'

import { useState, useRef, useEffect } from 'react'
import { PlusIcon, MinusIcon, ChevronDownIcon, CheckIcon } from '@radix-ui/react-icons'
import { useCart } from '@/components/providers/CartProvider'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { ProductWithImagesAndOptions, SelectedOption } from '@/types'

interface AddToCartButtonProps {
  product: ProductWithImagesAndOptions
}

export function OptionDropdown({
  group,
  selectedIndex,
  onSelect,
}: {
  group: ProductWithImagesAndOptions['optionGroups'][number]
  selectedIndex: number
  onSelect: (index: number) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const selected = group.choices[selectedIndex]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center justify-between px-3.5 py-2.5 text-sm border rounded-xl bg-brand-surface text-brand-text transition-all',
          open
            ? 'border-brand-blue ring-2 ring-brand-blue/20'
            : 'border-brand-border hover:border-brand-slate'
        )}
      >
        <span>
          {selected.label}
          {selected.priceModifier > 0 && (
            <span className="text-brand-muted ml-1.5">(+{formatPrice(selected.priceModifier)})</span>
          )}
          {selected.priceModifier < 0 && (
            <span className="text-brand-muted ml-1.5">({formatPrice(selected.priceModifier)})</span>
          )}
        </span>
        <ChevronDownIcon
          className={cn(
            'w-4 h-4 text-brand-muted transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-brand-surface border border-brand-border rounded-xl shadow-card-lg overflow-hidden animate-fade-in">
          {group.choices.map((choice, ci) => (
            <button
              key={choice.id}
              type="button"
              onClick={() => {
                onSelect(ci)
                setOpen(false)
              }}
              className={cn(
                'w-full flex items-center justify-between px-3.5 py-2.5 text-sm text-left transition-colors',
                ci === selectedIndex
                  ? 'bg-brand-blue-light text-brand-blue font-semibold'
                  : 'text-brand-text hover:bg-brand-arctic'
              )}
            >
              <span>
                {choice.label}
                {choice.priceModifier > 0 && (
                  <span className="text-brand-muted font-normal ml-1.5">
                    (+{formatPrice(choice.priceModifier)})
                  </span>
                )}
                {choice.priceModifier < 0 && (
                  <span className="text-brand-muted font-normal ml-1.5">
                    ({formatPrice(choice.priceModifier)})
                  </span>
                )}
              </span>
              {ci === selectedIndex && <CheckIcon className="w-4 h-4 text-brand-blue" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)

  const optionGroups = product.optionGroups || []

  // Initialize selections: select → index, boolean → false, text → ''
  const [selections, setSelections] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    for (const group of optionGroups) {
      if (group.choices.length > 0 && (group.type || 'select') === 'select') {
        initial[group.id] = 0
      }
    }
    return initial
  })

  const [booleanSelections, setBooleanSelections] = useState<Record<string, boolean>>({})
  const [textSelections, setTextSelections] = useState<Record<string, string>>({})

  const selectedOptions: SelectedOption[] = []

  for (const g of optionGroups) {
    const type = (g.type as string) || 'select'
    if (type === 'select' && g.choices.length > 0) {
      const choiceIdx = selections[g.id] ?? 0
      const choice = g.choices[choiceIdx]
      selectedOptions.push({
        groupName: g.name,
        choiceLabel: choice.label,
        priceModifier: choice.priceModifier,
      })
    } else if (type === 'boolean' && booleanSelections[g.id] && g.choices[0]) {
      selectedOptions.push({
        groupName: g.name,
        choiceLabel: g.choices[0].label,
        priceModifier: g.choices[0].priceModifier,
      })
    } else if (type === 'text' && textSelections[g.id]?.trim() && g.choices[0]) {
      selectedOptions.push({
        groupName: g.name,
        choiceLabel: textSelections[g.id].trim(),
        priceModifier: g.choices[0].priceModifier,
      })
    }
  }

  const optionsModifier = selectedOptions.reduce(
    (sum, o) => sum + o.priceModifier,
    0
  )
  const totalPrice = product.price + optionsModifier

  const handleAdd = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: totalPrice,
      quantity,
      imageUrl: product.images[0]?.url,
      isBundle: false,
      slug: product.slug,
      selectedOptions: selectedOptions.length > 0 ? selectedOptions : undefined,
    })
  }

  const isOutOfStock = product.stock === 0

  return (
    <div className="space-y-4">
      {/* Option selectors */}
      {optionGroups.map((group) => {
        const type = (group.type as string) || 'select'
        return (
          <div key={group.id}>
            <label className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1.5 block">
              {group.name}
            </label>

            {type === 'select' && (
              <OptionDropdown
                group={group}
                selectedIndex={selections[group.id] ?? 0}
                onSelect={(idx) =>
                  setSelections((prev) => ({
                    ...prev,
                    [group.id]: idx,
                  }))
                }
              />
            )}

            {type === 'boolean' && group.choices[0] && (
              <button
                type="button"
                onClick={() =>
                  setBooleanSelections((prev) => ({
                    ...prev,
                    [group.id]: !prev[group.id],
                  }))
                }
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm border rounded-xl bg-brand-surface text-brand-text transition-all border-brand-border hover:border-brand-slate"
              >
                <span>
                  {group.choices[0].label}
                  {group.choices[0].priceModifier > 0 && (
                    <span className="text-brand-muted ml-1.5">(+{formatPrice(group.choices[0].priceModifier)})</span>
                  )}
                </span>
                <div
                  className={cn(
                    'relative w-10 h-5 rounded-full transition-colors duration-200',
                    booleanSelections[group.id]
                      ? 'bg-brand-blue'
                      : 'bg-gray-200'
                  )}
                >
                  <div
                    className={cn(
                      'absolute top-0.5 w-4 h-4 rounded-full bg-brand-surface shadow transition-transform duration-200',
                      booleanSelections[group.id] ? 'translate-x-5' : 'translate-x-0.5'
                    )}
                  />
                </div>
              </button>
            )}

            {type === 'text' && group.choices[0] && (
              <div>
                <input
                  type="text"
                  placeholder={group.choices[0].label}
                  value={textSelections[group.id] || ''}
                  onChange={(e) =>
                    setTextSelections((prev) => ({
                      ...prev,
                      [group.id]: e.target.value,
                    }))
                  }
                  className="w-full px-3.5 py-2.5 text-sm border border-brand-border rounded-xl bg-brand-surface text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                />
                {group.choices[0].priceModifier > 0 && (
                  <p className="text-xs text-brand-muted mt-1">
                    +{formatPrice(group.choices[0].priceModifier)} when provided
                  </p>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Quantity selector */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
          Quantity
        </span>
        <div className="flex items-center border border-brand-border rounded-xl overflow-hidden bg-brand-surface">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="p-2.5 text-brand-muted hover:text-brand-blue hover:bg-brand-arctic transition-colors"
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            <MinusIcon className="w-3.5 h-3.5" />
          </button>
          <span className="w-10 text-center text-sm font-semibold text-brand-text">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
            className="p-2.5 text-brand-muted hover:text-brand-blue hover:bg-brand-arctic transition-colors"
            disabled={isOutOfStock || quantity >= (product.stock || 99)}
            aria-label="Increase quantity"
          >
            <PlusIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Live total */}
      <div className="text-sm text-brand-text font-semibold">
        Total: {formatPrice(totalPrice * quantity)}
        {quantity > 1 && (
          <span className="text-brand-muted font-normal ml-2">
            ({formatPrice(totalPrice)} each)
          </span>
        )}
      </div>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        onClick={handleAdd}
        disabled={isOutOfStock}
      >
        <PlusIcon className="w-4 h-4" />
        {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
      </Button>
    </div>
  )
}
