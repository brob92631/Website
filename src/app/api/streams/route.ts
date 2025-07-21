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
  if (info?.url && info.url.includes('.m3u8')) return info.url;
  if (info?.sources?.hls?.url) return info.sources.hls.url;
  
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const originalTargetUrl = searchParams.get('url');

    if (!originalTargetUrl) {
      return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
    }

    let effectiveStreamUrl = originalTargetUrl;

    // If it's a YouTube URL, resolve it to a direct .m3u8 link
    const ytValidationResult = play.yt_validate(originalTargetUrl);
    if (ytValidationResult === 'video' || ytValidationResult === 'playlist') {
      console.log(`[Resolver] Detected YouTube URL: ${originalTargetUrl}`);
      try {
        const streamInfo = await play.video_info(originalTargetUrl);
        const m3u8Url = getYouTubeHlsStreamUrl(streamInfo);
        if (m3u8Url) {
          effectiveStreamUrl = m3u8Url;
          console.log(`[Resolver] Resolved to M3U8: ${effectiveStreamUrl}`);
        } else {
          throw new Error('Could not extract M3U8 from YouTube info.');
        }
      } catch (e: any) {
        console.error(`[Resolver] play.video_info error for ${originalTargetUrl}:`, e.message);
        return NextResponse.json({ error: 'Failed to resolve YouTube stream.' }, { status: 500 });
      }
    }

    // For all other URLs, we assume they are already direct .m3u8 links
    // and just pass them back to the client.
    
    return NextResponse.json({ streamUrl: effectiveStreamUrl });

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
