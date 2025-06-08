// /src/lib/iptv.ts (The final version with two curated lists)

export interface Stream {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
}

// === LIST 1: THE MAIN SPORTS CHANNELS (REPLACED AS PER REQUEST) ===
const sportsStreams: Stream[] = [
  { id: "dazn-1-de", title: "DAZN 1 (DE)", description: "Live sports from Germany.", category: "Multi-sport", url: "https://x4-cdnnew.newkso.ru/x4-cdn/mono17/mono.m3u8" },
  { id: "sport-tv1-pt", title: "SPORT TV1 (PT)", description: "Live sports from Portugal.", category: "Sports", url: "https://x4-cdnnew.newkso.ru/x4-cdn/mono21/mono.m3u8" },
  { id: "nova-sports-prime-gr", title: "NOVA SPORTS PRIME (GR)", description: "Live sports from Greece.", category: "Sports", url: "https://x4-cdnnew.newkso.ru/x4-cdn/mono25/mono.m3u8" },
  { id: "sky-sport-football-it", title: "Sky Sport Football (IT)", description: "Italian football coverage.", category: "Football", url: "https://x4-cdnnew.newkso.ru/x4-cdn/mono47/mono.m3u8" },
  { id: "tf1-fr", title: "TF1 (FR)", description: "French general channel.", category: "General", url: "https://x4-cdnnew.newkso.ru/x4-cdn/mono50/mono.m3u8" },
  { id: "polsat-sport-1-pl", title: "POLSAT SPORT 1 (PL)", description: "Live sports from Poland.", category: "Sports", url: "https://x4-cdnnew.newkso.ru/x4-cdn/mono65/mono.m3u8" },
  { id: "polsat-sport-2-pl", title: "POLSAT SPORT 2 (PL)", description: "Live sports from Poland.", category: "Sports", url: "https://x4-cdnnew.newkso.ru/x4-cdn/mono66/mono.m3u8" },
  { id: "nba-tv", title: "NBA TV", description: "The official channel of the NBA.", category: "Basketball", url: "https://v13.thetvapp.to/hls/NBATV/tracks-v1a1/mono.m3u8?token=l5LXdrvnthAkYhx2IMcXOA&expires=1749416469&user_id=Q2xCRmRWRGpvYkVNMjlBcWJKbW1GN2RyQnVLa25zajlnQWs0WlBkNA==" },
];

// === LIST 2: YOUR CURATED ITALIAN CHANNELS (CLEANED AS PER REQUEST) ===
const italianStreams: Stream[] = [
  { id: "la7", title: "LA7", description: "Private Italian Channel", category: "General", url: "https://d3749synfikwkv.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-74ylxpgd78bpb/Live.m3u8" },
];

// We now have two functions to get our streams
export async function getSportsStreams(): Promise<Stream[]> {
  return sportsStreams;
}

export async function getItalianStreams(): Promise<Stream[]> {
  return italianStreams;
}
