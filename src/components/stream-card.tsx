import type { Stream } from "@/lib/iptv";
import { PlayCircle, Radio } from "lucide-react";

export function StreamCard({ stream, onClick }: { stream: Stream; onClick: () => void; }) {
  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('sport')) return '⚽';
    if (cat.includes('news')) return '📰';
    if (cat.includes('basketball')) return '🏀';
    if (cat.includes('football')) return '🏈';
    if (cat.includes('general')) return '📺';
    if (cat.includes('music')) return '🎵'; // Added for music channels
    if (cat.includes('movies')) return '🎬'; // Added for movie channels
    if (cat.includes('entertainment')) return '🎭'; // Added for entertainment channels
    if (cat.includes('kids')) return '👧'; // Added for kids channels
    if (cat.includes('documentary')) return '🐘'; // Added for documentary channels
    if (cat.includes('business')) return '💼'; // Added for business channels
    if (cat.includes('culture')) return '🎨'; // Added for culture channels
    return '📡';
  };

  const getCategoryColor = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('sport')) return 'text-green-400 bg-green-400/10';
    if (cat.includes('news')) return 'text-blue-400 bg-blue-400/10';
    if (cat.includes('basketball')) return 'text-orange-400 bg-orange-400/10';
    if (cat.includes('football')) return 'text-purple-400 bg-purple-400/10';
    if (cat.includes('music')) return 'text-pink-400 bg-pink-400/10'; // New color
    if (cat.includes('movies')) return 'text-indigo-400 bg-indigo-400/10'; // New color
    if (cat.includes('entertainment')) return 'text-yellow-400 bg-yellow-400/10'; // New color
    if (cat.includes('kids')) return 'text-cyan-400 bg-cyan-400/10'; // New color
    if (cat.includes('documentary')) return 'text-amber-400 bg-amber-400/10'; // New color
    if (cat.includes('business')) return 'text-teal-400 bg-teal-400/10'; // New color
    if (cat.includes('culture')) return 'text-violet-400 bg-violet-400/10'; // New color
    if (cat.includes('general')) return 'text-gray-400 bg-gray-400/10';
    return 'text-primary bg-primary/10';
  };

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
          <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${getCategoryColor(stream.category)}`}>
            {getCategoryIcon(stream.category)} {stream.category}
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
