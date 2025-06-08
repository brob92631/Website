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

    // --- The Core Logic: The Ultimate Disguise ---
    let finalResponse: Response;

    // 1. Prepare the complete header disguise.
    const fetchHeaders: Record<string, string> = {
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Sec-Ch-Ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'iframe',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'cross-site',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    };

    // If a stream needs a specific Referer, we add it.
    if (targetReferer) {
      fetchHeaders['Referer'] = targetReferer;
    }

    // Determine if the URL is a gatekeeper (.php) or direct content.
    const isGatekeeper = targetUrl.includes('.php');

    if (isGatekeeper) {
      // --- Handle the Gatekeeper ---
      console.log(`[Proxy] Gatekeeper detected. Applying FULL disguise.`);
      
      const gatekeeperResponse = await fetch(targetUrl, {
        headers: fetchHeaders,
        redirect: 'manual', 
      });

      const redirectUrl = gatekeeperResponse.headers.get('location');
      if (!redirectUrl) {
        // Log the status to see WHY it failed
        console.error(`[Proxy] CRITICAL: Gatekeeper did not provide a redirect URL. Status received: ${gatekeeperResponse.status}`);
        return new NextResponse(`Gatekeeper rejected the request with status: ${gatekeeperResponse.status}`, { status: 502 });
      }
      
      console.log(`[Proxy] Gatekeeper redirected to: ${redirectUrl}. Fetching final stream.`);
      // Fetch the real M3U8, but remove the browser-navigation specific headers.
      delete fetchHeaders['Sec-Fetch-Dest'];
      delete fetchHeaders['Sec-Fetch-Mode'];
      delete fetchHeaders['Sec-Fetch-Site'];
      delete fetchHeaders['Upgrade-Insecure-Requests'];
      
      finalResponse = await fetch(redirectUrl, { headers: fetchHeaders });

    } else {
      // --- Handle Direct Content (LA7, NBA TV, or a .ts video segment) ---
      console.log(`[Proxy] Direct content request.`);
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
