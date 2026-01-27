export const fetchHtml = async (url: string, timeoutMs: number, noStore: boolean, allowInsecureTls?: boolean) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  const previousTlsSetting = process.env.NODE_TLS_REJECT_UNAUTHORIZED

  try {
    if (allowInsecureTls) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    }

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'PersonalAggregator/1.0'
      },
      cache: noStore ? 'no-store' : 'force-cache'
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return await response.text()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(`fetchHtml failed for ${url}: ${message}`)
    throw error
  } finally {
    clearTimeout(timeoutId)
    if (allowInsecureTls) {
      if (previousTlsSetting === undefined) {
        delete process.env.NODE_TLS_REJECT_UNAUTHORIZED
      } else {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = previousTlsSetting
      }
    }
  }
}
