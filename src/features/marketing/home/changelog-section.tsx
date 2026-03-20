import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { Separator } from "@/components/ui/separator";
import type { ChangelogEntry } from "@/features/marketing/about/changelog/changelog-content";

type ChangelogCarouselProps = {
  entries: ChangelogEntry[];
};

export function ChangelogSection({ entries }: ChangelogCarouselProps) {
  const t = useTranslations("pages.home.changelogCarousel");
  const recentEntries = entries.slice(0, 4);

  return (
    <div className="space-y-8">
      <div className="mb-10 max-w-2xl">
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("title")}
        </h2>
      </div>

      <div className="relative max-sm:hidden">
        <Separator className="absolute top-1.5 left-0" />
        <div className="relative grid grid-cols-2 gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {recentEntries.map((entry, index) => (
            <div
              key={entry.id}
              className={cn(
                "space-y-2.5",
                index === 2 && "max-lg:hidden",
                index === 3 && "max-xl:hidden"
              )}
            >
              <div className="bg-muted-foreground size-3 rounded-full" />
              <div className="space-y-0.5">
                <p className="text-muted-foreground/80 text-xs">{entry.date}</p>
                <p className="text-foreground/70 text-xs font-medium tracking-widest uppercase">
                  {entry.versionLabel}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {recentEntries.map((entry, index) => (
          <article
            key={entry.id}
            className={cn(
              "group relative flex flex-col gap-3 py-5 sm:py-0",
              index !== 0 && "border-border border-t sm:border-t-0",
              index === 2 && "sm:hidden lg:block",
              index === 3 && "sm:hidden xl:block"
            )}
          >
            <div className="space-y-0.5 sm:hidden">
              <p className="text-foreground/70 text-xs font-medium tracking-widest uppercase">
                {entry.versionLabel}
              </p>
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-foreground font-heading group-hover:text-foreground/70 text-lg font-semibold tracking-tight text-balance transition-colors">
                <Link href="/about/changelog" className="after:absolute after:inset-0">
                  {entry.title}
                </Link>
              </h3>
              <p className="text-muted-foreground line-clamp-3 text-sm leading-6">
                {entry.description}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div>
        <Button nativeButton={false} render={<Link href="/about/changelog" />} variant="secondary">
          {t("actions.viewAll")}
        </Button>
      </div>
    </div>
  );
}

// poznámka pro budoucí vývoj: bude se dělat slug k jednotlivým příspěvkům/updatům?
