import { NextRequest, NextResponse } from 'next/server';
import play from 'play-dl';

// Helper to select the best HLS stream from play-dl info
// Corrected based on Perplexity's feedback
function getBestHlsStreamUrl(info: any): string | null {
  // Use 'formats' (plural)
  if (info?.formats && Array.isArray(info.formats)) {
    // Look for live HLS streams first
    const liveHls = info.formats.find((f: any) =>
      f.isLive && (f.url?.includes('.m3u8') || f.mimeType === 'application/x-mpegURL' || f.protocol === 'hls')
    );
    if (liveHls?.url) return liveHls.url;

    // Otherwise, look for any HLS stream
    const anyHls = info.formats.find((f: any) =>
      f.url?.includes('.m3u8') || f.mimeType === 'application/x-mpegURL' || f.protocol === 'hls'
    );
    if (anyHls?.url) return anyHls.url;
  }

  // Check sources.hls.url for alternative structure (e.g., DailyMotion)
  if (info?.sources?.hls?.url) {
    return info.sources.hls.url;
  }

  // General sources object check (less common for HLS from play-dl's primary parsing)
  if (info?.sources && typeof info.sources === 'object') {
    const hlsSource = Object.values(info.sources).find((s: any) =>
      s?.url && s.url.includes('.m3u8')
    );
    if (hlsSource) return (hlsSource as any).url;
  }
  
  // Sometimes, for very direct M3U8s passed to video_info, the URL might be top-level
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
        const streamInfo = await play.video_info(originalTargetUrl); // Call without options to avoid previous type errors
        // Corrected call to getBestHlsStreamUrl based on Perplexity's feedback
        const m3u8Url = getBestHlsStreamUrl(streamInfo);
        if (m3u8Url) {
          effectiveTargetUrl = m3u8Url;
          isExtractedManifest = true;
          console.log(`[Proxy YT] Extracted M3U8: ${effectiveTargetUrl}`);
        } else {
          console.warn(`[Proxy YT] Could not extract M3U8 from YouTube info for ${originalTargetUrl}. StreamInfo dump:`, JSON.stringify(streamInfo, null, 2).substring(0, 1000));
        }
      } catch (e: any) {
        console.error(`[Proxy YT] play.video_info error for ${originalTargetUrl}:`, e.message, e.stack);
      }
    } else if (play.dm_validate(originalTargetUrl)) {
      console.log(`[Proxy DM] Detected DailyMotion URL: ${originalTargetUrl}. Attempting stream info extraction...`);
      try {
        const streamInfo = await play.video_info(originalTargetUrl); // Call without options
        // Corrected call to getBestHlsStreamUrl based on Perplexity's feedback
        const m3u8Url = getBestHlsStreamUrl(streamInfo);
        if (m3u8Url) {
          effectiveTargetUrl = m3u8Url;
          isExtractedManifest = true;
          console.log(`[Proxy DM] Extracted M3U8: ${effectiveTargetUrl}`);
        } else {
          console.warn(`[Proxy DM] Could not extract M3U8 from DailyMotion info for ${originalTargetUrl}. StreamInfo dump:`, JSON.stringify(streamInfo, null, 2).substring(0,1000));
        }
      } catch (e: any) {
        console.error(`[Proxy DM] play.video_info error for ${originalTargetUrl}:`, e.message, e.stack);
      }
    }

    console.log(`[Proxy] Requesting Effective URL: ${effectiveTargetUrl}`);
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
