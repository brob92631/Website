const SkeletonCard = () => (
  <div className="flex items-center space-x-4 p-4 rounded-lg bg-card border">
    <div className="h-10 w-10 rounded-full bg-secondary" />
    <div className="flex-1 space-y-2">
      <div className="h-4 w-3/4 rounded bg-secondary" />
      <div className="h-3 w-1/2 rounded bg-secondary" />
    </div>
    <div className="h-6 w-6 rounded-full bg-secondary" />
  </div>
);

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="h-12 w-full rounded-lg bg-card border" />
        <div className="flex gap-2">
          <div className="h-9 w-28 rounded-full bg-card border" />
          <div className="h-9 w-32 rounded-full bg-card border" />
        </div>
      </div>
      <div className="space-y-3 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
