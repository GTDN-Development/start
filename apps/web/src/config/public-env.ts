type PublicEnvName = "NEXT_PUBLIC_APP_URL" | "NEXT_PUBLIC_PB_URL";
type PublicEnv = Record<string, string | undefined>;

const runtimePublicEnv: PublicEnv = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_PB_URL: process.env.NEXT_PUBLIC_PB_URL,
};

export function getPublicAppUrl(env: PublicEnv = runtimePublicEnv): string {
  return getRequiredPublicUrl("NEXT_PUBLIC_APP_URL", env);
}

export function getPocketBaseUrl(env: PublicEnv = runtimePublicEnv): string {
  return getRequiredPublicUrl("NEXT_PUBLIC_PB_URL", env);
}

function getRequiredPublicUrl(name: PublicEnvName, env: PublicEnv): string {
  const value = env[name]?.trim() ?? "";

  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }

  return value.replace(/\/+$/g, "");
}
