// /src/lib/iptv.ts

export interface Stream {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
  referer?: string;
  userAgent?: string;
}

const toKebabCase = (str: string) =>
  str.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');

// === LIST 1: Featured - Major Sports & International News ===
const featuredStreams: Stream[] = [
  {
    id: "nba-tv",
    title: "NBA TV",
    description: "The official channel of the NBA.",
    category: "Basketball",
    url: "https://v13.thetvapp.to/hls/NBATV/tracks-v1a1/mono.m3u8?token=l5LXdrvnthAkYhx2IMcXOA&expires=1749416469&user_id=Q2xCRmRWRGpvYkVNMjlBcWJKbW1GN2RyQnVLa25zajlnQWs0WlBkNA==",
  },
  // French Sports (will be populated from the new list below, if selected for featured)
  { id: "lequipe-fr", title: "L'Équipe", description: "French sports news and events.", category: "Sports", url: "https://raw.githubusercontent.com/ipstreet312/freeiptv/master/ressources/dmotion/py/eqpe/equipe.m3u8" }, // Using a more stable known link
  { id: "sport-en-france-fr", title: "Sport en France", description: "French national sports broadcaster.", category: "Sports", url: "https://sp1564435593.mytvchain.info/live/sp1564435593/index.m3u8" },
  // Arabic Sports
  { id: "al-kass-1-qa", title: "Al Kass 1 (Qatar)", description: "Qatari sports channel.", category: "Sports", url: "https://liveakgr.alkassdigital.net/hls/live/2097037/Alkass1muytrdc/master.m3u8" },
  { id: "dubai-sports-1-ae", title: "Dubai Sports 1 (UAE)", description: "UAE sports broadcaster.", category: "Sports", url: "https://dmidspta.cdn.mgmlcdn.com/dubaisports/smil:dubaisports.stream.smil/chunklist.m3u8" },
  { id: "abu-dhabi-sports-1-ae", title: "Abu Dhabi Sports 1", description: "UAE sports channel.", category: "Sports", url: "https://vo-live-media.cdb.cdn.orange.com/Content/Channel/AbuDhabiSportsChannel1/HLS/index.m3u8" },
  // Turkish Sports
  { id: "a-spor-tr", title: "A Spor (Turkey)", description: "Turkish sports channel.", category: "Sports", url: "https://trkvz-live.daioncdn.net/aspor/aspor.m3u8" },
  { id: "trt-spor-tr", title: "TRT Spor (Turkey)", description: "Turkish public sports channel.", category: "Sports", url: "https://tv-trtspor1.medya.trt.com.tr/master.m3u8" },
  // Spanish Sports
  { id: "teledeporte-es", title: "Teledeporte (TDP) (Spain)", description: "Spanish public sports channel.", category: "Sports", url: "https://ztnr.rtve.es/ztnr/1712295.m3u8" },
  { id: "real-madrid-tv-es", title: "Real Madrid TV (Spain)", description: "Official club channel.", category: "Football", url: "https://rmtv-canela.amagi.tv/playlist.m3u8" },
  // Italian Sports
  { id: "supertennis-it", title: "SuperTennis (Italy)", description: "Italian channel dedicated to tennis.", category: "Tennis", url: "https://live-embed.supertennix.hiway.media/restreamer/supertennix_client/gpu-a-c0-16/restreamer/rtmp/hls/h24_supertennix/manifest.m3u8" },
  { id: "sportitalia-it", title: "Sportitalia (Italy)", description: "Italian sports channel.", category: "Sports", url: "https://di-kzbhv8pw.vo.lswcdn.net/sportitalia/sihd/playlist.m3u8" },
  // International News
  { id: "cnn-international", title: "CNN International", description: "Global news coverage.", category: "News", url: "https://turnerlive.warnermediacdn.com/hls/live/586497/cnngo/cnni/VIDEO_0_3564000.m3u8" },
  { id: "bbc-news-world", title: "BBC News", description: "British international news.", category: "News", url: "https://vs-hls-push-ww-live.akamaized.net/x=4/i=urn:bbc:pips:service:bbc_news_channel_hd/pc_hd_abr_v2.m3u8" },
  { id: "al-jazeera-english", title: "Al Jazeera English", description: "International news from Qatar.", category: "News", url: "https://live-hls-web-aje.getaj.net/AJE/master.m3u8" },
  { id: "france-24-english", title: "France 24 (English)", description: "International news from France.", category: "News", url: "https://live.france24.com/hls/live/2037218/F24_EN_HI_HLS/master_5000.m3u8" },
  { id: "euronews-english", title: "Euronews (English)", description: "Pan-European news.", category: "News", url: "https://euronews-live-eng-uk.fast.rakuten.tv/v1/master/0547f18649bd788bec7b67b746e47670f558b6b2/production-LiveChannel-6503/bitok/e/26031/euronews-en.m3u8" },
  { id: "dw-english", title: "DW English (Germany)", description: "German international broadcaster.", category: "News", url: "https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8" },
  { id: "sky-news-uk", title: "Sky News (UK)", description: "British news channel.", category: "News", url: "https://linear417-gb-hls1-prd-ak.cdn.skycdp.com/100e/Content/HLS_001_1080_30/Live/channel(skynews)/index_1080-30.m3u8" },
];

