import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');
    const targetReferer = searchParams.get('referer'); // The "disguise" from iptv.ts

    if (!targetUrl) {
      return new NextResponse('Missing URL parameter', { status: 400 });
    }

    console.log(`[Proxy] Request received for: ${targetUrl}`);

    // --- The Core Logic: This is the definitive version ---
    let finalResponse: Response;
    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    };

    // **THE FIX**: If a stream needs a disguise, we give it the FULL disguise.
    if (targetReferer) {
      fetchHeaders['Referer'] = targetReferer;
      // The Origin header is the crucial missing piece.
      fetchHeaders['Origin'] = new URL(targetReferer).origin;
    }

    // Determine if the URL is a gatekeeper (.php) or direct content (.m3u8, .ts, etc.)
    const isGatekeeper = targetUrl.includes('.php');

    if (isGatekeeper) {
      // --- Handle the Gatekeeper ---
      console.log(`[Proxy] Gatekeeper stream detected. Applying disguise and expecting redirect.`);
      
      // We must handle the redirect manually.
      const gatekeeperResponse = await fetch(targetUrl, {
        headers: fetchHeaders,
        redirect: 'manual', 
      });

      const redirectUrl = gatekeeperResponse.headers.get('location');
      if (!redirectUrl) {
        console.error('[Proxy] CRITICAL: Gatekeeper did not provide a redirect URL.');
        return new NextResponse('Gatekeeper failed: no redirect location.', { status: 502 });
      }
      
      console.log(`[Proxy] Gatekeeper redirected. Fetching final stream from: ${redirectUrl}`);
      // Now fetch the real M3U8 playlist from the URL the gatekeeper gave us.
      finalResponse = await fetch(redirectUrl, { headers: fetchHeaders });

    } else {
      // --- Handle Direct Content (LA7, NBA TV, or a .ts video segment from a protected stream) ---
      console.log(`[Proxy] Direct content request.`);
      // Just fetch the URL. The headers are already correctly set (with or without the full disguise).
      finalResponse = await fetch(targetUrl, { headers: fetchHeaders });
    }

    // --- Process the Final Response ---
    if (!finalResponse.ok) {
      console.error(`[Proxy] Upstream error: ${finalResponse.status} for ${finalResponse.url}`);
      return new NextResponse(`Upstream error: ${finalResponse.status}`, { status: finalResponse.status });
    }
    console.log(`[Proxy] Success from upstream: ${finalResponse.status} ${finalResponse.url}`);

    const responseHeaders = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    });
    ['content-type', 'content-length', 'content-range', 'accept-ranges'].forEach(name => {
      if (finalResponse.headers.has(name)) {
        responseHeaders.set(name, finalResponse.headers.get(name)!);
      }
    });

    const contentType = finalResponse.headers.get('content-type') || '';
    if (contentType.includes('mpegurl') || contentType.includes('m3u8')) {
      const manifestText = await finalResponse.text();
      const manifestBaseUrl = finalResponse.url;

      const rewrittenManifest = manifestText.split('\n').map(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) {
          if (trimmedLine.startsWith('#EXT-X-KEY')) {
              const uriMatch = trimmedLine.match(/URI="([^"]+)"/);
              if (uriMatch?.[1]) {
                  const absoluteKeyUrl = new URL(uriMatch[1], manifestBaseUrl).href;
                  const proxiedKeyUrl = `/api/streams?url=${encodeURIComponent(absoluteKeyUrl)}` + 
                                     (targetReferer ? `&referer=${encodeURIComponent(targetReferer)}` : '');
                  return trimmedLine.replace(uriMatch[1], proxiedKeyUrl);
              }
          }
          return line;
        }
        
        const absoluteSegmentUrl = new URL(trimmedLine, manifestBaseUrl).href;
        // CRITICAL: Carry the referer forward for every segment request.
        return `/api/streams?url=${encodeURIComponent(absoluteSegmentUrl)}` + 
               (targetReferer ? `&referer=${encodeURIComponent(targetReferer)}` : '');
      }).join('\n');

      responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
      responseHeaders.set('Content-Length', String(Buffer.byteLength(rewrittenManifest)));
      
      console.log(`[Proxy] Rewritten manifest served in ${Date.now() - startTime}ms`);
      return new NextResponse(rewrittenManifest, { status: 200, headers: responseHeaders });

    } else {
      console.log(`[Proxy] Binary content served in ${Date.now() - startTime}ms`);
      return new NextResponse(finalResponse.body, { status: 200, headers: responseHeaders });
    }

  } catch (error) {
    console.error(`[Proxy] CRITICAL ERROR in GET handler:`, error);
    return new NextResponse('Proxy request failed due to a critical error.', { status: 500 });
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
