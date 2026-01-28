
import { createChatCompletion } from '@/lib/llm/openAiClient'
import { mapWithConcurrency } from '@/lib/scrape/mapWithConcurrency'

const CHUNK_MAX_CHARS = 4000
const CHUNK_SUMMARY_MAX_TOKENS = 220
const FINAL_SUMMARY_MAX_TOKENS = 200
const CHUNK_CONCURRENCY = 2

const normalizeText = (content: string) => content.replace(/\s+/g, ' ').trim()

const forceFiveLines = (text: string) => {
  const clean = text.split(/1\)/)[1] ?? text

  const points = ('1)' + clean)
    .split(/\s(?=\d\))/)
    .slice(0, 5)
    .map((p) => p.trim())

  while (points.length < 5) {
    points.push(`${points.length + 1}) Klíčová informace z článku.`)
  }

  return points.join('\n')
}

const splitIntoChunks = (text: string, chunkSize: number) =>
  Array.from({ length: Math.ceil(text.length / chunkSize) }, (_, index) =>
    text.slice(index * chunkSize, (index + 1) * chunkSize)
  ).filter((chunk) => chunk.length > 0)

const buildChunkPrompt = (chunk: string, index: number, total: number) => [
  {
    role: 'system' as const,
    content: 'Jsi asistent, který shrnuje texty článků v češtině. Zachováváš klíčová fakta a kontext.'
  },
  {
    role: 'user' as const,
    content: `Shrň tento segment článku v češtině. Zachovej důležitá fakta, jména, data a výsledky. Segment ${index} z ${total}:\n\n${chunk}`
  }
]

const buildFinalPrompt = (chunkSummaries: string[]) => [
  {
    role: 'system' as const,
    content: `Shrň následující článek.

PRAVIDLA:
- piš česky
- vrať PŘESNĚ 5 bodů
- body odděluj pouze čísly 1) až 5)
- žádné nadpisy, žádný jiný text`
  },
  {
    role: 'user' as const,
    content: `Text článku:\n\n${chunkSummaries.join('\n\n')}`
  }
]

export const summarize = async (content: string) => {
  const text = normalizeText(content)
  console.log('INPUT TEXT:', text.slice(0, 200))

  if (!text) {
    return ''
  }

  const chunks = splitIntoChunks(text, CHUNK_MAX_CHARS)
  let chunkSummaries: string[]

  if (chunks.length === 1) {
    chunkSummaries = [chunks[0]]
  } else {
    const tasks = chunks.map(
      (chunk, index) => async () =>
        await createChatCompletion(buildChunkPrompt(chunk, index + 1, chunks.length), {
          maxTokens: CHUNK_SUMMARY_MAX_TOKENS
        })
    )
    const { results, errors } = await mapWithConcurrency(tasks, CHUNK_CONCURRENCY)
    if (errors.length > 0) {
      throw new Error(`LLM summarization failed: ${errors.join('; ')}`)
    }
    chunkSummaries = results
  }

  const summary = await createChatCompletion(buildFinalPrompt(chunkSummaries), {
    maxTokens: FINAL_SUMMARY_MAX_TOKENS
  })

  console.log('LLM SUMMARY:', summary)
  return forceFiveLines(summary)
}
