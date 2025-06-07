"use client";

import { useState } from "react";
import type { Stream } from "@/lib/iptv";
import { StreamCard } from "./stream-card";
import { X } from "lucide-react";
import dynamic from "next/dynamic";

// ===================================================================
// THE FIX IS HERE: We are telling Next.js to NEVER render the
// VideoPlayer component on the server. It will only be loaded in the user's browser.
// This 100% fixes the "document is not defined" error.
// ===================================================================
const DynamicVideoPlayer = dynamic(
  () => import("./video-player").then((mod) => mod.VideoPlayer),
  { ssr: false } // ssr: false means "Server-Side Rendering: false"
);

interface StreamListProps {
  streams: Stream[];
}

export function StreamList({ streams }: StreamListProps) {
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);

  const handleSelectStream = (stream: Stream) => {
    setSelectedStream(stream);
  };

  const handleCloseModal = () => {
    setSelectedStream(null);
  };

  return (
    <>
      <div className="space-y-3">
        {streams.map((stream) => (
          <StreamCard
            key={stream.id}
            stream={stream}
            onClick={() => handleSelectStream(stream)}
          />
        ))}
      </div>

      {/* Video Player Modal */}
      {selectedStream && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl rounded-lg bg-background p-2 shadow-2xl">
            <button
              onClick={handleCloseModal}
              className="absolute -top-10 right-0 z-10 rounded-full p-1 text-foreground/70 transition-colors hover:text-foreground"
            >
              <X className="h-8 w-8" />
            </button>
            <div className="aspect-video w-full overflow-hidden rounded-md">
              {/* We now use our new DynamicVideoPlayer */}
              <DynamicVideoPlayer
                src={`/api/streams?url=${encodeURIComponent(
                  selectedStream.embedUrl
                )}`}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
