// api/streams/route.ts (The Final, Correct, and Simplified Proxy)

// This function IS the API route. It has one job.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new Response('URL parameter is missing', { status: 400 });
  }

  try {
    // Fetch the stream from the source
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        'Referer': 'https://google.com/' // Some streams require a referer header
      }
    });

    if (!response.ok) {
      return new Response(response.statusText, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || '';
    const isPlaylist = contentType.includes('mpegurl') || contentType.includes('x-mpegURL') || targetUrl.endsWith('.m3u8');
    
    // These headers are important for the player to work
    const headers = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    });

    // If it's a playlist, we rewrite its internal URLs to also point to our proxy
    if (isPlaylist) {
      const manifestText = await response.text();
      const manifestBaseUrl = new URL(targetUrl);
      const currentUrl = new URL(request.url);

      const rewrittenManifest = manifestText.split('\n').map(line => {
        if (line.trim().length > 0 && !line.startsWith('#')) {
          const absoluteUrl = new URL(line, manifestBaseUrl).href;
          // This is the clean, consistent loop: the proxy points back to itself
          return `${currentUrl.origin}/api/streams?url=${encodeURIComponent(absoluteUrl)}`;
        }
        return line;
      }).join('\n');
      
      headers.set('Content-Type', 'application/vnd.apple.mpegurl');
      return new Response(rewrittenManifest, { headers, status: 200 });

    } else {
      // If it's a video chunk, just stream it back to the user
      const body = await response.arrayBuffer();
      response.headers.forEach((value, key) => headers.set(key, value));
      return new Response(Buffer.from(body), { headers, status: response.status });
    }
  } catch (error) {
    console.error('Proxy Error:', error);
    return new Response('Failed to proxy request', { status: 500 });
  }
}
