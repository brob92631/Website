import { NextRequest, NextResponse } from 'next/server';
import play from 'play-dl';

// --- Static, Human-Like Configuration ---
// We now use a consistent, hardcoded set of headers to mimic a real browser session
// originating from tvron.ro. This is more robust than forwarding client headers.
const SPOOFED_REFERER = 'https://tvron.ro/';
const SPOOFED_ORIGIN = new URL(SPOOFED_REFERER).origin;
const HUMAN_LIKE_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
const HUMAN_LIKE_ACCEPT_LANGUAGE = 'ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7';

// Helper to select the best HLS stream from play-dl YouTube info
function getYouTubeHlsStreamUrl(info: any): string | null {
  if (info?.formats && Array.isArray(info.formats)) {
    const liveHls = info.formats.find((f: any) =>
      f.isLive && (f.url?.includes('.m3u8') || f.mimeType === 'application/x-mpegURL' || f.protocol === 'hls')
    );
    if (liveHls?.url) return liveHls.url;

    const anyHls = info.formats.find((f: any) =>
      f.url?.includes('.m3u8') || f.mimeType === 'application/x-mpegURL' || f.protocol === 'hls'
    );
    if (anyHls?.url) return anyHls.url;
  }
  // Simplified checks for other potential structures
  if (info?.url && info.url.includes('.m3u8')) return info.url;
  if (info?.sources?.hls?.url) return info.sources.hls.url;
  
  return null;
}

export async function GET(request: NextRequest) {
  const responseHeaders = new Headers({ 
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  });

  try {
    const { searchParams } = new URL(request.url);
    const originalTargetUrl = searchParams.get('url');

    if (!originalTargetUrl) {
      return new NextResponse('Missing URL parameter', { status: 400, headers: responseHeaders });
    }

    // --- Build the spoofed request headers ---
    const fetchHeaders = new Headers(); 
    fetchHeaders.set('User-Agent', HUMAN_LIKE_USER_AGENT);
    fetchHeaders.set('Accept-Language', HUMAN_LIKE_ACCEPT_LANGUAGE);
    fetchHeaders.set('Referer', SPOOFED_REFERER);
    fetchHeaders.set('Origin', SPOOFED_ORIGIN);
    fetchHeaders.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8');
    fetchHeaders.set('Connection', 'keep-alive');
    fetchHeaders.set('Upgrade-Insecure-Requests', '1');
    fetchHeaders.set('Cache-Control', 'no-cache');
    fetchHeaders.set('Pragma', 'no-cache');

    let effectiveTargetUrl = originalTargetUrl;
    let isExtractedManifest = false;

    // Handle YouTube URLs specifically
    if (play.yt_validate(originalTargetUrl).startsWith('video')) {
      console.log(`[Proxy YT] Detected YouTube URL: ${originalTargetUrl}.`);
      try {
        const streamInfo = await play.video_info(originalTargetUrl);
        const m3u8Url = getYouTubeHlsStreamUrl(streamInfo);
        if (m3u8Url) {
          effectiveTargetUrl = m3u8Url;
          isExtractedManifest = true;
          console.log(`[Proxy YT] Extracted M3U8: ${effectiveTargetUrl}`);
        } else {
          console.warn(`[Proxy YT] Could not extract M3U8 from YouTube info for ${originalTargetUrl}.`);
        }
      } catch (e: any) {
        console.error(`[Proxy YT] play.video_info error for ${originalTargetUrl}:`, e.message);
      }
    }

    // Set appropriate 'Accept' header for M3U8 manifest requests
    if (effectiveTargetUrl.includes('.m3u8') || isExtractedManifest) {
        fetchHeaders.set('Accept', 'application/vnd.apple.mpegurl, application/x-mpegURL, */*;q=0.8');
    }
    
    console.log(`[Proxy] Requesting Effective URL: ${effectiveTargetUrl} with spoofed headers.`);

    const response = await fetch(effectiveTargetUrl, { headers: fetchHeaders });

    if (!response.ok) {
      console.error(`[Proxy] Upstream error: ${response.status} for ${effectiveTargetUrl}`);
      const errorText = await response.text().catch(() => '');
      console.error(`[Proxy] Upstream error body: ${errorText.substring(0, 500)}`);
      return new NextResponse(`Upstream error: ${response.statusText}`, { status: response.status, headers: responseHeaders });
    }

    console.log(`[Proxy] Success from upstream: ${response.status} for ${effectiveTargetUrl}`);

    ['content-type', 'content-length', 'content-range', 'accept-ranges'].forEach(name => {
      if (response.headers.has(name)) responseHeaders.set(name, response.headers.get(name)!);
    });

    const contentType = response.headers.get('content-type') || '';
    const isManifest = isExtractedManifest || contentType.includes('mpegurl') || contentType.includes('m3u8') || effectiveTargetUrl.endsWith('.m3u8');

    if (isManifest) {
      const manifestText = await response.text();
      const actualManifestUrl = response.url; 

      // For all subsequent requests (segments, keys), we only need the core spoofing headers.
      // This is simpler and ensures consistency.
      const proxySubParams = `&referer=${encodeURIComponent(SPOOFED_REFERER)}`;

      const rewriteUrl = (url: string) => {
        try {
          const absoluteUrl = new URL(url, actualManifestUrl).href;
          return `/api/streams?url=${encodeURIComponent(absoluteUrl)}${proxySubParams}`;
        } catch (e) {
          console.warn(`[Proxy] Invalid URL in manifest: "${url}" with base "${actualManifestUrl}".`);
          return url; // Return original if invalid
        }
      };

      const rewrittenManifest = manifestText.split('\n').map(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return line;

        if (trimmedLine.startsWith('#')) {
          const uriMatch = trimmedLine.match(/URI="([^"]+)"/);
          if (uriMatch?.[1]) {
            return trimmedLine.replace(uriMatch[1], rewriteUrl(uriMatch[1]));
          }
          return line;
        }
        
        return rewriteUrl(trimmedLine);
      }).join('\n');

      responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
      responseHeaders.set('Content-Length', String(Buffer.byteLength(rewrittenManifest)));

      return new NextResponse(rewrittenManifest, { status: 200, headers: responseHeaders });
    } else {
      return new NextResponse(response.body, { status: 200, headers: responseHeaders });
    }

  } catch (error: any) {
    console.error('[Proxy] CRITICAL ERROR:', error.message, error.stack);
    return new NextResponse('Proxy request failed due to a critical error.', { status: 500, headers: responseHeaders });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