// === Italian Channels ===
const italianStreams: Stream[] = [
  { id: "la7-it", title: "LA7", description: "Private Italian Channel", category: "General", url: "https://d3749synfikwkv.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-74ylxpgd78bpb/Live.m3u8" },
  { id: "rai-news-24-it", title: "Rai News 24", description: "Italian 24/7 news channel.", category: "News", url: "https://rainews2-live.akamaized.net/hls/live/598327/rainews2/rainews2/playlist.m3u8" },
  { id: "rai-3-it", title: "Rai 3", description: "Italian public broadcaster.", category: "General", url: "https://wzstreaming.rai.it/TVlive/smil:liveStream.smil/playlist.m3u8"},
  { id: "rai-italia-it", title: "Rai Italia", description: "Italian international channel.", category: "General", url: "https://ilglobotv-live.akamaized.net/channels/RAIItaliaSudAfrica/Live.m3u8"},
  { id: "class-cnbc-it", title: "Class CNBC", description: "Italian financial news.", category: "Business", url: "https://859c1818ed614cc5b0047439470927b0.msvdn.net/live/S57048752/8raQqCXozN1H/playlist.m3u8"},
  { id: "radio-italia-tv-it", title: "Radio Italia TV", description: "Italian music television.", category: "Music", url: "https://radioitaliatv.akamaized.net/hls/live/2093117/RadioitaliaTV/master.m3u8" },
  { id: "euronews-it", title: "Euronews (Italian)", description: "Pan-European news.", category: "News", url: "https://euronews-live-ita-it.fast.rakuten.tv/v1/master/0547f18649bd788bec7b67b746e47670f558b6b2/production-LiveChannel-6570/bitok/e/25674/euronews-it.m3u8" },
  { id: toKebabCase("Deejay TV IT"), title: "Deejay TV", description: "Music and entertainment.", category: "Music", url: "https://4c4b867c89244861ac216426883d1ad0.msvdn.net/live/S85984808/sMO0tz9Sr2Rk/playlist.m3u8" },
  { id: toKebabCase("RTL 102.5 IT"), title: "RTL 102.5", description: "Music and entertainment.", category: "Music", url: "https://dd782ed59e2a4e86aabf6fc508674b59.msvdn.net/live/S97044836/tbbP8T1ZRPBL/playlist_video.m3u8" },
];

