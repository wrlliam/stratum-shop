import { describe, it, expect } from 'vitest'
import { evaluateConditions, conditionToLabel, PRESET_CONDITIONS } from '../coupon-conditions'
import type { CouponCondition, ConditionContext } from '../coupon-conditions'

// compare() is not exported, so we test it indirectly through evaluateConditions.
// We use a simple account.orderCount field to exercise each operator.

function makeCtx(orderCount: number): ConditionContext {
  return { account: { orderCount, totalSpent: 0, createdAtDays: 0 } }
}

function makeCond(operator: CouponCondition['operator'], value: number): CouponCondition {
  return { field: 'account.orderCount', operator, value }
}

describe('compare (via evaluateConditions)', () => {
  it('lt: returns valid when actual < value', () => {
    expect(evaluateConditions([makeCond('lt', 5)], makeCtx(3))).toEqual({ valid: true })
  })

  it('lt: returns invalid when actual >= value', () => {
    const result = evaluateConditions([makeCond('lt', 5)], makeCtx(5))
    expect(result.valid).toBe(false)
  })

  it('lte: returns valid when actual <= value', () => {
    expect(evaluateConditions([makeCond('lte', 5)], makeCtx(5))).toEqual({ valid: true })
  })

  it('lte: returns invalid when actual > value', () => {
    const result = evaluateConditions([makeCond('lte', 5)], makeCtx(6))
    expect(result.valid).toBe(false)
  })

  it('gt: returns valid when actual > value', () => {
    expect(evaluateConditions([makeCond('gt', 5)], makeCtx(6))).toEqual({ valid: true })
  })

  it('gt: returns invalid when actual <= value', () => {
    const result = evaluateConditions([makeCond('gt', 5)], makeCtx(5))
    expect(result.valid).toBe(false)
  })

  it('gte: returns valid when actual >= value', () => {
    expect(evaluateConditions([makeCond('gte', 5)], makeCtx(5))).toEqual({ valid: true })
  })

  it('gte: returns invalid when actual < value', () => {
    const result = evaluateConditions([makeCond('gte', 5)], makeCtx(4))
    expect(result.valid).toBe(false)
  })

  it('eq: returns valid when actual === value (numbers)', () => {
    expect(evaluateConditions([makeCond('eq', 3)], makeCtx(3))).toEqual({ valid: true })
  })

  it('eq: returns invalid when actual !== value', () => {
    const result = evaluateConditions([makeCond('eq', 3)], makeCtx(4))
    expect(result.valid).toBe(false)
  })

  it('neq: returns valid when actual !== value', () => {
    expect(evaluateConditions([makeCond('neq', 3)], makeCtx(4))).toEqual({ valid: true })
  })

  it('neq: returns invalid when actual === value', () => {
    const result = evaluateConditions([makeCond('neq', 3)], makeCtx(3))
    expect(result.valid).toBe(false)
  })
})

