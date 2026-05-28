export function isDateStringExpired(value: string, now = Date.now()): boolean {
  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    return true;
  }

  return timestamp <= now;
}
