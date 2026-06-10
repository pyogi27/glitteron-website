// lib/ai/providers/openai.ts
import OpenAI from 'openai'
import type { AIGenerateRequest, AIGenerateResponse } from '@/lib/ai/types'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function buildOpenAIPrompt(productName: string, category: string): string {
  const cat = category.toLowerCase()

  if (cat.includes('wall')) {
    return `Place the ${productName} wall light from the product reference image onto the wall of the room photo. Mount it naturally on the wall with realistic depth and shadows matching the room's lighting. Keep all other room elements unchanged. Photorealistic result.`
  }
  if (cat.includes('floor')) {
    return `Place the ${productName} floor lamp from the product reference image onto the floor of the room photo, standing naturally beside furniture. Keep all other room elements unchanged. Photorealistic result.`
  }
  if (cat.includes('chandelier')) {
    return `Place the ${productName} chandelier from the product reference image hanging from the ceiling centre of the room photo, with realistic depth and shadows. Keep all other room elements unchanged. Photorealistic result.`
  }
  if (cat.includes('ceiling')) {
    return `Place the ${productName} ceiling light from the product reference image flush-mounted on the ceiling of the room photo. Keep all other room elements unchanged. Photorealistic result.`
  }
  // Default: pendant lights and anything else hang from ceiling
  return `Place the ${productName} lighting fixture from the product reference image suspended from the ceiling of the room photo, centred, with realistic depth and shadows. Keep all other room elements unchanged. Photorealistic result.`
}

export async function generateCompositeWithOpenAI(
  req: AIGenerateRequest
): Promise<AIGenerateResponse> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in environment')
  }

  // Fetch the product AR image to use as an additional reference
  const productRes = await fetch(req.productImageUrl)
  if (!productRes.ok) {
    throw new Error(
      `Failed to fetch product AR image (${productRes.status}): ${req.productImageUrl}`
    )
  }
  const productArrayBuffer = await productRes.arrayBuffer()
  const productBuffer = Buffer.from(productArrayBuffer)

  // Convert room image base64 to Buffer
  const roomBuffer = Buffer.from(req.roomImageBase64, 'base64')

  // gpt-image-1 images.edit: places the product fixture into the room ceiling
  // Pass both images as an array — room photo first, product AR image second
  const response = await client.images.edit({
    model: 'gpt-image-1',
    image: [
      new File([roomBuffer], 'room.jpg', { type: req.roomMimeType }),
      new File([productBuffer], 'product.png', { type: 'image/png' }),
    ],
    prompt: buildOpenAIPrompt(req.productName, req.productCategory),
    size: '1024x1024',
    quality: 'high',
    n: 1,
  } as Parameters<typeof client.images.edit>[0]) as OpenAI.ImagesResponse

  const b64 = response.data?.[0]?.b64_json
  if (!b64) {
    throw new Error('OpenAI returned no image data')
  }

  return {
    compositeImageUrl: `data:image/png;base64,${b64}`,
    provider: 'openai',
  }
}
