// /src/lib/iptv.ts

export interface Stream {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
}

// === LIST 1: THE MAIN SPORTS CHANNELS (REVERTED TO ONLY WORKING STREAMS) ===
const sportsStreams: Stream[] = [
  // The GOATs that always worked
  {
    id: "nba-tv",
    title: "NBA TV",
    description: "The official channel of the NBA.",
    category: "Basketball",
    url: "https://v13.thetvapp.to/hls/NBATV/tracks-v1a1/mono.m3u8?token=l5LXdrvnthAkYhx2IMcXOA&expires=1749416469&user_id=Q2xCRmRWRGpvYkVNMjlBcWJKbW1GN2RyQnVLa25zajlnQWs0WlBkNA==",
  },
];

// === LIST 2: YOUR CURATED ITALIAN CHANNELS (REVERTED) ===
const italianStreams: Stream[] = [
  // The GOATs that always worked
  {
    id: "la7",
    title: "LA7",
    description: "Private Italian Channel",
    category: "General",
    url: "https://d3749synfikwkv.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-74ylxpgd78bpb/Live.m3u8",
  },
];

// We now have two functions to get our streams
export async function getSportsStreams(): Promise<Stream[]> {
  return sportsStreams;
}

export async function getItalianStreams(): Promise<Stream[]> {
  return italianStreams;
}