// === French (+ FR-speaking BE, CH, CA) Channels ===
const frenchStreams: Stream[] = [
  // National & General
  { id: toKebabCase("TF1 FR (Paradise)"), title: "TF1", description: "Major French national channel.", category: "General", url: "https://raw.githubusercontent.com/Paradise-91/ParaTV/main/streams/tf1plus/tf1.m3u8" },
  { id: toKebabCase("France 2 FR (Paradise)"), title: "France 2", description: "Main French public channel.", category: "General", url: "https://raw.githubusercontent.com/Paradise-91/ParaTV/main/streams/francetv/france2.m3u8" },
  { id: toKebabCase("France 3 FR (Paradise)"), title: "France 3", description: "French regional public channel.", category: "General", url: "https://raw.githubusercontent.com/Paradise-91/ParaTV/main/streams/francetv/france3.m3u8" },
  { id: toKebabCase("France 5 FR (Paradise)"), title: "France 5", description: "French public educational channel.", category: "Education", url: "https://raw.githubusercontent.com/Paradise-91/ParaTV/main/streams/francetv/france5.m3u8" },
  { id: toKebabCase("Arte FR (Akamai)"), title: "Arte", description: "European culture channel (French).", category: "Culture", url: "https://artesimulcast.akamaized.net/hls/live/2031003/artelive_fr/index.m3u8" },
  { id: toKebabCase("W9 FR (Bozztv)"), title: "W9", description: "French music and entertainment channel.", category: "Entertainment", url: "https://live20.bozztv.com/dvrfl06/astv/astv-w9tv/index.m3u8" },
  { id: toKebabCase("TMC FR (Paradise)"), title: "TMC", description: "French general entertainment channel.", category: "Entertainment", url: "https://raw.githubusercontent.com/Paradise-91/ParaTV/main/streams/tf1plus/tmc.m3u8" },
  { id: toKebabCase("TV5Monde FBSM"), title: "TV5Monde FBSM", description: "International Francophone channel.", category: "General", url: "https://ott.tv5monde.com/Content/HLS/Live/channel(fbs)/variant.m3u8" },

  // News
  { id: toKebabCase("BFM TV FR (NextRadioTV)"), title: "BFM TV", description: "French 24/7 news channel.", category: "News", url: "https://live-cdn-stream-euw1.bfmtv.bct.nextradiotv.com/master.m3u8" },
  { id: toKebabCase("CNews FR (Bryan)"), title: "CNews", description: "French news channel.", category: "News", url: "https://raw.githubusercontent.com/LeBazarDeBryan/XTVZ_/main/Stream/Live/CNews.m3u8" },
  { id: toKebabCase("LCI FR (ipstreet312)"), title: "LCI", description: "French news channel.", category: "News", url: "https://raw.githubusercontent.com/ipstreet312/freeiptv/master/ressources/btv/py/lci1.m3u8" },
  { id: toKebabCase("France 24 FR (Official)"), title: "France 24 (French)", description: "International news in French.", category: "News", url: "https://live.france24.com/hls/live/2037179/F24_FR_HI_HLS/master_5000.m3u8" }, // Picked 1080p

  // Sports
  { id: toKebabCase("L'Équipe FR (ipstreet312)"), title: "L'Équipe", description: "French sports news and events.", category: "Sports", url: "https://raw.githubusercontent.com/ipstreet312/freeiptv/master/ressources/dmotion/py/eqpe/equipe.m3u8" },
  { id: toKebabCase("Sport en France FR (MyTVChain)"), title: "Sport en France", description: "French national sports broadcaster.", category: "Sports", url: "https://sp1564435593.mytvchain.info/live/sp1564435593/index.m3u8" }, // Picked 1080p from list
  { id: toKebabCase("Equidia FR (Paradise)"), title: "Equidia", description: "Equestrian sports.", category: "Sports", url: "https://raw.githubusercontent.com/Paradise-91/ParaTV/main/streams/equidia/live2.m3u8" },

  // Documentary
  { id: toKebabCase("RMC Découverte FR (Cloudfront)"), title: "RMC Découverte", description: "French documentary channel.", category: "Documentary", url: "https://d2mt8for1pddy4.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-6uronj7gzvy4j/index.m3u8" },
  { id: toKebabCase("RMC Story FR (Cloudfront)"), title: "RMC Story", description: "French factual and documentary channel.", category: "Documentary", url: "https://d36bxc1bknkxrk.cloudfront.net/v1/master/3722c60a815c199d9c0ef36c5b73da68a62b09d1/cc-3ewcp19zjaxpt/index.m3u8" },
  { id: toKebabCase("National Geographic FR (Bozztv)"), title: "National Geographic", description: "Nature and science documentaries.", category: "Documentary", url: "https://live20.bozztv.com/dvrfl06/astv/astv-natgeofr/index.m3u8" },

  // Kids
  { id: toKebabCase("TiVi5Monde (Official)"), title: "TiVi5Monde", description: "Kids Francophone channel.", category: "Kids", url: "https://ott.tv5monde.com/Content/HLS/Live/channel(tivi5)/variant.m3u8" },
  // Many other kids channels (Gulli, Disney etc.) from previous list were from 2hubs, now removed
];


// === Spanish Channels ===
const spanishStreams: Stream[] = [
    { id: toKebabCase("TVE Internacional ES"), title: "TVE Internacional", description: "International Spanish public channel.", category: "General", url: "https://rtvelivestream-rtveplayplus.rtve.es/rtvesec/int/tvei_eu_main_720.m3u8" },
    { id: toKebabCase("TVE La 1 ES"), title: "TVE La 1", description: "Main public channel.", category: "General", url: "https://ztnr.rtve.es/ztnr/1688877.m3u8" },
    { id: toKebabCase("TVE 24 H ES"), title: "TVE 24 H", description: "24/7 news channel.", category: "News", url: "https://ztnr.rtve.es/ztnr/1694255.m3u8" },
    { id: toKebabCase("Antena 3 ES"), title: "Antena 3", description: "Private general channel.", category: "General", url: "https://tvnoov.com/fadoo/antena3.m3u8" },
    { id: toKebabCase("Cuatro ES"), title: "Cuatro", description: "Private general channel.", category: "General", url: "https://tvnoov.com/fadoo/cuatrohd.m3u8" },
    { id: toKebabCase("Telecinco ES"), title: "Telecinco", description: "Private general channel.", category: "General", url: "https://tvnoov.com/fadoo/telecincohd.m3u8" },
    { id: toKebabCase("La Sexta ES"), title: "La Sexta", description: "Private general channel.", category: "General", url: "https://tvnoov.com/fadoo/lasexta.m3u8" },
    { id: toKebabCase("Euronews ES"), title: "Euronews (Spanish)", description: "Pan-European news.", category: "News", url: "https://euronews-live-spa-es.fast.rakuten.tv/v1/master/0547f18649bd788bec7b67b746e47670f558b6b2/production-LiveChannel-6571/bitok/e/26034/euronews-es.m3u8" },
    { id: toKebabCase("Trece ES"), title: "TRECE", description: "Generalist channel.", category: "General", url: "https://play.cdn.enetres.net/091DB7AFBD77442B9BA2F141DCC182F5021/021/playlist.m3u8" },
    { id: toKebabCase("France 24 ES"), title: "France 24 (Spanish)", description: "International news.", category: "News", url: "https://live.france24.com/hls/live/2037220/F24_ES_HI_HLS/master_5000.m3u8" },
    { id: toKebabCase("DW Español"), title: "DW Español", description: "German international broadcaster.", category: "News", url: "https://dwamdstream104.akamaized.net/hls/live/2015530/dwstream104/index.m3u8" },
];

