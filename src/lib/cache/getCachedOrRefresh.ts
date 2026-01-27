import { unstable_cache } from 'next/cache'
import { sources } from '@/config/sources'
import type { ListPageParams, SyncResult } from '@/lib/types'
import { CACHE_KEY_ITEMS, CACHE_TTL_MS } from '@/lib/cache/constants'
import { getMemoryCache, setMemoryCache } from '@/lib/cache/memoryCache'
import { aggregateSources } from '@/lib/scrape/aggregateSources'

const cachedAggregate = unstable_cache(async () => aggregateSources(sources, false), [CACHE_KEY_ITEMS], {
  revalidate: 3600,
  tags: [CACHE_KEY_ITEMS]
})

const buildCacheKey = (params?: ListPageParams) => {
  if (!params) {
    return CACHE_KEY_ITEMS
  }
  const offset = params.listPageOffset ?? 0
  const limit = params.listPageLimit ?? 0
  return `${CACHE_KEY_ITEMS}:${offset}:${limit}`
}

export const getCachedOrRefresh = async (forceRefresh: boolean, listPageParams?: ListPageParams): Promise<SyncResult> => {
  const now = Date.now()
  const cacheKey = buildCacheKey(listPageParams)

  if (!forceRefresh) {
    const memory = getMemoryCache(cacheKey, now)
    if (memory) {
      return memory
    }
  }

  const data =
    listPageParams && listPageParams.listPageLimit !== undefined
      ? await aggregateSources(sources, forceRefresh, listPageParams)
      : forceRefresh
        ? await aggregateSources(sources, true)
        : await cachedAggregate()
  setMemoryCache(cacheKey, data, CACHE_TTL_MS, now)
  return data
}
