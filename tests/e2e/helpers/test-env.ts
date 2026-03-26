export function getRequiredTestEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required test environment variable: ${name}`);
  }

  return value;
}

export function getRequiredTestEnvNumber(name: string): number {
  const value = Number.parseInt(getRequiredTestEnv(name), 10);

  if (Number.isNaN(value)) {
    throw new Error(`Expected ${name} to contain a valid number.`);
  }

  return value;
}
