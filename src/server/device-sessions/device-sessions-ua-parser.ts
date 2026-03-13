import type { DeviceSessionDeviceType, ParsedDeviceInfo } from "@/server/device-sessions/device-sessions-types";
import { detectDeviceType } from "@/lib/device-environment";

/**
 * Lightweight UA heuristic for user-facing labels.
 * This is intentionally not a fingerprinting-grade parser.
 */
export function parseDeviceInfo(userAgent: string): ParsedDeviceInfo {
  const normalizedUserAgent = userAgent.toLowerCase();
  const browser = parseBrowser(normalizedUserAgent);
  const os = parseOperatingSystem(normalizedUserAgent);
  const deviceType =
    normalizedUserAgent.length === 0
      ? "unknown"
      : mapDeviceType(detectDeviceType(normalizedUserAgent, os));

  return {
    deviceLabel: buildDeviceLabel(os, browser),
    deviceType,
    browser,
    os,
  };
}

function parseBrowser(userAgent: string): string {
  if (userAgent.includes("edg/") || userAgent.includes("edge/")) {
    return "Edge";
  }

  if (userAgent.includes("firefox") || userAgent.includes("fxios")) {
    return "Firefox";
  }

  if (userAgent.includes("opr/") || userAgent.includes("opera")) {
    return "Opera";
  }

  if (userAgent.includes("safari") && !userAgent.includes("chrome") && !userAgent.includes("chromium")) {
    return "Safari";
  }

  if (userAgent.includes("chrome") || userAgent.includes("chromium") || userAgent.includes("crios")) {
    return "Chrome";
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

  if (userAgent.includes("mac os") || userAgent.includes("macintosh")) {
    return "macOS";
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

function mapDeviceType(deviceType: "desktop" | "phone" | "tablet"): DeviceSessionDeviceType {
  if (deviceType === "phone") {
    return "phone";
  }

  if (deviceType === "tablet") {
    return "tablet";
  }

  return "desktop";
}
