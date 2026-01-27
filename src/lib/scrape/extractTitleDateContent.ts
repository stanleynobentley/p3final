import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'
import { extractJsonLdDate } from '@/lib/scrape/extractJsonLdDate'
import { extractMainText } from '@/lib/scrape/extractMainText'
import { normalizeToIso } from '@/lib/scrape/normalizeDate'

export const extractTitleDateContent = (html: string, url: string, fetchedAtIso: string) => {
  const dom = new JSDOM(html, { url })
  const doc = dom.window.document

  const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim()
  const pageTitle = doc.querySelector('title')?.textContent?.trim()
  const h1 = doc.querySelector('h1')?.textContent?.trim()
  const title = ogTitle || pageTitle || h1 || 'Untitled'

  const metaTime = doc.querySelector('meta[property="article:published_time"]')?.getAttribute('content')
  const timeTag = doc.querySelector('time[datetime]')?.getAttribute('datetime')
  const jsonLdDate = extractJsonLdDate(dom)
  const dateCandidate = metaTime || timeTag || jsonLdDate || fetchedAtIso
  const date = normalizeToIso(dateCandidate, fetchedAtIso)

  const reader = new Readability(doc)
  const article = reader.parse()
  const contentText = article?.textContent?.trim() || extractMainText(doc)

  return { title, date, contentText }
}
