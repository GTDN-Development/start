"use client";

import { useState, useSyncExternalStore, type ComponentPropsWithRef, type ReactNode } from "react";
import { ArrowRightIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const LAYOUT_BANNER_DISMISSED_IDS_STORAGE_KEY = "layout_banner_dismissed_ids";

const LAYOUT_BANNER_DISMISSED_IDS_COOKIE_NAME = "layout_banner_dismissed_ids";
const LAYOUT_BANNER_DISMISS_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

const dismissedBannerStoreSubscribers = new Set<() => void>();

export type LayoutBannerSeverity = "info" | "warning" | "success";
export type LayoutBannerIntent = LayoutBannerSeverity;

export type LayoutBannerViewModel = {
  id: string;
  title: string | null;
  body: string | null;
  severity: LayoutBannerSeverity;
  rememberDismiss: boolean;
  bgImageUrl: string | null;
  cta: {
    label: string;
    href: string;
    openNewTab: boolean;
  } | null;
};

export type LayoutBannerLabels = {
  dismiss: string;
};

type LayoutBannersProps = {
  banner: LayoutBannerViewModel;
  labels: LayoutBannerLabels;
  className?: string;
};

type BannerProps = ComponentPropsWithRef<"div"> & {
  children: ReactNode;
  intent?: LayoutBannerIntent;
  isOpen?: boolean;
  isDefaultOpen?: boolean;
  onClose?: (isOpen: boolean) => void;
  isDismissable?: boolean;
  closeLabel?: string;
  backgroundImageUrl?: string | null;
};

const bannerIntentClassNames: Record<LayoutBannerIntent, string> = {
  info: "bg-primary text-primary-foreground",
  warning: "text-white bg-amber-600",
  success: "text-white bg-emerald-600",
};

export function LayoutBanners({ banner, labels, className }: LayoutBannersProps) {
  const dismissedBannerSnapshot = useSyncExternalStore(
    subscribeDismissedBannerStore,
    getDismissedBannerSnapshot,
    getServerDismissedBannerSnapshot
  );
  const isDismissed =
    banner.rememberDismiss && parseDismissedBannerIds(dismissedBannerSnapshot).includes(banner.id);

  if (isDismissed) {
    return null;
  }

  function handleOpenChange(newIsOpen: boolean) {
    if (newIsOpen || !banner.rememberDismiss) {
      return;
    }

    persistDismissedBannerId(banner.id);
  }

  return (
    <>
      {banner.rememberDismiss && (
        <LayoutBannerDismissBeforePaintScript bannerId={banner.id} />
      )}
      <Banner
        backgroundImageUrl={banner.bgImageUrl}
        className={className}
        closeLabel={labels.dismiss}
        data-layout-banner-id={banner.id}
        data-testid="layout-banner"
        intent={banner.severity}
        isDismissable={banner.rememberDismiss}
        isOpen={!isDismissed}
        onClose={handleOpenChange}
      >
        {banner.title && <BannerTitle>{banner.title}</BannerTitle>}
        {banner.title && banner.body && <BannerDivider />}
        {banner.body && <BannerDescription>{banner.body}</BannerDescription>}
        {banner.cta && (
          <BannerLink
            href={banner.cta.href}
            openNewTab={banner.cta.openNewTab}
            className={banner.title || banner.body ? "ml-3" : undefined}
          >
            {banner.cta.label}
          </BannerLink>
        )}
      </Banner>
    </>
  );
}

export function Banner({
  children,
  isOpen: controlledIsOpen,
  isDefaultOpen = true,
  onClose,
  isDismissable = true,
  closeLabel = "Close alert",
  intent = "info",
  backgroundImageUrl,
  className,
  ...props
}: BannerProps) {
  const isControlled = controlledIsOpen !== undefined;
  const [internalIsOpen, setInternalIsOpen] = useState(isDefaultOpen);
  const isComputedOpen = isControlled ? controlledIsOpen : internalIsOpen;

  function handleOpenChange(newIsOpen: boolean) {
    if (!isControlled) {
      setInternalIsOpen(newIsOpen);
    }

    onClose?.(newIsOpen);
  }

  if (!isComputedOpen) {
    return null;
  }

  return (
    <div
      {...props}
      className={cn(
        "relative isolate flex items-center gap-x-6 overflow-hidden px-6 py-2.5 sm:px-3.5 sm:before:flex-1",
        bannerIntentClassNames[intent],
        !isDismissable && "sm:after:flex-1",
        className
      )}
      data-intent={intent}
    >
      {backgroundImageUrl && (
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-cover bg-center opacity-40"
          data-testid="layout-banner-bg-image"
          style={{
            backgroundImage: `url(${JSON.stringify(backgroundImageUrl)})`,
          }}
        />
      )}

      <p className="min-w-0 text-sm leading-6">{children}</p>
      {isDismissable && (
        <div className="flex flex-1 justify-end">
          <BannerCloseButton label={closeLabel} onClick={() => handleOpenChange(false)} />
        </div>
      )}
    </div>
  );
}

export function BannerCloseButton({
  className,
  label,
  ...props
}: Omit<ComponentPropsWithRef<typeof Button>, "children" | "variant" | "size"> & {
  label: string;
}) {
  return (
    <Button
      {...props}
      aria-label={label}
      variant="ghost"
      size="icon"
      className={cn(
        "relative size-6 text-current hover:bg-current/10 hover:text-current",
        className
      )}
    >
      <span
        className="absolute top-1/2 left-1/2 size-[max(100%,2.75rem)] -translate-x-1/2 -translate-y-1/2 pointer-fine:hidden"
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
      <XIcon aria-hidden="true" />
    </Button>
  );
}

export function BannerTitle({ className, ...props }: ComponentPropsWithRef<"strong">) {
  return <strong {...props} className={cn("font-semibold", className)} />;
}

export function BannerDescription({ className, ...props }: ComponentPropsWithRef<"span">) {
  return <span {...props} className={cn("opacity-80", className)} />;
}

export function BannerDivider({ className, ...props }: ComponentPropsWithRef<"svg">) {
  return (
    <svg
      {...props}
      viewBox="0 0 2 2"
      aria-hidden="true"
      className={cn("mx-2 inline size-0.5 fill-current", className)}
    >
      <circle r={1} cx={1} cy={1} />
    </svg>
  );
}

export function BannerLink({
  children,
  className,
  href,
  openNewTab = false,
}: {
  children: ReactNode;
  className?: string;
  href: string;
  openNewTab?: boolean;
}) {
  const linkClassName = cn(
    "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-full px-3.5 py-1 text-sm leading-6 font-semibold whitespace-nowrap transition-colors",
    className
  );
  const target = openNewTab ? "_blank" : undefined;
  const rel = openNewTab ? "noreferrer" : undefined;

  return (
    <a href={href} target={target} rel={rel} className={linkClassName}>
      {children}
      <ArrowRightIcon aria-hidden="true" className="ml-2 inline size-[1em]" />
    </a>
  );
}

function subscribeDismissedBannerStore(listener: () => void) {
  dismissedBannerStoreSubscribers.add(listener);

  function handleStorage(event: StorageEvent) {
    if (event.key === LAYOUT_BANNER_DISMISSED_IDS_STORAGE_KEY) {
      listener();
    }
  }

  window.addEventListener("storage", handleStorage);

  return function unsubscribeDismissedBannerStore() {
    dismissedBannerStoreSubscribers.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function getDismissedBannerSnapshot(): string {
  if (typeof window === "undefined") {
    return "[]";
  }

  const dismissedIds = new Set(readDismissedBannerCookieIds());

  try {
    for (const id of parseDismissedBannerIds(
      window.localStorage.getItem(LAYOUT_BANNER_DISMISSED_IDS_STORAGE_KEY) ?? "[]"
    )) {
      dismissedIds.add(id);
    }
  } catch {
    // Browser storage can be disabled; the cookie still gives us reload-safe dismiss state.
  }

  return JSON.stringify(Array.from(dismissedIds));
}

function getServerDismissedBannerSnapshot(): string {
  return "[]";
}

function persistDismissedBannerId(id: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const dismissedIds = new Set(parseDismissedBannerIds(getDismissedBannerSnapshot()));
  dismissedIds.add(id);
  const nextDismissedIds = Array.from(dismissedIds).slice(-100);

  try {
    window.localStorage.setItem(
      LAYOUT_BANNER_DISMISSED_IDS_STORAGE_KEY,
      JSON.stringify(nextDismissedIds)
    );
  } catch {
    // Dismiss is a convenience preference; blocked storage should not break the banner.
  }

  persistDismissedBannerCookie(nextDismissedIds);
  notifyDismissedBannerStoreSubscribers();
}

function persistDismissedBannerCookie(ids: string[]): void {
  try {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    const value = encodeURIComponent(JSON.stringify(ids));

    document.cookie = `${LAYOUT_BANNER_DISMISSED_IDS_COOKIE_NAME}=${value}; Path=/; Max-Age=${LAYOUT_BANNER_DISMISS_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
  } catch {
    // Dismiss still applies for the current tab through component state/localStorage.
  }
}

function readDismissedBannerCookieIds(): string[] {
  try {
    const cookieValue = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith(`${LAYOUT_BANNER_DISMISSED_IDS_COOKIE_NAME}=`))
      ?.slice(LAYOUT_BANNER_DISMISSED_IDS_COOKIE_NAME.length + 1);

    if (!cookieValue) {
      return [];
    }

    return parseDismissedBannerIds(decodeURIComponent(cookieValue));
  } catch {
    return [];
  }
}

function parseDismissedBannerIds(value: string): string[] {
  try {
    const parsedValue: unknown = JSON.parse(value);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function notifyDismissedBannerStoreSubscribers() {
  for (const subscriber of dismissedBannerStoreSubscribers) {
    subscriber();
  }
}

function LayoutBannerDismissBeforePaintScript({ bannerId }: { bannerId: string }) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: getLayoutBannerDismissBeforePaintScript(bannerId),
      }}
      suppressHydrationWarning
    />
  );
}

function getLayoutBannerDismissBeforePaintScript(bannerId: string): string {
  const cookieName = JSON.stringify(LAYOUT_BANNER_DISMISSED_IDS_COOKIE_NAME);
  const serializedBannerId = JSON.stringify(bannerId);
  const cookiePattern = `(?:^|; )${escapeRegExp(
    LAYOUT_BANNER_DISMISSED_IDS_COOKIE_NAME
  )}=([^;]*)`;
  const styleText = `[data-layout-banner-id="${escapeCssAttributeValue(
    bannerId
  )}"]{display:none!important}`;

  return `(function(){try{var cookieName=${cookieName};var match=document.cookie.match(new RegExp(${JSON.stringify(
    cookiePattern
  )}));var ids=match?JSON.parse(decodeURIComponent(match[1])):[];if(Array.isArray(ids)&&ids.indexOf(${serializedBannerId})!==-1){var style=document.createElement("style");style.setAttribute("data-layout-banner-dismiss-style",${serializedBannerId});style.textContent=${JSON.stringify(
    styleText
  )};document.head.appendChild(style);}}catch(_){}})();`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeCssAttributeValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
