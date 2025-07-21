// /src/lib/iptv.ts

export interface Stream {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
  referer?: string;
  userAgent?: string;
  acceptLanguage?: string; // Added this as an option if needed later
  xForwardedFor?: string; // Added this as an option if needed later
}

const toKebabCase = (str: string) =>
  str.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');

// === Master List: All Romanian Streams ===
const allRomanianStreamsData: Stream[] = [
  { id: toKebabCase("TVR 1"), title: "TVR 1", description: "Romanian public television channel 1.", category: "General", url: "https://ultra2.falconx.cfd/t001/usergend4sdkx9q2rnd.m3u8" },
  { id: toKebabCase("TVR 2"), title: "TVR 2", description: "Romanian public television channel 2.", category: "General", url: "https://thor1.syndula.cfd/tevere2/usergendxl6d4vnd.m3u8" },
  { id: toKebabCase("PRO TV"), title: "PRO TV", description: "Major Romanian private television channel.", category: "General", url: "https://omega1.visionxmans.cfd/porky/usergenx7240lrnd.m3u8" },
  { id: toKebabCase("ANTENA 1"), title: "ANTENA 1", description: "Popular Romanian entertainment channel.", category: "General", url: "https://hokrus113.zokares.cfd/ah1/usergenx304Jtlrnd.m3u8" },
  { id: toKebabCase("KANAL D"), title: "KANAL D", description: "Romanian private general entertainment channel.", category: "General", url: "https://arwen1.panaka.cfd/canald/usergenxq0jl72l0rnd.m3u8" },
  { id: toKebabCase("PRIMA TV"), title: "PRIMA TV", description: "Romanian private general entertainment channel.", category: "General", url: "https://saruman1.tharen.cfd/prima/usergenrnd8qxl92r.m3u8" },
  { id: toKebabCase("PRO CINEMA"), title: "PRO CINEMA", description: "Romanian movie channel from Pro TV group.", category: "Movies", url: "https://saruman1.tharen.cfd/porkynema/usergenrnd0ek16an4l.m3u8" },
  { id: toKebabCase("Happy Channel"), title: "Happy Channel", description: "Romanian channel focusing on series and movies.", category: "Entertainment", url: "https://saruman1.tharen.cfd/hap/usergenrnd2gd3ogS7bkd.m3u8" },
  { id: toKebabCase("Acasa TV"), title: "Acasa TV", description: "Romanian channel for soap operas and entertainment.", category: "Entertainment", url: "https://alpha1.cool-itv.com/acasa/usergenx3e7g4rnd.m3u8" },
  { id: toKebabCase("Antena 3 CNN"), title: "Antena 3 CNN", description: "Romanian news channel affiliated with CNN.", category: "News", url: "https://alpha1.cool-itv.com/an3/high/usergen801l41hcrnd.m3u8" },
  { id: toKebabCase("Realitatea TV Plus"), title: "Realitatea TV Plus", description: "Romanian news and current affairs channel.", category: "News", url: "https://flash1.bogulus.cfd/realy/usergenrx0j3qt.m3u8" },
  { id: toKebabCase("Romania TV"), title: "Romania TV", description: "Romanian news channel.", category: "News", url: "https://vs2133.vcdn.biz/d955576a43f6ed06a913697e4dbe1618_megogo/live/hls/b/700_2490/u_sid/0/o/183396781/rsid/2930bbeb-5b16-463a-a8c1-2f6bd84d761a/u_uid/0/u_vod/0/u_device/cms_html5/u_devicekey/_site/lip/79.118.147.14*asn/u_srvc/109126/u_did/web_WK1eydcMlEUw69RRnwjOGI1oJwFlc5bq/type.live/chunklist-sid1414520553411439744-b2490000.m3u8" },
  { id: toKebabCase("HBO"), title: "HBO", description: "Premium movie channel.", category: "Movies", url: "https://thor1.syndula.cfd/h1/usergendx172s9rnd.m3u8" },
  { id: toKebabCase("HBO 2"), title: "HBO 2", description: "Second premium movie channel.", category: "Movies", url: "https://onyx1.mofta.cfd/h2/usergendxn430rnd.m3u8" },
  { id: toKebabCase("DIGI Sport 1"), title: "DIGI Sport 1", description: "Romanian sports channel 1.", category: "Sports", url: "https://kuk1.modprimus.cfd/kuk1/usergendx472snx93kdgwqrnd.m3u8" },
  { id: toKebabCase("DIGI Sport 2"), title: "DIGI Sport 2", description: "Romanian sports channel 2.", category: "Sports", url: "https://ultra2.falconx.cfd/kuk2/usergendx0ul2J8tsDx9lgcddwqrnd.m3u8" },
  { id: toKebabCase("DIGI Sport 3"), title: "DIGI Sport 3", description: "Romanian sports channel 3.", category: "Sports", url: "https://ultra2.falconx.cfd/kuk3/usergendx0slfk9QssDx9lgxlsdmqrnd.m3u8" },
  { id: toKebabCase("DIGI Sport 4"), title: "DIGI Sport 4", description: "Romanian sports channel 4.", category: "Sports", url: "https://kuk1.modprimus.cfd/kuk4/usergendx0thc60skrdnnd.m3u8" },
  { id: toKebabCase("Taraf TV"), title: "Taraf TV", description: "Romanian music and entertainment channel.", category: "Music", url: "https://flash1.bogulus.cfd/tarafy/usergenrxgi1cla6qt.m3u8" },
  { id: toKebabCase("AMC"), title: "AMC", description: "Movie and series channel.", category: "Movies", url: "https://iron1.jarvisx.cfd/amece/usergenrx3oq1kr.m3u8" },
  { id: toKebabCase("Filmbox"), title: "Filmbox", description: "Movie channel.", category: "Movies", url: "https://ultra2.falconx.cfd/muk/usergendx0nht6241s0krdnyd.m3u8" },
  { id: toKebabCase("National Geographic"), title: "National Geographic", description: "Documentary channel.", category: "Documentary", url: "https://onyx1.mofta.cfd/ngeo/usergenrnd84oeigt.m3u8" },
  { id: toKebabCase("Teennick"), title: "Teennick", description: "Nickelodeon's channel for teenagers.", category: "Kids", url: "https://flash1.bogulus.cfd/tinnik/usergenrx8fg02rt.m3u8" },
  { id: toKebabCase("Nickelodeon"), title: "Nickelodeon", description: "Children's entertainment channel.", category: "Kids", url: "https://onyx1.mofta.cfd/nike/usergenm24qrnd.m3u8" },
  { id: toKebabCase("Film Now"), title: "Film Now", description: "Movie channel.", category: "Movies", url: "https://ultra2.falconx.cfd/muk/usergendx0nht6241s0krdnyd.m3u8" }, // Duplicate URL with Filmbox
  { id: toKebabCase("TV 1000"), title: "TV 1000", description: "Movie channel.", category: "Movies", url: "https://flash1.bogulus.cfd/tivi10/usergenrxs4f7zc.m3u8" },
  { id: toKebabCase("Prima Sport 1"), title: "Prima Sport 1", description: "Romanian sports channel 1.", category: "Sports", url: "https://hulky116.lokix.cfd/puk1/usergenrx0cir27aq.m3u8" },
  { id: toKebabCase("Prima Sport 2"), title: "Prima Sport 2", description: "Romanian sports channel 2.", category: "Sports", url: "https://arwen1.panaka.cfd/puk2/usergenrnd0clv03fyt.m3u8" },
  { id: toKebabCase("Cartoon Network"), title: "Cartoon Network", description: "Children's animation channel.", category: "Kids", url: "https://iron1.jarvisx.cfd/cartun/usergenrx2xfzol0q.m3u8" },
  { id: toKebabCase("BBC First"), title: "BBC First", description: "BBC drama and comedy channel.", category: "Entertainment", url: "https://onyx1.mofta.cfd/bibi1/usergendxn09l2s6cek.m3u8" },
  { id: toKebabCase("Music Channel"), title: "Music Channel", description: "Romanian music channel.", category: "Music", url: "https://arwen1.panaka.cfd/mch/usergenz7h0qdt.m3u8" },
  { id: toKebabCase("Favorit TV"), title: "Favorit TV", description: "Romanian folk and traditional music channel.", category: "Music", url: "https://arwen1.panaka.cfd/favorit/usergenrn9jn4gba.m3u8" },
  { id: toKebabCase("Kiss TV"), title: "Kiss TV", description: "Romanian pop music channel.", category: "Music", url: "https://tv.broadcasting.ro/kisstv/a629c031-2170-4ee9-a36d-87a891aa3131_output_0.m3u8" },
  { id: toKebabCase("Cartoonito"), title: "Cartoonito", description: "Preschool animation channel.", category: "Kids", url: "https://flash1.bogulus.cfd/bomer/usergenrx2c86jey.m3u8" },
  { id: toKebabCase("Bollywood Classic"), title: "Bollywood Classic", description: "Indian classic movie channel.", category: "Movies", url: "https://flash1.bogulus.cfd/boly/usergenr9j8s2t.m3u8" },
  { id: toKebabCase("Sport Extra"), title: "Sport Extra", description: "Sports news and events.", category: "Sports", url: "https://saruman1.tharen.cfd/sextra/usergenq8eo0q.m3u8" },
  { id: toKebabCase("Prima Sport 3"), title: "Prima Sport 3", description: "Romanian sports channel 3.", category: "Sports", url: "https://iron1.jarvisx.cfd/puk3/usergenrx4t0l8sybkr.m3u8" },
  { id: toKebabCase("Pro Arena"), title: "Pro Arena", description: "Romanian sports and entertainment channel.", category: "Sports", url: "https://arwen1.panaka.cfd/prx/usergenrnvdfki42man4l.m3u8" },
  { id: toKebabCase("ID"), title: "ID", description: "Investigation Discovery, documentary channel.", category: "Documentary", url: "https://onyx1.mofta.cfd/cryme/usergendxn0487rnd.m3u8" },
  { id: toKebabCase("Acasa Gold"), title: "Acasa Gold", description: "Romanian channel for classic series and movies.", category: "Entertainment", url: "https://thor1.syndula.cfd/gold/usergendxt638rnd.m3u8" },
  { id: toKebabCase("AXN White"), title: "AXN White", description: "Action and crime series channel.", category: "Entertainment", url: "https://onyx1.mofta.cfd/axwhite/usergenx23rnd.m3u8" },
  { id: toKebabCase("AXN Black"), title: "AXN Black", description: "Action and crime series channel.", category: "Entertainment", url: "https://saruman1.tharen.cfd/axyblack/usergenrxi6s93hs2.m3u8" },
  { id: toKebabCase("ZU TV"), title: "ZU TV", description: "Romanian music channel.", category: "Music", url: "https://iron1.jarvisx.cfd/zzz/usergenrx8c0k3lkr.m3u8" },
  { id: toKebabCase("Etno TV"), title: "Etno TV", description: "Romanian folk music channel.", category: "Music", url: "https://arwen1.panaka.cfd/etno/usergenrnd7ke5lgt.m3u8" },
  { id: toKebabCase("EuroSport 1"), title: "EuroSport 1", description: "Pan-European sports channel.", category: "Sports", url: "https://jardo111.jardomany.cfd/er01/usergendx0slkgx7dqrnd.m3u8" },
  { id: toKebabCase("EuroSport 2"), title: "EuroSport 2", description: "Pan-European sports channel.", category: "Sports", url: "https://jardo111.jardomany.cfd/er02/usergenje3x9dqrnd.m3u8" },
  { id: toKebabCase("Sky Showtime 1"), title: "Sky Showtime 1", description: "Movie and series channel.", category: "Movies", url: "https://thor1.syndula.cfd/schi1/usergendxn430rnd.m3u8" }, // Duplicate URL with HBO 2
  { id: toKebabCase("Sky Showtime 2"), title: "Sky Showtime 2", description: "Movie and series channel.", category: "Movies", url: "https://thor1.syndula.cfd/schi2/usergendxj85trnd.m3u8" }, // Duplicate URL with DIVA
  { id: toKebabCase("Comedy Central"), title: "Comedy Central", description: "Comedy series channel.", category: "Entertainment", url: "https://saruman1.tharen.cfd/comedi/usergenrx7zo1kr.m3u8" },
  { id: toKebabCase("DIVA"), title: "DIVA", description: "Female-oriented entertainment channel.", category: "Entertainment", url: "https://thor1.syndula.cfd/diva/usergenm48Qhxrnd.m3u8" }, // Duplicate URL with Sky Showtime 2
  { id: toKebabCase("C & I"), title: "C & I", description: "Crime & Investigation, documentary channel.", category: "Documentary", url: "https://onyx1.mofta.cfd/crymeinv2/usergen9o4n2srnd.m3u8" },
  { id: toKebabCase("JimJam"), title: "JimJam", description: "Preschool children's channel.", category: "Kids", url: "https://saruman1.tharen.cfd/jimy/usergenq3n0lz7kr.m3u8" },
  { id: toKebabCase("Balcan Music TV"), title: "Balcan Music TV", description: "Music channel featuring Balkan music.", category: "Music", url: "https://arwen1.panaka.cfd/balkmus/usergenko4x0g.m3u8" },
  { id: toKebabCase("Antena Stars"), title: "Antena Stars", description: "Romanian celebrity and entertainment news channel.", category: "Entertainment", url: "https://iron1.jarvisx.cfd/antstar/usergenrxl7m94sq.m3u8" },
  { id: toKebabCase("Rock TV"), title: "Rock TV", description: "Romanian rock music channel.", category: "Music", url: "https://tv.broadcasting.ro/rocktv/85c83a80-4f71-4f2d-a8d6-43f676896bcb_output_0.m3u8" },
  { id: toKebabCase("Prima News"), title: "Prima News", description: "Romanian news channel.", category: "News", url: "https://thor1.syndula.cfd/prnews/usergenx2klq7rnd.m3u8" },
  { id: toKebabCase("National Geographic Wild"), title: "National Geographic Wild", description: "Wildlife documentary channel.", category: "Documentary", url: "https://flash1.bogulus.cfd/wild/usergenr9qsi5gt.m3u8" },
  { id: toKebabCase("TVR 3"), title: "TVR 3", description: "Romanian public television channel 3.", category: "General", url: "https://tvr-tvr3.cdn.zitec.com/hls/52eacb03-8342-706f-aa4d-c376055b30fa/streams/v3/play.m3u8" },
  { id: toKebabCase("Viasat Explore"), title: "Viasat Explore", description: "Documentary channel focused on adventure and technology.", category: "Documentary", url: "https://arwen1.panaka.cfd/vexplr/usergenrnd7ke5lgt.m3u8" },
  { id: toKebabCase("Viasat Nature"), title: "Viasat Nature", description: "Documentary channel focused on nature and wildlife.", category: "Documentary", url: "https://arwen1.panaka.cfd/vnature/usergenrnd2g9eqk.m3u8" },
  { id: toKebabCase("Viasat History"), title: "Viasat History", description: "Documentary channel focused on history.", category: "Documentary", url: "https://arwen1.panaka.cfd/vhis/usergenrnd4v6g8eigt.m3u8" },
  { id: toKebabCase("DIGI 24"), title: "DIGI 24", description: "Romanian news channel.", category: "News", url: "https://flash1.bogulus.cfd/news/usergenrk91a4gt.m3u8" },
  { id: toKebabCase("BBC News"), title: "BBC News", description: "International news from the BBC.", category: "News", url: "https://arwen1.panaka.cfd/bibinews/usergenz2b0ekd.m3u8" },
  { id: toKebabCase("B1 TV"), title: "B1 TV", description: "Romanian news and general interest channel.", category: "General", url: "https://saruman1.tharen.cfd/b1/usergenrnd840zwl3m.m3u8" },
];

