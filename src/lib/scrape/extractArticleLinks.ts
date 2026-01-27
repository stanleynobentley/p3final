import type { Source } from '@/lib/types'
import { JSDOM } from 'jsdom'

const defaultContainerSelectors = ['main', 'article', '#content', '.content', '#main']
const ignoredContainerSelectors = [
  'nav',
  'header',
  'footer',
  '.breadcrumb',
  '.breadcrumbs',
  '.nav',
  '.navigation',
  '.menu',
  '.submenu',
  '.profile',
  '.account',
  '.user',
  '.social'
]

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
    return true
  }
  try {
    return new RegExp(pattern).test(url)
  } catch {
    return true
  }
}

const matchesAnyPattern = (url: string, patterns?: string[]) => {
  if (!patterns || patterns.length === 0) {
    return false
  }
  return patterns.some((pattern) => {
    try {
      return new RegExp(pattern).test(url)
    } catch {
      return false
    }
  })
}

export const extractArticleLinks = (html: string, source: Source) => {
  const dom = new JSDOM(html)
  const doc = dom.window.document
  const effectiveSelectors = source.linkContainerSelectors?.length ? source.linkContainerSelectors : defaultContainerSelectors
  const containers = effectiveSelectors
    .map((selector) => doc.querySelector(selector))
    .filter((node): node is Element => Boolean(node))

  const scopeNodes = containers.length > 0 ? containers : [doc.body]
  const linkSelector = source.linkSelector ?? 'a[href]'
  const rawLinks = scopeNodes.flatMap((node) => Array.from(node.querySelectorAll(linkSelector)))
  const ignoredSelectorList = ignoredContainerSelectors.join(',')

  const candidates = rawLinks.map((link) => {
    const href = (link.getAttribute('href') ?? '').trim()
    const normalized = href ? normalizeUrl(href, source.url) : null
    const inIgnoredContainer = ignoredSelectorList ? Boolean(link.closest(ignoredSelectorList)) : false
    return { href, normalized, inIgnoredContainer }
  })

  const normalized = candidates
    .filter((candidate) => Boolean(candidate.href))
    .filter((candidate) => !candidate.href.startsWith('#'))
    .filter((candidate) => !candidate.href.startsWith('mailto:'))
    .filter((candidate): candidate is { href: string; normalized: string; inIgnoredContainer: boolean } =>
      Boolean(candidate.normalized)
    )
    .filter((candidate) => isHttpUrl(candidate.normalized))
    .filter((candidate) => candidate.normalized !== source.url)
    .filter((candidate) => {
      try {
        return new URL(candidate.normalized).host === new URL(source.url).host
      } catch {
        return false
      }
    })
    .filter((candidate) => filterByPattern(candidate.normalized, source.articleUrlPattern))
    .filter((candidate) => !matchesAnyPattern(candidate.normalized, source.excludeUrlPatterns))
    .filter((candidate) => !candidate.inIgnoredContainer)
    .map((candidate) => candidate.normalized)

  return normalized.reduce<string[]>((acc, url) => {
    const exists = acc.includes(url)
    return exists ? acc : [...acc, url]
  }, [])
}
