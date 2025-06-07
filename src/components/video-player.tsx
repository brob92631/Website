"use client";

import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

// This is a type definition for Video.js options to keep TypeScript happy.
interface VideoJsPlayerOptions {
  autoplay: boolean;
  controls: boolean;
  responsive: boolean;
  fluid: boolean;
  sources: {
    src: string;
    type: string;
  }[];
  // THE FIX IS HERE: We tell Video.js how to handle HLS (the .m3u8 format)
  html5: {
    hls: {
      overrideNative: boolean;
    };
  };
}

interface VideoPlayerProps {
  src: string;
}

export const VideoPlayer = ({ src }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  const options: VideoJsPlayerOptions = {
    autoplay: true,
    controls: true,
    responsive: true,
    fluid: true,
    sources: [{
      src: src,
      type: 'application/x-mpegURL'
    }],
    html5: {
      hls: {
        overrideNative: true,
      }
    }
  };

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current && videoRef.current) {
      const videoElement = document.createElement("video-js");
      videoElement.classList.add('vjs-fill');
      videoRef.current.appendChild(videoElement);

      // We import Hls.js here, only when the component mounts in the browser
      require('hls.js');
      require('videojs-hls-source-handler');
      
      playerRef.current = videojs(videoElement, options);
    } else {
      // If the player already exists, just update the source
      const player = playerRef.current;
      if (player) {
        player.src({ src: src, type: 'application/x-mpegURL' });
      }
    }
  }, [src]); // We remove `options` from dependency array as it's stable

  // Special cleanup effect
  useEffect(() => {
    const player = playerRef.current;
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div data-vjs-player>
      <div ref={videoRef} />
    </div>
  );
};
