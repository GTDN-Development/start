"use client";

import { routing } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Locale } from "next-intl";
import { useParams } from "next/navigation";
import { useTransition } from "react";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";

export function LocaleSelect({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const params = useParams();

  function onChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value;
    startTransition(() => {
      router.replace(
        // @ts-expect-error -- TypeScript will validate that only known `params`
        // are used in combination with a given `pathname`. Since the two will
        // always match for the current route, we can skip runtime checks.
        { pathname, params },
        { locale: nextLocale as Locale }
      );
    });
  }

  return (
    <NativeSelect
      value={locale}
      onChange={onChange}
      disabled={isPending}
      className={cn(className)}
      aria-label="Select language"
    >
      {routing.locales.map((cur) => (
        <NativeSelectOption key={cur} value={cur}>
          {cur.toUpperCase()}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
