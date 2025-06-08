import { NextRequest, NextResponse } from 'next/server';

// This function is no longer needed as we will handle hosts dynamically.
// We remove it to reduce complexity and potential bugs.

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

    // --- Core Logic ---
    let finalResponse: Response;

    // 1. Prepare the disguise (headers) for the request.
    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    };
    // **THE FIX**: We ONLY add the Referer disguise if it's explicitly provided.
    // This protects LA7 and NBA TV from being broken.
    if (targetReferer) {
      fetchHeaders['Referer'] = targetReferer;
    }

    // 2. Determine if we are talking to a gatekeeper (.php) or getting content directly.
    const isGatekeeper = targetUrl.includes('.php');

    if (isGatekeeper) {
      // --- Handle the Gatekeeper ---
      console.log(`[Proxy] Gatekeeper detected. Applying disguise and expecting redirect.`);
      
      // We must handle the redirect manually to ensure the disguise is not lost.
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
      // Now fetch the actual M3U8 playlist from the URL the gatekeeper gave us,
      // using the same disguise. `fetch` will follow any further internal redirects.
      finalResponse = await fetch(redirectUrl, { headers: fetchHeaders });

    } else {
      // --- Handle Direct Content (LA7, NBA TV, or a .ts video segment) ---
      console.log(`[Proxy] Direct content request.`);
      // Just fetch the URL. The headers are already correctly set (with or without Referer).
      finalResponse = await fetch(targetUrl, { headers: fetchHeaders });
    }

    // --- 3. Process the Final Response ---
    if (!finalResponse.ok) {
      console.error(`[Proxy] Upstream error: ${finalResponse.status} for ${finalResponse.url}`);
      return new NextResponse(`Upstream error: ${finalResponse.status}`, { status: finalResponse.status });
    }
    console.log(`[Proxy] Success from upstream: ${finalResponse.status} ${finalResponse.url}`);

    // Create a fresh set of headers to send back to our video player.
    const responseHeaders = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    });
    ['content-type', 'content-length', 'content-range', 'accept-ranges'].forEach(name => {
      if (finalResponse.headers.has(name)) {
        responseHeaders.set(name, finalResponse.headers.get(name)!);
      }
    });

    // If the response is a playlist, we must rewrite its internal URLs.
    const contentType = finalResponse.headers.get('content-type') || '';
    if (contentType.includes('mpegurl') || contentType.includes('m3u8')) {
      const manifestText = await finalResponse.text();
      // The base URL for rewriting MUST be the final URL after all redirects.
      const manifestBaseUrl = finalResponse.url; 

      const rewrittenManifest = manifestText.split('\n').map(line => {
        const trimmedLine = line.trim();
        // If the line is not a URL, pass it through.
        if (!trimmedLine || trimmedLine.startsWith('#')) {
          // Special case: Some playlists have key URLs that also need to be proxied.
          if (trimmedLine.startsWith('#EXT-X-KEY')) {
              const uriMatch = trimmedLine.match(/URI="([^"]+)"/);
              if (uriMatch?.[1]) {
                  const absoluteKeyUrl = new URL(uriMatch[1], manifestBaseUrl).href;
                  // We MUST carry the referer forward for the key request.
                  const proxiedKeyUrl = `/api/streams?url=${encodeURIComponent(absoluteKeyUrl)}` + 
                                     (targetReferer ? `&referer=${encodeURIComponent(targetReferer)}` : '');
                  return trimmedLine.replace(uriMatch[1], proxiedKeyUrl);
              }
          }
          return line;
        }
        
        // This line is a video segment URL. Rewrite it to point back to our proxy.
        const absoluteSegmentUrl = new URL(trimmedLine, manifestBaseUrl).href;
        // **CRITICAL**: We carry the `referer` forward so the next request for this
        // segment will also have the correct disguise.
        return `/api/streams?url=${encodeURIComponent(absoluteSegmentUrl)}` + 
               (targetReferer ? `&referer=${encodeURIComponent(targetReferer)}` : '');
      }).join('\n');

      responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
      responseHeaders.set('Content-Length', String(Buffer.byteLength(rewrittenManifest)));
      
      console.log(`[Proxy] Rewritten manifest served in ${Date.now() - startTime}ms`);
      return new NextResponse(rewrittenManifest, { status: 200, headers: responseHeaders });

    } else {
      // If it's a video segment or other binary data, just stream it directly.
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
