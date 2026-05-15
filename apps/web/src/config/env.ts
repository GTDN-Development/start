export function parseEnvBoolean(value: string | undefined, defaultValue: boolean): boolean {
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
