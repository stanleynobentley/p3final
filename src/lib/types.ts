export type Source = {
  id: string
  name: string
  url: string
  articleUrlPattern?: string
  excludeUrlPatterns?: string[]
  listPageUrlPattern?: string
  listPageTemplate?: string
  allowInsecureTls?: boolean
  linkContainerSelectors?: string[]
  linkSelector?: string
  maxItems?: number
}

export type Item = {
  id: string
  sourceId: string
  sourceName: string
  url: string
  title: string
  date: string
  summary: string
  imageUrl?: string
  fetchedAt: string
}

export type SyncResult = {
  items: Item[]
  errors: { sourceId: string; message: string }[]
  lastSync: string
}

export type ListPageParams = {
  listPageOffset?: number
  listPageLimit?: number
}