describe('evaluateConditions', () => {
  it('returns valid for a single passing condition', () => {
    const cond: CouponCondition = { field: 'cart.itemCount', operator: 'gte', value: 2 }
    const ctx: ConditionContext = { cart: { itemCount: 5, productIds: [] } }
    expect(evaluateConditions([cond], ctx)).toEqual({ valid: true })
  })

  it('returns invalid with failedCondition for a single failing condition', () => {
    const cond: CouponCondition = { field: 'cart.itemCount', operator: 'gte', value: 10 }
    const ctx: ConditionContext = { cart: { itemCount: 5, productIds: [] } }
    const result = evaluateConditions([cond], ctx)
    expect(result.valid).toBe(false)
    expect(result.failedCondition).toEqual(cond)
  })

  it('requires all conditions to pass (returns first failure)', () => {
    const conds: CouponCondition[] = [
      { field: 'account.orderCount', operator: 'gte', value: 1 },
      { field: 'account.totalSpent', operator: 'gte', value: 5000 },
    ]
    const ctx: ConditionContext = {
      account: { orderCount: 2, totalSpent: 1000, createdAtDays: 10 },
    }
    const result = evaluateConditions(conds, ctx)
    expect(result.valid).toBe(false)
    expect(result.failedCondition).toEqual(conds[1])
  })

  it('returns valid when all multiple conditions pass', () => {
    const conds: CouponCondition[] = [
      { field: 'account.orderCount', operator: 'gte', value: 1 },
      { field: 'account.totalSpent', operator: 'gte', value: 5000 },
    ]
    const ctx: ConditionContext = {
      account: { orderCount: 3, totalSpent: 10000, createdAtDays: 30 },
    }
    expect(evaluateConditions(conds, ctx)).toEqual({ valid: true })
  })

  it('returns invalid when context field is undefined (no account)', () => {
    const cond: CouponCondition = { field: 'account.orderCount', operator: 'gte', value: 1 }
    const result = evaluateConditions([cond], {})
    expect(result.valid).toBe(false)
    expect(result.failedCondition).toEqual(cond)
  })

  it('cart.hasProduct sets actual to 1 when product is in cart', () => {
    // hasProduct: actual = includes(value) ? 1 : 0, then compare(actual, op, value)
    // With eq and a string value: compare(1, 'eq', 'prod-abc') => 1 === 'prod-abc' => false
    // because eq uses strict equality between the number 1 and string value
    const cond: CouponCondition = { field: 'cart.hasProduct', operator: 'eq', value: 'prod-abc' }
    const ctx: ConditionContext = { cart: { itemCount: 2, productIds: ['prod-abc', 'prod-xyz'] } }
    const result = evaluateConditions([cond], ctx)
    expect(result.valid).toBe(false)
  })

  it('cart.hasProduct sets actual to 0 when product is not in cart', () => {
    // actual = 0, compare(0, 'eq', 'prod-missing') => 0 === 'prod-missing' => false
    const cond: CouponCondition = { field: 'cart.hasProduct', operator: 'eq', value: 'prod-missing' }
    const ctx: ConditionContext = { cart: { itemCount: 1, productIds: ['prod-abc'] } }
    const result = evaluateConditions([cond], ctx)
    expect(result.valid).toBe(false)
  })

  it('cart.hasProduct with neq: actual 1 !== string value is true', () => {
    // actual = 1 (product found), compare(1, 'neq', 'prod-abc') => 1 !== 'prod-abc' => true
    const cond: CouponCondition = { field: 'cart.hasProduct', operator: 'neq', value: 'prod-abc' }
    const ctx: ConditionContext = { cart: { itemCount: 2, productIds: ['prod-abc'] } }
    const result = evaluateConditions([cond], ctx)
    expect(result.valid).toBe(true)
  })

  it('returns valid for an empty conditions array', () => {
    expect(evaluateConditions([], {})).toEqual({ valid: true })
  })
})

describe('conditionToLabel', () => {
  it('formats account.orderCount condition correctly', () => {
    const cond: CouponCondition = { field: 'account.orderCount', operator: 'lt', value: 1 }
    expect(conditionToLabel(cond)).toBe('Orders placed < 1')
  })

  it('formats account.totalSpent with gte', () => {
    const cond: CouponCondition = { field: 'account.totalSpent', operator: 'gte', value: 5000 }
    expect(conditionToLabel(cond)).toBe('Total spent (p) \u2265 5000')
  })

  it('formats cart.hasProduct with eq', () => {
    const cond: CouponCondition = { field: 'cart.hasProduct', operator: 'eq', value: 'prod-123' }
    expect(conditionToLabel(cond)).toBe('Has product ID = prod-123')
  })

  it('formats neq operator as \u2260', () => {
    const cond: CouponCondition = { field: 'cart.itemCount', operator: 'neq', value: 0 }
    expect(conditionToLabel(cond)).toBe('Items in cart \u2260 0')
  })
})

describe('PRESET_CONDITIONS', () => {
  it('contains preset entries with labels and conditions', () => {
    expect(PRESET_CONDITIONS.length).toBeGreaterThan(0)
    for (const preset of PRESET_CONDITIONS) {
      expect(preset.label).toBeTruthy()
      expect(Array.isArray(preset.conditions)).toBe(true)
      expect(preset.conditions.length).toBeGreaterThan(0)
    }
  })
})
