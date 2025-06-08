import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // --- THIS IS THE FIX: Create the permission slip (headers) at the very beginning ---
  const responseHeaders = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Range, Authorization',
  });

  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');
    const targetReferer = searchParams.get('referer');

    if (!targetUrl) {
      return new NextResponse('Missing URL parameter', { status: 400, headers: responseHeaders });
    }

    console.log(`[Proxy] Request received for: ${targetUrl}`);

    // --- Core Logic ---
    let finalResponse: Response;
    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    };

    if (targetReferer) {
      fetchHeaders['Referer'] = targetReferer;
      // The Origin header is also needed for the complete disguise.
      fetchHeaders['Origin'] = new URL(targetReferer).origin;
    }

    const isGatekeeper = targetUrl.includes('.php');

    if (isGatekeeper) {
      console.log(`[Proxy] Gatekeeper stream detected. Applying disguise.`);
      const gatekeeperResponse = await fetch(targetUrl, { headers: fetchHeaders });

      // The gatekeeper should respond with the playlist directly.
      if (!gatekeeperResponse.ok) {
        console.error(`[Proxy] Gatekeeper rejected request with status: ${gatekeeperResponse.status}`);
        return new NextResponse(`Gatekeeper error: ${gatekeeperResponse.statusText}`, { status: gatekeeperResponse.status, headers: responseHeaders });
      }
      console.log(`[Proxy] Gatekeeper returned playlist successfully.`);
      finalResponse = gatekeeperResponse;

    } else {
      console.log(`[Proxy] Direct content request.`);
      finalResponse = await fetch(targetUrl, { headers: fetchHeaders });
    }

    // --- Process the Final Response ---
    if (!finalResponse.ok) {
      console.error(`[Proxy] Upstream error: ${finalResponse.status} for ${finalResponse.url}`);
      return new NextResponse(`Upstream error: ${finalResponse.status}`, { status: finalResponse.status, headers: responseHeaders });
    }
    console.log(`[Proxy] Success from upstream: ${finalResponse.status} ${finalResponse.url}`);

    // Add headers from the source response to our response headers.
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
    // Ensure even the final crash error has the permission slip.
    return new NextResponse('Proxy request failed due to a critical error.', { status: 500, headers: responseHeaders });
  }
}

export async function OPTIONS(request: NextRequest) {
  // The preflight request also needs the correct CORS headers.
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
