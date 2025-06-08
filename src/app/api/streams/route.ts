import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Always prepare CORS headers to prevent "immediate error" bugs.
  const responseHeaders = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  });

  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return new NextResponse('Missing URL parameter', { status: 400, headers: responseHeaders });
    }

    console.log(`[Proxy] Requesting: ${targetUrl}`);

    // Fetch the stream with a simple, standard User-Agent.
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      }
    });

    if (!response.ok) {
      console.error(`[Proxy] Upstream error: ${response.status} for ${response.url}`);
      return new NextResponse(`Upstream error: ${response.statusText}`, { status: response.status, headers: responseHeaders });
    }
    
    console.log(`[Proxy] Success from upstream: ${response.status}`);

    // Add headers from the source response to our response headers.
    ['content-type', 'content-length', 'content-range', 'accept-ranges'].forEach(name => {
      if (response.headers.has(name)) {
        responseHeaders.set(name, response.headers.get(name)!);
      }
    });

    // If the content is a playlist, we must rewrite its internal URLs.
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('mpegurl') || contentType.includes('m3u8')) {
      const manifestText = await response.text();
      const manifestBaseUrl = response.url; // Use the final URL after redirects.

      const rewrittenManifest = manifestText.split('\n').map(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) {
          if (trimmedLine.startsWith('#EXT-X-KEY')) {
              const uriMatch = trimmedLine.match(/URI="([^"]+)"/);
              if (uriMatch?.[1]) {
                  const absoluteKeyUrl = new URL(uriMatch[1], manifestBaseUrl).href;
                  const proxiedKeyUrl = `/api/streams?url=${encodeURIComponent(absoluteKeyUrl)}`;
                  return trimmedLine.replace(uriMatch[1], proxiedKeyUrl);
              }
          }
          return line;
        }
        
        const absoluteSegmentUrl = new URL(trimmedLine, manifestBaseUrl).href;
        return `/api/streams?url=${encodeURIComponent(absoluteSegmentUrl)}`;
      }).join('\n');

      responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
      responseHeaders.set('Content-Length', String(Buffer.byteLength(rewrittenManifest)));
      
      return new NextResponse(rewrittenManifest, { status: 200, headers: responseHeaders });

    } else {
      // If it's a video segment or other binary data, just stream it through.
      return new NextResponse(response.body, { status: 200, headers: responseHeaders });
    }

  } catch (error) {
    console.error('[Proxy] CRITICAL ERROR:', error);
    return new NextResponse('Proxy request failed due to a critical error.', { status: 500, headers: responseHeaders });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
