export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new Response('URL parameter is missing', { status: 400 });
  }

  try {
    // Fetch with realistic headers to avoid blocking
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.google.com/',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    if (!response.ok) {
      console.error(`Fetch failed: ${response.status} - ${response.statusText}`);
      return new Response(`Failed to fetch: ${response.statusText}`, { status: response.status });
    }

    // Determine content type
    const contentType = response.headers.get('content-type') || '';
    const isPlaylist = contentType.includes('mpegurl') || 
                      contentType.includes('x-mpegURL') || 
                      targetUrl.includes('.m3u8') ||
                      targetUrl.includes('playlist');

    // Setup CORS headers
    const corsHeaders = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges'
    });

    if (isPlaylist) {
      // Handle HLS manifest files
      const manifestText = await response.text();
      
      if (!manifestText) {
        console.error('Empty manifest received');
        return new Response('Empty manifest', { status: 502 });
      }

      // Parse base URL for resolving relative paths
      let baseUrl: URL;
      try {
        baseUrl = new URL(targetUrl);
      } catch (error) {
        console.error('Invalid target URL:', error);
        return new Response('Invalid URL', { status: 400 });
      }

      // Process each line of the manifest
      const rewrittenManifest = manifestText
        .split('\n')
        .map(line => {
          const trimmedLine = line.trim();
          
          // Skip empty lines and comments (lines starting with #)
          if (!trimmedLine || trimmedLine.startsWith('#')) {
            return line;
          }

          try {
            let absoluteUrl: string;
            
            // Handle different URL formats
            if (trimmedLine.startsWith('http://') || trimmedLine.startsWith('https://')) {
              // Already absolute URL
              absoluteUrl = trimmedLine;
            } else if (trimmedLine.startsWith('/')) {
              // Root-relative URL
              absoluteUrl = `${baseUrl.protocol}//${baseUrl.host}${trimmedLine}`;
            } else {
              // Relative URL - resolve against base URL
              absoluteUrl = new URL(trimmedLine, baseUrl.href).href;
            }

            // Rewrite to go through our proxy
            const proxyUrl = `/api/streams?url=${encodeURIComponent(absoluteUrl)}`;
            
            return proxyUrl;
          } catch (error) {
            console.error('Error processing manifest line:', trimmedLine, error);
            return line; // Return original line if processing fails
          }
        })
        .join('\n');

      // Set appropriate headers for HLS manifest
      corsHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
      corsHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      corsHeaders.set('Pragma', 'no-cache');
      corsHeaders.set('Expires', '0');

      return new Response(rewrittenManifest, { 
        headers: corsHeaders, 
        status: 200 
      });

    } else {
      // Handle video segments and other binary content
      const arrayBuffer = await response.arrayBuffer();
      
      // Copy relevant headers from original response
      const relevantHeaders = [
        'content-type',
        'content-length',
        'content-range',
        'accept-ranges',
        'last-modified',
        'etag'
      ];

      relevantHeaders.forEach(headerName => {
        const headerValue = response.headers.get(headerName);
        if (headerValue) {
          corsHeaders.set(headerName, headerValue);
        }
      });

      // Handle range requests for video segments
      const rangeHeader = request.headers.get('range');
      if (rangeHeader) {
        corsHeaders.set('Accept-Ranges', 'bytes');
      }

      return new Response(arrayBuffer, { 
        headers: corsHeaders, 
        status: response.status 
      });
    }

  } catch (error) {
    console.error('Proxy Error:', error);
    
    // Provide more specific error information
    let errorMessage = 'Failed to proxy request';
    let statusCode = 500;

    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMessage = 'Network error - unable to reach target URL';
      statusCode = 502;
    } else if (error instanceof Error) {
      errorMessage = `Proxy error: ${error.message}`;
    }

    return new Response(errorMessage, { 
      status: statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/plain'
      }
    });
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
      'Access-Control-Max-Age': '86400'
    }
  });
}
