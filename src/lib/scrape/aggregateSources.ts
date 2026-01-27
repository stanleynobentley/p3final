import type { Item, ListPageParams, Source, SyncResult } from '@/lib/types'
import { scrapeSourceItems } from '@/lib/scrape/scrapeSourceItems'

const dedupeSources = (sources: Source[]) =>
  sources.reduce<Source[]>((acc, source) => {
    const exists = acc.some((item) => item.url === source.url)
    return exists ? acc : [...acc, source]
  }, [])

const buildError = (sourceId: string, message: string) => ({ sourceId, message })

const dedupeItems = (items: Item[]) =>
  items.reduce<Item[]>((acc, item) => {
    const exists = acc.some((existing) => existing.url === item.url)
    return exists ? acc : [...acc, item]
  }, [])

export const aggregateSources = async (
  sources: Source[],
  forceRefresh: boolean,
  listPageParams?: ListPageParams
): Promise<SyncResult> => {
  const fetchedAtIso = new Date().toISOString()
  const uniqueSources = dedupeSources(sources)

  const results = await Promise.allSettled(
    uniqueSources.map(async (source) => {
      try {
        const result = await scrapeSourceItems(source, fetchedAtIso, forceRefresh, listPageParams)
        return result
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return { items: [], errors: [buildError(source.id, message)] }
      }
    })
  )

  const items = results.reduce<Item[]>((acc, result) => {
    if (result.status === 'fulfilled') {
      return [...acc, ...result.value.items]
    }
    return acc
  }, [])

  const errors = results.reduce<SyncResult['errors']>((acc, result) => {
    if (result.status === 'fulfilled') {
      return [...acc, ...result.value.errors]
    }
    const message = result.reason instanceof Error ? result.reason.message : 'Unknown error'
    return [...acc, buildError('unknown', message)]
  }, [])

  const dedupedItems = dedupeItems(items)
  const sortedItems = [...dedupedItems].sort((a, b) => b.date.localeCompare(a.date))

  return {
    items: sortedItems,
    errors,
    lastSync: fetchedAtIso
  }
}
