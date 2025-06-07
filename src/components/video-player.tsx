"use client";
import { useEffect, useRef } from "react"; import Plyr from "plyr-react"; import "plyr-react/dist/plyr.css"; import Hls from "hls.js";
export function VideoPlayer({ src }: { src: string }) {
  const ref = useRef<any>(null);
  useEffect(() => {
    const video = ref.current?.plyr.media; if (!video) return; let hls: Hls;
    if (Hls.isSupported()) { hls = new Hls(); hls.loadSource(src); hls.attachMedia(video); } else { console.error("HLS is not supported"); }
    return () => { if (hls) { hls.destroy(); } };
  }, [src]);
  return ( <Plyr ref={ref} source={{ type: "video" }} options={{ autoplay: true, controls: ['play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'] }} /> );
}
