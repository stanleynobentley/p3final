import { describe, expect, it } from 'vitest'
import { extractArticleLinks } from '@/lib/scrape/extractArticleLinks'
import type { Source } from '@/lib/types'

const source: Source = {
  id: 'test',
  name: 'Test',
  url: 'https://example.com/list',
  articleUrlPattern: '^https?://example\\.com/articles/.+$'
}

const html = `
  <html>
    <body>
      <nav>
        <a href="/articles/nav-link">Nav Link</a>
      </nav>
      <main>
        <a href="/articles/one">One</a>
        <a href="/articles/two">Two</a>
        <a href="/about">About</a>
        <a href="#hash">Hash</a>
        <a href="mailto:test@example.com">Mail</a>
        <a href="https://other.com/articles/three">External</a>
      </main>
    </body>
  </html>
`

describe('extractArticleLinks', () => {
  it('filters to matching article URLs on same host', () => {
    const links = extractArticleLinks(html, source)
    expect(links).toEqual([
      'https://example.com/articles/one',
      'https://example.com/articles/two'
    ])
  })

  it('ignores links inside navigation containers', () => {
    const links = extractArticleLinks(html, source)
    expect(links).not.toContain('https://example.com/articles/nav-link')
  })

  it('ignores links matching excluded patterns', () => {
    const withExclusions: Source = {
      ...source,
      excludeUrlPatterns: ['^https?://example\\.com/articles/two$']
    }
    const links = extractArticleLinks(html, withExclusions)
    expect(links).toEqual(['https://example.com/articles/one'])
  })
})
