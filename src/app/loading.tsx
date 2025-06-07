import { Tv } from "lucide-react";
const SkeletonCard = () => ( <div className="flex items-center gap-4 rounded-lg bg-card p-4"> <div className="h-8 w-8 rounded-full bg-card-hover"></div> <div className="h-4 w-4/5 rounded-full bg-card-hover"></div> </div> );
export default function Loading() {
  return ( <main className="container mx-auto max-w-2xl animate-pulse p-4"> <header className="my-8 flex flex-col items-center text-center"> <Tv className="h-12 w-12 text-primary" /> <h1 className="mt-4 text-4xl font-bold tracking-tight">StreamHub</h1> <p className="mt-2 text-lg text-foreground/60"> Publicly available sports channels, curated for you. </p> </header> <div className="space-y-3"> <SkeletonCard /> <SkeletonCard /> <SkeletonCard /> <SkeletonCard /> <SkeletonCard /> </div> </main> );
}
