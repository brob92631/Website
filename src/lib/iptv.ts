// /src/lib/iptv.ts (The Final, Smart Version)

export interface Stream {
  id: string;
  title: string;
  competition: string;
  sport: string;
  embedUrl: string;
}

// This is the new, intelligent function to get our streams.
export async function getStreams(): Promise<Stream[]> {
  try {
    console.log("Fetching the list of all online streams...");

    // Fetch the official IPTV-ORG database of all streams.
    const response = await fetch('https://iptv-org.github.io/api/streams.json', {
      next: { revalidate: 3600 } // Cache the huge list for 1 hour
    });
    const allStreams: any[] = await response.json();

    console.log(`Found ${allStreams.length} total streams. Filtering for online sports channels...`);

    // Now, we filter this massive list for only the best streams.
    const onlineSportsStreams = allStreams
      .filter(stream =>
        // 1. The stream must be marked as ONLINE.
        stream.status === 'online' &&
        // 2. The stream URL must be a playable HLS format.
        stream.url.endsWith('.m3u8') &&
        // 3. The channel must be in the "Sports" category.
        (stream.categories?.some((cat: any) => cat.name === 'Sports'))
      )
      // 4. We map the filtered data to the format our app expects.
      .map(stream => ({
        id: Buffer.from(stream.url).toString('base64'),
        title: stream.channel_name || stream.channel, // Use channel_name if available
        competition: 'Live TV Channel',
        sport: 'Sports',
        embedUrl: stream.url,
      }));

    console.log(`Found ${onlineSportsStreams.length} high-quality online sports streams.`);
    
    // We will return a randomized slice of the list to keep it fresh
    // and prevent showing the exact same 100+ channels every time.
    return onlineSportsStreams.sort(() => 0.5 - Math.random()).slice(0, 100);

  } catch (error) {
    console.error("Failed to fetch or process IPTV stream database:", error);
    return []; // Return an empty array on failure
  }
}
