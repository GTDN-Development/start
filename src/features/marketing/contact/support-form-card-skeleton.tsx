import { Skeleton } from "@/components/ui/skeleton";

export function SupportFormCardSkeleton() {
  return (
    <div className="flex w-full flex-col gap-6 py-1">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full max-w-sm" />
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-30 w-full" />
        </div>

        <div className="grid gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-36 rounded-md" />
          <Skeleton className="h-3 w-full max-w-xs" />
        </div>
      </div>

      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  );
}
