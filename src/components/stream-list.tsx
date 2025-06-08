"use client";

import { useState, useEffect } from "react";
import type { Stream } from "@/lib/iptv";
import { StreamCard } from "./stream-card";
import { X, Search, Filter, Star } from "lucide-react";
import dynamic from "next/dynamic";

const DynamicVideoPlayer = dynamic(
  () => import("./video-player").then((mod) => mod.VideoPlayer),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-video w-full bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-white text-sm">Loading Player...</p>
        </div>
      </div>
    )
  }
);

interface StreamListProps {
  featuredStreams: Stream[];
  italianStreams: Stream[];
  frenchStreams: Stream[];
  spanishStreams: Stream[];
  turkishStreams: Stream[];
  maghrebStreams: Stream[];
  middleEastStreams: Stream[];
  greekStreams: Stream[];
  germanStreams: Stream[];
  otherEuropeanStreams: Stream[];
  usaUkGeneralStreams: Stream[];
  caucasianStreams: Stream[];
  kurdishStreams: Stream[]; // Added Kurdish
}

type CategoryKey =
  | 'featured'
  | 'italian'
  | 'french'
  | 'spanish'
  | 'turkish'
  | 'maghreb'
  | 'middleEast'
  | 'greek'
  | 'german'
  | 'otherEuropean'
  | 'usaUkGeneral'
  | 'caucasian'
  | 'kurdish'; // Added Kurdish

interface CategoryUIData {
  name: string;
  emoji: string | JSX.Element;
  key: CategoryKey;
  streams: Stream[];
}

export function StreamList({
  featuredStreams,
  italianStreams,
  frenchStreams,
  spanishStreams,
  turkishStreams,
  maghrebStreams,
  middleEastStreams,
  greekStreams,
  germanStreams,
  otherEuropeanStreams,
  usaUkGeneralStreams,
  caucasianStreams,
  kurdishStreams, // Added Kurdish
}: StreamListProps) {
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
  const [activeCategoryKey, setActiveCategoryKey] = useState<CategoryKey>('featured');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const categoriesData: CategoryUIData[] = [
    { name: "Featured", emoji: <Star className="h-4 w-4"/>, key: 'featured', streams: featuredStreams },
    { name: "USA/UK", emoji: "🇺🇸/🇬🇧", key: 'usaUkGeneral', streams: usaUkGeneralStreams },
    { name: "Italian", emoji: "🇮🇹", key: 'italian', streams: italianStreams },
    { name: "French", emoji: "🇫🇷", key: 'french', streams: frenchStreams },
    { name: "Spanish", emoji: "🇪🇸", key: 'spanish', streams: spanishStreams },
    { name: "Turkish", emoji: "🇹🇷", key: 'turkish', streams: turkishStreams },
    { name: "Arabic ME", emoji: "🇸🇦", key: 'middleEast', streams: middleEastStreams },
    { name: "Maghreb", emoji: "🇲🇦", key: 'maghreb', streams: maghrebStreams },
    { name: "Greek", emoji: "🇬🇷", key: 'greek', streams: greekStreams },
    { name: "German", emoji: "🇩🇪", key: 'german', streams: germanStreams },
    { name: "Caucasian", emoji: "🇬🇪", key: 'caucasian', streams: caucasianStreams },
    { name: "Kurdish", emoji: "☀️", key: 'kurdish', streams: kurdishStreams }, // Added Kurdish
    { name: "Europe Mix", emoji: "🇪🇺", key: 'otherEuropean', streams: otherEuropeanStreams },
  ];

  const currentCategory = categoriesData.find(cat => cat.key === activeCategoryKey) || categoriesData[0];
  const streamsToDisplay = currentCategory.streams;
  const uniqueSubCategories = ['all', ...new Set(streamsToDisplay.map(stream => stream.category.toLowerCase()))];

  const filteredStreams = streamsToDisplay.filter(stream => {
    const streamTitle = stream.title || "";
    const streamDesc = stream.description || "";
    const streamCat = stream.category || "";

    const matchesSearch = streamTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         streamDesc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' ||
                         streamCat.toLowerCase() === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedStream(null);
      if (event.key === '/' && !selectedStream) {
        event.preventDefault();
        document.getElementById('search-input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStream]);

  useEffect(() => {
    setSearchTerm('');
    setSelectedFilter('all');
  }, [activeCategoryKey]);

  const CategoryButton = ({ name, emoji, categoryKey, count }: { name: string, emoji: string | JSX.Element, categoryKey: CategoryKey, count: number }) => (
    <button
      onClick={() => setActiveCategoryKey(categoryKey)}
      className={`flex-shrink-0 flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 ${
        activeCategoryKey === categoryKey
          ? 'bg-primary text-white shadow-lg scale-105'
          : 'bg-card hover:bg-card-hover border border-card-hover'
      }`}
    >
      {emoji}
      {name} ({count})
    </button>
  );

  return (
    <>
      {/* Category Toggle */}
      <div className="mb-6 flex justify-start sm:justify-center gap-2 overflow-x-auto pb-3 -mx-4 px-4">
        {categoriesData.filter(cat => cat.streams.length > 0).map(cat => (
          <CategoryButton key={cat.key} name={cat.name} emoji={cat.emoji} categoryKey={cat.key} count={cat.streams.length} />
        ))}
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/50" />
          <input
            id="search-input"
            type="text"
            placeholder={`Search ${streamsToDisplay.length} streams in ${currentCategory.name}... (Press '/' to focus)`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-card border border-card-hover rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all duration-200"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="h-4 w-4 text-foreground/50 flex-shrink-0" />
          {uniqueSubCategories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedFilter(category)}
              className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                selectedFilter === category
                  ? 'bg-primary text-white'
                  : 'bg-card hover:bg-card-hover border border-card-hover'
              }`}
            >
              {category === 'all' ? `All (${streamsToDisplay.length})` : category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stream List */}
      <div className="space-y-3">
        {filteredStreams.length > 0 ? (
          filteredStreams.map((stream) => (
            <StreamCard
              key={stream.id}
              stream={stream}
              onClick={() => setSelectedStream(stream)}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">😢</div>
            <h3 className="text-lg font-semibold mb-2">No streams found</h3>
            <p className="text-foreground/60">
              Try adjusting your search or filter for the "{currentCategory.name}" category.
            </p>
             {(searchTerm || selectedFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedFilter('all');
                }}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      {selectedStream && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          onClick={() => setSelectedStream(null)}
        >
          <div
            className="relative w-full max-w-6xl aspect-video rounded-xl bg-background shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-white font-semibold text-lg">{selectedStream.title}</h2>
                  <p className="text-white/70 text-sm">{selectedStream.description}</p>
                </div>
                <button
                  onClick={() => setSelectedStream(null)}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
                  aria-label="Close video player"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="w-full h-full bg-black">
              <DynamicVideoPlayer
                key={selectedStream.id}
                src={
                  `/api/streams?url=${encodeURIComponent(selectedStream.url)}` +
                  (selectedStream.referer ? `&referer=${encodeURIComponent(selectedStream.referer)}` : '') +
                  (selectedStream.userAgent ? `&userAgent=${encodeURIComponent(selectedStream.userAgent)}` : '')
                }
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
