import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new Response('URL parameter is missing', { status: 400 });
  }

  console.log('Proxying request to:', targetUrl);

  try {
    // More comprehensive headers to avoid blocking
    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site'
    };

    // Copy range header if present for video segments
    const rangeHeader = request.headers.get('range');
    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader;
    }

    const response = await fetch(targetUrl, {
      headers: fetchHeaders,
      method: 'GET'
    });

    if (!response.ok) {
      console.error(`Fetch failed: ${response.status} - ${response.statusText} for URL: ${targetUrl}`);
      return new Response(`Failed to fetch: ${response.statusText}`, { 
        status: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Range'
        }
      });
    }

    // Determine if this is a playlist or video segment
    const contentType = response.headers.get('content-type') || '';
    const isPlaylist = 
      contentType.includes('mpegurl') || 
      contentType.includes('x-mpegURL') || 
      contentType.includes('vnd.apple.mpegurl') ||
      targetUrl.includes('.m3u8') ||
      targetUrl.includes('master') ||
      targetUrl.includes('playlist');

    // Enhanced CORS headers
    const responseHeaders = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range, Authorization',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges, Content-Type',
      'Access-Control-Max-Age': '86400'
    });

    if (isPlaylist) {
      console.log('Processing HLS manifest:', targetUrl);
      
      const manifestText = await response.text();
      
      if (!manifestText || manifestText.trim().length === 0) {
        console.error('Empty manifest received from:', targetUrl);
        return new Response('Empty or invalid manifest', { 
          status: 502,
          headers: responseHeaders
        });
      }

      console.log('Manifest content preview:', manifestText.substring(0, 200));

      // Get base URL for resolving relative paths
      const baseUrl = new URL(targetUrl);
      const basePath = baseUrl.pathname.substring(0, baseUrl.pathname.lastIndexOf('/') + 1);

      // Process manifest and rewrite URLs
      const rewrittenManifest = manifestText
        .split('\n')
        .map(line => {
          const trimmedLine = line.trim();
          
          // Skip empty lines and comments
          if (!trimmedLine || trimmedLine.startsWith('#')) {
            return line;
          }

          try {
            let absoluteUrl: string;
            
            if (trimmedLine.startsWith('http://') || trimmedLine.startsWith('https://')) {
              // Already absolute
              absoluteUrl = trimmedLine;
            } else if (trimmedLine.startsWith('/')) {
              // Root relative
              absoluteUrl = `${baseUrl.protocol}//${baseUrl.host}${trimmedLine}`;
            } else {
              // Relative to current path
              absoluteUrl = `${baseUrl.protocol}//${baseUrl.host}${basePath}${trimmedLine}`;
            }

            const proxyUrl = `/api/streams?url=${encodeURIComponent(absoluteUrl)}`;
            console.log('Rewriting URL:', trimmedLine, '->', proxyUrl);
            
            return proxyUrl;
          } catch (error) {
            console.error('Error processing manifest line:', trimmedLine, error);
            return line;
          }
        })
        .join('\n');

      // Set manifest headers
      responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
      responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      responseHeaders.set('Pragma', 'no-cache');
      responseHeaders.set('Expires', '0');

      console.log('Returning rewritten manifest, length:', rewrittenManifest.length);
      
      return new Response(rewrittenManifest, {
        status: 200,
        headers: responseHeaders
      });

    } else {
      // Handle video segments
      console.log('Proxying video segment:', targetUrl);
      
      // Copy important headers from original response
      const importantHeaders = [
        'content-type',
        'content-length', 
        'content-range',
        'accept-ranges',
        'last-modified',
        'etag',
        'cache-control'
      ];

      importantHeaders.forEach(headerName => {
        const headerValue = response.headers.get(headerName);
        if (headerValue) {
          responseHeaders.set(headerName, headerValue);
        }
      });

      // Handle range requests properly
      if (rangeHeader) {
        responseHeaders.set('Accept-Ranges', 'bytes');
      }

      // Stream the response
      const body = response.body;
      
      return new Response(body, {
        status: response.status,
        headers: responseHeaders
      });
    }

  } catch (error) {
    console.error('Proxy Error for URL:', targetUrl, error);
    
    let errorMessage = 'Proxy request failed';
    let statusCode = 500;

    if (error instanceof TypeError) {
      if (error.message.includes('fetch')) {
        errorMessage = 'Network error - unable to reach stream source';
        statusCode = 502;
      } else if (error.message.includes('AbortError')) {
        errorMessage = 'Request timeout';
        statusCode = 504;
      }
    }

    return new Response(errorMessage, {
      status: statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Range',
        'Content-Type': 'text/plain'
      }
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}
