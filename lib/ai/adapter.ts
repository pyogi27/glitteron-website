// lib/ai/adapter.ts
import type { AIGenerateRequest, AIGenerateResponse } from '@/lib/ai/types'

export async function generateComposite(
  req: AIGenerateRequest
): Promise<AIGenerateResponse> {
  const provider = process.env.AI_GENERATION_PROVIDER ?? 'openai'

  if (provider === 'replicate') {
    const { generateCompositeWithReplicate } = await import('./providers/replicate')
    return generateCompositeWithReplicate(req)
  }

  if (provider === 'openai') {
    const { generateCompositeWithOpenAI } = await import('./providers/openai')
    return generateCompositeWithOpenAI(req)
  }

  throw new Error(
    `Unknown AI_GENERATION_PROVIDER: "${provider}". Valid values: "replicate", "openai".`
  )
}
