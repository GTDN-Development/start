"use client";

import { Suspense, useTransition } from "react";
import { routing } from "@/i18n/routing";
import { getPathname, usePathname } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { GlobeIcon } from "lucide-react";
import { Locale, useLocale, useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ className = "" }: { className?: string }) {
  return (
    <Suspense fallback={<LocaleSwitcherSkeleton className={className} />}>
      <LocaleSwitcherContent className={className} />
    </Suspense>
  );
}

function LocaleSwitcherContent({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("common.localeSwitcher");
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const params = useParams();

  function onValueChange(nextLocale: string | null) {
    if (!nextLocale) {
      return;
    }

    startTransition(() => {
      const localizedPathname = getPathname({
        // @ts-expect-error -- TypeScript will validate that only known `params`
        // are used in combination with a given `pathname`. Since the two will
        // always match for the current route, we can skip runtime checks.
        href: { pathname, params },
        locale: nextLocale as Locale,
      });

      window.location.replace(
        `${localizedPathname}${window.location.search}${window.location.hash}`
      );
    });
  }

  return (
    <Select value={locale} onValueChange={onValueChange} disabled={isPending}>
      <SelectTrigger
        className={cn("min-w-32 rounded-full data-[size=default]:h-10", className)}
        aria-label={t("label")}
      >
        <GlobeIcon aria-hidden="true" className="text-muted-foreground size-[1em]" />
        <SelectValue>{(value) => (value ? t("locale", { locale: value }) : "")}</SelectValue>
      </SelectTrigger>

      <SelectContent alignItemWithTrigger={false}>
        <SelectGroup>
          {routing.locales.map((cur) => (
            <SelectItem key={cur} value={cur}>
              {t("locale", { locale: cur })}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function LocaleSwitcherSkeleton({ className = "" }: { className?: string }) {
  return <Skeleton className={cn("h-10 min-w-32 rounded-full", className)} />;
}
