import { describe, expect, it } from 'vitest'
import { mapWithConcurrency } from '@/lib/scrape/mapWithConcurrency'

describe('mapWithConcurrency', () => {
  it('collects results and errors', async () => {
    const tasks = [
      async () => 1,
      async () => {
        throw new Error('boom')
      },
      async () => 3
    ]

    const result = await mapWithConcurrency(tasks, 2)
    expect(result.results).toEqual([1, 3])
    expect(result.errors).toEqual(['boom'])
  })
})
