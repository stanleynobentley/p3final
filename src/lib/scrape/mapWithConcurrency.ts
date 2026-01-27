type Task<T> = () => Promise<T>

type MapResult<T> = {
  results: T[]
  errors: string[]
}

type TaskOutcome<T> = { result: T } | { error: string }

const toChunks = <T>(items: T[], limit: number) =>
  items.reduce<T[][]>((acc, item, index) => {
    const chunkIndex = Math.floor(index / limit)
    const existing = acc[chunkIndex] ?? []
    const updated = [...existing, item]
    const mapped = acc.map((chunk, idx) => (idx === chunkIndex ? updated : chunk))
    return acc.length <= chunkIndex ? [...mapped, updated] : mapped
  }, [])

const collectOutcomes = <T>(outcomes: TaskOutcome<T>[]) =>
  outcomes.reduce<MapResult<T>>(
    (acc, outcome) =>
      'result' in outcome
        ? { results: [...acc.results, outcome.result], errors: acc.errors }
        : { results: acc.results, errors: [...acc.errors, outcome.error] },
    { results: [], errors: [] }
  )

export const mapWithConcurrency = async <T>(tasks: Task<T>[], limit: number): Promise<MapResult<T>> => {
  if (tasks.length === 0) {
    return { results: [], errors: [] }
  }

  const chunks = toChunks(tasks, limit)

  const initial: MapResult<T> = { results: [], errors: [] }

  return chunks.reduce<Promise<MapResult<T>>>(async (prevPromise, chunk) => {
    const previous = await prevPromise
    const outcomes = await Promise.all(
      chunk.map(async (task) => {
        try {
          const result = await task()
          return { result } as TaskOutcome<T>
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          return { error: message } as TaskOutcome<T>
        }
      })
    )

    const current = collectOutcomes(outcomes)
    return {
      results: [...previous.results, ...current.results],
      errors: [...previous.errors, ...current.errors]
    }
  }, Promise.resolve(initial))
}
