"use client";

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  src: string;
}

export const VideoPlayer = ({ src }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // --- UX: State to trigger a retry without a full page reload ---
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    setRetryCount(count => count + 1);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Reset state on src change or retry
    setIsLoading(true);
    setError(null);

    const setupHls = () => {
      // --- PERFORMANCE: Enable web workers for smoother playback ---
      const hls = new Hls({
        debug: false,
        enableWorker: true, // Set to true for performance
        // Sensible defaults for live streaming
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 10,
        // Timeouts
        manifestLoadingTimeOut: 20000,
        manifestLoadingMaxRetry: 3,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 4,
      });
      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS: Manifest parsed, starting playback');
        setIsLoading(false);
        video.play().catch(() => console.warn('Autoplay was prevented.'));
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError('Network error, stream might be offline.');
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError('Media error, trying to recover...');
              hls.recoverMediaError(); // Try to recover
              break;
            default:
              setError('Stream playback failed.');
              break;
          }
          setIsLoading(false);
        }
      });
    };
    
    // Clean up previous instance if it exists
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    if (Hls.isSupported()) {
      setupHls();
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video.play().catch(() => console.warn('Autoplay was prevented.'));
      });
    } else {
      setError('HLS is not supported in this browser.');
      setIsLoading(false);
    }

    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
    };
  }, [src, retryCount]); // Re-run effect on src change OR retryCount change

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        playsInline
        muted
        autoPlay
        style={{ objectFit: 'contain' }}
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 pointer-events-none">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading stream...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
          <div className="text-center text-red-400 p-4 rounded-lg bg-background">
            <p className="text-lg mb-4">⚠️ {error}</p>
            <button 
              onClick={handleRetry}
              className="px-4 py-2 bg-primary text-white rounded hover:opacity-80 transition-opacity"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
