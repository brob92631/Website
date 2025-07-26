"use client";

import { useState, useEffect, useCallback, memo } from "react";
import type { Stream } from "@/lib/iptv";
import { StreamCard } from "./stream-card";
import { X, Search, Star } from "lucide-react";
import dynamic from "next/dynamic";

const DynamicVideoPlayer = dynamic(
  () => import("./video-player").then((mod) => mod.VideoPlayer),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-video w-full bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    ),
  }
);

interface StreamListProps {
  featuredStreams: Stream[];
  romanianStreams: Stream[];
}

type CategoryKey = "featured" | "romanian";

interface CategoryUIData {
  name: string;
  emoji: string | JSX.Element;
  key: CategoryKey;
  streams: Stream[];
}

// Memoized CategoryButton to prevent re-renders
const CategoryButton = memo(
  ({
    name,
    emoji,
    categoryKey,
    isActive,
    onClick,
  }: {
    name: string;
    emoji: string | JSX.Element;
    categoryKey: CategoryKey;
    isActive: boolean;
    onClick: (key: CategoryKey) => void;
  }) => (
    <button
      onClick={() => onClick(categoryKey)}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        isActive
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
      }`}
    >
      {emoji}
      {name}
    </button>
  )
);
CategoryButton.displayName = "CategoryButton";

export function StreamList({
  featuredStreams,
  romanianStreams,
}: StreamListProps) {
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
  const [activeCategoryKey, setActiveCategoryKey] =
    useState<CategoryKey>("featured");
  const [searchTerm, setSearchTerm] = useState("");

  const categoriesData: CategoryUIData[] = [
    {
      name: "Featured",
      emoji: <Star className="h-4 w-4" />,
      key: "featured",
      streams: featuredStreams,
    },
    {
      name: "Romanian",
      emoji: "🇷🇴",
      key: "romanian",
      streams: romanianStreams,
    },
  ];

  const currentCategory =
    categoriesData.find((cat) => cat.key === activeCategoryKey) ||
    categoriesData[0];
  const streamsToDisplay = currentCategory.streams;

  const filteredStreams = streamsToDisplay.filter((stream) => {
    const streamTitle = stream.title || "";
    const streamCat = stream.category || "";
    return (
      streamTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      streamCat.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleSelectStream = useCallback((stream: Stream) => {
    setSelectedStream(stream);
  }, []);

  const handleSetCategory = useCallback((key: CategoryKey) => {
    setActiveCategoryKey(key);
  }, []);

  const handleClosePlayer = useCallback(() => {
    setSelectedStream(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClosePlayer();
      if (event.key === "/" && !selectedStream) {
        event.preventDefault();
        document.getElementById("search-input")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedStream, handleClosePlayer]);

  useEffect(() => {
    setSearchTerm("");
  }, [activeCategoryKey]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/50" />
          <input
            id="search-input"
            type="text"
            placeholder={`Search in ${currentCategory.name}... (Press '/' to focus)`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border bg-card py-2.5 pl-10 pr-4 text-base outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categoriesData
            .filter((cat) => cat.streams.length > 0)
            .map((cat) => (
              <CategoryButton
                key={cat.key}
                name={cat.name}
                emoji={cat.emoji}
                categoryKey={cat.key}
                isActive={activeCategoryKey === cat.key}
                onClick={handleSetCategory}
              />
            ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredStreams.length > 0 ? (
          filteredStreams.map((stream) => (
            <StreamCard
              key={stream.id}
              stream={stream}
              onClick={handleSelectStream}
            />
          ))
        ) : (
          <div className="text-center py-16">
            <p className="text-lg font-medium">No streams found.</p>
            <p className="text-foreground/60">Try adjusting your search.</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>

      {selectedStream && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-2 sm:p-4 backdrop-blur-sm"
          onClick={handleClosePlayer}
        >
          <div
            className="relative w-full max-w-5xl aspect-video rounded-lg bg-black shadow-2xl overflow-hidden border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-2 right-2 z-20">
              <button
                onClick={handleClosePlayer}
                className="p-2 bg-black/50 text-white/70 hover:text-white hover:bg-black/70 rounded-full transition-all"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <DynamicVideoPlayer
              key={selectedStream.id}
              stream={selectedStream}
            />
          </div>
        </div>
      )}
    </div>
  );
}
