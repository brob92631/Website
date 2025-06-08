import { NextRequest, NextResponse } from 'next/server';
import { getSportsStreams, getItalianStreams } from '@/lib/iptv';

// --- SECURITY: Create a whitelist of allowed hostnames ---
// We get the streams from our library and extract the hostnames.
// The proxy will only be allowed to request URLs from these hosts.
const initializeAllowedHosts = async () => {
  const [sports, italian] = await Promise.all([
    getSportsStreams(),
    getItalianStreams(),
  ]);
  const allStreamUrls = [...sports, ...italian].map(s => s.url);
  const hosts = new Set<string>();
  allStreamUrls.forEach(url => {
    try {
      hosts.add(new URL(url).hostname);
    } catch (error) {
      console.error(`Invalid URL in iptv.ts: ${url}`);
    }
  });
  return hosts;
};
const allowedHosts = await initializeAllowedHosts();
console.log('Proxy initialized. Allowed hosts:', allowedHosts);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new Response('URL parameter is missing', { status: 400 });
  }

  // --- SECURITY CHECK ---
  // Ensure the requested URL's hostname is in our whitelist.
  try {
    const requestHost = new URL(targetUrl).hostname;
    if (!allowedHosts.has(requestHost)) {
      console.warn(`[403] Forbidden request to non-whitelisted host: ${requestHost}`);
      return new Response(`Forbidden: Host ${requestHost} is not allowed.`, { status: 403 });
    }
  } catch (error) {
    return new Response('Invalid target URL format', { status: 400 });
  }

  console.log('Proxying request to:', targetUrl);

  try {
    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site',
    };

    const rangeHeader = request.headers.get('range');
    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader;
    }

    const response = await fetch(targetUrl, { headers: fetchHeaders, method: 'GET' });

    if (!response.ok) {
      console.error(`Fetch failed: ${response.status} ${response.statusText} for URL: ${targetUrl}`);
      return new Response(`Failed to fetch from origin: ${response.statusText}`, { status: response.status });
    }

    // --- ENHANCED CORS HEADERS ---
    const responseHeaders = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Range',
    });
    
    // Copy important headers from the original response
    ['content-type', 'content-length', 'content-range', 'accept-ranges', 'last-modified', 'etag', 'cache-control'].forEach(headerName => {
      const headerValue = response.headers.get(headerName);
      if (headerValue) responseHeaders.set(headerName, headerValue);
    });

    const contentType = response.headers.get('content-type') || '';
    const isPlaylist = contentType.includes('mpegurl') || targetUrl.endsWith('.m3u8');

    if (isPlaylist) {
      console.log('Processing HLS manifest:', targetUrl);
      const manifestText = await response.text();
      
      // --- ROBUST URL REWRITING ---
      // We use the URL constructor to safely resolve relative paths against the manifest's URL.
      const rewrittenManifest = manifestText.split('\n').map(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) {
          return line; // Keep comments and empty lines as they are
        }
        try {
          // Resolve the URL in the line relative to the manifest's own URL
          const absoluteUrl = new URL(trimmedLine, targetUrl).href;
          // Return the rewritten URL pointing to our proxy
          return `/api/streams?url=${encodeURIComponent(absoluteUrl)}`;
        } catch (error) {
          console.error(`Error rewriting manifest line: "${trimmedLine}"`, error);
          return line; // Return original line on error
        }
      }).join('\n');

      responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
      
      return new Response(rewrittenManifest, {
        status: 200,
        headers: responseHeaders,
      });

    } else {
      // It's a video segment, stream it directly
      console.log('Proxying video segment:', targetUrl);
      return new Response(response.body, {
        status: response.status,
        headers: responseHeaders,
      });
    }

  } catch (error) {
    console.error('Proxy Error for URL:', targetUrl, error);
    let errorMessage = 'Proxy request failed';
    let statusCode = 500;
    if (error instanceof Error && error.message.includes('fetch')) {
      errorMessage = 'Network error: Unable to reach stream source.';
      statusCode = 502; // Bad Gateway
    }
    return new Response(errorMessage, { status: statusCode });
  }
}

export async function OPTIONS() {
  return NextResponse.json(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
    },
  });
}
