"use client";

import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

// ===================================================================
// THE FIX IS HERE: We create our own perfect type for the player
// by looking at what the `videojs()` function returns.
// This is the most robust way to do this in modern TypeScript.
// ===================================================================
type VideoJsPlayer = ReturnType<typeof videojs>;

interface VideoPlayerProps {
  src: string;
}

export const VideoPlayer = ({ src }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLDivElement>(null);
  // We now use our new, correctly derived type.
  const playerRef = useRef<VideoJsPlayer | null>(null);

  useEffect(() => {
    // Ensure the player is only initialized once
    if (!playerRef.current && videoRef.current) {
      const videoElement = document.createElement("video-js");
      videoElement.classList.add('vjs-fill');
      videoRef.current.appendChild(videoElement);

      playerRef.current = videojs(videoElement, {
        autoplay: true,
        controls: true,
        responsive: true,
        fluid: true,
        sources: [{
          src: src,
          type: 'application/x-mpegURL'
        }]
      });
    } else {
      // If the player already exists, just update its source
      const player = playerRef.current;
      if (player) {
        player.src({ src: src, type: 'application/x-mpegURL' });
      }
    }
  }, [src]);

  // Cleanup effect to dispose of the player on unmount
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
