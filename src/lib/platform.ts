interface NavigatorUABrandVersion {
  brand: string;
  version: string;
}

interface NavigatorUAData {
  brands: NavigatorUABrandVersion[];
  mobile: boolean;
  platform: string;
}

declare global {
  interface Navigator {
    userAgentData?: NavigatorUAData;
  }
}

function isBrowser(): boolean {
  return typeof document !== "undefined";
}

function getNavigator(): Navigator | null {
  return isBrowser() ? window.navigator : null;
}

function matchUserAgent(pattern: RegExp): boolean {
  const nav = getNavigator();
  if (!nav) return false;

  if (nav.userAgentData?.brands) {
    if (nav.userAgentData.brands.some((item) => pattern.test(item.brand))) {
      return true;
    }
  }

  // Fallback to traditional userAgent
  return pattern.test(nav.userAgent);
}

function getPlatformString(): string {
  const nav = getNavigator();
  if (!nav) return "";

  if (nav.userAgentData?.platform) {
    return nav.userAgentData.platform;
  }

  // Derive platform from userAgent to avoid deprecated navigator.platform
  const ua = nav.userAgent;
  if (/Macintosh|Mac OS/.test(ua)) return "macOS";
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Windows/.test(ua)) return "Windows";
  if (/Android/.test(ua)) return "Android";
  if (/CrOS/.test(ua)) return "Chrome OS";
  if (/Linux/.test(ua)) return "Linux";
  return "";
}

function matchPlatform(pattern: RegExp): boolean {
  return pattern.test(getPlatformString());
}

// Platform detection functions
export function isMacOS(): boolean {
  return matchPlatform(/^Mac/i);
}

export function isIPhone(): boolean {
  return matchPlatform(/^iPhone/i);
}

export function isIPad(): boolean {
  // iPad detection — newer iPads report as Mac, detect via maxTouchPoints
  const nav = getNavigator();
  return matchPlatform(/^iPad/i) || (isMacOS() && nav != null && nav.maxTouchPoints > 1);
}

export function isIOS(): boolean {
  return isIPhone() || isIPad();
}

export function isApple(): boolean {
  return isMacOS() || isIOS();
}

export function isSafari(): boolean {
  // Safari detection — check for WebKit but not Chrome
  return matchUserAgent(/Safari/i) && !matchUserAgent(/Chrome|Chromium|CriOS/i);
}

export function isChrome(): boolean {
  return matchUserAgent(/Chrome|Chromium|CriOS/i);
}

export function isFirefox(): boolean {
  return matchUserAgent(/Firefox|FxiOS/i);
}

export function isAndroid(): boolean {
  return matchUserAgent(/Android/i);
}

export function isWindows(): boolean {
  return matchPlatform(/^Win/i);
}

export function isLinux(): boolean {
  return matchPlatform(/^Linux/i);
}

// Touch support detection
export function hasTouchSupport(): boolean {
  const nav = getNavigator();
  if (!nav) return false;
  return "ontouchstart" in window || nav.maxTouchPoints > 0;
}

// Mobile detection
export function isMobile(): boolean {
  return isIOS() || isAndroid() || matchUserAgent(/Mobile|Tablet/i);
}

// WebKit detection
export function isWebKit(): boolean {
  if (!isBrowser()) return false;
  return (
    "WebkitAppearance" in document.documentElement.style || "webkitRequestAnimationFrame" in window
  );
}

// Device type detection from arbitrary hint strings (e.g. user agent, device label)
export type DeviceType = "phone" | "tablet" | "desktop";

export function detectDeviceType(...hints: string[]): DeviceType {
  const combined = hints.join(" ").toLowerCase();
  if (/ipad|tablet/.test(combined)) return "tablet";
  if (/iphone|android|mobile|phone/.test(combined)) return "phone";
  return "desktop";
}
