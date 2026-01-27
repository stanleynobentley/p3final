import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getCachedOrRefresh } from '@/lib/cache/getCachedOrRefresh'
import { CACHE_KEY_ITEMS } from '@/lib/cache/constants'
import { parseListPageParams } from '@/app/api/utils/parseListPageParams'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  revalidateTag(CACHE_KEY_ITEMS)
  const { searchParams } = new URL(request.url)
  const listPageParams = parseListPageParams(searchParams)
  const data = await getCachedOrRefresh(true, listPageParams)
  return NextResponse.json(data)
}
