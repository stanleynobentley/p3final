import { describe, expect, it } from 'vitest'
import type { Source } from '@/lib/types'
import { buildListPageUrls } from '@/lib/scrape/buildListPageUrls'

const baseSource: Source = {
  id: 'praha-3',
  name: 'Praha 3',
  url: 'https://www.praha3.cz/aktualne-z-trojky/zpravy',
  listPageTemplate: 'https://www.praha3.cz/aktualne-z-trojky/zpravy/page:{page}/'
}

describe('buildListPageUrls', () => {
  it('includes base url and pages 2..15 for first batch', () => {
    const urls = buildListPageUrls(baseSource, { offset: 0, limit: 15 })
    expect(urls[0]).toBe(baseSource.url)
    expect(urls).toContain('https://www.praha3.cz/aktualne-z-trojky/zpravy/page:2/')
    expect(urls).toContain('https://www.praha3.cz/aktualne-z-trojky/zpravy/page:15/')
    expect(urls).toHaveLength(15)
  })

  it('skips base url for subsequent batches', () => {
    const urls = buildListPageUrls(baseSource, { offset: 15, limit: 15 })
    expect(urls).not.toContain(baseSource.url)
    expect(urls).toContain('https://www.praha3.cz/aktualne-z-trojky/zpravy/page:16/')
    expect(urls).toContain('https://www.praha3.cz/aktualne-z-trojky/zpravy/page:30/')
    expect(urls).toHaveLength(15)
  })

  it('returns empty when template is invalid', () => {
    const source: Source = { ...baseSource, listPageTemplate: 'https://example.com/page/' }
    expect(buildListPageUrls(source, { offset: 0, limit: 10 })).toEqual([])
  })
})
