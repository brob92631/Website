import type { Stream } from "@/lib/iptv";
import { PlayCircle, Radio } from "lucide-react";

export function StreamCard({ stream, onClick }: { stream: Stream; onClick: () => void; }) {
  const categoryMap: { [key: string]: { icon: string; color: string } } = {
    'sport': { icon: '⚽', color: 'text-green-400 bg-green-400/10' },
    'news': { icon: '📰', color: 'text-blue-400 bg-blue-400/10' },
    'basketball': { icon: '🏀', color: 'text-orange-400 bg-orange-400/10' },
    'football': { icon: '🏈', color: 'text-purple-400 bg-purple-400/10' },
    'music': { icon: '🎵', color: 'text-pink-400 bg-pink-400/10' },
    'movies': { icon: '🎬', color: 'text-indigo-400 bg-indigo-400/10' },
    'entertainment': { icon: '🎭', color: 'text-yellow-400 bg-yellow-400/10' },
    'kids': { icon: '👧', color: 'text-cyan-400 bg-cyan-400/10' },
    'documentary': { icon: '🐘', color: 'text-amber-400 bg-amber-400/10' },
    'business': { icon: '💼', color: 'text-teal-400 bg-teal-400/10' },
    'culture': { icon: '🎨', color: 'text-violet-400 bg-violet-400/10' },
    'general': { icon: '📺', color: 'text-gray-400 bg-gray-400/10' },
  };

  const normalizedCategory = stream.category.toLowerCase();
  const { icon, color } = Object.entries(categoryMap).find(([key]) => 
    normalizedCategory.includes(key)
  )?.[1] || { icon: '📡', color: 'text-primary bg-primary/10' };

  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-xl bg-card p-4 text-left transition-all duration-200 hover:bg-card-hover hover:scale-[1.02] hover:shadow-lg border border-transparent hover:border-primary/20"
    >
      {/* Stream Icon */}
      <div className="relative flex-shrink-0">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors duration-200">
          <PlayCircle className="h-6 w-6" />
        </div>
        {/* Live indicator */}
        <div className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 rounded-full">
          <Radio className="h-2.5 w-2.5 text-white animate-pulse" />
        </div>
      </div>

      {/* Stream Info */}
      <div className="flex-grow overflow-hidden">
        <div className="flex items-center gap-2 mb-1">
          <p className="truncate font-semibold text-foreground group-hover:text-primary transition-colors duration-200">
            {stream.title}
          </p>
          <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
            {icon} {stream.category}
          </span>
        </div>
        <p className="truncate text-sm text-foreground/60 group-hover:text-foreground/80 transition-colors duration-200">
          {stream.description}
        </p>
      </div>

      {/* Arrow indicator */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="h-8 w-8 flex items-center justify-center rounded-full bg-primary/10 text-primary">
          <PlayCircle className="h-4 w-4" />
        </div>
      </div>
    </button>
  );
}
