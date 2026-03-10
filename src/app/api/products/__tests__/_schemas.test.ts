import { describe, it, expect } from 'vitest'
import { optionChoiceSchema, optionGroupSchema, customOrderFieldSchema } from '../_schemas'

describe('optionChoiceSchema', () => {
  it('accepts valid data', () => {
    const result = optionChoiceSchema.safeParse({ label: 'Red', priceModifier: 200 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.label).toBe('Red')
      expect(result.data.priceModifier).toBe(200)
    }
  })

  it('defaults priceModifier to 0 when omitted', () => {
    const result = optionChoiceSchema.safeParse({ label: 'Blue' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.priceModifier).toBe(0)
    }
  })

  it('rejects missing label', () => {
    const result = optionChoiceSchema.safeParse({ priceModifier: 100 })
    expect(result.success).toBe(false)
  })

  it('rejects empty label', () => {
    const result = optionChoiceSchema.safeParse({ label: '', priceModifier: 0 })
    expect(result.success).toBe(false)
  })
})

describe('optionGroupSchema', () => {
  it('accepts valid group with choices', () => {
    const result = optionGroupSchema.safeParse({
      name: 'Colour',
      type: 'select',
      choices: [{ label: 'Red', priceModifier: 0 }],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Colour')
      expect(result.data.choices).toHaveLength(1)
    }
  })

  it('defaults type to select when omitted', () => {
    const result = optionGroupSchema.safeParse({
      name: 'Size',
      choices: [{ label: 'Small' }],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.type).toBe('select')
    }
  })

  it('rejects empty choices array', () => {
    const result = optionGroupSchema.safeParse({
      name: 'Colour',
      type: 'select',
      choices: [],
    })
    expect(result.success).toBe(false)
  })
})

describe('customOrderFieldSchema', () => {
  it('accepts all valid field types', () => {
    const types = ['text', 'image', 'number', 'select'] as const
    for (const type of types) {
      const result = customOrderFieldSchema.safeParse({
        type,
        label: `Test ${type}`,
      })
      expect(result.success).toBe(true)
    }
  })

  it('accepts optional fields', () => {
    const result = customOrderFieldSchema.safeParse({
      type: 'select',
      label: 'Choose size',
      required: true,
      placeholder: 'Pick one',
      options: ['S', 'M', 'L'],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.required).toBe(true)
      expect(result.data.placeholder).toBe('Pick one')
      expect(result.data.options).toEqual(['S', 'M', 'L'])
    }
  })

  it('rejects invalid type', () => {
    const result = customOrderFieldSchema.safeParse({
      type: 'checkbox',
      label: 'Invalid',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing label', () => {
    const result = customOrderFieldSchema.safeParse({
      type: 'text',
    })
    expect(result.success).toBe(false)
  })
})
