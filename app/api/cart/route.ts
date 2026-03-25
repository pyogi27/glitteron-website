import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.API_URL ?? 'http://localhost:3000';

async function proxyRequest(req: NextRequest): Promise<NextResponse> {
  const url = `${BACKEND}/api/v1/cart`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const authorization = req.headers.get('authorization');
  if (authorization) headers['authorization'] = authorization;

  const cookie = req.headers.get('cookie');
  if (cookie) headers['cookie'] = cookie;

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

  if (backendRes.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const body = await backendRes.text();
  const response = new NextResponse(body, {
    status: backendRes.status,
    headers: { 'Content-Type': 'application/json' },
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

export const GET    = (req: NextRequest) => proxyRequest(req);
export const POST   = (req: NextRequest) => proxyRequest(req);
export const PATCH  = (req: NextRequest) => proxyRequest(req);
export const DELETE = (req: NextRequest) => proxyRequest(req);
