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
  if (info?.url && (info.url.includes('.m3u8') || info.protocol === 'hls' || info.mimeType === 'application/x-mpegURL')) {
    return info.url;
  }
  // Check sources.hls.url for alternative structure (e.g., if play-dl ever supports DM this way)
  if (info?.sources?.hls?.url) {
    return info.sources.hls.url;
  }
  if (info?.sources && typeof info.sources === 'object') {
    const hlsSource = Object.values(info.sources).find((s: any) => s?.url && s.url.includes('.m3u8'));
    if (hlsSource) return (hlsSource as any).url;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const responseHeaders = new Headers({ // For the response FROM our proxy
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

    // --- Constructing "human-like" fetch headers ---
    const fetchHeaders = new Headers(); // Use Headers object for easier manipulation

    // 1. User-Agent
    fetchHeaders.set('User-Agent', customUserAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

    // 2. Accept-Language
    fetchHeaders.set('Accept-Language', customAcceptLanguage || 'en;q=0.9,fr;q=0.8,de;q=0.7');
    
    // 3. Accept (General browsing accept, will be overridden for M3U8 later if needed)
    fetchHeaders.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9');

    // 4. Other common headers
    fetchHeaders.set('Accept-Encoding', 'gzip, deflate, br'); // Server will respond with what it supports
    fetchHeaders.set('Connection', 'keep-alive');
    fetchHeaders.set('Upgrade-Insecure-Requests', '1'); // For initial page loads, less relevant for direct M3U8
    fetchHeaders.set('Cache-Control', 'no-cache'); // Ensure fresh manifest/segments
    fetchHeaders.set('Pragma', 'no-cache'); // For older HTTP/1.0 servers

    // 5. Referer - will be set more specifically below
    if (customReferer) {
      fetchHeaders.set('Referer', customReferer);
      // 6. Origin - set if Referer is present
      try {
        fetchHeaders.set('Origin', new URL(customReferer).origin);
      } catch (e) { /* ignore if customReferer is not a valid URL for origin derivation */ }
    }
    
    // 7. X-Forwarded-For (less reliable for bypassing, but can be added)
    if (customXForwardedFor) {
      fetchHeaders.set('X-Forwarded-For', customXForwardedFor);
    }

    let effectiveTargetUrl = originalTargetUrl;
    let isExtractedManifest = false; // True if M3U8 URL comes from play-dl
    let manifestBaseForReferer: string | undefined = undefined; // To set Referer for segments

    const ytValidationResult = play.yt_validate(originalTargetUrl);
    if (ytValidationResult === 'video' || ytValidationResult === 'playlist') {
      console.log(`[Proxy YT] Detected YouTube URL type "${ytValidationResult}": ${originalTargetUrl}.`);
      // For play-dl's internal requests, it uses its own headers.
      // We are not passing our custom fetchHeaders into play.video_info() to avoid type errors.
      try {
        const streamInfo = await play.video_info(originalTargetUrl);
        const m3u8Url = getYouTubeHlsStreamUrl(streamInfo);
        if (m3u8Url) {
          effectiveTargetUrl = m3u8Url;
          isExtractedManifest = true;
          manifestBaseForReferer = effectiveTargetUrl; // The M3U8 URL becomes the referer for its segments
          if (!customReferer) { // If no specific referer was provided for YT, use YouTube as referer for the manifest
            fetchHeaders.set('Referer', originalTargetUrl); // or just 'https://www.youtube.com/'
            try { fetchHeaders.set('Origin', new URL(originalTargetUrl).origin); } catch (e) {/*ignore*/}
          }
          console.log(`[Proxy YT] Extracted M3U8: ${effectiveTargetUrl}`);
        } else {
          console.warn(`[Proxy YT] Could not extract M3U8 from YouTube info for ${originalTargetUrl}. StreamInfo dump:`, JSON.stringify(streamInfo, null, 2).substring(0,1000));
        }
      } catch (e: any) {
        console.error(`[Proxy YT] play.video_info error for ${originalTargetUrl}:`, e.message, e.stack);
      }
    } else if (originalTargetUrl.includes("dailymotion.com/") || originalTargetUrl.includes("dai.ly/")) {
        console.log(`[Proxy DM] Detected DailyMotion URL: ${originalTargetUrl}. play-dl does not support DailyMotion. Attempting to proxy URL directly.`);
        // If no customReferer for DM, maybe set a generic one.
        if (!customReferer) {
            fetchHeaders.set('Referer', originalTargetUrl); // Page URL as referer for initial manifest
            try { fetchHeaders.set('Origin', new URL(originalTargetUrl).origin); } catch(e) {/*ignore*/}
        }
        manifestBaseForReferer = effectiveTargetUrl;
    } else {
        // For direct M3U8s or other URLs, effectiveTargetUrl is originalTargetUrl
        // Referer and Origin are already set if customReferer was provided.
        // If not, they might be omitted or could default to the target's origin.
        manifestBaseForReferer = effectiveTargetUrl;
    }

    // For manifest requests, 'Accept' should indicate M3U8 preference
    if (effectiveTargetUrl.includes('.m3u8') || isExtractedManifest || (contentType && (contentType.includes('mpegurl') || contentType.includes('m3u8')))) {
        fetchHeaders.set('Accept', 'application/vnd.apple.mpegurl, application/x-mpegURL, */*;q=0.8');
    }
    
    console.log(`[Proxy] Requesting Effective URL: ${effectiveTargetUrl}`);
    // console.log('[Proxy] Sending Headers:', Object.fromEntries(fetchHeaders.entries())); // For debugging

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
      // Use the final URL from the response as the base for resolving relative paths in the manifest.
      // For segments, the Referer should ideally be the manifest URL.
      const actualManifestUrl = response.url; 

      let proxySubParams = '';
      // For segments, we'll use the M3U8 URL as referer if not overridden by a custom one for segments.
      // We also need to propagate other headers like User-Agent for consistency.
      const segmentReferer = customReferer || actualManifestUrl; // Prefer custom, fallback to manifest URL
      
      if (customUserAgent) proxySubParams += `&userAgent=${encodeURIComponent(customUserAgent)}`;
      proxySubParams += `&referer=${encodeURIComponent(segmentReferer)}`; // Always send referer for segments
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
                         absoluteUri = new URL(absoluteUri, actualManifestUrl).href; // Use actualManifestUrl as base
                    }
                    const proxiedUri = `/api/streams?url=${encodeURIComponent(absoluteUri)}${proxySubParams}`;
                    rewrittenLine = trimmedLine.replace(uriMatch[1], proxiedUri);
                } catch (e) {
                     console.warn(`[Proxy] Invalid URI in manifest: ${uriMatch[1]} with base ${actualManifestUrl}. Line: ${line}`);
                     return line;
                }
            }
            return rewrittenLine;
        }

        if (trimmedLine) {
            let absoluteSegmentUrl = trimmedLine;
            try {
                if (!absoluteSegmentUrl.startsWith('http://') && !absoluteSegmentUrl.startsWith('https://')) {
                    absoluteSegmentUrl = new URL(absoluteSegmentUrl, actualManifestUrl).href; // Use actualManifestUrl as base
                }
                return `/api/streams?url=${encodeURIComponent(absoluteSegmentUrl)}${proxySubParams}`;
            } catch (e) {
                 console.warn(`[Proxy] Invalid segment URL: ${trimmedLine} with base ${actualManifestUrl}. Line: ${line}`);
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
