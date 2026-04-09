"use client";

import { render, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthSessionSnapshot } from "@/features/auth/auth-types";

const {
  getSessionSnapshotMock,
  getPathnameMock,
  subscribeToSessionStoreMock,
  useLocaleMock,
  useSessionMock,
} = vi.hoisted(function hoistApplicationAuthSyncMocks() {
  return {
    getSessionSnapshotMock: vi.fn(),
    getPathnameMock: vi.fn(),
    subscribeToSessionStoreMock: vi.fn(),
    useLocaleMock: vi.fn(),
    useSessionMock: vi.fn(),
  };
});

vi.mock("next-intl", function mockNextIntl() {
  return {
    useLocale: useLocaleMock,
  };
});

vi.mock("@/features/auth/auth-client", function mockAuthClient() {
  return {
    useSession: useSessionMock,
  };
});

vi.mock("@/features/auth/auth-session-runtime", function mockAuthSessionRuntime() {
  return {
    getSessionSnapshot: getSessionSnapshotMock,
    subscribeToSessionStore: subscribeToSessionStoreMock,
  };
});

vi.mock("@/i18n/navigation", function mockNavigation() {
  return {
    getPathname: getPathnameMock,
  };
});

describe("application auth sync", function describeApplicationAuthSync() {
  let sessionSnapshot: AuthSessionSnapshot;
  let assignMock: ReturnType<typeof vi.fn>;
  let originalLocation: Location;
  let storeSubscribers: Set<() => void>;

  beforeAll(function captureOriginalLocation() {
    originalLocation = window.location;
  });

  beforeEach(function resetApplicationAuthSyncTestState() {
    sessionSnapshot = createAuthenticatedSnapshot();
    assignMock = vi.fn();
    storeSubscribers = new Set();

    useLocaleMock.mockReturnValue("cs");
    useSessionMock.mockImplementation(function getSessionSnapshot() {
      return sessionSnapshot;
    });
    getSessionSnapshotMock.mockImplementation(function getSessionSnapshot() {
      return sessionSnapshot;
    });
    subscribeToSessionStoreMock.mockImplementation(function subscribeToSessionStore(
      listener: () => void
    ) {
      storeSubscribers.add(listener);

      return function unsubscribeSessionStore() {
        storeSubscribers.delete(listener);
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

    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...originalLocation,
        assign: assignMock,
      },
    });
  });

  it("does not redirect while session is loading or authenticated", async function testNoRedirect() {
    const { ApplicationAuthSync } = await import("./application-auth-sync");

    sessionSnapshot = {
      status: "loading",
      session: null,
    };

    const { rerender } = render(<ApplicationAuthSync />);

    await waitFor(function expectNoRedirectForLoading() {
      expect(assignMock).not.toHaveBeenCalled();
    });

    sessionSnapshot = createAuthenticatedSnapshot();
    rerender(<ApplicationAuthSync />);

    await waitFor(function expectNoRedirectForAuthenticated() {
      expect(assignMock).not.toHaveBeenCalled();
    });
  });

  it("redirects once when session becomes unauthenticated", async function testRedirectsOnce() {
    const { ApplicationAuthSync } = await import("./application-auth-sync");
    render(<ApplicationAuthSync />);

    sessionSnapshot = {
      status: "unauthenticated",
      session: null,
    };
    emitSessionStoreChange(storeSubscribers);

    await waitFor(function expectRedirect() {
      expect(getPathnameMock).toHaveBeenCalledWith({
        href: "/sign-in",
        locale: "cs",
      });
      expect(assignMock).toHaveBeenCalledWith("/cs/sign-in");
    });

    emitSessionStoreChange(storeSubscribers);

    await waitFor(function expectSingleRedirect() {
      expect(assignMock).toHaveBeenCalledTimes(1);
    });
  });
});

function createAuthenticatedSnapshot(): AuthSessionSnapshot {
  return {
    status: "authenticated",
    session: {
      user: {
        id: "user_123",
        email: "fanda@example.com",
        name: "Fanda",
        avatarUrl: null,
      },
    },
  };
}

function emitSessionStoreChange(subscribers: Set<() => void>) {
  for (const listener of subscribers) {
    listener();
  }
}
