import { Skeleton } from "@/components/ui/skeleton";
import {
  SettingsItem,
  SettingsItemContent,
  SettingsItemContentBody,
  SettingsItemContentHeader,
  SettingsItemDescription,
  SettingsItemFooter,
  SettingsItemTitle,
} from "@/components/ui/settings-item";

type SettingsPageSkeletonProps = {
  itemCount?: number;
};

export function SettingsPageSkeleton({ itemCount = 3 }: SettingsPageSkeletonProps) {
  return (
    <div className="grid">
      <div className="pb-6">
        <Skeleton className="h-6.5 w-48 sm:h-8 sm:w-56" />
        <Skeleton className="mt-2 h-4 w-full max-w-xl" />
      </div>

      <div className="mt-1 grid gap-8">
        {Array.from({ length: itemCount }).map((_, index) => (
          <SettingsCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

function SettingsCardSkeleton() {
  return (
    <SettingsItem>
      <SettingsItemContent className="flex flex-col gap-6">
        <SettingsItemContentHeader>
          <SettingsItemTitle render={<div />}>
            <Skeleton className="h-6 w-40" />
          </SettingsItemTitle>
          <SettingsItemDescription render={<div />}>
            <Skeleton className="mt-1 h-3.5 w-full max-w-2xl" />
          </SettingsItemDescription>
        </SettingsItemContentHeader>

        <SettingsItemContentBody>
          <div className="grid gap-4">
            <div className="grid max-w-md gap-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-9 w-full max-w-xl" />
              <Skeleton className="h-3.5 w-2/3 max-w-sm" />
            </div>
          </div>
        </SettingsItemContentBody>
      </SettingsItemContent>

      <SettingsItemFooter>
        <Skeleton className="h-3.5 w-2/3 max-w-2xl" />
        <Skeleton className="h-9 w-32 rounded-md sm:self-end" />
      </SettingsItemFooter>
    </SettingsItem>
  );
}
