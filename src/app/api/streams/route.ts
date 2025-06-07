// This version has a small bug fix in the proxy logic.

async function handleProxy(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new Response('URL parameter is missing', { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) {
      return new Response(response.statusText, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || '';
    const isPlaylist = contentType.includes('mpegurl') || contentType.includes('x-mpegURL') || targetUrl.endsWith('.m3u8');
    
    const headers = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    });
    
    if (isPlaylist) {
      const manifestText = await response.text();
      const manifestBaseUrl = new URL(targetUrl);

      const rewrittenManifest = manifestText.split('\n').map(line => {
        if (line.trim().length > 0 && !line.startsWith('#')) {
          const absoluteUrl = new URL(line, manifestBaseUrl).href;
          const currentUrl = new URL(req.url);
          return `${currentUrl.origin}/api/streams?proxy=true&url=${encodeURIComponent(absoluteUrl)}`; // Small correction here for clarity
        }
        return line;
      }).join('\n');
      
      headers.set('Content-Type', 'application/vnd.apple.mpegurl');
      return new Response(rewrittenManifest, { headers, status: 200 });

    } else {
      const body = await response.arrayBuffer();
      response.headers.forEach((value, key) => {
        if (headers.has(key)) return;
        headers.set(key, value)
      });
      return new Response(Buffer.from(body), { headers, status: response.status });
    }
  } catch (error) {
    console.error('Proxy Error:', error);
    return new Response('Failed to proxy request', { status: 500 });
  }
}

// Correcting the GET handler to properly check for the proxy action.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isProxyRequest = searchParams.has('proxy'); // Check if it's a proxy call

  // The premium app fetches the stream list directly in the Server Component,
  // so we don't need the 'getStreams' action anymore. The API only needs to be a proxy.
  if (isProxyRequest) {
    return handleProxy(request);
  }

  return new Response('Invalid request. This API route is for proxying streams.', { status: 400 });
}
