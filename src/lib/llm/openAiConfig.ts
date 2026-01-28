import 'server-only'

type OpenAiConfig = {
  apiKey: string
  baseUrl: string
  model: string
}

const DEFAULT_BASE_URL = 'https://api.openai.com/v1'
const DEFAULT_MODEL = 'gpt-4o-mini'

export const getOpenAiConfig = (): OpenAiConfig => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error('[SERVER] OPENAI_API_KEY is not configured. Set it in Vercel Environment Variables.')
    throw new Error('OPENAI_API_KEY not configured')
  }

  return {
    apiKey,
    baseUrl: process.env.OPENAI_BASE_URL ?? DEFAULT_BASE_URL,
    model: process.env.OPENAI_MODEL ?? DEFAULT_MODEL
  }
}
