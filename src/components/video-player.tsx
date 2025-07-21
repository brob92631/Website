"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { Play, RotateCcw, Volume2, VolumeX, Maximize2, Minimize2, Pause } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
}

export const VideoPlayer = ({ src }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showControls, setShowControls] = useState(true);

  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  }, [isPlaying]);

  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setRetryCount(count => count + 1);
  }, []);

  const handlePlayPause = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (video.paused) {
        await video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    } catch (err) {
      console.warn('Play/pause failed:', err);
    }
  }, []);

  const handleMuteToggle = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const handleFullscreenToggle = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setError(null);
    setIsPlaying(false);

    const setupHls = () => {
      const hls = new Hls({
        debug: false,
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        if (video.paused) {
          video.play().catch(() => console.warn('Autoplay was prevented.'));
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', { type: data.type, details: data.details, fatal: data.fatal });
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError('Network error. The stream may be offline or blocked.');
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError('Media error. Attempting to recover...');
              hls.recoverMediaError();
              break;
            default:
              setError('A playback error occurred. Please try again.');
              break;
          }
          setIsLoading(false);
        }
      });
    };

    if (hlsRef.current) hlsRef.current.destroy();

    if (Hls.isSupported()) {
      setupHls();
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video.play().catch(() => console.warn('Autoplay was prevented.'));
      });
    } else {
      setError('HLS streaming is not supported in your browser.');
      setIsLoading(false);
    }

    const onWaiting = () => setIsLoading(true);
    const onPlaying = () => { setIsLoading(false); setIsPlaying(true); setError(null); };
    const onPause = () => setIsPlaying(false);

    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('pause', onPause);

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('pause', onPause);
    };
  }, [src, retryCount]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black group"
      onMouseMove={resetControlsTimeout}
      onMouseEnter={resetControlsTimeout}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        playsInline
        muted={isMuted}
        onClick={handlePlayPause}
        style={{ objectFit: 'contain' }}
      />
      
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="w-10 h-10 border-2 border-primary/50 border-t-primary rounded-full animate-spin"></div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
          <div className="text-center max-w-sm p-6 bg-secondary rounded-lg border border-red-500/50">
            <h3 className="text-primary text-lg font-semibold mb-2">Stream Error</h3>
            <p className="text-foreground/80 text-sm mb-6">{error}</p>
            <button 
              onClick={handleRetry}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors mx-auto"
            >
              <RotateCcw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      )}

      {!isPlaying && !isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={handlePlayPause}>
          <div className="w-20 h-20 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 border border-white/20">
            <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
          </div>
        </div>
      )}

      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 md:p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <button onClick={handlePlayPause} className="p-2 text-white bg-black/40 hover:bg-black/60 rounded-full transition-colors">
              {isPlaying ? <Pause className="w-5 h-5" fill="currentColor"/> : <Play className="w-5 h-5 ml-0.5" fill="currentColor"/>}
            </button>
            <button onClick={handleMuteToggle} className="p-2 text-white bg-black/40 hover:bg-black/60 rounded-full transition-colors">
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
          <button onClick={handleFullscreenToggle} className="p-2 text-white bg-black/40 hover:bg-black/60 rounded-full transition-colors">
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
