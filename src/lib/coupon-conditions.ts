export interface CouponCondition {
  field: 'account.orderCount' | 'account.totalSpent' | 'account.createdAt' | 'cart.itemCount' | 'cart.hasProduct'
  operator: 'lt' | 'lte' | 'gt' | 'gte' | 'eq' | 'neq'
  value: number | string
}

export interface ConditionContext {
  account?: {
    orderCount: number
    totalSpent: number     // pence
    createdAtDays: number  // account age in days
  }
  cart?: {
    itemCount: number
    productIds: string[]
  }
}

function compare(actual: number | string, operator: string, expected: number | string): boolean {
  const a = typeof actual === 'string' ? actual : Number(actual)
  const b = typeof expected === 'string' ? expected : Number(expected)
  switch (operator) {
    case 'lt':  return Number(a) < Number(b)
    case 'lte': return Number(a) <= Number(b)
    case 'gt':  return Number(a) > Number(b)
    case 'gte': return Number(a) >= Number(b)
    case 'eq':  return a === b
    case 'neq': return a !== b
    default:    return false
  }
}

export function evaluateConditions(conditions: CouponCondition[], ctx: ConditionContext): { valid: boolean; failedCondition?: CouponCondition } {
  for (const cond of conditions) {
    let actual: number | string | undefined

    switch (cond.field) {
      case 'account.orderCount':
        actual = ctx.account?.orderCount
        break
      case 'account.totalSpent':
        actual = ctx.account?.totalSpent
        break
      case 'account.createdAt':
        actual = ctx.account?.createdAtDays
        break
      case 'cart.itemCount':
        actual = ctx.cart?.itemCount
        break
      case 'cart.hasProduct':
        actual = ctx.cart?.productIds.includes(String(cond.value)) ? 1 : 0
        break
    }

    if (actual === undefined) {
      return { valid: false, failedCondition: cond }
    }

    if (!compare(actual, cond.operator, cond.value)) {
      return { valid: false, failedCondition: cond }
    }
  }

  return { valid: true }
}

export function conditionToLabel(cond: CouponCondition): string {
  const opMap: Record<string, string> = { lt: '<', lte: '≤', gt: '>', gte: '≥', eq: '=', neq: '≠' }
  const fieldMap: Record<string, string> = {
    'account.orderCount': 'Orders placed',
    'account.totalSpent': 'Total spent (p)',
    'account.createdAt': 'Account age (days)',
    'cart.itemCount': 'Items in cart',
    'cart.hasProduct': 'Has product ID',
  }
  return `${fieldMap[cond.field] ?? cond.field} ${opMap[cond.operator] ?? cond.operator} ${cond.value}`
}

export const PRESET_CONDITIONS: Array<{ label: string; conditions: CouponCondition[] }> = [
  {
    label: 'First order only',
    conditions: [{ field: 'account.orderCount', operator: 'lt', value: 1 }],
  },
  {
    label: 'Spent over £50',
    conditions: [{ field: 'account.totalSpent', operator: 'gte', value: 5000 }],
  },
  {
    label: '3+ items in cart',
    conditions: [{ field: 'cart.itemCount', operator: 'gte', value: 3 }],
  },
  {
    label: 'Account older than 30 days',
    conditions: [{ field: 'account.createdAt', operator: 'gte', value: 30 }],
  },
  {
    label: 'New account (< 7 days)',
    conditions: [{ field: 'account.createdAt', operator: 'lt', value: 7 }],
  },
]
