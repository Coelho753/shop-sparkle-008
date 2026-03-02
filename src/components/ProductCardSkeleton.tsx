export function ProductCardSkeleton() {
  return (
    <div className="card-product">
      <div className="aspect-square skeleton-loading" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-16 skeleton-loading" />
        <div className="h-4 w-full skeleton-loading" />
        <div className="h-4 w-3/4 skeleton-loading" />
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-3.5 h-3.5 skeleton-loading rounded-full" />
          ))}
        </div>
        <div className="h-5 w-24 skeleton-loading" />
        <div className="h-9 w-full skeleton-loading rounded-lg" />
      </div>
    </div>
  );
}
