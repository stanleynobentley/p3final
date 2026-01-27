import { afterEach, describe, expect, it, vi } from 'vitest'
import { summarize } from '@/lib/scrape/summarize'

describe('summarize', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.restoreAllMocks()
  })

  const mockFetch = (content: string) =>
    vi.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content } }]
      })
    }))

  it('returns empty when no content', async () => {
    process.env = { ...originalEnv, OPENAI_API_KEY: 'test-key' }
    const result = await summarize('   ')
    expect(result).toBe('')
  })

  it('throws when api key is missing', async () => {
    process.env = { ...originalEnv, OPENAI_API_KEY: undefined }
    await expect(summarize('Some text.')).rejects.toThrow('OPENAI_API_KEY not configured')
  })

  it('returns llm summary for single chunk', async () => {
    process.env = { ...originalEnv, OPENAI_API_KEY: 'test-key' }
    const fetchMock = mockFetch('LLM summary')
    vi.stubGlobal('fetch', fetchMock)

    const result = await summarize('First sentence. Second sentence! Third sentence? Fourth.')

    expect(result).toBe('LLM summary')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('returns llm summary for multiple chunks', async () => {
    process.env = { ...originalEnv, OPENAI_API_KEY: 'test-key' }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'Chunk summary 1' } }] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'Chunk summary 2' } }] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'Final summary' } }] })
      })
    vi.stubGlobal('fetch', fetchMock)

    const longText = 'A'.repeat(9000)
    const result = await summarize(longText)

    expect(result).toBe('Final summary')
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})
