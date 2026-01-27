import type { ListPageParams } from '@/lib/types'

const toOptionalNonNegativeInt = (value: string | null) => {
  if (value === null) {
    return undefined
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return undefined
  }
  return Math.max(0, Math.floor(parsed))
}

export const parseListPageParams = (searchParams: URLSearchParams): ListPageParams | undefined => {
  const listPageOffset = toOptionalNonNegativeInt(searchParams.get('listPageOffset'))
  const rawLimit = toOptionalNonNegativeInt(searchParams.get('listPageLimit'))
  const listPageLimit = rawLimit === undefined ? undefined : Math.max(1, rawLimit)

  if (listPageOffset === undefined && listPageLimit === undefined) {
    return undefined
  }

  return { listPageOffset, listPageLimit }
}
