import type { JSDOM } from 'jsdom'

const pickDatePublished = (value: unknown): string | null => {
  if (!value) {
    return null
  }

  if (typeof value === 'string') {
    return value
  }

  if (Array.isArray(value)) {
    return value.map(pickDatePublished).find((item) => Boolean(item)) ?? null
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    const direct = record.datePublished
    const graph = record['@graph']
    const dateFromGraph = pickDatePublished(graph)
    return (typeof direct === 'string' ? direct : null) || dateFromGraph
  }

  return null
}

export const extractJsonLdDate = (dom: JSDOM) => {
  const scripts = Array.from(dom.window.document.querySelectorAll('script[type="application/ld+json"]'))

  return scripts
    .map((script) => {
      try {
        const parsed = JSON.parse(script.textContent ?? '')
        return pickDatePublished(parsed)
      } catch {
        return null
      }
    })
    .find((value): value is string => Boolean(value))
}
