import { parseEnvBoolean } from "@/config/env";

type TurnstileEnv = Record<string, string | undefined>;

type TurnstileConfig = {
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
    enabled: parseEnvBoolean(env.NEXT_PUBLIC_TURNSTILE_ENABLED, true),
    siteKey: getOptionalTrimmedSecurityEnvValue("NEXT_PUBLIC_TURNSTILE_SITE_KEY", env),
    secretKey: getOptionalTrimmedSecurityEnvValue("TURNSTILE_SECRET_KEY", env),
  };
}

export function isTurnstileEnabled(env: TurnstileEnv = runtimeTurnstileEnv) {
  return getTurnstileConfig(env).enabled;
}

function getOptionalTrimmedSecurityEnvValue(name: string, env: TurnstileEnv) {
  const value = env[name]?.trim();

  return value ? value : undefined;
}
