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
        // Also add www variants for flexibility
        if (!hostname.startsWith('www.')) {
          hosts.add(`www.${hostname}`);
        }
      } catch (error) {
        console.error(`[Init] Invalid URL in stream list: ${url}`);
      }
    });
    
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

    if (!targetUrl) {
      return new NextResponse('Missing URL parameter', { status: 400 });
    }

    // Enhanced security validation
    let requestHost: string;
    try {
      const parsedUrl = new URL(targetUrl);
      requestHost = parsedUrl.hostname;
      
      // Block suspicious patterns
      if (requestHost.includes('localhost') || 
          requestHost.includes('127.0.0.1') || 
          requestHost.includes('0.0.0.0') ||
          parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
        console.warn(`🚫 Blocked suspicious request: ${targetUrl}`);
        return new NextResponse('Forbidden request', { status: 403 });
      }
    } catch (error) {
      console.error('❌ Invalid URL format:', targetUrl);
      return new NextResponse('Invalid URL format', { status: 400 });
    }

    if (!allowedHosts.has(requestHost)) {
      console.warn(`🚫 Blocked non-whitelisted host: ${requestHost}`);
      return new NextResponse(`Host ${requestHost} is not allowed`, { status: 403 });
    }

    console.log(`🔄 Proxying request to: ${requestHost}`);

    // --- START OF CHANGE ---
    // Enhanced request headers with Referer/Origin spoofing
    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Origin': 'https://sporthd.live', // <-- ADDED THIS LINE
      'Referer': 'https://sporthd.live/', // <-- AND THIS LINE
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    };
    // --- END OF CHANGE ---

    // Forward range requests for video streaming
    const rangeHeader = request.headers.get('range');
    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader;
    }

    // Make the request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    let response: Response;
    try {
      response = await fetch(targetUrl, { 
        headers: fetchHeaders, 
        method: 'GET',
        signal: controller.signal,
        // Don't follow redirects automatically for security
        redirect: 'manual'
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

    // Handle redirects manually for security
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        try {
          const redirectHost = new URL(location, targetUrl).hostname;
          if (!allowedHosts.has(redirectHost)) {
            console.warn(`🚫 Blocked redirect to non-whitelisted host: ${redirectHost}`);
            return new NextResponse('Redirect to unauthorized host', { status: 403 });
          }
        } catch (error) {
          console.error('❌ Invalid redirect URL:', location);
          return new NextResponse('Invalid redirect', { status: 400 });
        }
      }
    }

    if (!response.ok) {
      console.error(`❌ Upstream error: ${response.status} ${response.statusText} for ${targetUrl}`);
      return new NextResponse(`Upstream error: ${response.statusText}`, { 
        status: response.status >= 500 ? 502 : response.status 
      });
    }

    // Enhanced response headers
    const responseHeaders = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range, Authorization',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
      'Cache-Control': 'public, max-age=300', // 5 minute cache
      'X-Proxy-Cache': 'MISS',
    });
    
    // Forward important headers
    const headersToForward = [
      'content-type', 'content-length', 'content-range', 'accept-ranges', 
      'last-modified', 'etag', 'expires', 'cache-control'
    ];
    
    headersToForward.forEach(headerName => {
      const headerValue = response.headers.get(headerName);
      if (headerValue) {
        responseHeaders.set(headerName, headerValue);
      }
    });

    const contentType = response.headers.get('content-type') || '';
    const isPlaylist = contentType.includes('mpegurl') || 
                      contentType.includes('m3u8') || 
                      targetUrl.endsWith('.m3u8') ||
                      targetUrl.includes('.m3u8');

    if (isPlaylist) {
      try {
        const manifestText = await response.text();
        
        // --- START: CORRECTED MANIFEST REWRITING LOGIC ---
        const rewrittenManifest = manifestText
          .split('\n')
          .map(line => {
            const trimmedLine = line.trim();

            // Handle lines containing a URI attribute (e.g., #EXT-X-KEY, #EXT-X-MAP)
            if (trimmedLine.startsWith('#') && trimmedLine.includes('URI="')) {
              try {
                // Extract the original URI
                const uriMatch = trimmedLine.match(/URI="([^"]+)"/);
                if (!uriMatch || !uriMatch[1]) return line; // No URI found, return original line
                
                const originalUri = uriMatch[1];
                
                // Create an absolute URL for the URI
                const absoluteUrl = new URL(originalUri, targetUrl).href;

                // Validate the host before rewriting
                const uriHost = new URL(absoluteUrl).hostname;
                if (!allowedHosts.has(uriHost)) {
                    console.warn(`🚫 Skipping non-whitelisted URI in manifest: ${uriHost}`);
                    return `# Blocked: ${line}`;
                }

                // Rewrite the line with the proxied URI
                const proxiedUri = `/api/streams?url=${encodeURIComponent(absoluteUrl)}`;
                return trimmedLine.replace(originalUri, proxiedUri);

              } catch (error) {
                console.error(`❌ Error rewriting manifest URI line: "${trimmedLine}"`, error);
                return `# Error: ${line}`;
              }
            }
            
            // Handle segment URLs (lines that don't start with #)
            if (!trimmedLine || trimmedLine.startsWith('#')) {
              return line;
            }
            
            try {
              // Handle relative and absolute URLs
              const absoluteUrl = new URL(trimmedLine, targetUrl).href;
              
              // Validate the rewritten URL host
              const rewrittenHost = new URL(absoluteUrl).hostname;
              if (!allowedHosts.has(rewrittenHost)) {
                console.warn(`🚫 Skipping non-whitelisted URL in manifest: ${rewrittenHost}`);
                return `# Blocked: ${line}`;
              }
              
              return `/api/streams?url=${encodeURIComponent(absoluteUrl)}`;
            } catch (error) {
              console.error(`❌ Error rewriting manifest line: "${trimmedLine}"`, error);
              return `# Error: ${line}`;
            }
          })
          .join('\n');
        // --- END: CORRECTED MANIFEST REWRITING LOGIC ---

        responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
        responseHeaders.set('Content-Length', Buffer.byteLength(rewrittenManifest, 'utf8').toString());
        
        const processingTime = Date.now() - startTime;
        console.log(`✅ Manifest processed in ${processingTime}ms for ${requestHost}`);
        
        return new NextResponse(rewrittenManifest, {
          status: 200,
          headers: responseHeaders,
        });

      } catch (error) {
        console.error('❌ Manifest processing error:', error);
        return new NextResponse('Failed to process manifest', { status: 500 });
      }
    } else {
      // Stream binary content (video segments)
      const processingTime = Date.now() - startTime;
      console.log(`✅ Binary content proxied in ${processingTime}ms for ${requestHost}`);
      
      return new NextResponse(response.body, {
        status: response.status,
        headers: responseHeaders,
      });
    }

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ Proxy error after ${processingTime}ms:`, error);
    
    let errorMessage = 'Proxy request failed';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
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
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}

export async function HEAD(request: NextRequest) {
  // Handle HEAD requests for video players that check stream availability
  return GET(request);
}
