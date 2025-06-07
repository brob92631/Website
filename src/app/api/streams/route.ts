async function handleProxy(req: Request) {
  const { searchParams } = new URL(req.url); const targetUrl = searchParams.get('url');
  if (!targetUrl) { return new Response('URL parameter is missing', { status: 400 }); }
  try {
    const response = await fetch(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) { return new Response(response.statusText, { status: response.status }); }
    const contentType = response.headers.get('content-type') || '';
    const isPlaylist = contentType.includes('mpegurl') || targetUrl.endsWith('.m3u8');
    const headers = new Headers({ 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS' });
    if (isPlaylist) {
      const text = await response.text(); const baseUrl = new URL(targetUrl);
      const rewritten = text.split('\n').map(line => {
        if (line.trim().length > 0 && !line.startsWith('#')) {
          const absoluteUrl = new URL(line, baseUrl).href; const currentUrl = new URL(req.url);
          return `${currentUrl.origin}/api/streams?action=proxy&url=${encodeURIComponent(absoluteUrl)}`;
        } return line;
      }).join('\n');
      headers.set('Content-Type', 'application/vnd.apple.mpegurl');
      return new Response(rewritten, { headers, status: 200 });
    } else {
      const body = await response.arrayBuffer(); response.headers.forEach((v, k) => headers.set(k, v));
      return new Response(Buffer.from(body), { headers, status: 200 });
    }
  } catch (error) { return new Response('Failed to proxy request', { status: 500 }); }
}
export async function GET(request: Request) { return handleProxy(request); }
