import type { Source } from '@/lib/types'

type ListPageRange = {
  offset: number
  limit: number
}

const toNonNegativeInt = (value: number) => {
  if (!Number.isFinite(value)) {
    return 0
  }
  return Math.max(0, Math.floor(value))
}

const hasPlaceholder = (template: string) => template.includes('{page}')

const dedupeUrls = (urls: string[]) =>
  urls.reduce<string[]>((acc, url) => (acc.includes(url) ? acc : [...acc, url]), [])

export const buildListPageUrls = (source: Source, range: ListPageRange) => {
  const template = source.listPageTemplate
  if (!template || !hasPlaceholder(template)) {
    return []
  }

  const offset = toNonNegativeInt(range.offset)
  const limit = toNonNegativeInt(range.limit)
  if (limit === 0) {
    return []
  }

  const startPage = offset + 1
  const endPage = offset + limit
  const pages = Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index)

  const urls = pages.reduce<string[]>((acc, page) => {
    if (page === 1) {
      return [...acc, source.url]
    }
    return [...acc, template.replace('{page}', String(page))]
  }, [])

  return dedupeUrls(urls)
}
