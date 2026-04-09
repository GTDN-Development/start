export const securityConfig = {
  deviceSessions: {
    cookieName: "app_device_session",
    persistentMaxAgeSeconds: 90 * 24 * 60 * 60,
    heartbeatMinSeconds: 5 * 60,
    maxActiveSessions: 8 as number | null,
  },
} as const;

export function isTurnstileEnabled() {
  return parseSecurityEnvBoolean(process.env.NEXT_PUBLIC_TURNSTILE_ENABLED, true);
}

function parseSecurityEnvBoolean(value: string | undefined, defaultValue: boolean) {
  const normalizedValue = value?.trim().toLowerCase();

  if (!normalizedValue) {
    return defaultValue;
  }

  if (normalizedValue === "true") {
    return true;
  }

  if (normalizedValue === "false") {
    return false;
  }

  return defaultValue;
}
