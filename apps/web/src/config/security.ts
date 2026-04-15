export const securityConfig = {
  deviceSessions: {
    cookieName: "app_device_session",
    persistentMaxAgeSeconds: 90 * 24 * 60 * 60,
    sessionOnlyMaxAgeSeconds: 30 * 60,
    heartbeatMinSeconds: 5 * 60,
    maxActiveSessions: 8 as number | null,
  },
} as const;

type TurnstileEnv = Record<string, string | undefined>;

export type TurnstileConfig = {
  enabled: boolean;
  siteKey: string | undefined;
  secretKey: string | undefined;
};

const runtimeTurnstileEnv: TurnstileEnv = {
  NEXT_PUBLIC_TURNSTILE_ENABLED: process.env.NEXT_PUBLIC_TURNSTILE_ENABLED,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
};

export function getTurnstileConfig(env: TurnstileEnv = runtimeTurnstileEnv): TurnstileConfig {
  return {
    enabled: parseSecurityEnvBoolean(env.NEXT_PUBLIC_TURNSTILE_ENABLED, true),
    siteKey: getOptionalTrimmedSecurityEnvValue("NEXT_PUBLIC_TURNSTILE_SITE_KEY", env),
    secretKey: getOptionalTrimmedSecurityEnvValue("TURNSTILE_SECRET_KEY", env),
  };
}

export function isTurnstileEnabled(env: TurnstileEnv = runtimeTurnstileEnv) {
  return getTurnstileConfig(env).enabled;
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

function getOptionalTrimmedSecurityEnvValue(name: string, env: TurnstileEnv) {
  const value = env[name]?.trim();

  return value ? value : undefined;
}
