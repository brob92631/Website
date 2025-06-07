// Update this file to show the new 'description' field.
import type { Stream } from "@/lib/iptv";
import { PlayCircle } from "lucide-react";

export function StreamCard({ stream, onClick }: { stream: Stream; onClick: () => void; }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-lg bg-card p-4 text-left transition-colors hover:bg-card-hover"
    >
      <PlayCircle className="h-8 w-8 flex-shrink-0 text-primary/70" />
      <div className="flex-grow overflow-hidden">
        <p className="truncate font-medium">{stream.title}</p>
        {/* We now use the new description field */}
        <p className="truncate text-sm text-foreground/60">{stream.description}</p>
      </div>
    </button>
  );
}
