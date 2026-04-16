"use client";

import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { getPathnameMock, subscribeToAuthClientEventsMock, useAccountProfileMock, useLocaleMock } =
  vi.hoisted(function hoistApplicationAuthSyncMocks() {
    return {
      getPathnameMock: vi.fn(),
      subscribeToAuthClientEventsMock: vi.fn(),
      useAccountProfileMock: vi.fn(),
      useLocaleMock: vi.fn(),
    };
  });

vi.mock("next-intl", function mockNextIntl() {
  return {
    useLocale: useLocaleMock,
  };
});

vi.mock("@/features/account/account-profile-context", function mockAccountProfileContext() {
  return {
    useAccountProfile: useAccountProfileMock,
  };
});

vi.mock("@/features/auth/auth-client-events", function mockAuthClientEvents() {
  return {
    subscribeToAuthClientEvents: subscribeToAuthClientEventsMock,
  };
});

vi.mock("@/i18n/navigation", function mockNavigation() {
  return {
    getPathname: getPathnameMock,
  };
});

describe("application auth sync", function describeApplicationAuthSync() {
  let authEventListener: ((event: "auth-changed" | "signed-out") => void) | null;
  let assignMock: ReturnType<typeof vi.fn>;
  let fetchMock: ReturnType<typeof vi.fn>;
  let originalLocation: Location;
  let setProfileMock: ReturnType<typeof vi.fn>;
  let dateNowSpy: ReturnType<typeof vi.spyOn>;
  let now: number;
  let profile: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
  };

  beforeAll(function captureOriginalLocation() {
    originalLocation = window.location;
  });

  beforeEach(function resetApplicationAuthSyncTestState() {
    authEventListener = null;
    assignMock = vi.fn();
    fetchMock = vi.fn();
    setProfileMock = vi.fn();
    now = new Date("2026-04-14T10:00:00.000Z").getTime();
    profile = createProfileSnapshot();
    dateNowSpy = vi.spyOn(Date, "now").mockImplementation(function mockDateNow() {
      return now;
    });

    useLocaleMock.mockReturnValue("cs");
    useAccountProfileMock.mockImplementation(function useAccountProfile() {
      return {
        profile,
        setProfile: setProfileMock,
      };
    });
    subscribeToAuthClientEventsMock.mockImplementation(function subscribeToAuthClientEvents(
      listener: (event: "auth-changed" | "signed-out") => void
    ) {
      authEventListener = listener;

      return function unsubscribeAuthClientEvents() {
        authEventListener = null;
      };
    });
    getPathnameMock.mockImplementation(function getPathname({
      href,
      locale,
    }: {
      href: string;
      locale: string;
    }) {
      return `/${locale}${href}`;
    });

    vi.stubGlobal("fetch", fetchMock);

    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...originalLocation,
        assign: assignMock,
      },
    });
  });

  afterEach(function cleanupApplicationAuthSyncTestState() {
    dateNowSpy.mockRestore();
    vi.unstubAllGlobals();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("redirects immediately on signed-out auth events", async function testSignedOutRedirect() {
    fetchMock.mockResolvedValue(createFetchResponse(createAuthenticatedSessionResponse()));

    const { ApplicationAuthSync } = await import("./application-auth-sync");
    render(<ApplicationAuthSync />);

    await waitFor(function expectInitialRecheck() {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    authEventListener?.("signed-out");

    await waitFor(function expectRedirect() {
      expect(getPathnameMock).toHaveBeenCalledWith({
        href: "/sign-in",
        locale: "cs",
      });
      expect(assignMock).toHaveBeenCalledWith("/cs/sign-in");
    });
  });

  it("rechecks on auth-changed and patches account profile fields from session", async function testAuthChangedPatch() {
    fetchMock
      .mockResolvedValueOnce(createFetchResponse(createAuthenticatedSessionResponse()))
      .mockResolvedValueOnce(
        createFetchResponse(
          createAuthenticatedSessionResponse({
            email: "updated@example.com",
            name: "Updated User",
            avatarUrl: "https://cdn.test/avatar.png",
          })
        )
      );

    const { ApplicationAuthSync } = await import("./application-auth-sync");
    render(<ApplicationAuthSync />);

    await waitFor(function expectInitialRecheck() {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    authEventListener?.("auth-changed");

    await waitFor(function expectProfilePatch() {
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(setProfileMock).toHaveBeenCalledWith({
        id: "user_123",
        name: "Updated User",
        email: "updated@example.com",
        avatarUrl: "https://cdn.test/avatar.png",
      });
    });
  });

  it("rate-limits focus and online rechecks to five seconds", async function testRecheckRateLimit() {
    fetchMock.mockResolvedValue(createFetchResponse(createAuthenticatedSessionResponse()));

    const { ApplicationAuthSync } = await import("./application-auth-sync");
    render(<ApplicationAuthSync />);

    await waitFor(function expectInitialRecheck() {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    window.dispatchEvent(new Event("focus"));
    document.dispatchEvent(new Event("visibilitychange"));

    await waitFor(function expectNoImmediateRecheck() {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    now += 5_000;
    window.dispatchEvent(new Event("online"));

    await waitFor(function expectDelayedRecheck() {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });
});

function createProfileSnapshot() {
  return {
    id: "user_123",
    email: "fanda@example.com",
    name: "Fanda",
    avatarUrl: null,
  };
}

function createAuthenticatedSessionResponse(input?: {
  email?: string;
  name?: string | null;
  avatarUrl?: string | null;
}) {
  return {
    ok: true as const,
    data: {
      session: {
        user: {
          id: "user_123",
          email: input?.email ?? "fanda@example.com",
          name: input?.name ?? "Fanda",
          avatarUrl: input?.avatarUrl ?? null,
        },
      },
    },
  };
}

function createFetchResponse(payload: unknown) {
  return {
    async json() {
      return payload;
    },
  };
}
