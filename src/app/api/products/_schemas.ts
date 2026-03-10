import { z } from 'zod'

export const optionChoiceSchema = z.object({
  label: z.string().min(1),
  priceModifier: z.number().int().default(0),
})

export const optionGroupSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['select', 'boolean', 'text']).default('select'),
  choices: z.array(optionChoiceSchema).min(1),
})

export const customOrderFieldSchema = z.object({
  type: z.enum(['text', 'image', 'number', 'select']),
  label: z.string().min(1),
  required: z.boolean().optional(),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
})
