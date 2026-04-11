import { cache } from "react";
import { ChevronRightIcon } from "lucide-react";
import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { MobileMenuClose } from "@/components/ui/mobile-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_HOME_PATH } from "@/config/routes";
import { getServerAuthSession } from "@/server/auth/auth-session-service";
import { resolveApplicationEntryHref } from "@/server/application/application-entry-href";
import type { UserAccountMenuViewer } from "@/features/account/user-account-menu";
import { MarketingFooterAccountSection } from "./marketing-footer-account-section";

const getMarketingAuthState = cache(async function getMarketingAuthState() {
  const sessionResponse = await getServerAuthSession();
  const sessionUser = sessionResponse.ok ? (sessionResponse.data.session?.user ?? null) : null;

  if (!sessionUser) {
    return {
      viewer: null,
      applicationEntryHref: APP_HOME_PATH,
    };
  }

  return {
    viewer: {
      id: sessionUser.id,
      email: sessionUser.email,
      name: sessionUser.name,
      avatarUrl: sessionUser.avatarUrl,
    } satisfies UserAccountMenuViewer,
    applicationEntryHref: await resolveApplicationEntryHref(sessionUser.id),
  };
});

export async function MarketingHeaderDesktopAuthSlot() {
  const [{ viewer, applicationEntryHref }, tHeader, tNav] = await Promise.all([
    getMarketingAuthState(),
    getTranslations("layout.header"),
    getTranslations("layout.navigation.items"),
  ]);

  if (viewer) {
    return (
      <li>
        <Button size="lg" nativeButton={false} render={<Link href={applicationEntryHref} />}>
          {tHeader("goToApplication")}
          <ChevronRightIcon aria-hidden="true" className="size-4" data-icon="inline-end" />
        </Button>
      </li>
    );
  }

  return (
    <>
      <li>
        <Button variant="ghost" size="lg" nativeButton={false} render={<Link href="/sign-in" />}>
          {tNav("signIn")}
        </Button>
      </li>
      <li>
        <Button size="lg" nativeButton={false} render={<Link href="/sign-up" />}>
          {tNav("signUp")}
        </Button>
      </li>
    </>
  );
}

export function MarketingHeaderDesktopAuthSkeleton() {
  return (
    <>
      <li>
        <Skeleton className="h-11 w-24 rounded-md" />
      </li>
      <li>
        <Skeleton className="h-11 w-28 rounded-md" />
      </li>
    </>
  );
}

export async function MarketingHeaderMobileTopAuthSlot() {
  const [{ viewer, applicationEntryHref }, tHeader] = await Promise.all([
    getMarketingAuthState(),
    getTranslations("layout.header"),
  ]);

  if (!viewer) {
    return null;
  }

  return (
    <Button
      size="lg"
      className="shrink-0"
      nativeButton={false}
      render={<Link href={applicationEntryHref} />}
    >
      {tHeader("goToApplication")}
      <ChevronRightIcon aria-hidden="true" className="size-4" data-icon="inline-end" />
    </Button>
  );
}

export async function MarketingHeaderMobileViewerSlot() {
  const [{ viewer }, tApplication] = await Promise.all([
    getMarketingAuthState(),
    getTranslations("layout.application"),
  ]);

  if (!viewer) {
    return null;
  }

  const viewerDisplayName = viewer.name?.trim() || null;

  return (
    <div className="border-border rounded-xl border p-4">
      <p className="text-muted-foreground text-xs">{tApplication("signedInAs")}</p>
      <p className="mt-1 truncate text-sm font-medium">{viewerDisplayName ?? viewer.email}</p>
      {viewerDisplayName && (
        <p className="text-muted-foreground mt-1 truncate text-xs">{viewer.email}</p>
      )}
    </div>
  );
}

export function MarketingHeaderMobileViewerSkeleton() {
  return (
    <div className="border-border rounded-xl border p-4">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-2 h-4 w-40" />
      <Skeleton className="mt-2 h-3 w-32" />
    </div>
  );
}

export async function MarketingHeaderMobileFooterActionsSlot() {
  const [{ viewer, applicationEntryHref }, tHeader, tNav] = await Promise.all([
    getMarketingAuthState(),
    getTranslations("layout.header"),
    getTranslations("layout.navigation.items"),
  ]);

  if (viewer) {
    return (
      <Button
        size="lg"
        className="w-full"
        nativeButton={false}
        render={<MobileMenuClose render={<Link href={applicationEntryHref} />} />}
      >
        {tHeader("goToApplication")}
        <ChevronRightIcon aria-hidden="true" data-icon="inline-end" />
      </Button>
    );
  }

  return (
    <>
      <Button
        size="lg"
        className="w-full"
        nativeButton={false}
        render={<MobileMenuClose render={<Link href="/sign-up" />} />}
      >
        {tNav("signUp")}
      </Button>
      <Button
        variant="secondary"
        size="lg"
        className="w-full"
        nativeButton={false}
        render={<MobileMenuClose render={<Link href="/sign-in" />} />}
      >
        {tNav("signIn")}
      </Button>
    </>
  );
}

export function MarketingHeaderMobileFooterActionsSkeleton() {
  return (
    <>
      <Skeleton className="h-11 w-full rounded-md" />
      <Skeleton className="h-11 w-full rounded-md" />
    </>
  );
}

export async function MarketingFooterAccountSectionSlot({ locale }: { locale: Locale }) {
  const [{ viewer, applicationEntryHref }, tApplication, tNav] = await Promise.all([
    getMarketingAuthState(),
    getTranslations("layout.application"),
    getTranslations("layout.navigation.items"),
  ]);

  return (
    <MarketingFooterAccountSection
      viewer={viewer}
      applicationEntryHref={applicationEntryHref}
      locale={locale}
      labels={{
        heading: tNav("myAccount"),
        signedInAs: tApplication("signedInAs"),
        home: tNav("home"),
        myAccount: tNav("myAccount"),
        signIn: tNav("signIn"),
        signUp: tNav("signUp"),
        signOut: tApplication("signOut"),
      }}
    />
  );
}

export function MarketingFooterAccountSectionSkeleton() {
  return (
    <div className="flex flex-col items-start justify-start gap-7">
      <Skeleton className="h-4 w-24" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-28" />
      </div>
      <div className="grid gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-18" />
      </div>
    </div>
  );
}