// === Turkish Channels ===
const turkishStreams: Stream[] = [
    { id: toKebabCase("TRT 1 TR"), title: "TRT 1", description: "Main public channel.", category: "General", url: "https://tv-trt1.medya.trt.com.tr/master.m3u8" },
    { id: toKebabCase("TRT Haber TR"), title: "TRT Haber", description: "Public news channel.", category: "News", url: "https://tv-trthaber.medya.trt.com.tr/master.m3u8" },
    { id: toKebabCase("TRT Spor TR"), title: "TRT Spor", description: "Public sports channel.", category: "Sports", url: "https://tv-trtspor1.medya.trt.com.tr/master.m3u8" },
    { id: toKebabCase("Kanal D TR"), title: "Kanal D", description: "Major private channel.", category: "General", url: "https://demiroren-live.daioncdn.net/kanald/kanald.m3u8" },
    { id: toKebabCase("Show TV TR"), title: "Show TV", description: "Major private channel.", category: "General", url: "https://ciner-live.daioncdn.net/showtv/showtv.m3u8" },
    { id: toKebabCase("NOW TR"), title: "NOW", description: "Private channel (formerly Fox).", category: "General", url: "https://nowtv.daioncdn.net/nowtv/nowtv.m3u8?st=S-2GH8a8n1xcZmJls2vkww&e=1749410174" },
    { id: toKebabCase("TV8 TR"), title: "TV8", description: "Entertainment channel.", category: "Entertainment", url: "https://tv8.daioncdn.net/tv8/tv8.m3u8?app=7ddc255a-ef47-4e81-ab14-c0e5f2949788" },
    { id: toKebabCase("ATV TR"), title: "ATV", description: "Major private channel.", category: "General", url: "https://rnttwmjcin.turknet.ercdn.net/lcpmvefbyo/atv/atv_480p.m3u8" },
    { id: toKebabCase("HaberTürk"), title: "HaberTürk", description: "News channel.", category: "News", url: "https://ciner-live.daioncdn.net/haberturktv/haberturktv.m3u8" },
    { id: toKebabCase("CNN Türk"), title: "CNN Türk", description: "Turkish news channel.", category: "News", url: "https://b.fulltvizle.com/cnn/playlist.m3u8" },
    { id: toKebabCase("A Haber TR"), title: "A Haber", description: "News channel.", category: "News", url: "https://trkvz-live.ercdn.net/ahaberhd/ahaberhd.m3u8" },
    { id: toKebabCase("TRT Belgesel"), title: "TRT Belgesel", description: "Documentary channel.", category: "Documentary", url: "https://tv-trtbelgesel-dai.medya.trt.com.tr/master.m3u8" },
    { id: toKebabCase("TRT Çocuk"), title: "TRT Çocuk", description: "Kids channel.", category: "Kids", url: "https://tv-trtcocuk.medya.trt.com.tr/master.m3u8" },
    { id: toKebabCase("TRT Müzik"), title: "TRT Müzik", description: "Music channel.", category: "Music", url: "https://tv-trtmuzik.medya.trt.com.tr/master.m3u8" },
    { id: toKebabCase("TRT Kurdî"), title: "TRT Kurdî", description: "Kurdish language channel.", category: "General", url: "https://tv-trtkurdi.medya.trt.com.tr/master.m3u8" },
];

