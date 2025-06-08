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

    // --- The Core Logic: This logic is now correct based on the logs ---
    let finalResponse: Response;

    // 1. Prepare the complete header disguise.
    const fetchHeaders: Record<string, string> = {
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    };

    // Only add the Referer disguise if the stream needs it. This protects LA7 and NBA TV.
    if (targetReferer) {
      fetchHeaders['Referer'] = targetReferer;
    }

    // 2. Make the initial request.
    const initialResponse = await fetch(targetUrl, {
      headers: fetchHeaders,
      redirect: 'manual', // We always handle redirects manually to see what's happening.
    });

    // 3. Decide what to do with the response.
    // Case 1: The server redirected us to the final content.
    if (initialResponse.status >= 300 && initialResponse.status < 400 && initialResponse.headers.get('location')) {
        const redirectUrl = initialResponse.headers.get('location')!;
        console.log(`[Proxy] Initial request was a redirect. Following to: ${redirectUrl}`);
        
        // Fetch the final content from the new URL.
        finalResponse = await fetch(redirectUrl, { headers: fetchHeaders });
    
    // Case 2 (THE FIX): The server gave us the content directly (Status 200 OK).
    } else if (initialResponse.ok) {
        console.log(`[Proxy] Initial request was successful (200 OK). Treating this response as the final content.`);
        // The initial response *is* our final response.
        finalResponse = initialResponse;

    // Case 3: The request failed for some other reason.
    } else {
        console.error(`[Proxy] Initial request failed with unhandled status: ${initialResponse.status}`);
        return new NextResponse(`Initial request failed: ${initialResponse.statusText}`, { status: initialResponse.status });
    }

    // --- Process the Final Response ---
    if (!finalResponse.ok) {
      console.error(`[Proxy] Upstream error on final fetch: ${finalResponse.status} for ${finalResponse.url}`);
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
