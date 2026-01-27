import type { SyncResult } from '@/lib/types'

type CacheEntry = {
  data: SyncResult
  expiresAt: number
}

let memoryCache: Record<string, CacheEntry> = {}

export const getMemoryCache = (key: string, now: number) => {
  const entry = memoryCache[key]
  if (!entry || entry.expiresAt <= now) {
    return null
  }
  return entry.data
}

export const setMemoryCache = (key: string, data: SyncResult, ttlMs: number, now: number) => {
  const entry: CacheEntry = {
    data,
    expiresAt: now + ttlMs
  }

  memoryCache = { ...memoryCache, [key]: entry }
}
