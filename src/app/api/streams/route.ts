import { NextRequest, NextResponse } from 'next/server';
import { getSportsStreams, getItalianStreams } from '@/lib/iptv';

// Cache for allowed hosts - computed once and reused
let allowedHostsCache: Set<string> | null = null;
let hostsInitialized = false;

async function getAllowedHosts(): Promise<Set<string>> {
  if (allowedHostsCache && hostsInitialized) {
    return allowedHostsCache;
  }

  try {
    const [sports, italian] = await Promise.all([
      getSportsStreams(),
      getItalianStreams(),
    ]);
    
    const allStreamUrls = [...sports, ...italian].map(s => s.url);
    const hosts = new Set<string>();
    
    allStreamUrls.forEach(url => {
      try {
        const hostname = new URL(url).hostname;
        hosts.add(hostname);
        if (!hostname.startsWith('www.')) {
          hosts.add(`www.${hostname}`);
        }
      } catch (error) {
        console.error(`[Init] Invalid URL in stream list: ${url}`);
      }
    });
    
    // Manually add the host for the redirected streams
    hosts.add('cdn-redirect.vidiscdn.com');

    allowedHostsCache = hosts;
    hostsInitialized = true;
    
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
    const allowedHosts = await getAllowedHosts();
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');
    const targetReferer = searchParams.get('referer');

    if (!targetUrl) {
      return new NextResponse('Missing URL parameter', { status: 400 });
    }

    let requestHost: string;
    try {
      const parsedUrl = new URL(targetUrl);
      requestHost = parsedUrl.hostname;
    } catch (error) {
      console.error('❌ Invalid URL format:', targetUrl);
      return new NextResponse('Invalid URL format', { status: 400 });
    }

    if (!allowedHosts.has(requestHost)) {
      console.warn(`🚫 Blocked non-whitelisted host: ${requestHost}`);
      return new NextResponse(`Host ${requestHost} is not allowed`, { status: 403 });
    }

    console.log(`🔄 Proxying initial request to: ${requestHost}`);
    if (targetReferer) console.log(`  ...using Referer: ${targetReferer}`);

    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
    };

    if (targetReferer) {
      fetchHeaders['Referer'] = targetReferer;
    }

    const rangeHeader = request.headers.get('range');
    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let response: Response;
    try {
      response = await fetch(targetUrl, { 
        headers: fetchHeaders, 
        method: 'GET',
        signal: controller.signal,
        redirect: 'manual' // IMPORTANT: We handle the redirect ourselves
      });
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`⏰ Request timeout for: ${targetUrl}`);
        return new NextResponse('Request timeout', { status: 504 });
      }
      throw error;
    }
    
    // --- START OF THE NEW LOGIC ---
    // Check if the gatekeeper script is redirecting us to the real stream
    if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
      const redirectUrl = response.headers.get('location')!;
      console.log(`➡️ Gatekeeper redirecting to: ${redirectUrl}`);

      let finalUrl: URL;
      try {
        finalUrl = new URL(redirectUrl);
      } catch (error) {
        console.error('❌ Invalid redirect URL from gatekeeper:', redirectUrl);
        return new NextResponse('Invalid redirect from source', { status: 502 });
      }

      // Security check: ensure the redirect is to an allowed host
      if (!allowedHosts.has(finalUrl.hostname)) {
        console.warn(`🚫 Blocked redirect to non-whitelisted host: ${finalUrl.hostname}`);
        // Let's dynamically add it for now, but log it
        console.log(`  ...dynamically adding ${finalUrl.hostname} to allowed list for this session.`);
        allowedHosts.add(finalUrl.hostname);
      }
      
      // Now fetch the REAL stream URL
      const secondController = new AbortController();
      const secondTimeoutId = setTimeout(() => secondController.abort(), 15000);
      try {
        response = await fetch(finalUrl.href, {
          headers: fetchHeaders, // Use the same headers
          method: 'GET',
          signal: secondController.signal,
        });
        clearTimeout(secondTimeoutId);
      } catch(error) {
        clearTimeout(secondTimeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          console.error(`⏰ Request timeout for redirected URL: ${finalUrl.href}`);
          return new NextResponse('Request timeout', { status: 504 });
        }
        throw error;
      }
    }
    // --- END OF THE NEW LOGIC ---

    if (!response.ok) {
      console.error(`❌ Upstream error: ${response.status} ${response.statusText} for ${response.url}`);
      const responseBody = await response.text();
      console.error(`  ...Response body: ${responseBody.slice(0, 200)}`);
      return new NextResponse(`Upstream error: ${response.statusText}`, { 
        status: response.status >= 500 ? 502 : response.status 
      });
    }

    const responseHeaders = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range, Authorization',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
      'Cache-Control': 'no-cache', // Streams should not be cached aggressively
    });
    
    const headersToForward = [
      'content-type', 'content-length', 'content-range', 'accept-ranges', 
      'last-modified', 'etag', 'expires'
    ];
    
    headersToForward.forEach(headerName => {
      const headerValue = response.headers.get(headerName);
      if (headerValue) {
        responseHeaders.set(headerName, headerValue);
      }
    });

    const contentType = response.headers.get('content-type') || '';
    const isPlaylist = contentType.includes('mpegurl') || contentType.includes('m3u8');

    if (isPlaylist) {
      const manifestText = await response.text();
      const manifestBaseUrl = response.url; // Use the FINAL response url as the base

      const rewrittenManifest = manifestText.split('\n').map(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#EXT')) {
            // Rewrite URI in EXT-X-KEY
            if (trimmedLine.startsWith('#EXT-X-KEY')) {
                const uriMatch = trimmedLine.match(/URI="([^"]+)"/);
                if (uriMatch && uriMatch[1]) {
                    const absoluteUrl = new URL(uriMatch[1], manifestBaseUrl).href;
                    const proxiedUri = `/api/streams?url=${encodeURIComponent(absoluteUrl)}` + 
                                       (targetReferer ? `&referer=${encodeURIComponent(targetReferer)}` : '');
                    return trimmedLine.replace(uriMatch[1], proxiedUri);
                }
            }
            return line;
        }
        
        // This is a segment URL
        const absoluteUrl = new URL(trimmedLine, manifestBaseUrl).href;
        return `/api/streams?url=${encodeURIComponent(absoluteUrl)}` + 
               (targetReferer ? `&referer=${encodeURIComponent(targetReferer)}` : '');
      }).join('\n');

      responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
      responseHeaders.set('Content-Length', Buffer.byteLength(rewrittenManifest, 'utf8').toString());
      
      console.log(`✅ Manifest processed in ${Date.now() - startTime}ms`);
      return new NextResponse(rewrittenManifest, { status: 200, headers: responseHeaders });

    } else {
      console.log(`✅ Binary content proxied in ${Date.now() - startTime}ms`);
      return new NextResponse(response.body, { status: response.status, headers: responseHeaders });
    }

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ Proxy error after ${processingTime}ms:`, error);
    let errorMessage = 'Proxy request failed';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('network')) {
        errorMessage = 'Network error: Unable to reach stream source';
        statusCode = 502;
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout: Stream source too slow';
        statusCode = 504;
      }
    }
    
    return new NextResponse(errorMessage, { status: statusCode });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function HEAD(request: NextRequest) {
  return GET(request);
}
