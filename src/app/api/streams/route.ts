import { NextRequest, NextResponse } from 'next/server';
import { getSportsStreams, getItalianStreams } from '@/lib/iptv';

// --- CORRECTED APPROACH: LAZY INITIALIZATION ---
// We start the async operation once when the module loads, storing the promise.
// We then 'await' this promise inside the handler. This avoids top-level await
// while ensuring the list of hosts is only computed once.
const allowedHostsPromise = (async () => {
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
      console.error(`[Startup] Invalid URL in iptv.ts: ${url}`);
    }
  });
  console.log('Proxy security initialized. Allowed hosts:', hosts);
  return hosts;
})();


export async function GET(request: NextRequest) {
  // Await the promise here. On the first request, it will wait for the async
  // function to finish. On subsequent requests, it will resolve instantly.
  const allowedHosts = await allowedHostsPromise;

  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new Response('URL parameter is missing', { status: 400 });
  }

  // --- SECURITY CHECK ---
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

    const responseHeaders = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Range',
    });
    
    ['content-type', 'content-length', 'content-range', 'accept-ranges', 'last-modified', 'etag', 'cache-control'].forEach(headerName => {
      const headerValue = response.headers.get(headerName);
      if (headerValue) responseHeaders.set(headerName, headerValue);
    });

    const contentType = response.headers.get('content-type') || '';
    const isPlaylist = contentType.includes('mpegurl') || targetUrl.endsWith('.m3u8');

    if (isPlaylist) {
      const manifestText = await response.text();
      
      const rewrittenManifest = manifestText.split('\n').map(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) {
          return line;
        }
        try {
          const absoluteUrl = new URL(trimmedLine, targetUrl).href;
          return `/api/streams?url=${encodeURIComponent(absoluteUrl)}`;
        } catch (error) {
          console.error(`Error rewriting manifest line: "${trimmedLine}"`, error);
          return line;
        }
      }).join('\n');

      responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
      
      return new Response(rewrittenManifest, {
        status: 200,
        headers: responseHeaders,
      });

    } else {
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
      statusCode = 502;
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
