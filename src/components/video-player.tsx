"use client";

import React, { useEffect, useRef } from 'react';
// ===================================================================
// THE FIRST PART OF THE FIX IS HERE: We import the specific type.
// ===================================================================
import videojs, { type VideoJsPlayer } from 'video.js';
import 'video.js/dist/video-js.css';

interface VideoPlayerProps {
  src: string;
}

export const VideoPlayer = ({ src }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLDivElement>(null);
  // ===================================================================
  // THE SECOND PART OF THE FIX IS HERE: We use the correct type.
  // ===================================================================
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
