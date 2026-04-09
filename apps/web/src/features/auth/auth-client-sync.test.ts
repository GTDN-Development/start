import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthSessionSnapshot } from "@/features/auth/auth-types";

const { refreshSessionMock, setSessionStateMock } = vi.hoisted(function hoistAuthClientSyncMocks() {
  return {
    refreshSessionMock: vi.fn(async function refreshSession() {
      return {
        ok: true as const,
        data: {
          session: createAuthenticatedSnapshot().session,
        },
      };
    }),
    setSessionStateMock: vi.fn(),
  };
});

const authSyncStoreState = {
  sessionSnapshot: createAuthenticatedSnapshot() as AuthSessionSnapshot,
  isRefetchAllowed: true,
};

describe("auth client sync", function describeAuthClientSync() {
  let authSessionRuntimeModule: typeof import("./auth-session-runtime");
  let online = true;
  let visibilityState: DocumentVisibilityState = "visible";

  beforeAll(async function initializeAuthClientSync() {
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      get() {
        return online;
      },
    });

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get() {
        return visibilityState;
      },
    });

    vi.stubGlobal("BroadcastChannel", MockBroadcastChannel);
    authSessionRuntimeModule = await import("./auth-session-runtime");
    authSessionRuntimeModule
      .createSessionSyncController({
        getSessionSnapshot: function getSessionSnapshot() {
          return authSyncStoreState.sessionSnapshot;
        },
        isSessionRefetchAllowed: function isSessionRefetchAllowed() {
          return authSyncStoreState.isRefetchAllowed;
        },
        refreshSession: refreshSessionMock,
        setSessionState: setSessionStateMock,
      })
      .ensureSessionSyncInitialized();
  });

  beforeEach(function resetAuthClientSyncState() {
    online = true;
    visibilityState = "visible";
    authSyncStoreState.sessionSnapshot = createAuthenticatedSnapshot();
    authSyncStoreState.isRefetchAllowed = true;
    refreshSessionMock.mockClear();
    setSessionStateMock.mockClear();
  });

  it("applies signed-out broadcasts immediately", function testSignedOutBroadcast() {
    getBroadcastChannel().dispatchMessage("signed-out");

    expect(setSessionStateMock).toHaveBeenCalledWith({
      status: "unauthenticated",
      session: null,
    });
    expect(refreshSessionMock).not.toHaveBeenCalled();
  });

  it("refreshes on session-changed broadcasts only when online and allowed", function testSessionChangedBroadcast() {
    online = false;
    getBroadcastChannel().dispatchMessage("session-changed");
    expect(refreshSessionMock).not.toHaveBeenCalled();

    online = true;
    authSyncStoreState.isRefetchAllowed = false;
    getBroadcastChannel().dispatchMessage("session-changed");
    expect(refreshSessionMock).not.toHaveBeenCalled();

    authSyncStoreState.isRefetchAllowed = true;
    getBroadcastChannel().dispatchMessage("session-changed");
    expect(refreshSessionMock).toHaveBeenCalledTimes(1);
  });

  it("refreshes on visible, focus, and online recovery only for authenticated sessions", function testRuntimeRefreshSignals() {
    authSyncStoreState.sessionSnapshot = {
      status: "unauthenticated",
      session: null,
    };

    dispatchAuthRuntimeSignals();
    expect(refreshSessionMock).not.toHaveBeenCalled();

    authSyncStoreState.sessionSnapshot = createAuthenticatedSnapshot();
    authSyncStoreState.isRefetchAllowed = false;

    dispatchAuthRuntimeSignals();
    expect(refreshSessionMock).not.toHaveBeenCalled();

    authSyncStoreState.isRefetchAllowed = true;
    visibilityState = "hidden";
    document.dispatchEvent(new Event("visibilitychange"));
    expect(refreshSessionMock).not.toHaveBeenCalled();

    visibilityState = "visible";
    dispatchAuthRuntimeSignals();
    expect(refreshSessionMock).toHaveBeenCalledTimes(3);
  });
});

function dispatchAuthRuntimeSignals() {
  document.dispatchEvent(new Event("visibilitychange"));
  window.dispatchEvent(new Event("focus"));
  window.dispatchEvent(new Event("online"));
}

function getBroadcastChannel() {
  const [channel] = MockBroadcastChannel.instances;

  if (!channel) {
    throw new Error("Expected auth sync BroadcastChannel to be initialized.");
  }

  return channel;
}

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

class MockBroadcastChannel {
  static instances: MockBroadcastChannel[] = [];

  name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  postMessage = vi.fn();
  close = vi.fn();

  constructor(name: string) {
    this.name = name;
    MockBroadcastChannel.instances.push(this);
  }

  dispatchMessage(data: unknown) {
    this.onmessage?.({ data } as MessageEvent);
  }
}
