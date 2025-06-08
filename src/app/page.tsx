import { StreamList } from "@/components/stream-list";
import { getSportsStreams, getItalianStreams } from "@/lib/iptv";
import { Tv } from "lucide-react";

export const revalidate = 3600; // Re-fetch streams every hour

export default async function HomePage() {
  // Fetch both lists of streams at the same time
  const [sports, italian] = await Promise.all([
    getSportsStreams(),
    getItalianStreams()
  ]);

  return (
    <main className="container mx-auto max-w-2xl p-4">
      <header className="my-8 flex flex-col items-center text-center">
        <Tv className="h-12 w-12 text-primary" />
        <h1 className="mt-4 text-4xl font-bold tracking-tight">StreamHub</h1>
        <p className="mt-2 text-lg text-foreground/60">
          Your curated collection of live channels.
        </p>
      </header>
      {/* Pass both lists down to the client component */}
      <StreamList sportsStreams={sports} italianStreams={italian} />
    </main>
  );
}
