"use client";

import { useEffect, useRef } from "react";
import Plyr from "plyr-react";
import "plyr/dist/plyr.css"; // This import is correct
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
      // ===================================================================
      // THE FINAL FIX IS HERE: We add an empty sources array to satisfy TypeScript.
      // ===================================================================
      source={{ type: "video", sources: [] }}
      // ===================================================================
      options={{
        autoplay: true,
        controls: ['play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
      }}
    />
  );
}
