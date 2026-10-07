import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.API_URL ?? 'http://localhost:3000';

type RouteContext = { params: Promise<{ proxy: string[] }> };

async function proxyRequest(req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  const { proxy } = await ctx.params;
  const path = proxy.join('/');
  const search = req.nextUrl.search;
  const url = `${BACKEND}/api/v1/auth/${path}${search}`;

  // Build forwarded headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Clerk bearer token only; the backend no longer reads cookies on these routes.
  const authorization = req.headers.get('authorization');
  if (authorization) headers['authorization'] = authorization;

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

  const body = await backendRes.text();
  return new NextResponse(body, {
    status: backendRes.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET    = (req: NextRequest, ctx: RouteContext) => proxyRequest(req, ctx);
export const POST   = (req: NextRequest, ctx: RouteContext) => proxyRequest(req, ctx);
export const PATCH  = (req: NextRequest, ctx: RouteContext) => proxyRequest(req, ctx);
export const DELETE = (req: NextRequest, ctx: RouteContext) => proxyRequest(req, ctx);
