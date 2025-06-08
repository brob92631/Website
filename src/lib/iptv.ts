// /src/lib/iptv.ts (The final version with two curated lists)

export interface Stream {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
}

// === LIST 1: THE MAIN SPORTS CHANNELS ===
const sportsStreams: Stream[] = [
  { id: "cbs-sports-golazo", title: "CBS Sports Golazo", description: "The home of UCL Today.", category: "Football", url: "https://cbs-sports-golazo-us.cbsaavideo.com/cbs-sports-golazo-us/master.m3u8" },
  { id: "nba-tv", title: "NBA TV", description: "The official channel of the NBA.", category: "Basketball", url: "https://go.lnb.live/channels/nba/playlist.m3u8" },
  { id: "tnt-basketball", title: "TNT", description: "Inside the NBA & live games.", category: "Basketball", url: "https://turner-tnt-us-live.akamaized.net/hls/live/2023533/tnt/master.m3u8" },
  { id: "stadium-tv", title: "Stadium", description: "Live games and sports news.", category: "Multi-sport", url: "https://d335s5x62j2med.cloudfront.net/v1/master/a85523b5594d3a1c652174363c87842d765e9403/stadium/live.m3u8" },
  { id: "dazn-1", title: "DAZN 1", description: "Boxing, Football, and more.", category: "Multi-sport", url: "http://solid-5.jupimages.com/jupimages/daznes/live/dazn1bar_1.m3u8" },
];

// === LIST 2: YOUR CURATED ITALIAN CHANNELS ===
const italianStreams: Stream[] = [
  { id: "rai-1", title: "Rai 1", description: "Italian National Broadcaster", category: "General", url: "https://live.mediavibes.net/Rai1/master.m3u8" },
  { id: "rai-2", title: "Rai 2", description: "Italian National Broadcaster", category: "General", url: "https://live.mediavibes.net/Rai2/master.m3u8" },
  { id: "rai-3", title: "Rai 3", description: "Italian National Broadcaster", category: "General", url: "https://live.mediavibes.net/Rai3/master.m3u8" },
  { id: "la7", title: "LA7", description: "Private Italian Channel", category: "General", url: "https://d3749synfikwkv.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-74ylxpgd78bpb/Live.m3u8" },
  { id: "tv8-italy", title: "TV8", description: "Owned by Sky Group", category: "General", url: "https://hlslive-web-gcdn-skycdn-it.akamaized.net/TACT/11223/tv8web/master.m3u8" },
  { id: "nove", title: "NOVE", description: "Owned by Warner Bros. Discovery", category: "General", url: "https://d35j56w66xh9i2.cloudfront.net/live/nove/nove-1.m3u8" },
  { id: "rai-sport", title: "Rai Sport", description: "Dedicated Italian Sports Channel", category: "Sports", url: "https://live.mediavibes.net/RaiSport/master.m3u8" },
  { id: "sportitalia", title: "Sportitalia", description: "Italian Sports Channel", category: "Sports", url: "https://sportitaliaamd.akamaized.net/live/Sportitalia/hls/F59D8EB0332E783633CDDE8E265844975635D24F/index.m3u8" },
  { id: "supertennis", title: "SuperTennis", description: "Dedicated Italian Tennis Channel", category: "Sports", url: "https://live-embed.supertennix.hiway.media/restreamer/supertennix_client/gpu-a-c0-16/restreamer/rtmp/hls/h24_supertennix/manifest.m3u8" },
  { id: "sky-tg24", title: "Sky TG24", description: "24-hour news channel", category: "News", url: "https://hlslive-web-gcdn-skycdn-it.akamaized.net/TACT/12221/web/master.m3u8" },
];

// We now have two functions to get our streams
export async function getSportsStreams(): Promise<Stream[]> {
  return sportsStreams;
}

export async function getItalianStreams(): Promise<Stream[]> {
  return italianStreams;
}
