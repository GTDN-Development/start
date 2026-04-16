import { beforeEach, describe, expect, it, vi } from "vitest";

const { clearActiveWorkspaceSlugCookieMock, clearPendingInviteTokenCookieMock } = vi.hoisted(
  function hoistApplicationSessionStateMocks() {
    return {
      clearActiveWorkspaceSlugCookieMock: vi.fn(),
      clearPendingInviteTokenCookieMock: vi.fn(),
    };
  }
);

vi.mock("@/server/workspaces/workspace-cookie", function mockWorkspaceCookie() {
  return {
    clearActiveWorkspaceSlugCookie: clearActiveWorkspaceSlugCookieMock,
    clearPendingInviteTokenCookie: clearPendingInviteTokenCookieMock,
  };
});

import { clearSessionScopedApplicationState } from "./application-session-state";

describe("application-session-state", function describeApplicationSessionState() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
  });

  it("clears session-scoped workspace cookies", async function testClearSessionScopedState() {
    await clearSessionScopedApplicationState();

    expect(clearActiveWorkspaceSlugCookieMock).toHaveBeenCalledTimes(1);
    expect(clearPendingInviteTokenCookieMock).toHaveBeenCalledTimes(1);
  });
});
