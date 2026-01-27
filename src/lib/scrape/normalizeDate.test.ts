import { describe, expect, it } from 'vitest'
import { normalizeToIso } from '@/lib/scrape/normalizeDate'

describe('normalizeToIso', () => {
  it('returns ISO when parseable', () => {
    const result = normalizeToIso('2024-01-02T12:00:00Z', '2024-01-01T00:00:00Z')
    expect(result).toBe('2024-01-02T12:00:00.000Z')
  })

  it('returns fallback when invalid', () => {
    const fallback = '2024-01-01T00:00:00Z'
    const result = normalizeToIso('not-a-date', fallback)
    expect(result).toBe(fallback)
  })
})