// === LIST 1: Featured - Selection of Romanian Streams ===
const featuredStreams: Stream[] = [
  allRomanianStreamsData[0], // TVR 1
  allRomanianStreamsData[2], // PRO TV
  allRomanianStreamsData[9], // Antena 3 CNN
  allRomanianStreamsData[14], // DIGI Sport 1
  allRomanianStreamsData[21], // National Geographic
  allRomanianStreamsData[28], // Cartoon Network
  allRomanianStreamsData[37], // Pro Arena
  allRomanianStreamsData[44], // EuroSport 1
];

// All other country-specific streams are now empty arrays as per the new instruction set.
const italianStreams: Stream[] = [];
const frenchStreams: Stream[] = [];
const spanishStreams: Stream[] = [];
const turkishStreams: Stream[] = [];
const maghrebStreams: Stream[] = [];
const middleEastStreams: Stream[] = [];
const greekStreams: Stream[] = [];
const germanStreams: Stream[] = [];
const otherEuropeanStreams: Stream[] = [];
const usaUkGeneralStreams: Stream[] = [];
const caucasianStreams: Stream[] = [];
const kurdishStreams: Stream[] = [];

// Export functions to get the stream lists.
export async function getFeaturedStreams(): Promise<Stream[]> {
  return featuredStreams;
}

