// /src/lib/iptv.ts

export interface Stream {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
  referer?: string; // The "disguise" the stream needs
}

// === LIST 1: THE MAIN SPORTS CHANNELS (WITH CORRECT URLS AND REFERERS) ===
const sportsStreams: Stream[] = [
  // --- Tricky streams that need the special referer ---
  {
    id: "dazn-1-de",
    title: "DAZN 1 (DE)",
    description: "Requires gopst.link referer",
    category: "Multi-sport",
    url: "https://zukiplay.cfd/mono.php?id=17", // The REAL source URL
    referer: "https://gopst.link/", // The REQUIRED disguise
  },
  {
    id: "sport-tv1-pt",
    title: "SPORT TV1 (PT)",
    description: "Requires gopst.link referer",
    category: "Sports",
    url: "https://zukiplay.cfd/mono.php?id=21",
    referer: "https://gopst.link/",
  },
  {
    id: "nova-sports-prime-gr",
    title: "NOVA SPORTS PRIME (GR)",
    description: "Requires gopst.link referer",
    category: "Sports",
    url: "https://zukiplay.cfd/mono.php?id=25",
    referer: "https://gopst.link/",
  },
  {
    id: "sky-sport-football-it",
    title: "Sky Sport Football (IT)",
    description: "Requires gopst.link referer",
    category: "Football",
    url: "https://zukiplay.cfd/mono.php?id=47",
    referer: "https://gopst.link/",
  },
  {
    id: "tf1-fr",
    title: "TF1 (FR)",
    description: "Requires gopst.link referer",
    category: "General",
    url: "https://zukiplay.cfd/mono.php?id=50",
    referer: "https://gopst.link/",
  },
  {
    id: "polsat-sport-1-pl",
    title: "POLSAT SPORT 1 (PL)",
    description: "Requires gopst.link referer",
    category: "Sports",
    url: "https://zukiplay.cfd/mono.php?id=65",
    referer: "https://gopst.link/",
  },
  {
    id: "polsat-sport-2-pl",
    title: "POLSAT SPORT 2 (PL)",
    description: "Requires gopst.link referer",
    category: "Sports",
    url: "https://zukiplay.cfd/mono.php?id=66",
    referer: "https://gopst.link/",
  },

  // --- Stable streams that don't need a special referer ---
  {
    id: "nba-tv",
    title: "NBA TV",
    description: "The official channel of the NBA.",
    category: "Basketball",
    url: "https://v13.thetvapp.to/hls/NBATV/tracks-v1a1/mono.m3u8?token=l5LXdrvnthAkYhx2IMcXOA&expires=1749416469&user_id=Q2xCRmRWRGpvYkVNMjlBcWJKbW1GN2RyQnVLa25zajlnQWs0WlBkNA==",
  },
];

// === LIST 2: YOUR CURATED ITALIAN CHANNELS ===
const italianStreams: Stream[] = [
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
