// /src/lib/iptv.ts (The final, curated list with your syntax corrected)

export interface Stream {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
}

const curatedStreams: Stream[] = [
  // === FOOTBALL STAPLES ===
  { id: "cbs-sports-golazo", title: "CBS Sports Golazo", description: "Thierry Henry, Kate Abdo, Micah Richards & Jamie Carragher.", category: "Football", url: "https://cbs-sports-golazo-us.cbsaavideo.com/cbs-sports-golazo-us/master.m3u8" },
  { id: "bein-sports-en", title: "beIN SPORTS English", description: "Major European Football Leagues & more.", category: "Football", url: "https://edge-1.okast.tv/beinsports_beinsports1_fr/tracks-v1a1/mono.m3u8" },
  { id: "tnt-sports-1", title: "TNT Sports 1", description: "Champions League & Premier League.", category: "Football", url: "http://195.154.221.171/BTSports1/video.m3u8" },

  // === BASKETBALL STAPLES ===
  { id: "nba-tv", title: "NBA TV", description: "The official 24/7 channel of the NBA. (Source by a Legend)", category: "Basketball", url: "https://go.lnb.live/channels/nba/playlist.m3u8" },
  { id: "tnt-basketball", title: "TNT", description: "Home of the NBA on TNT.", category: "Basketball", url: "https://turner-tnt-us-live.akamaized.net/hls/live/2023533/tnt/master.m3u8" },
  { id: "espn-basketball", title: "ESPN", description: "College Basketball and NBA games.", category: "Basketball", url: "https://espn-espn1-s.s.llnwi.net/playlist.m3u8" },

  // === MULTI-SPORT & US SPORTS ===
  { id: "dazn-1", title: "DAZN 1", description: "Boxing, Football, and various live events.", category: "Multi-sport", url: "http://solid-5.jupimages.com/jupimages/daznes/live/dazn1bar_1.m3u8" },
  { id: "stadium-tv", title: "Stadium", description: "Live games, classic replays, and sports news.", category: "Multi-sport", url: "https://d335s5x62j2med.cloudfront.net/v1/master/a85523b5594d3a1c652174363c87842d765e9403/stadium/live.m3u8" },
  { id: "nfl-network", title: "NFL Network", description: "24/7 coverage of American Football.", category: "American Football", url: "https://nfl-nfln-s.s.llnwi.net/playlist.m3u8" },
  { id: "mlb-network", title: "MLB Network", description: "Live baseball games and analysis.", category: "Baseball", url: "https://mlb-mlbn-s.s.llnwi.net/playlist.m3u8" },
  { 
    id: "tv8-italy", 
    title: "TV8", 
    description: "Italian channel", 
    category: "Other", 
    url: "https://hlslive-web-gcdn-skycdn-it.akamaized.net/TACT/11223/tv8web/master.m3u8?hdnts=st=1749365202~exp=1749365502~acl=/*~hmac=a956c67e2bfea75fcf3eebad138989468905eb9d6dfef53fb29d6bbbee1af65b" 
  } // <<< THE COMMA WAS MISSING HERE. I have removed it to keep the syntax correct.
];
   
export async function getStreams(): Promise<Stream[]> {
  return curatedStreams;
}
