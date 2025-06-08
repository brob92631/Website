"use client";

import { useState, useEffect } from "react";
import type { Stream } from "@/lib/iptv";
import { StreamCard } from "./stream-card";
import { X, Gamepad2, Search, Filter } from "lucide-react";
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
  sportsStreams: Stream[];
  italianStreams: Stream[];
}

export function StreamList({ sportsStreams, italianStreams }: StreamListProps) {
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
  const [activeCategory, setActiveCategory] = useState<'sports' | 'italian'>('sports');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Get unique categories for filtering
  const streamsToDisplay = activeCategory === 'sports' ? sportsStreams : italianStreams;
  const categories = ['all', ...new Set(streamsToDisplay.map(stream => stream.category.toLowerCase()))];
  
  // Filter streams based on search and category
  const filteredStreams = streamsToDisplay.filter(stream => {
    const matchesSearch = stream.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stream.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || 
                         stream.category.toLowerCase() === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedStream(null);
      }
      if (event.key === '/' && !selectedStream) {
        event.preventDefault();
        document.getElementById('search-input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStream]);

  // Reset filters when category changes
  useEffect(() => {
    setSearchTerm('');
    setSelectedFilter('all');
  }, [activeCategory]);

  return (
    <>
      {/* Category Toggle */}
      <div className="mb-6 flex justify-center gap-2">
        <button
          onClick={() => setActiveCategory('sports')}
          className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-200 ${
            activeCategory === 'sports' 
              ? 'bg-primary text-white shadow-lg scale-105' 
              : 'bg-card hover:bg-card-hover border border-card-hover'
          }`}
        >
          <Gamepad2 className="h-4 w-4" />
          Sports ({sportsStreams.length})
        </button>
        <button
          onClick={() => setActiveCategory('italian')}
          className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-200 ${
            activeCategory === 'italian' 
              ? 'bg-primary text-white shadow-lg scale-105' 
              : 'bg-card hover:bg-card-hover border border-card-hover'
          }`}
        >
          🇮🇹 Italian ({italianStreams.length})
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/50" />
          <input
            id="search-input"
            type="text"
            placeholder="Search streams... (Press '/' to focus)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-card border border-card-hover rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all duration-200"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="h-4 w-4 text-foreground/50 flex-shrink-0" />
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedFilter(category)}
              className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                selectedFilter === category
                  ? 'bg-primary text-white'
                  : 'bg-card hover:bg-card-hover border border-card-hover'
              }`}
            >
              {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Results Summary */}
      {(searchTerm || selectedFilter !== 'all') && (
        <div className="mb-4 text-sm text-foreground/60">
          {filteredStreams.length} stream{filteredStreams.length !== 1 ? 's' : ''} found
          {searchTerm && ` for "${searchTerm}"`}
          {selectedFilter !== 'all' && ` in ${selectedFilter}`}
        </div>
      )}

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
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold mb-2">No streams found</h3>
            <p className="text-foreground/60">
              {searchTerm 
                ? `No streams match "${searchTerm}"`
                : `No streams available in ${selectedFilter} category`
              }
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
            {/* Stream Info Header */}
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

            {/* Video Player */}
            <div className="w-full h-full bg-black">
              <DynamicVideoPlayer
                key={selectedStream.id}
                src={`/api/streams?url=${encodeURIComponent(selectedStream.url)}`}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
