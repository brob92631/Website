import { StreamList } from "@/components/stream-list";
import { getStreams } from "@/lib/iptv";
import { Tv } from "lucide-react";
export const revalidate = 3600;
export default async function HomePage() {
  const streams = await getStreams();
  return ( <main className="container mx-auto max-w-2xl p-4"> <header className="my-8 flex flex-col items-center text-center"> <Tv className="h-12 w-12 text-primary" /> <h1 className="mt-4 text-4xl font-bold tracking-tight">StreamHub</h1> <p className="mt-2 text-lg text-foreground/60"> Publicly available sports channels, curated for you. </p> </header> <StreamList streams={streams} /> </main> );
}
