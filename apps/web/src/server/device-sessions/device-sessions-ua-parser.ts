import type {
  DeviceSessionDeviceType,
  ParsedDeviceInfo,
} from "@/server/device-sessions/device-sessions-types";

/**
 * Lightweight UA heuristic for user-facing labels.
 * This is intentionally not a fingerprinting-grade parser.
 */
export function parseDeviceInfo(userAgent: string): ParsedDeviceInfo {
  const normalizedUserAgent = userAgent.toLowerCase();
  const browser = parseBrowser(normalizedUserAgent);
  const os = parseOperatingSystem(normalizedUserAgent);
  const deviceType = parseDeviceType(normalizedUserAgent, os);

  return {
    deviceLabel: buildDeviceLabel(os, browser),
    deviceType,
    browser,
    os,
  };
}

function parseBrowser(userAgent: string): string {
  if (userAgent.includes("edg/") || userAgent.includes("edge/") || userAgent.includes("edgios")) {
    return "Edge";
  }

  if (userAgent.includes("firefox") || userAgent.includes("fxios")) {
    return "Firefox";
  }

  if (userAgent.includes("opr/") || userAgent.includes("opera") || userAgent.includes("opios")) {
    return "Opera";
  }

  if (
    userAgent.includes("chrome") ||
    userAgent.includes("chromium") ||
    userAgent.includes("crios")
  ) {
    return "Chrome";
  }

  if (userAgent.includes("safari")) {
    return "Safari";
  }

  return "Unknown browser";
}

function parseOperatingSystem(userAgent: string): string {
  if (userAgent.includes("windows")) {
    return "Windows";
  }

  if (userAgent.includes("android")) {
    return "Android";
  }

  if (userAgent.includes("iphone") || userAgent.includes("ipod")) {
    return "iOS";
  }

  if (userAgent.includes("ipad")) {
    return "iPadOS";
  }

  if (userAgent.includes("macintosh") && userAgent.includes("mobile")) {
    return "iPadOS";
  }

  if (userAgent.includes("mac os") || userAgent.includes("macintosh")) {
    return "macOS";
  }

  if (userAgent.includes("cros")) {
    return "Chrome OS";
  }

  if (userAgent.includes("linux")) {
    return "Linux";
  }

  return "Unknown OS";
}

function buildDeviceLabel(os: string, browser: string): string {
  if (os.startsWith("Unknown") && browser.startsWith("Unknown")) {
    return "Unknown device";
  }

  if (os.startsWith("Unknown")) {
    return browser;
  }

  if (browser.startsWith("Unknown")) {
    return os;
  }

  return `${os} · ${browser}`;
}

function parseDeviceType(userAgent: string, os: string): DeviceSessionDeviceType {
  if (userAgent.length === 0) {
    return "unknown";
  }

  const combined = `${userAgent} ${os}`.toLowerCase();

  if (os === "iPadOS" || /ipad|tablet|sm-t|tab\s/.test(combined)) {
    return "tablet";
  }

  if (/iphone|ipod|android.+mobile|mobile|phone/.test(combined)) {
    return "phone";
  }

  if (os === "Android") {
    return "tablet";
  }

  if (/windows|mac|linux|cros|desktop|chrome os/.test(combined)) {
    return "desktop";
  }

  return "unknown";
}
