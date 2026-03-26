import { randomUUID } from "node:crypto";

export type E2ETestRun = {
  id: string;
  prefix: string;
  startedAt: Date;
};

export function createE2ETestRun(): E2ETestRun {
  const startedAt = new Date();
  const id = createTestRunId(startedAt);

  return {
    id,
    prefix: `e2e-${id}`,
    startedAt,
  };
}

export function createTestRunId(date: Date = new Date()): string {
  return `${formatRunDate(date)}-${randomUUID().slice(0, 8)}`;
}

export function createIsolatedTestValue(runId: string, value: string): string {
  const normalizedRunId = normalizeTestSegment(runId);
  const normalizedValue = normalizeTestSegment(value);

  return `e2e-${normalizedRunId}-${normalizedValue}`;
}

export function createIsolatedTestEmail(
  runId: string,
  localPart: string,
  domain: string = "example.com"
): string {
  return `${createIsolatedTestValue(runId, localPart)}@${domain}`;
}

function formatRunDate(date: Date): string {
  const isoString = date.toISOString();

  return isoString.replaceAll("-", "").replaceAll(":", "").replace(".", "").slice(0, 15);
}

function normalizeTestSegment(value: string): string {
  const normalizedValue = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const sanitizedValue = normalizedValue.replace(/^-+/, "").replace(/-+$/, "");

  if (!sanitizedValue) {
    return "value";
  }

  return sanitizedValue;
}
