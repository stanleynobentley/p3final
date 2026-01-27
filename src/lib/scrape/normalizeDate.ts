export const normalizeToIso = (candidate: string, fallbackIso: string) => {
  if (!candidate) {
    return fallbackIso
  }

  const parsed = Date.parse(candidate)
  if (Number.isNaN(parsed)) {
    return fallbackIso
  }

  return new Date(parsed).toISOString()
}
