import type { Item, ListPageParams, Source } from '@/lib/types'
import { fetchHtml } from '@/lib/scrape/fetchHtml'
import { extractArticleLinks } from '@/lib/scrape/extractArticleLinks'
import { extractListPageLinks } from '@/lib/scrape/extractListPageLinks'
import { extractTitleDateContent } from '@/lib/scrape/extractTitleDateContent'
import { summarize } from '@/lib/scrape/summarize'
import { mapWithConcurrency } from '@/lib/scrape/mapWithConcurrency'
import { buildListPageUrls } from '@/lib/scrape/buildListPageUrls'

const SOURCE_TIMEOUT_MS = 12000
const ARTICLE_TIMEOUT_MS = 12000
const LIST_PAGE_CONCURRENCY = 3
const ARTICLE_CONCURRENCY = 4
const DEFAULT_MAX_ITEMS = 25
const DEFAULT_LIST_PAGE_LIMIT = 15

const toNonNegativeInt = (value: number) => (Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0)

const toItemId = (sourceId: string, url: string) => `${sourceId}:${encodeURIComponent(url)}`

const buildItem = (source: Source, url: string, title: string, date: string, summary: string, fetchedAtIso: string): Item => ({
  id: toItemId(source.id, url),
  sourceId: source.id,
  sourceName: source.name,
  url,
  title,
  date,
  summary,
  fetchedAt: fetchedAtIso
})

export const scrapeSourceItems = async (
  source: Source,
  fetchedAtIso: string,
  forceRefresh: boolean,
  listPageParams?: ListPageParams
) => {
  const listPageOffset = toNonNegativeInt(listPageParams?.listPageOffset ?? 0)
  const listPageLimit = toNonNegativeInt(listPageParams?.listPageLimit ?? DEFAULT_LIST_PAGE_LIMIT)
  const shouldFetchBaseList = !source.listPageTemplate || listPageOffset === 0
  const listHtml = shouldFetchBaseList
    ? await fetchHtml(source.url, SOURCE_TIMEOUT_MS, forceRefresh, source.allowInsecureTls)
    : ''
  const listPageUrls = source.listPageTemplate
    ? buildListPageUrls(source, { offset: listPageOffset, limit: listPageLimit })
    : [source.url, ...extractListPageLinks(listHtml, source.url, source.listPageUrlPattern)].reduce<string[]>(
        (acc, url) => (acc.includes(url) ? acc : [...acc, url]),
        []
      )

  const listPageTasks = listPageUrls.map((url) => async () => {
    if (url === source.url && listHtml) {
      return listHtml
    }
    return await fetchHtml(url, SOURCE_TIMEOUT_MS, forceRefresh, source.allowInsecureTls)
  })

  const listPageResults = await mapWithConcurrency(listPageTasks, LIST_PAGE_CONCURRENCY)
  const pageErrors = listPageResults.errors.map((message) => ({ sourceId: source.id, message }))
  const listPageHtmls = listPageResults.results
  const links = listPageHtmls.reduce<string[]>((acc, html) => {
    const extracted = extractArticleLinks(html, source)
    return extracted.reduce<string[]>((inner, url) => (inner.includes(url) ? inner : [...inner, url]), acc)
  }, [])
  const maxItems = source.maxItems ?? DEFAULT_MAX_ITEMS
  const baseLinks = links.length > 0 ? links : [source.url]
  const limitedLinks = baseLinks.slice(0, maxItems)

  const tasks = limitedLinks.map((url) => async () => {
    const html = await fetchHtml(url, ARTICLE_TIMEOUT_MS, forceRefresh, source.allowInsecureTls)
    const { title, date, contentText } = extractTitleDateContent(html, url, fetchedAtIso)
    const summary = await summarize(contentText)
    return buildItem(source, url, title, date, summary, fetchedAtIso)
  })

  const { results, errors } = await mapWithConcurrency(tasks, ARTICLE_CONCURRENCY)

  return {
    items: results,
    errors: [...pageErrors, ...errors.map((message) => ({ sourceId: source.id, message }))]
  }
}
