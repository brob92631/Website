import { NextRequest, NextResponse } from 'next/server';
import play from 'play-dl';

const CHECK_TIMEOUT = 2800; // Total timeout for all quality checks (max 3 seconds)

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
  if (info?.url && info.url.includes('.m3u8')) return info.url;
  if (info?.sources?.hls?.url) return info.sources.hls.url;
  
  return null;
}

// Helper to check a single URL's availability and latency
async function checkUrl(url: string, controller: AbortController) {
  const startTime = Date.now();
  try {
    // Use HEAD request for speed, as we only need headers to validate.
    const response = await fetch(url, { method: 'HEAD', signal: controller.signal });
    const latency = Date.now() - startTime;

    if (!response.ok) {
      return { url, status: 'failed', reason: `HTTP status ${response.status}` };
    }

    // Check for a valid M3U8 content type. Be lenient as servers can be misconfigured.
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('mpegurl') && !contentType.includes('octet-stream') && !contentType.includes('text/plain')) {
      return { url, status: 'failed', reason: `Invalid content-type: ${contentType}` };
    }
    
    return { url, status: 'success', latency };

  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { url, status: 'failed', reason: `Timed out after ${CHECK_TIMEOUT}ms` };
    }
    return { url, status: 'failed', reason: error.message };
  }
}

// Helper to find the best URL from a list by checking them concurrently.
async function getBestStreamUrl(urls: string[]): Promise<string | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CHECK_TIMEOUT);

    const checkPromises = urls.map(url => checkUrl(url, controller));

    const results = await Promise.allSettled(checkPromises);
    clearTimeout(timeoutId);

    const successfulChecks = results
      .filter((result): result is PromiseFulfilledResult<{ url: string; status: 'success'; latency: number; }> => 
          result.status === 'fulfilled' && result.value.status === 'success'
      )
      .map(result => result.value);

    if (successfulChecks.length === 0) {
      console.warn('[QualityCheck] No working streams found from the list.', { allResults: results.map(r => r.status === 'fulfilled' ? r.value : r.reason) });
      return null;
    }

    // Sort by latency to find the fastest (and likely most stable) one.
    successfulChecks.sort((a, b) => a.latency - b.latency);
    
    console.log(`[QualityCheck] Found ${successfulChecks.length} working streams. Fastest is ${successfulChecks[0].url} with ${successfulChecks[0].latency}ms latency.`);
    return successfulChecks[0].url;
}


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const originalTargetUrl = searchParams.get('url');
    const backupUrls = searchParams.getAll('backups').filter(Boolean); // Filter out empty/null backups

    if (!originalTargetUrl) {
      return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
    }

    // If it's a YouTube URL, resolve it to a direct .m3u8 link
    const ytValidationResult = play.yt_validate(originalTargetUrl);
    if (ytValidationResult === 'video' || ytValidationResult === 'playlist') {
      console.log(`[Resolver] Detected YouTube URL: ${originalTargetUrl}`);
      try {
        const streamInfo = await play.video_info(originalTargetUrl);
        const m3u8Url = getYouTubeHlsStreamUrl(streamInfo);
        if (m3u8Url) {
          console.log(`[Resolver] Resolved to M3U8: ${m3u8Url}`);
          return NextResponse.json({ streamUrl: m3u8Url });
        } else {
          throw new Error('Could not extract M3U8 from YouTube info.');
        }
      } catch (e: any) {
        console.error(`[Resolver] play.video_info error for ${originalTargetUrl}:`, e.message);
        return NextResponse.json({ error: 'Failed to resolve YouTube stream.' }, { status: 500 });
      }
    }

    // For all other URLs, perform the quality check on the primary and backup URLs.
    console.log(`[Resolver] Detected IPTV stream. Checking primary and ${backupUrls.length} backups.`);
    const allUrls = [originalTargetUrl, ...backupUrls];
    const bestUrl = await getBestStreamUrl(allUrls);

    if (bestUrl) {
      return NextResponse.json({ streamUrl: bestUrl });
    } else {
      return NextResponse.json({ error: 'Could not find a working stream. The channel may be offline or all links are invalid.' }, { status: 404 });
    }

  } catch (error: any) {
    console.error('[Resolver] CRITICAL ERROR:', error.message);
    return NextResponse.json({ error: 'Failed to process request.' }, { status: 500 });
  }
}

// OPTIONS handler remains for CORS pre-flight requests from the client
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*', // Adjust if your site has a specific domain
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
