'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Item, SyncResult } from '@/lib/types'

const DAYS_OPTIONS = [1, 7, 14] as const
const LIST_PAGE_BATCH = 15

type LoadState = {
  data: SyncResult | null
  loading: boolean
  error: string | null
}

type FetchOptions = {
  force: boolean
  listPageOffset: number
  listPageLimit: number
}

const initialState: LoadState = {
  data: null,
  loading: true,
  error: null
}

const fetchItems = async (options: FetchOptions) => {
  const endpoint = options.force ? '/api/sync' : '/api/items'
  const searchParams = new URLSearchParams({
    listPageOffset: String(options.listPageOffset),
    listPageLimit: String(options.listPageLimit)
  })
  const url = `${endpoint}?${searchParams.toString()}`
  const response = await fetch(url, { method: options.force ? 'POST' : 'GET' })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  return (await response.json()) as SyncResult
}

const withinDays = (dateIso: string, days: number) => {
  const threshold = Date.now() - days * 24 * 60 * 60 * 1000
  const parsed = Date.parse(dateIso)
  return !Number.isNaN(parsed) && parsed >= threshold
}

const uniqueSources = (items: Item[]) =>
  items.reduce<{ id: string; name: string }[]>((acc, item) => {
    const exists = acc.some((source) => source.id === item.sourceId)
    return exists ? acc : [...acc, { id: item.sourceId, name: item.sourceName }]
  }, [])

const mergeItems = (existing: Item[], incoming: Item[]) =>
  [...existing, ...incoming].reduce<Item[]>((acc, item) => {
    const exists = acc.some((candidate) => candidate.url === item.url)
    return exists ? acc : [...acc, item]
  }, [])

const mergeErrors = (existing: SyncResult['errors'], incoming: SyncResult['errors']) =>
  [...existing, ...incoming].reduce<SyncResult['errors']>((acc, error) => {
    const exists = acc.some((candidate) => candidate.sourceId === error.sourceId && candidate.message === error.message)
    return exists ? acc : [...acc, error]
  }, [])

const mergeSyncResults = (current: SyncResult, incoming: SyncResult): SyncResult => {
  const items = mergeItems(current.items, incoming.items).sort((a, b) => b.date.localeCompare(a.date))
  const errors = mergeErrors(current.errors, incoming.errors)
  const lastSync =
    current.lastSync && incoming.lastSync
      ? current.lastSync >= incoming.lastSync
        ? current.lastSync
        : incoming.lastSync
      : current.lastSync || incoming.lastSync
  return { items, errors, lastSync }
}

export const ItemsView = () => {
  const [state, setState] = useState<LoadState>(initialState)
  const [daysFilter, setDaysFilter] = useState<number>(1)
  const [sourceFilter, setSourceFilter] = useState('all')
  const [pageOffset, setPageOffset] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)

  const load = useCallback(async (force: boolean) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const data = await fetchItems({ force, listPageOffset: 0, listPageLimit: LIST_PAGE_BATCH })
      setState({ data, loading: false, error: null })
      setPageOffset(LIST_PAGE_BATCH)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Load failed'
      setState({ data: null, loading: false, error: message })
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (loadingMore || state.loading) {
      return
    }
    setLoadingMore(true)
    try {
      const data = await fetchItems({ force: false, listPageOffset: pageOffset, listPageLimit: LIST_PAGE_BATCH })
      setState((prev) => {
        if (!prev.data) {
          return { data, loading: false, error: null }
        }
        return { data: mergeSyncResults(prev.data, data), loading: false, error: null }
      })
      setPageOffset((prev) => prev + LIST_PAGE_BATCH)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Load failed'
      setState((prev) => ({ ...prev, error: message }))
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, pageOffset, state.loading])

  const items = state.data?.items ?? []
  const errors = state.data?.errors ?? []
  const sources = useMemo(() => uniqueSources(items), [items])

  const filteredItems = useMemo(() => {
    const byDays = items.filter((item) => withinDays(item.date, daysFilter))
    const bySource = sourceFilter === 'all' ? byDays : byDays.filter((item) => item.sourceId === sourceFilter)
    return [...bySource].sort((a, b) => b.date.localeCompare(a.date))
  }, [items, daysFilter, sourceFilter])

  useEffect(() => {
    load(false)
  }, [load])

  return (
    <main>
      <header>
        <h1>P3everything</h1>
        <p className="status">
          {state.data?.lastSync ? `Poslední synchronizace: ${new Date(state.data.lastSync).toLocaleString('cs-CZ')}` : 'Poslední synchronizace: -'}
        </p>
        {state.error ? <p className="status">Chyba nacitani: {state.error}</p> : null}
      </header>

      <section className="panel controls">
        <label>
          Počet dní:
          <select value={daysFilter} onChange={(e) => setDaysFilter(Number(e.target.value))}>
            <option value={1}>1 den</option>
            <option value={7}>7 dní</option>
            <option value={14}>14 dní</option>
          </select>
        </label>
        <label>
          Zdroj:
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option value="all">Všechny</option>
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => load(true)} disabled={state.loading}>
          Sync
        </button>
      </section>

      {errors.length > 0 ? (
        <ul className="error-list">
          {errors.map((error) => (
            <li key={`${error.sourceId}-${error.message}`}>
              {error.sourceId}: {error.message}
            </li>
          ))}
        </ul>
      ) : null}

      <section className="articles-grid">
        {state.loading && !state.data ? <p>Loading...</p> : null}
        {filteredItems.map((item) => (
          <article className="article-card" key={item.id}>
            <div className="article-image">
              <img
                src={item.imageUrl ?? '/placeholder.svg'}
                alt={item.title}
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg'
                }}
              />
            </div>
            <div className="article-content">
              <a href={item.url} target="_blank" rel="noreferrer">
                <h2 className="article-title">{item.title}</h2>
              </a>
              <ul className="article-summary">
                {item.summary
                  .split('\n')
                  .map((line) => line.replace(/^\d+\)\s*/, ''))
                  .filter((point) => point.trim())
                  .map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
              </ul>
            </div>
          </article>
        ))}
      </section>
      {state.data ? (
        <button className="load-more" onClick={loadMore} disabled={loadingMore || state.loading}>
          {loadingMore ? 'Načítání...' : 'Načíst další'}
        </button>
      ) : null}
    </main>
  )
}

export default ItemsView