// === Maghreb (Morocco, Algeria, Tunisia) ===
const maghrebStreams: Stream[] = [
    { id: toKebabCase("Al Aoula Inter MA"), title: "Al Aoula Inter (Morocco)", description: "Moroccan public TV.", category: "General", url: "https://cdn.live.easybroadcast.io/ts_corp/73_aloula_w1dqfwm/playlist_dvr.m3u8", userAgent: "ExoPlayer", referer: "https://snrtlive.ma/" },
    { id: toKebabCase("2M Monde MA"), title: "2M Monde (Morocco)", description: "Moroccan general TV.", category: "General", url: "https://cdn-globecast.akamaized.net/live/eds/2m_monde/hls_video_ts_tuhawxpiemz257adfc/2m_monde.m3u8", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0", referer: "https://2m.ma" },
    { id: toKebabCase("Arryadia MA"), title: "Arryadia (Morocco)", description: "Moroccan sports channel.", category: "Sports", url: "https://cdn.live.easybroadcast.io/ts_corp/73_arryadia_k2tgcj0/playlist_dvr.m3u8", userAgent: "ExoPlayer", referer: "https://snrtlive.ma/" },
    { id: toKebabCase("Medi 1 TV Maghreb"), title: "Medi 1 TV (Maghreb)", description: "Pan-Maghreb news and general.", category: "General", url: "https://streaming1.medi1tv.com/live/smil:medi1tv.smil/playlist.m3u8" },
    { id: toKebabCase("Watania 1 TN"), title: "Watania 1 (Tunisia)", description: "Tunisian public TV.", category: "General", url: "http://live.watania1.tn:1935/live/watanya1.stream/playlist.m3u8" },
    { id: toKebabCase("Nessma TV TN"), title: "Nessma TV (Tunisia)", description: "Tunisian private channel.", category: "General", url: "https://edge66.magictvbox.com/liveApple/nessma/index.m3u8" },
    { id: toKebabCase("TV2 Algérie DZ"), title: "TV2 Algérie", description: "Algerian public channel.", category: "General", url: "http://69.64.57.208/canalalgerie/playlist.m3u8" },
    { id: toKebabCase("Echorouk TV DZ"), title: "Echorouk TV (Algeria)", description: "Algerian private channel.", category: "General", url: "https://hls-distrib-rlb1.dzsecurity.net/live/EchoroukTV/playlist.m3u8?e=&token=" },
];

// === Middle East (General Arabic, UAE, Saudi, Qatar etc.) ===
const middleEastStreams: Stream[] = [
    { id: toKebabCase("Al Arabiya ME"), title: "Al Arabiya", description: "Saudi-owned news channel.", category: "News", url: "https://live.alarabiya.net/alarabiapublish/alarabiya.smil/playlist.m3u8" },
    { id: toKebabCase("Al Jazeera Arabic ME"), title: "Al Jazeera (Arabic)", description: "Qatari news channel.", category: "News", url: "http://live-hls-web-aja.getaj.net/AJA/index.m3u8" },
    { id: toKebabCase("Sky News Arabia ME"), title: "Sky News Arabia", description: "UAE-based news channel.", category: "News", url: "https://stream.skynewsarabia.com/hls/sna.m3u8" },
    { id: toKebabCase("MBC 1 ME"), title: "MBC 1", description: "Pan-Arab general entertainment.", category: "General", url: "https://shls-mbc1na-prod-dub.shahid.net/out/v1/84ab37e99d6e4b16b33c6600f94f6ccb/index.m3u8" },
    { id: toKebabCase("Dubai TV AE"), title: "Dubai TV (UAE)", description: "UAE general channel.", category: "General", url: "https://dmieigthvllta.cdn.mgmlcdn.com/dubaitvht/smil:dubaitv.stream.smil/index.m3u8" },
    { id: toKebabCase("Abu Dhabi TV AE"), title: "Abu Dhabi TV (UAE)", description: "UAE general channel.", category: "General", url: "https://vo-live.cdb.cdn.orange.com/Content/Channel/AbuDhabiChannel/HLS/index.m3u8" },
    { id: toKebabCase("Qatar TV QA"), title: "Qatar TV", description: "Qatari public channel.", category: "General", url: "https://qatartv.akamaized.net/hls/live/2026573/qtv1/master.m3u8" },
    { id: toKebabCase("Saudi TV Channel 1 SA"), title: "Saudi TV Channel 1", description: "Saudi public channel.", category: "General", url: "https://shls-masr2-ak.akamaized.net/out/v1/5ae66b453b62403199811ab78da9982a/index.m3u8" },
    { id: toKebabCase("Sharjah TV AE"), title: "Sharjah TV (UAE)", description: "UAE channel from Sharjah.", category: "General", url: "https://svs.itworkscdn.net/smc1live/smc1.smil/playlist.m3u8" },
    { id: toKebabCase("Bahrain TV BH"), title: "Bahrain TV", description: "Bahraini public channel.", category: "General", url: "https://5c7b683162943.streamlock.net/live/ngrp:bahraintvmain_all/playlist.m3u8" },
    { id: toKebabCase("Oman TV OM"), title: "Oman TV", description: "Omani public channel.", category: "General", url: "https://partneta.cdn.mgmlcdn.com/omantv/smil:omantv.stream.smil/chunklist.m3u8" },
    { id: toKebabCase("Kuwait TV 1 KW"), title: "Kuwait TV 1", description: "Kuwaiti public channel.", category: "General", url: "https://kwtktv1ta.cdn.mangomolo.com/ktv1/smil:ktv1.stream.smil/chunklist.m3u8" },
    { id: toKebabCase("MBC Drama ME"), title: "MBC Drama", description: "Pan-Arab drama series.", category: "Entertainment", url: "https://mbc1-enc.edgenextcdn.net/out/v1/b0b3a0e6750d4408bb86d703d5feffd1/index.m3u8" },
    { id: toKebabCase("Rotana Cinema KSA"), title: "Rotana Cinema KSA", description: "Saudi movie channel.", category: "Movies", url: "https://bcovlive-a.akamaihd.net/9527a892aeaf43019fd9eeb77ad1516e/eu-central-1/6057955906001/playlist.m3u8" },
];

// === Greek Channels ===
const greekStreams: Stream[] = [
    { id: toKebabCase("ERT World GR"), title: "ERT World", description: "Greek international channel.", category: "General", url: "https://ertflix.akamaized.net/ertlive/ertworld/default/playlist.m3u8" },
    { id: toKebabCase("ERT News GR"), title: "ERT News", description: "Greek public news.", category: "News", url: "https://ertflix.akamaized.net/ertlive/ertnews/default/playlist.m3u8" },
    { id: toKebabCase("ERT 1 GR"), title: "ERT 1", description: "Main Greek public channel.", category: "General", url: "https://ertflix.akamaized.net/ertlive/ert1/clrdef24723b/playlist.m3u8" },
    { id: toKebabCase("ERT Sports 1 GR"), title: "ERT Sports 1", description: "Greek public sports channel.", category: "Sports", url: "https://ertflix.akamaized.net/ertlive/ertsports1/clrdef24724a/playlist.m3u8" },
    { id: toKebabCase("Alpha TV GR"), title: "Alpha TV", description: "Greek private channel.", category: "General", url: "https://alphatvlive2.siliconweb.com/alphatvlive/live_abr/playlist.m3u8" },
    { id: toKebabCase("ANT1 GR"), title: "ANT1", description: "Greek private channel.", category: "General", url: "http://l2.cloudskep.com/ant1cm2/abr/playlist.m3u8" },
    { id: toKebabCase("Skai TV GR"), title: "Skai TV", description: "Greek private channel.", category: "General", url: "https://skai-live.siliconweb.com/media/cambria4/index.m3u8" },
    { id: toKebabCase("Star Channel GR"), title: "Star Channel", description: "Greek private channel.", category: "General", url: "https://livestar.siliconweb.com/starvod/star_int/star_int.m3u8" },
    { id: toKebabCase("Mega TV GR"), title: "Mega TV", description: "Greek private channel.", category: "General", url: "http://c98db5952cb54b358365984178fb898a.msvdn.net/live/S14373792/aGr5KG7RcZ9a/playlist.m3u8" },
];

// === German Channels ===
const germanStreams: Stream[] = [
    { id: toKebabCase("Das Erste DE"), title: "Das Erste", description: "Main German public channel.", category: "General", url: "https://mcdn.daserste.de/daserste/de/master.m3u8" },
    { id: toKebabCase("Tagesschau24 DE"), title: "Tagesschau24", description: "German news channel.", category: "News", url: "https://tagesschau.akamaized.net/hls/live/2020115/tagesschau/tagesschau_1/master.m3u8" },
    { id: toKebabCase("Arte DE"), title: "ARTE (German)", description: "European culture channel.", category: "Culture", url: "https://artesimulcast.akamaized.net/hls/live/2030993/artelive_de/index.m3u8" },
    { id: toKebabCase("Euronews DE"), title: "Euronews (German)", description: "Pan-European news.", category: "News", url: "https://euronews-live-deu-de.fast.rakuten.tv/v1/master/0547f18649bd788bec7b67b746e47670f558b6b2/production-LiveChannel-6567/bitok/e/26033/euronews-de.m3u8" },
    { id: toKebabCase("RTL DE"), title: "RTL Germany", description: "Major German private channel.", category: "General", url: "https://ma.anixa.tv/clips/stream/rtl/index.m3u8" },
    { id: toKebabCase("WDR DE"), title: "WDR", description: "German regional public channel.", category: "General", url: "https://mcdn.wdr.de/wdr/wdrfs/de/master.m3u8" },
];

// === Other European Channels (Portugal, Balkan, Poland, Romania, etc.) ===
const otherEuropeanStreams: Stream[] = [
    // Portugal
    { id: toKebabCase("RTP Internacional PT"), title: "RTP Internacional (Portugal)", description: "Portuguese international channel.", category: "General", url: "https://streaming-live.rtp.pt/liverepeater/smil:rtpi.smil/playlist.m3u8", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0", referer: "https://www.rtp.pt/play/direto/rtpinternacional" },
    { id: toKebabCase("RTP 1 PT"), title: "RTP 1 (Portugal)", description: "Portuguese main public channel.", category: "General", url: "https://streaming-live.rtp.pt/liverepeater/smil:rtpClean1HD.smil/playlist.m3u8", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0", referer: "https://www.rtp.pt/play/direto/rtp1" },
    { id: toKebabCase("RTP 3 PT"), title: "RTP 3 (Portugal)", description: "Portuguese news channel.", category: "News", url: "https://streaming-live.rtp.pt/liverepeater/rtpnHD.smil/playlist.m3u8", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/133.0.0.0", referer: "https://www.rtp.pt/play/direto/rtp3" },
    { id: toKebabCase("SIC PT"), title: "SIC (Portugal)", description: "Portuguese private channel.", category: "General", url: "https://d1zx6l1dn8vaj5.cloudfront.net/out/v1/b89cc37caa6d418eb423cf092a2ef970/index.m3u8" },
    { id: toKebabCase("CNN Portugal"), title: "CNN Portugal", description: "Portuguese news channel.", category: "News", url: "https://video-auth7.iol.pt/edge_servers/cnn-720p/playlist.m3u8" },
    // Balkan (Croatia, Serbia, Bosnia)
    { id: toKebabCase("HRT 1 HR"), title: "HRT 1 (Croatia)", description: "Croatian public channel.", category: "General", url: "https://webtvstream.bhtelecom.ba/hrt1.m3u8" },
    { id: toKebabCase("RTS 1 RS"), title: "RTS 1 (Serbia)", description: "Serbian public channel.", category: "General", url: "https://webtvstream.bhtelecom.ba/rts1.m3u8" },
    { id: toKebabCase("Al Jazeera Balkans"), title: "Al Jazeera Balkans", description: "News for Balkan region.", category: "News", url: "https://live-hls-web-ajb.getaj.net/AJB/index.m3u8" },
    { id: toKebabCase("N1 HRV"), title: "N1 Croatia", description: "News channel for Croatia.", category: "News", url: "https://best-str.umn.cdn.united.cloud/stream?stream=sp1400&sp=n1info&channel=n1hrv&u=n1info&p=n1Sh4redSecre7iNf0&player=m3u8" },
    // Poland
    { id: toKebabCase("TVP Polonia PL"), title: "TVP Polonia (Poland)", description: "Polish international channel.", category: "General", url: "https://raw.githubusercontent.com/ipstreet312/freeiptv/refs/heads/master/ressources/wld/tvpol.m3u8" },
    { id: toKebabCase("TVP Info PL"), title: "TVP Info (Poland)", description: "Polish news channel.", category: "News", url: "https://raw.githubusercontent.com/fraudiay79/strm/refs/heads/main/platforms/links/tvpinfo.m3u8" },
    { id: toKebabCase("Polsat News PL"), title: "Polsat News (Poland)", description: "Polish news channel.", category: "News", url: "http://cdn-s-lb2.pluscdn.pl/lv/1517830/349/hls/f03a76f3/masterlist.m3u8" },
    // Romania
    { id: toKebabCase("TVR International RO"), title: "TVR International (Romania)", description: "Romanian international channel.", category: "General", url: "https://tvr-tvri.cdn.zitec.com/live/tvri/main.m3u8" },
    { id: toKebabCase("Antena 1 RO"), title: "Antena 1 (Romania)", description: "Romanian private channel.", category: "General", url: "https://live1ag.antenaplay.ro/live_a1ro/live_a1ro.m3u8" },
    { id: toKebabCase("Kanal D RO"), title: "Kanal D (Romania)", description: "Romanian private channel.", category: "General", url: "https://stream1.kanald.ro/iphone/knd-live.m3u8" },
    // Other European
    { id: toKebabCase("RTL LU"), title: "RTL (Luxembourg)", description: "Luxembourgish channel.", category: "General", url: "https://live-edge.rtl.lu/channel1/smil:channel1/playlist.m3u8" },
    { id: toKebabCase("YLE TV World FI"), title: "YLE TV World (Finland)", description: "Finnish international channel.", category: "General", url: "https://yletvworld.akamaized.net/hls/live/622540/yletv1w/index.m3u8" },
];

// === USA/UK General & Other International ===
const usaUkGeneralStreams: Stream[] = [
    { id: toKebabCase("Bloomberg US"), title: "Bloomberg TV (US)", description: "US financial news.", category: "Business", url: "https://www.bloomberg.com/media-manifest/streams/us-event.m3u8" },
    { id: toKebabCase("Court TV US"), title: "Court TV", description: "US legal news & trials.", category: "News", url: "https://content.uplynk.com/channel/6c0bd0f94b1d4526a98676e9699a10ef.m3u8" },
    { id: toKebabCase("CSPAN US"), title: "C-SPAN", description: "US public affairs.", category: "News", url: "http://fl2.moveonjoy.com/C-SPAN/index.m3u8" },
    { id: toKebabCase("Fox News US"), title: "Fox News", description: "US news channel.", category: "News", url: "https://fox-foxnewsnow-samsungus.amagi.tv/playlist.m3u8" },
    { id: toKebabCase("ABC News Australia"), title: "ABC News (Australia)", description: "Australian news channel.", category: "News", url: "https://abc-iview-mediapackagestreams-2.akamaized.net/out/v1/6e1cc6d25ec0480ea099a5399d73bc4b/index.m3u8" },
    { id: toKebabCase("NHK World Japan"), title: "NHK World (Japan)", description: "Japanese international broadcaster.", category: "News", url: "https://nhkwlive-ojp.nhkworld.jp/hls/live/2003459/nhkwlive-ojp-en/index.m3u8" },
    { id: toKebabCase("TRT World"), title: "TRT World (Turkey)", description: "Turkish international news in English.", category: "News", url: "https://tv-trtworld.medya.trt.com.tr/master.m3u8" },
    { id: toKebabCase("CGTN News"), title: "CGTN News (China)", description: "Chinese international news in English.", category: "News", url: "https://news.cgtn.com/resource/live/english/cgtn-news.m3u8" },
    { id: toKebabCase("Deluxe Music English"), title: "Deluxe Music (English)", description: "International music channel.", category: "Music", url: "https://sdn-global-live-streaming-packager-cache.3qsdn.com/13456/13456_264_live.m3u8" },
];

// === Caucasian (Georgia, Armenia, Azerbaijan) ===
const caucasianStreams: Stream[] = [
    { id: toKebabCase("GPB 1TV GE"), title: "GPB 1TV (Georgia)", description: "Georgian public channel.", category: "General", url: "https://tv.cdn.xsg.ge/gpb-1tv/index.m3u8" },
    { id: toKebabCase("Imedi TV GE"), title: "Imedi TV (Georgia)", description: "Georgian private channel.", category: "General", url: "https://tv.cdn.xsg.ge/imedihd/index.m3u8" },
    { id: toKebabCase("Rustavi 2 GE"), title: "Rustavi 2 (Georgia)", description: "Georgian private channel.", category: "General", url: "https://dvrfl05.tulix.tv/gin-rustavi2/index.m3u8" },
    { id: toKebabCase("H1 ARM"), title: "H1 (Armenia)", description: "Armenian public channel.", category: "General", url: "https://amtv.tulixcdn.com/amtv2/am2abr/index.m3u8" },
    { id: toKebabCase("AZ TV AZ"), title: "AZ TV (Azerbaijan)", description: "Azerbaijani public channel.", category: "General", url: "http://str.yodacdn.net/aztv/index.m3u8" },
];

// === KURDISH CHANNELS ===
const kurdishStreams: Stream[] = [
    { id: toKebabCase("ZAROK KURMANÎ"), title: "ZAROK KURMANÎ", description: "Kurdish kids channel.", category: "Kids", url: "https://zindikurmanci.zaroktv.com.tr/hls/stream.m3u8"},
    { id: toKebabCase("TRT KURDÎ"), title: "TRT KURDÎ", description: "Turkish state Kurdish channel.", category: "General", url: "https://tv-trtkurdi.medya.trt.com.tr/master.m3u8"},
    { id: toKebabCase("RÛDAW TV"), title: "RÛDAW TV", description: "Kurdish news channel.", category: "News", url: "https://svs.itworkscdn.net/rudawlive/rudawlive.smil/playlist.m3u8"},
    { id: toKebabCase("KURDISTAN 24"), title: "KURDISTAN 24", description: "Kurdish news channel.", category: "News", url: "https://d1x82nydcxndze.cloudfront.net/live/index.m3u8"},
    { id: toKebabCase("KURDSAT"), title: "KURDSAT", description: "Kurdish general channel.", category: "General", url: "https://kurdsat.akamaized.net/hls/kurdsat.m3u8"},
];


// Export functions to get the stream lists.
export async function getFeaturedStreams(): Promise<Stream[]> {
  return featuredStreams;
}
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
