import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.API_URL ?? 'http://localhost:3000'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url)
  // Browser-side listings (infinite scroll, visualizer) get the same in-stock-only
  // view as the server-rendered pages — see fetchProducts in lib/api/server.ts.
  searchParams.set('stockStatus', 'in_stock')
  const url = `${BACKEND}/api/products?${searchParams.toString()}`

  try {
    const res = await fetch(url)
    const data = await res.text()
    return new NextResponse(data, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Backend unreachable' },
      { status: 502 },
    )
  }
}
