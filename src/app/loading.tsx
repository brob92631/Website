import { Tv, Radio } from "lucide-react";

const SkeletonCard = ({ delay = 0 }: { delay?: number }) => (
  <div 
    className="flex items-center gap-4 rounded-xl bg-card p-4 animate-pulse border border-card-hover"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="relative flex-shrink-0">
      <div className="h-12 w-12 rounded-full bg-card-hover"></div>
      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-card-hover"></div>
    </div>
    <div className="flex-grow space-y-2">
      <div className="flex items-center gap-2">
        <div className="h-4 w-3/5 rounded-full bg-card-hover"></div>
        <div className="h-5 w-16 rounded-full bg-card-hover"></div>
      </div>
      <div className="h-3 w-4/5 rounded-full bg-card-hover"></div>
    </div>
    <div className="h-8 w-8 rounded-full bg-card-hover flex-shrink-0"></div>
  </div>
);

const PulsingLogo = () => (
  <div className="relative">
    <Tv className="h-12 w-12 text-primary relative z-10" />
    <div className="absolute inset-0 h-12 w-12 bg-primary/20 rounded-full animate-ping"></div>
    <div className="absolute top-2 right-2 text-red-500">
      <Radio className="h-3 w-3 animate-pulse" />
    </div>
  </div>
);

export default function Loading() {
  return (
    <main className="container mx-auto max-w-2xl p-4">
      <header className="my-8 flex flex-col items-center text-center">
        <PulsingLogo />
        <h1 className="mt-4 text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          StreamHub
        </h1>
        <p className="mt-2 text-lg text-foreground/60 animate-pulse">
          Loading your curated collection of live channels...
        </p>
      </header>

      {/* Category Toggle Skeleton */}
      <div className="mb-6 flex justify-center gap-2">
        <div className="flex items-center gap-2 rounded-full px-6 py-3 bg-card border border-card-hover animate-pulse">
          <div className="h-4 w-4 rounded bg-card-hover"></div>
          <div className="h-4 w-16 rounded bg-card-hover"></div>
        </div>
        <div className="flex items-center gap-2 rounded-full px-6 py-3 bg-card border border-card-hover animate-pulse">
          <div className="h-4 w-4 rounded bg-card-hover"></div>
          <div className="h-4 w-20 rounded bg-card-hover"></div>
        </div>
      </div>

      {/* Search Bar Skeleton */}
      <div className="mb-6 space-y-4">
        <div className="relative animate-pulse">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 rounded bg-card-hover"></div>
          <div className="w-full h-12 pl-10 pr-4 bg-card border border-card-hover rounded-lg"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-card-hover"></div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-6 w-16 rounded-full bg-card border border-card-hover animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      {/* Stream Cards Skeleton */}
      <div className="space-y-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <SkeletonCard key={i} delay={i * 100} />
        ))}
      </div>

      {/* Loading Progress Indicator */}
      <div className="mt-8 flex justify-center">
        <div className="flex items-center gap-2 text-sm text-foreground/60">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <span className="ml-2">Fetching streams...</span>
        </div>
      </div>
    </main>
  );
}
