import { NextRequest, NextResponse } from 'next/server';
import play from 'play-dl';

const SPOOFED_REFERER = 'https://tvron.ro/';
const SPOOFED_ORIGIN = new URL(SPOOFED_REFERER).origin;
const COMMON_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

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

    const fetchHeaders = new Headers(); 
    const effectiveReferer = customReferer || SPOOFED_REFERER;

    fetchHeaders.set('User-Agent', customUserAgent || COMMON_USER_AGENT);
    fetchHeaders.set('Accept-Language', customAcceptLanguage || 'en-US,en;q=0.9,ro;q=0.8');
    fetchHeaders.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7');
    fetchHeaders.set('Accept-Encoding', 'gzip, deflate, br');
    fetchHeaders.set('Connection', 'keep-alive');
    fetchHeaders.set('Upgrade-Insecure-Requests', '1');
    fetchHeaders.set('Cache-Control', 'no-cache');
    fetchHeaders.set('Pragma', 'no-cache');
    fetchHeaders.set('Referer', effectiveReferer);
    fetchHeaders.set('Origin', SPOOFED_ORIGIN);
    
    if (customXForwardedFor) {
      fetchHeaders.set('X-Forwarded-For', customXForwardedFor);
    }

    let effectiveTargetUrl = originalTargetUrl;
    let isExtractedManifest = false;

    const ytValidationResult = play.yt_validate(originalTargetUrl);
    if (ytValidationResult === 'video' || ytValidationResult === 'playlist') {
      console.log(`[Proxy YT] Detected YouTube URL type "${ytValidationResult}": ${originalTargetUrl}.`);
      try {
        const streamInfo = await play.video_info(originalTargetUrl);
        const m3u8Url = getYouTubeHlsStreamUrl(streamInfo);
        if (m3u8Url) {
          effectiveTargetUrl = m3u8Url;
          isExtractedManifest = true;
          console.log(`[Proxy YT] Extracted M3U8: ${effectiveTargetUrl}`);
        } else {
          console.warn(`[Proxy YT] Could not extract M3U8 from YouTube info for ${originalTargetUrl}. StreamInfo dump:`, JSON.stringify(streamInfo, null, 2).substring(0,1000));
        }
      } catch (e: any) {
        console.error(`[Proxy YT] play.video_info error for ${originalTargetUrl}:`, e.message, e.stack);
      }
    } else if (originalTargetUrl.includes("dailymotion.com/") || originalTargetUrl.includes("dai.ly/")) {
        console.log(`[Proxy DM] Detected DailyMotion URL: ${originalTargetUrl}. play-dl does not support DailyMotion. Attempting to proxy URL directly.`);
    } 

    if (effectiveTargetUrl.includes('.m3u8') || isExtractedManifest) {
        fetchHeaders.set('Accept', 'application/vnd.apple.mpegurl, application/x-mpegURL, */*;q=0.8');
    }
    
    console.log(`[Proxy] Requesting Effective URL: ${effectiveTargetUrl}`);

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
    if (isExtractedManifest || contentType.includes('mpegurl') || contentType.includes('m3u8') || (effectiveTargetUrl.includes('.m3u8') && !contentType)) {
      const manifestText = await response.text();
      const actualManifestUrl = response.url; 

      const segmentReferer = customReferer || SPOOFED_REFERER;
      
      let proxySubParams = '';
      if (customUserAgent) proxySubParams += `&userAgent=${encodeURIComponent(customUserAgent)}`;
      proxySubParams += `&referer=${encodeURIComponent(segmentReferer)}`; 
      if (customAcceptLanguage) proxySubParams += `&acceptLanguage=${encodeURIComponent(customAcceptLanguage)}`; else proxySubParams += `&acceptLanguage=${encodeURIComponent('en-US,en;q=0.9,ro;q=0.8')}`;
      if (customXForwardedFor) proxySubParams += `&xForwardedFor=${encodeURIComponent(customXForwardedFor)}`;

      const rewrittenManifest = manifestText.split('\n').map(line => {
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith('#')) {
            let rewrittenLine = line;
            const uriMatch = trimmedLine.match(/URI="([^"]+)"/);
            if (uriMatch?.[1]) {
                let absoluteUri = uriMatch[1];
                try {
                    if (!absoluteUri.startsWith('http://') && !absoluteUri.startsWith('https://')) {
                         absoluteUri = new URL(absoluteUri, actualManifestUrl).href;
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
                    absoluteSegmentUrl = new URL(absoluteSegmentUrl, actualManifestUrl).href; 
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
