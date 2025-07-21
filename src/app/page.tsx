import { StreamList } from "@/components/stream-list";
import {
  getFeaturedStreams,
  getAllRomanianStreams,
} from "@/lib/iptv";
import { Suspense } from "react";
import Loading from "./loading";

export const revalidate = 3600; // Re-fetch streams every hour
export const dynamic = "force-dynamic";

async function StreamData() {
  try {
    const [featured, romanian] = await Promise.all([
      getFeaturedStreams(),
      getAllRomanianStreams(),
    ]);

    return (
      <StreamList featuredStreams={featured} romanianStreams={romanian} />
    );
  } catch (error) {
    console.error("Failed to load streams:", error);

    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📡</div>
        <h2 className="text-xl font-semibold mb-2">Unable to Load Streams</h2>
        <p className="text-foreground/60 mb-6">
          There was an issue loading the stream list. Please try refreshing the
          page.
        </p>
      </div>
    );
  }
}

export default function HomePage() {
  return (
    <main className="container max-w-3xl mx-auto py-8 md:py-12">
      <header className="mb-8 md:mb-12 text-center">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-primary">
          Stream Player
        </h1>
        <p className="mt-3 text-lg text-foreground/70 max-w-2xl mx-auto">
          Select a channel from the list below to start watching.
        </p>
      </header>

      <Suspense fallback={<Loading />}>
        <StreamData />
      </Suspense>

      <footer className="mt-12 text-center text-xs text-foreground/50">
        <p>
          This service aggregates publicly available streams. All content is
          property of their respective owners.
        </p>
      </footer>
    </main>
  );
}
