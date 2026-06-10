// lib/ai/types.ts

export interface AIGenerateRequest {
  roomImageBase64: string                                        // raw base64, no data: prefix
  roomMimeType: 'image/jpeg' | 'image/png' | 'image/webp'
  productImageUrl: string                                        // public URL of product arImages
  productName: string
  productCategory: string                                        // e.g. "Wall Light", "Pendant Light"
}

export interface AIGenerateResponse {
  compositeImageUrl: string   // data URL or remote URL of the inpainted result
  provider: string            // which provider produced it
}

export interface SharePayload {
  roomType: string
  compositeImageUrl: string
  products: Array<{
    id: number
    name: string
    price: string
    thumb: string
  }>
  createdAt: string           // ISO string
}

export interface ShareResult {
  id: string
  url: string                 // e.g. /room-visualizer/share/<id>
}
