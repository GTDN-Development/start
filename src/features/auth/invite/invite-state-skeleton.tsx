import { Skeleton } from "@/components/ui/skeleton";

export function InviteStateSkeleton() {
  return (
    <div className="mx-auto flex min-h-[40vh] w-full max-w-md flex-col justify-center py-8 text-center">
      <Skeleton className="mx-auto h-8 w-52" />
      <div className="mt-3 grid gap-3">
        <Skeleton className="mx-auto h-4 w-full max-w-sm" />
        <Skeleton className="mx-auto h-4 w-4/5 max-w-xs" />
      </div>
      <div className="mt-6">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  );
}
