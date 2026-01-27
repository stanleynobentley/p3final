import { JSDOM } from 'jsdom'

const normalizeUrl = (href: string, baseUrl: string) => {
  try {
    return new URL(href, baseUrl).toString()
  } catch {
    return null
  }
}

const isHttpUrl = (value: string) => value.startsWith('http://') || value.startsWith('https://')

const filterByPattern = (url: string, pattern?: string) => {
  if (!pattern) {
    return false
  }
  try {
    return new RegExp(pattern).test(url)
  } catch {
    return false
  }
}

const dedupeUrls = (urls: string[]) =>
  urls.reduce<string[]>((acc, url) => (acc.includes(url) ? acc : [...acc, url]), [])

export const extractListPageLinks = (html: string, baseUrl: string, listPageUrlPattern?: string) => {
  if (!listPageUrlPattern) {
    return []
  }

  const dom = new JSDOM(html)
  const doc = dom.window.document
  const rawLinks = Array.from(doc.querySelectorAll('a[href]'))

  const normalized = rawLinks
    .map((link) => (link.getAttribute('href') ?? '').trim())
    .filter((href) => Boolean(href))
    .filter((href) => !href.startsWith('#'))
    .filter((href) => !href.startsWith('mailto:'))
    .map((href) => normalizeUrl(href, baseUrl))
    .filter((href): href is string => Boolean(href))
    .filter(isHttpUrl)
    .filter((url) => {
      try {
        return new URL(url).host === new URL(baseUrl).host
      } catch {
        return false
      }
    })
    .filter((url) => filterByPattern(url, listPageUrlPattern))

  return dedupeUrls(normalized)
}
