import { NextRequest, NextResponse } from 'next/server';
import play from 'play-dl';

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
  // Fallback if info itself contains a direct M3U8 URL (less common for YouTube via play.video_info)
  if (info?.url && (info.url.includes('.m3u8') || info.protocol === 'hls' || info.mimeType === 'application/x-mpegURL')) {
    return info.url;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const responseHeaders = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  });

  try {
    const { searchParams } = new URL(request.url);
    let originalTargetUrl = searchParams.get('url');
    const customUserAgent = searchParams.get('userAgent');
    const customReferer = searchParams.get('referer');
    const customAcceptLanguage = searchParams.get('acceptLanguage');
    const customXForwardedFor = searchParams.get('xForwardedFor');

    if (!originalTargetUrl) {
      return new NextResponse('Missing URL parameter', { status: 400, headers: responseHeaders });
    }

    const fetchHeaders: HeadersInit = {
      'User-Agent': customUserAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'Accept-Language': customAcceptLanguage || 'en-US,en;q=0.9,fr-FR;q=0.8,fr;q=0.7',
    };
    if (customReferer) fetchHeaders['Referer'] = customReferer;
    if (customXForwardedFor) fetchHeaders['X-Forwarded-For'] = customXForwardedFor;
    if (customReferer) {
        try { fetchHeaders['Origin'] = new URL(customReferer).origin; } catch (e) { /* ignore */ }
    }

    let effectiveTargetUrl = originalTargetUrl;
    let isExtractedManifest = false;

    const ytValidationResult = play.yt_validate(originalTargetUrl);
    if (ytValidationResult === 'video' || ytValidationResult === 'playlist') {
      console.log(`[Proxy YT] Detected YouTube URL type "${ytValidationResult}": ${originalTargetUrl}. Attempting stream info extraction...`);
      try {
        const streamInfo = await play.video_info(originalTargetUrl); // No options for now to ensure build passes
        const m3u8Url = getYouTubeHlsStreamUrl(streamInfo); // Use the YouTube-specific helper
        if (m3u8Url) {
          effectiveTargetUrl = m3u8Url;
          isExtractedManifest = true;
          console.log(`[Proxy YT] Extracted M3U8: ${effectiveTargetUrl}`);
        } else {
          console.warn(`[Proxy YT] Could not extract M3U8 from YouTube info for ${originalTargetUrl}. StreamInfo dump:`, JSON.stringify(streamInfo, null, 2).substring(0,1000));
        }
      } catch (e: any) {
        console.error(`[Proxy YT] play.video_info error for ${originalTargetUrl}:`, e.message, e.stack);
        // If play-dl fails, we might still try to use the original URL if it happens to be a direct M3U8
        // but for YouTube page URLs, this is unlikely.
      }
    } else if (originalTargetUrl.includes("dailymotion.com/") || originalTargetUrl.includes("dai.ly/")) {
        console.log(`[Proxy DM] Detected DailyMotion URL: ${originalTargetUrl}. play-dl does not support DailyMotion. Attempting to proxy URL directly if it's an M3U8.`);
        // For DailyMotion, since play-dl doesn't support it,
        // effectiveTargetUrl remains originalTargetUrl.
        // The proxy will attempt to fetch it. If originalTargetUrl is not a direct M3U8, this will likely fail or not be a stream.
    }


    console.log(`[Proxy] Requesting Effective URL: ${effectiveTargetUrl}`);
    // ... (rest of the fetch and manifest rewriting logic remains the same) ...
    if (customUserAgent) console.log(`[Proxy] Using Custom User-Agent (for direct fetch): ${customUserAgent}`);
    if (customReferer) console.log(`[Proxy] Using Custom Referer (for direct fetch): ${customReferer}`);
    if (customXForwardedFor) console.log(`[Proxy] Using Custom X-Forwarded-For (for direct fetch): ${customXForwardedFor}`);


    const response = await fetch(effectiveTargetUrl, { headers: fetchHeaders });

    if (!response.ok) {
      console.error(`[Proxy] Upstream error: ${response.status} for ${effectiveTargetUrl} (final URL: ${response.url})`);
      try {
        const errorText = await response.text();
        console.error(`[Proxy] Upstream error body: ${errorText.substring(0, 500)}`);
      } catch (e) { /* ignore */ }
      return new NextResponse(`Upstream error: ${response.statusText}`, { status: response.status, headers: responseHeaders });
    }

    console.log(`[Proxy] Success from upstream: ${response.status} for ${effectiveTargetUrl} (final URL: ${response.url})`);

    ['content-type', 'content-length', 'content-range', 'accept-ranges'].forEach(name => {
      if (response.headers.has(name)) responseHeaders.set(name, response.headers.get(name)!);
    });

    const contentType = response.headers.get('content-type') || '';
    if (isExtractedManifest || contentType.includes('mpegurl') || contentType.includes('m3u8') || (effectiveTargetUrl && effectiveTargetUrl.includes('.m3u8'))) {
      const manifestText = await response.text();
      const manifestBaseUrl = response.url;

      let proxySubParams = '';
      if (customUserAgent) proxySubParams += `&userAgent=${encodeURIComponent(customUserAgent)}`;
      if (customReferer) proxySubParams += `&referer=${encodeURIComponent(customReferer)}`;
      if (customAcceptLanguage) proxySubParams += `&acceptLanguage=${encodeURIComponent(customAcceptLanguage)}`;
      if (customXForwardedFor) proxySubParams += `&xForwardedFor=${encodeURIComponent(customXForwardedFor)}`;

      const rewrittenManifest = manifestText.split('\n').map(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#EXT-X-INDEPENDENT-SEGMENTS')) {
             if (trimmedLine.startsWith('#EXT-X-STREAM-INF')) {
                return line;
            }
        }

        if (trimmedLine.startsWith('#')) {
            let rewrittenLine = line;
            const uriMatch = trimmedLine.match(/URI="([^"]+)"/);
            if (uriMatch?.[1]) {
                let absoluteUri = uriMatch[1];
                try {
                    if (!absoluteUri.startsWith('http://') && !absoluteUri.startsWith('https://')) {
                         absoluteUri = new URL(absoluteUri, manifestBaseUrl).href;
                    }
                    const proxiedUri = `/api/streams?url=${encodeURIComponent(absoluteUri)}${proxySubParams}`;
                    rewrittenLine = trimmedLine.replace(uriMatch[1], proxiedUri);
                } catch (e) {
                     console.warn(`[Proxy] Invalid URI in manifest: ${uriMatch[1]} with base ${manifestBaseUrl}. Line: ${line}`);
                     return line;
                }
            }
            return rewrittenLine;
        }

        if (trimmedLine) {
            let absoluteSegmentUrl = trimmedLine;
            try {
                if (!absoluteSegmentUrl.startsWith('http://') && !absoluteSegmentUrl.startsWith('https://')) {
                    absoluteSegmentUrl = new URL(absoluteSegmentUrl, manifestBaseUrl).href;
                }
                return `/api/streams?url=${encodeURIComponent(absoluteSegmentUrl)}${proxySubParams}`;
            } catch (e) {
                 console.warn(`[Proxy] Invalid segment URL: ${trimmedLine} with base ${manifestBaseUrl}. Line: ${line}`);
                 return line;
            }
        }
        return line;
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
