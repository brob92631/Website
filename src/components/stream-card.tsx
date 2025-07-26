import { memo } from "react";
import type { Stream } from "@/lib/iptv";
import { Play, ChevronRight } from "lucide-react";

interface StreamCardProps {
  stream: Stream;
  onClick: (stream: Stream) => void;
}

export const StreamCard = memo(({ stream, onClick }: StreamCardProps) => {
  const handleClick = () => onClick(stream);

  return (
    <button
      onClick={handleClick}
      className="group flex w-full items-center gap-4 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-secondary/50"
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <Play className="h-5 w-5" />
      </div>

      <div className="flex-1 overflow-hidden">
        <p className="truncate font-medium text-card-foreground">
          {stream.title}
        </p>
        <p className="truncate text-sm text-foreground/60">
          {stream.category}
        </p>
      </div>

      <ChevronRight className="h-5 w-5 flex-shrink-0 text-foreground/50 transition-transform group-hover:translate-x-1" />
    </button>
  );
});

StreamCard.displayName = "StreamCard";
