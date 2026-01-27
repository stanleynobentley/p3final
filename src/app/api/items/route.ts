import { NextResponse } from 'next/server'
import { getCachedOrRefresh } from '@/lib/cache/getCachedOrRefresh'
import { parseListPageParams } from '@/app/api/utils/parseListPageParams'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const listPageParams = parseListPageParams(searchParams)
  const data = await getCachedOrRefresh(false, listPageParams)
  return NextResponse.json(data)
}
