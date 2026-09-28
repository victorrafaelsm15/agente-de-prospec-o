import { Skeleton } from "@/components/ui/Skeleton";

export default function LeadsLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="mb-2 h-6 w-32" />
      <Skeleton className="mb-6 h-4 w-56" />
      <Skeleton className="mb-4 h-10 w-full" />
      <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