// New export function for all Romanian streams
export async function getAllRomanianStreams(): Promise<Stream[]> {
  return allRomanianStreamsData;
}

// All other country-specific getters will return empty arrays
export async function getItalianStreams(): Promise<Stream[]> {
  return italianStreams;
}
export async function getFrenchStreams(): Promise<Stream[]> {
  return frenchStreams;
}
export async function getTurkishStreams(): Promise<Stream[]> {
  return turkishStreams;
}
export async function getSpanishStreams(): Promise<Stream[]> {
  return spanishStreams;
}
export async function getMaghrebStreams(): Promise<Stream[]> {
  return maghrebStreams;
}
export async function getMiddleEastStreams(): Promise<Stream[]> {
  return middleEastStreams;
}
export async function getGreekStreams(): Promise<Stream[]> {
  return greekStreams;
}
export async function getGermanStreams(): Promise<Stream[]> {
  return germanStreams;
}
export async function getOtherEuropeanStreams(): Promise<Stream[]> {
  return otherEuropeanStreams;
}
export async function getUsaUkGeneralStreams(): Promise<Stream[]> {
  return usaUkGeneralStreams;
}
export async function getCaucasianStreams(): Promise<Stream[]> {
  return caucasianStreams;
}
export async function getKurdishStreams(): Promise<Stream[]> {
  return kurdishStreams;
}
