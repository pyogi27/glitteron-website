import { NextRequest, NextResponse } from 'next/server';
import { backendHeaders, isCrossSite, logEdgeHeadersOnce } from '@/lib/api/proxyGuard';

const BACKEND = process.env.API_URL ?? 'http://localhost:3000';

type RouteContext = { params: Promise<{ proxy: string[] }> };

async function proxyRequest(req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  const { proxy } = await ctx.params;
  const path = proxy.join('/');
  const searchParams = req.nextUrl.searchParams.toString();
  const url = `${BACKEND}/api/v1/guest/${path}${searchParams ? `?${searchParams}` : ''}`;

  if (isCrossSite(req.method, req.headers)) {
    return NextResponse.json({ success: false, message: 'Cross-site request refused' }, { status: 403 });
  }
  logEdgeHeadersOnce(req.headers);
  const headers = backendHeaders(req.headers);

  const init: RequestInit = { method: req.method, headers };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const body = await req.text();
    if (body) init.body = body;
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(url, init);
  } catch {
    return NextResponse.json({ success: false, message: 'Backend unreachable' }, { status: 502 });
  }

  // Sessions and order views: never cached by a browser or CDN.
  if (backendRes.status === 204) {
    return new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  }

  const body = await backendRes.text();
  const response = new NextResponse(body, {
    status: backendRes.status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

  const setCookies =
    typeof backendRes.headers.getSetCookie === 'function'
      ? backendRes.headers.getSetCookie()
      : backendRes.headers.get('set-cookie')
        ? [backendRes.headers.get('set-cookie')!]
        : [];

  setCookies.forEach(c => response.headers.append('set-cookie', c));

  return response;
}

export const GET    = (req: NextRequest, ctx: RouteContext) => proxyRequest(req, ctx);
export const POST   = (req: NextRequest, ctx: RouteContext) => proxyRequest(req, ctx);
export const PATCH  = (req: NextRequest, ctx: RouteContext) => proxyRequest(req, ctx);
export const DELETE = (req: NextRequest, ctx: RouteContext) => proxyRequest(req, ctx);
