export interface Stream { id: string; title: string; competition: string; sport: string; embedUrl: string; }
export async function getStreams(): Promise<Stream[]> {
  try {
    const response = await fetch('https://iptv-org.github.io/iptv/categories/sports.m3u', { next: { revalidate: 3600 } });
    const m3uContent = await response.text(); const lines = m3uContent.split('\n'); const streams: Stream[] = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('#EXTINF:')) {
        const title = lines[i].split(',').pop()?.trim() || 'Unknown Stream'; let streamUrl = '';
        for (let j = i + 1; j < lines.length; j++) { if (lines[j] && !lines[j].startsWith('#')) { streamUrl = lines[j].trim(); break; } }
        if (title && streamUrl) { streams.push({ id: Buffer.from(streamUrl).toString('base64'), title, competition: 'Live TV Channel', sport: 'Sports', embedUrl: streamUrl }); }
      }
    } return streams;
  } catch (error) { console.error("Failed to fetch IPTV streams:", error); return []; }
}
