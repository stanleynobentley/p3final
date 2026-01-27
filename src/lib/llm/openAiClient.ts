import { getOpenAiConfig } from '@/lib/llm/openAiConfig'

type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type ChatCompletionOptions = {
  temperature?: number
  maxTokens?: number
}

type OpenAiChoice = {
  message?: {
    content?: string | null
  }
}

type OpenAiResponse = {
  choices?: OpenAiChoice[]
  error?: { message?: string }
}

export const createChatCompletion = async (
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
) => {
  const { apiKey, baseUrl, model } = getOpenAiConfig()
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens
    })
  })

  const payload = (await response.json()) as OpenAiResponse
  if (!response.ok) {
    const errorMessage = payload.error?.message ?? `OpenAI request failed with ${response.status}`
    throw new Error(errorMessage)
  }

  const content = payload.choices?.[0]?.message?.content?.trim()
  if (!content) {
    throw new Error('OpenAI response missing content')
  }

  return content
}
