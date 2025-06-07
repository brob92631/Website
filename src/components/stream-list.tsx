"use client";

import { useState } from "react";
import type { Stream } from "@/lib/iptv";
import { StreamCard } from "./stream-card";
import { X } from "lucide-react";
import dynamic from "next/dynamic";

// ===================================================================
// THE FIX IS HERE: We are dynamically importing our NEW VideoPlayer,
// not the old one. This fixes the build error.
// ===================================================================
const DynamicVideoPlayer = dynamic(
  () => import("./video-player").then((mod) => mod.VideoPlayer),
  {
    ssr: false, // Never render this on the server
    loading: () => <div className="aspect-video w-full bg-black flex items-center justify-center"><p>Loading Player...</p></div>
  }
);

export function StreamList({ streams }: { streams: Stream[] }) {
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);

  return (
    <>
      <div className="space-y-3">
        {streams.map((stream) => (
          <StreamCard key={stream.id} stream={stream} onClick={() => setSelectedStream(stream)} />
        ))}
      </div>

      {selectedStream && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl rounded-lg bg-background p-2 shadow-2xl">
            <button
              onClick={() => setSelectedStream(null)}
              className="absolute -top-10 right-0 z-10 p-1 text-foreground/70 transition-colors hover:text-foreground"
            >
              <X className="h-8 w-8" />
            </button>
            <div className="aspect-video w-full overflow-hidden rounded-md bg-black">
              <DynamicVideoPlayer
                src={`/api/streams?url=${encodeURIComponent(
                  selectedStream.url
                )}`}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
