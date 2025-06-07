"use client";

import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

// This tells videojs where to find the HLS playback engine
// @ts-ignore
import Hls from 'hls.js';
window.Hls = Hls;

interface VideoPlayerProps {
  src: string;
}

// This is a custom wrapper component for the GOAT player
export const VideoPlayer = ({ src }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current && videoRef.current) {
      const videoElement = document.createElement("video-js");
      videoElement.classList.add('vjs-fill'); // Make it fill the container
      videoRef.current.appendChild(videoElement);

      const player = playerRef.current = videojs(videoElement, {
        autoplay: true,
        controls: true,
        responsive: true,
        fluid: true,
        sources: [{
          src: src,
          type: 'application/x-mpegURL' // This tells it we are playing an HLS stream
        }]
      });
    } else {
        // If the player already exists, just update the source
        const player = playerRef.current;
        player.src({ src: src, type: 'application/x-mpegURL' });
    }
  }, [src]);

  // Special cleanup effect to destroy the player when the component is removed
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
