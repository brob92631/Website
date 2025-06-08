import { StreamList } from "@/components/stream-list";
import { getSportsStreams, getItalianStreams } from "@/lib/iptv";
import { Tv, Radio, Zap } from "lucide-react";
import { Suspense } from "react";

export const revalidate = 3600; // Re-fetch streams every hour
export const dynamic = 'force-dynamic'; // Ensure fresh data

async function StreamData() {
  try {
    // Fetch both lists with timeout protection
    const [sports, italian] = await Promise.all([
      Promise.race([
        getSportsStreams(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Sports streams timeout')), 5000)
        )
      ]),
      Promise.race([
        getItalianStreams(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Italian streams timeout')), 5000)
        )
      ])
    ]);

    return <StreamList sportsStreams={sports} italianStreams={italian} />;
  } catch (error) {
    console.error('Failed to load streams:', error);
    
    // Fallback UI for when streams fail to load
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📡</div>
        <h2 className="text-xl font-semibold mb-2">Unable to Load Streams</h2>
        <p className="text-foreground/60 mb-6">
          There was an issue loading the stream list. Please try refreshing the page.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    );
  }
}

export default function HomePage() {
  return (
    <main className="container mx-auto max-w-2xl p-4">
      {/* Enhanced Header */}
      <header className="my-8 flex flex-col items-center text-center">
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
          <div className="relative bg-gradient-to-br from-primary to-primary/60 p-4 rounded-2xl">
            <Tv className="h-12 w-12 text-white" />
          </div>
          {/* Live indicator */}
          <div className="absolute -top-1 -right-1 flex items-center gap-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
            <Radio className="h-3 w-3 animate-pulse" />
            LIVE
          </div>
        </div>
        
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
          StreamHub
        </h1>
        
        <p className="mt-2 text-lg text-foreground/70 max-w-md">
          Your curated collection of live channels, streaming seamlessly.
        </p>

        {/* Stats Bar */}
        <div className="mt-6 flex items-center gap-6 text-sm text-foreground/60">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-green-400" />
            <span>High Quality</span>
          </div>
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-red-400 animate-pulse" />
            <span>Live Streams</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>24/7 Available</span>
          </div>
        </div>
      </header>

      {/* Stream List with Suspense boundary */}
      <Suspense fallback={
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-card rounded-full">
            <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <span className="text-sm text-foreground/70">Loading streams...</span>
          </div>
        </div>
      }>
        <StreamData />
      </Suspense>

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-foreground/40 border-t border-card-hover pt-6">
        <p>StreamHub aggregates publicly available streams. All content belongs to their respective owners.</p>
      </footer>
    </main>
  );
}
