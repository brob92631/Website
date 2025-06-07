"use client";

import { useEffect, useRef } from "react";
import Plyr from "plyr-react";
// ===================================================================
// THE FIX IS HERE: This is the correct way to import the CSS file.
// ===================================================================
import "plyr/dist/plyr.css";
// ===================================================================
import Hls from "hls.js";

interface VideoPlayerProps {
  src: string;
}

export function VideoPlayer({ src }: VideoPlayerProps) {
  const ref = useRef<any>(null);

  useEffect(() => {
    const videoElement = ref.current?.plyr.media;
    if (!videoElement) return;

    let hls: Hls;

    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(src);
hls.attachMedia(videoElement);
    } else {
      console.error("HLS is not supported in this browser.");
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src]);

  return (
    <Plyr
      ref={ref}
      source={{ type: "video" }} // Source is set by HLS.js
      options={{
        autoplay: true,
        controls: ['play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
      }}
    />
  );
}
