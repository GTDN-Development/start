export const securityConfig = {
  deviceSessions: {
    cookieName: "app_device_session",
    persistentMaxAgeSeconds: 90 * 24 * 60 * 60,
    heartbeatMinSeconds: 5 * 60,
    maxActiveSessions: 8 as number | null,
  },
} as const;

type SecurityEnv = Record<string, string | undefined>;

export type TurnstileConfig = {
  enabled: boolean;
  siteKey?: string;
  secretKey?: string;
};

export function getTurnstileConfig(env: SecurityEnv = process.env): TurnstileConfig {
  return {
    enabled: parseSecurityEnvBoolean(env.NEXT_PUBLIC_TURNSTILE_ENABLED, true),
    siteKey: getOptionalSecurityEnvValue("NEXT_PUBLIC_TURNSTILE_SITE_KEY", env),
    secretKey: getOptionalSecurityEnvValue("TURNSTILE_SECRET_KEY", env),
  };
}

export function isTurnstileEnabled(env: SecurityEnv = process.env) {
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

function getOptionalSecurityEnvValue(name: string, env: SecurityEnv): string | undefined {
  const value = env[name]?.trim();

  return value ? value : undefined;
}
