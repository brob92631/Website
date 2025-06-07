// /src/app/api/streams/route.ts (The Final, Bulletproof Proxy)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new Response('URL parameter is missing', { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.google.com/' }
    });

    if (!response.ok) {
      return new Response(response.statusText, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || '';
    const isPlaylist = contentType.includes('mpegurl') || targetUrl.endsWith('.m3u8');
    
    const headers = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    });
    
    // Always copy original headers
    response.headers.forEach((value, key) => headers.set(key, value));

    if (isPlaylist) {
      const manifestText = await response.text();
      const manifestBaseUrl = new URL(targetUrl);
      
      const rewrittenManifest = manifestText.split('\n').map(line => {
        if (line.trim() && !line.startsWith('#')) {
          const absoluteUrl = new URL(line, manifestBaseUrl).href;
          // THE FIX IS HERE: We create a relative URL which is more robust
          return `/api/streams?url=${encodeURIComponent(absoluteUrl)}`;
        }
        return line;
      }).join('\n');
      
      headers.set('Content-Type', 'application/vnd.apple.mpegurl');
      return new Response(rewrittenManifest, { headers, status: 200 });

    } else {
      // For video chunks, stream them directly with the correct headers
      const body = await response.arrayBuffer();
      return new Response(Buffer.from(body), { headers, status: response.status });
    }
  } catch (error) {
    console.error('Proxy Error:', error);
    return new Response('Failed to proxy request', { status: 500 });
  }
}
