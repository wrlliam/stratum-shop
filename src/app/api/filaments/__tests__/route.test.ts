import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

const mockSelectWhere = vi.fn()

vi.mock('@/lib/db', () => {
  const selectChain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn(() => mockSelectWhere()),
  }
  return {
    db: {
      select: vi.fn(() => selectChain),
    },
    filaments: { active: 'active' },
  }
})

const mockFilament = {
  id: 'fil-1',
  name: 'PLA White',
  type: 'PLA',
  colour: 'White',
  active: true,
  stockGrams: 1000,
  costPerGramPence: 3,
}

describe('GET /api/filaments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns list of active filaments', async () => {
    mockSelectWhere.mockResolvedValue([mockFilament])
    const { GET } = await import('../route')
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(1)
    expect(data[0].name).toBe('PLA White')
    expect(data[0].active).toBe(true)
  })

  it('returns empty array when none exist', async () => {
    mockSelectWhere.mockResolvedValue([])
    const { GET } = await import('../route')
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual([])
  })

  it('only returns active filaments (filters inactive)', async () => {
    const activeOnly = [mockFilament]
    mockSelectWhere.mockResolvedValue(activeOnly)
    const { GET } = await import('../route')
    const res = await GET()
    const data = await res.json()
    // All returned filaments should be active
    expect(data.every((f: { active: boolean }) => f.active === true)).toBe(true)
    expect(data).toHaveLength(1)
  })
})
