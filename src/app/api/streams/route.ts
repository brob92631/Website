import { NextRequest, NextResponse } from 'next/server';
import { getSportsStreams, getItalianStreams } from '@/lib/iptv';

// This function dynamically builds the list of allowed domains for security.
let allowedHostsCache: Set<string> | null = null;
async function getAllowedHosts(): Promise<Set<string>> {
  if (allowedHostsCache) return allowedHostsCache;

  try {
    const [sports, italian] = await Promise.all([getSportsStreams(), getItalianStreams()]);
    const allStreamUrls = [...sports, ...italian].map(s => s.url);
    const hosts = new Set<string>();
    
    allStreamUrls.forEach(url => {
      try {
        const hostname = new URL(url).hostname;
        hosts.add(hostname);
      } catch (error) {
        console.error(`[Init] Invalid URL in stream list: ${url}`);
      }
    });

    // Manually add the host that zukiplay.cfd redirects to. This is essential.
    hosts.add('cdn-redirect.vidiscdn.com');

    allowedHostsCache = hosts;
    console.log('✅ Proxy security initialized. Allowed hosts:', Array.from(hosts));
    return hosts;
  } catch (error) {
    console.error('❌ Failed to initialize allowed hosts:', error);
    return new Set();
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');
    const targetReferer = searchParams.get('referer'); // The "disguise" from iptv.ts

    if (!targetUrl) {
      return new NextResponse('Missing URL parameter', { status: 400 });
    }

    console.log(`[Proxy] Request for: ${targetUrl}`);

    // --- The Core Logic: Distinguish Between Gatekeeper and Content ---
    let finalResponse: Response;
    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    };

    // THIS IS THE FIX: The logic now checks if the URL is a gatekeeper.
    const isGatekeeper = targetUrl.includes('.php') && targetReferer;

    if (isGatekeeper) {
      // --- This is a GATEKEEPER stream ---
      console.log(`[Proxy] Gatekeeper stream detected. Applying disguise: Referer=${targetReferer}`);
      fetchHeaders['Referer'] = targetReferer;

      // First, hit the gatekeeper script and manually handle the redirect.
      const gatekeeperResponse = await fetch(targetUrl, {
        headers: fetchHeaders,
        redirect: 'manual', 
      });

      // The gatekeeper MUST give us a redirect (3xx status).
      if (gatekeeperResponse.status < 300 || gatekeeperResponse.status >= 400) {
        console.error(`[Proxy] Gatekeeper did not redirect as expected. Status: ${gatekeeperResponse.status}`);
        return new NextResponse('Gatekeeper check failed', { status: 502 });
      }

      const redirectUrl = gatekeeperResponse.headers.get('location');
      if (!redirectUrl) {
        console.error('[Proxy] Gatekeeper redirected but sent no location header.');
        return new NextResponse('Invalid redirect from gatekeeper', { status: 502 });
      }
      
      console.log(`[Proxy] Gatekeeper redirected to final stream. Fetching...`);
      // Now, fetch the REAL stream from the URL the gatekeeper gave us.
      finalResponse = await fetch(redirectUrl, { headers: fetchHeaders });

    } else {
      // --- This is a DIRECT stream (LA7, NBA TV, or a .ts video segment) ---
      console.log('[Proxy] Direct stream detected.');
      // If a referer was passed (for a .ts segment), we still need to use it.
      if (targetReferer) {
        fetchHeaders['Referer'] = targetReferer;
        console.log(`  ... Applying disguise: Referer=${targetReferer}`);
      }
      // Just fetch the URL directly.
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
    const headersToForward = ['content-type', 'content-length', 'content-range', 'accept-ranges'];
    headersToForward.forEach(headerName => {
      if (finalResponse.headers.has(headerName)) {
        responseHeaders.set(headerName, finalResponse.headers.get(headerName)!);
      }
    });

    const contentType = finalResponse.headers.get('content-type') || '';
    const isPlaylist = contentType.includes('mpegurl') || contentType.includes('m3u8');

    if (isPlaylist) {
      const manifestText = await finalResponse.text();
      const manifestBaseUrl = finalResponse.url; // Use the FINAL URL as the base

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
    console.error(`[Proxy] Critical error in GET handler:`, error);
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
