export const securityConfig = {
  deviceSessions: {
    cookieName: "app_device_session",
    persistentMaxAgeSeconds: 90 * 24 * 60 * 60,
    heartbeatMinSeconds: 5 * 60,
    maxActiveSessions: 8 as number | null,
  },
} as const;
