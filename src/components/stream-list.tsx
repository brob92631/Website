"use client";

import { useState, useEffect } from "react";
import type { Stream } from "@/lib/iptv";
import { StreamCard } from "./stream-card";
import { X, Gamepad2 } from "lucide-react";
import dynamic from "next/dynamic";

const DynamicVideoPlayer = dynamic(
  () => import("./video-player").then((mod) => mod.VideoPlayer),
  {
    ssr: false,
    loading: () => <div className="aspect-video w-full bg-black flex items-center justify-center"><p>Loading Player...</p></div>
  }
);

interface StreamListProps {
  sportsStreams: Stream[];
  italianStreams: Stream[];
}

export function StreamList({ sportsStreams, italianStreams }: StreamListProps) {
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
  const [activeCategory, setActiveCategory] = useState<'sports' | 'italian'>('sports');

  // --- UX: Handle Escape key to close modal ---
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedStream(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const streamsToDisplay = activeCategory === 'sports' ? sportsStreams : italianStreams;

  return (
    <>
      <div className="mb-6 flex justify-center gap-2">
        <button
          onClick={() => setActiveCategory('sports')}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            activeCategory === 'sports' ? 'bg-primary text-white' : 'bg-card hover:bg-card-hover'
          }`}
        >
          <Gamepad2 className="h-4 w-4" />
          Sports
        </button>
        <button
          onClick={() => setActiveCategory('italian')}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            activeCategory === 'italian' ? 'bg-primary text-white' : 'bg-card hover:bg-card-hover'
          }`}
        >
          🇮🇹 Italian
        </button>
      </div>

      <div className="space-y-3">
        {streamsToДисплей.map((stream) => (
          <StreamCard key={stream.id} stream={stream} onClick={() => setSelectedStream(stream)} />
        ))}
      </div>

      {selectedStream && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          // --- UX: Handle click on backdrop to close modal ---
          onClick={() => setSelectedStream(null)}
        >
          <div 
            className="relative w-full max-w-4xl rounded-lg bg-background p-2 shadow-2xl"
            // Stop propagation so clicking the player doesn't close the modal
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedStream(null)}
              className="absolute -top-10 right-0 z-10 p-1 text-foreground/70 transition-colors hover:text-foreground"
              aria-label="Close video player"
            >
              <X className="h-8 w-8" />
            </button>
            <div className="aspect-video w-full overflow-hidden rounded-md bg-black">
              <DynamicVideoPlayer
                key={selectedStream.id} // Use key to force re-mount on stream change
                src={`/api/streams?url=${encodeURIComponent(selectedStream.url)}`}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
