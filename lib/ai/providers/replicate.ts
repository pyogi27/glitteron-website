// lib/ai/providers/replicate.ts
import type { AIGenerateRequest, AIGenerateResponse } from '@/lib/ai/types'

type ReplicatePrediction = {
  id: string
  urls: { get: string }
  status: string
  output?: string[]
  error?: string
}

function buildPrompt(productName: string, category: string): string {
  const cat = category.toLowerCase()

  // Matches real API category names: "Wall Lights"
  if (cat.includes('wall')) {
    return `A ${productName} wall light mounted on the wall, glowing softly, photorealistic interior design photo, high quality`
  }
  // "Floor Lamps"
  if (cat.includes('floor')) {
    return `A ${productName} floor lamp standing beside furniture, turned on, photorealistic interior design photo, high quality`
  }
  // "Chandelier Lights"
  if (cat.includes('chandelier')) {
    return `A ${productName} chandelier hanging from the ceiling centre, glowing warmly, photorealistic interior design photo, high quality`
  }
  // "Ceiling Lights"
  if (cat.includes('ceiling')) {
    return `A ${productName} ceiling light flush-mounted on the ceiling, glowing evenly, photorealistic interior design photo, high quality`
  }
  // "Pendant Lights"
  if (cat.includes('pendant')) {
    return `A ${productName} pendant light suspended from the ceiling, photorealistic interior design photo, high quality`
  }
  // Fallback for any unmapped category
  return `A ${productName} light fixture installed in a room, photorealistic interior design photo, high quality`
}

export async function generateCompositeWithReplicate(
  req: AIGenerateRequest
): Promise<AIGenerateResponse> {
  const useReal = process.env.ENABLE_AI_GENERATION === 'true'

  if (!useReal) {
    // Stub: return the original room image so the UI pipeline works end-to-end
    return {
      compositeImageUrl: `data:${req.roomMimeType};base64,${req.roomImageBase64}`,
      provider: 'replicate-stub',
    }
  }

  const token = process.env.REPLICATE_API_TOKEN
  if (!token) throw new Error('REPLICATE_API_TOKEN is not set in environment')

  // SDXL-inpainting on Replicate
  const startRes = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: 'c11bac58203367db93a3c552bd49a25a5567e5e1a432f9b5836e67e4e8e2e43e',
      input: {
        image: `data:${req.roomMimeType};base64,${req.roomImageBase64}`,
        inpaint_image: req.productImageUrl,
        prompt: buildPrompt(req.productName, req.productCategory),
        negative_prompt: 'blurry, cartoon, unrealistic, low quality, distorted',
        num_inference_steps: 30,
        guidance_scale: 7.5,
      },
    }),
  })

  if (!startRes.ok) {
    const body = await startRes.text()
    throw new Error(`Replicate prediction start failed (${startRes.status}): ${body}`)
  }

  const prediction = await startRes.json() as ReplicatePrediction

  if (!prediction.urls?.get) {
    throw new Error('Replicate API returned no polling URL')
  }

  // Poll every 3 seconds, up to 20 attempts (60s total)
  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise<void>((resolve) => setTimeout(resolve, 3000))

    const pollRes = await fetch(prediction.urls.get, {
      headers: { Authorization: `Token ${token}` },
    })
    if (!pollRes.ok) {
      const body = await pollRes.text()
      throw new Error(`Replicate poll failed (${pollRes.status}): ${body}`)
    }
    const polled = await pollRes.json() as ReplicatePrediction

    if (polled.status === 'succeeded' && polled.output?.[0]) {
      return { compositeImageUrl: polled.output[0], provider: 'replicate' }
    }
    if (polled.status === 'failed') {
      throw new Error(`Replicate inpainting failed: ${polled.error ?? 'unknown error'}`)
    }
  }

  throw new Error('Replicate inpainting timed out after 60 seconds')
}
