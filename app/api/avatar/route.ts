import { NextRequest, NextResponse } from 'next/server';

const cacheControl = 'public, max-age=3600, stale-while-revalidate=86400';
const allowedAvatarHosts = ['googleusercontent.com', 'gstatic.com'];

function isAllowedAvatarHost(hostname: string) {
  return allowedAvatarHosts.some((allowedHost) => hostname === allowedHost || hostname.endsWith(`.${allowedHost}`));
}

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get('src');
  if (!source) {
    return NextResponse.json({ error: 'Missing src query param.' }, { status: 400 });
  }

  let sourceUrl: URL;
  try {
    sourceUrl = new URL(source);
  } catch {
    return NextResponse.json({ error: 'Invalid avatar URL.' }, { status: 400 });
  }

  if (sourceUrl.protocol !== 'http:' && sourceUrl.protocol !== 'https:') {
    return NextResponse.json({ error: 'Unsupported URL protocol.' }, { status: 400 });
  }
  if (!isAllowedAvatarHost(sourceUrl.hostname)) {
    return NextResponse.json({ error: 'Avatar host not allowed.' }, { status: 400 });
  }

  try {
    const upstream = await fetch(sourceUrl.toString(), {
      cache: 'no-store',
      headers: {
        Accept: 'image/*',
      },
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: 'Avatar unavailable.' }, { status: 502 });
    }

    const buffer = await upstream.arrayBuffer();
    const contentType = upstream.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Avatar fetch failed.' }, { status: 502 });
  }
}
