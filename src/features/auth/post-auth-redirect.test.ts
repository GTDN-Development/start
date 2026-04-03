import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react", async function mockReact() {
  const actual = await vi.importActual<typeof import("react")>("react");

  return {
    ...actual,
    startTransition: function startTransition(callback: () => void) {
      callback();
    },
  };
});

vi.mock("@/features/auth/auth-actions", function mockAuthActions() {
  return {
    resolvePostAuthDestinationAction: vi.fn(),
  };
});

vi.mock("@/lib/app-utils", function mockAppUtils() {
  return {
    runAsyncTransition: vi.fn(),
  };
});

import {
  APP_HOME_PATH,
  SIGN_IN_PATH,
  getInviteHref,
  getWorkspaceOverviewHref,
} from "@/config/routes";
import { resolvePostAuthDestinationAction } from "@/features/auth/auth-actions";
import { runAsyncTransition } from "@/lib/app-utils";
import { replaceToPostAuthDestination } from "./post-auth-redirect";

describe("replaceToPostAuthDestination", function describeReplaceToPostAuthDestination() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
    vi.mocked(runAsyncTransition).mockImplementation(async function mockRunAsyncTransition(action) {
      return await action();
    });
  });

  it("redirects to workspace overview for workspace destinations", async function testWorkspaceRedirect() {
    const router = createRouter();

    vi.mocked(resolvePostAuthDestinationAction).mockResolvedValue({
      ok: true,
      data: {
        state: "workspace_redirect",
        workspaceSlug: "team-space",
      },
    });

    await replaceToPostAuthDestination(router);

    expect(router.replace).toHaveBeenCalledWith(getWorkspaceOverviewHref("team-space"));
  });

  it("redirects to invite route for invite destinations", async function testInviteRedirect() {
    const router = createRouter();

    vi.mocked(resolvePostAuthDestinationAction).mockResolvedValue({
      ok: true,
      data: {
        state: "invite_redirect",
        inviteToken: "invite-token",
      },
    });

    await replaceToPostAuthDestination(router);

    expect(router.replace).toHaveBeenCalledWith(getInviteHref("invite-token"));
  });

  it("redirects to app for app destinations", async function testAppRedirect() {
    const router = createRouter();

    vi.mocked(resolvePostAuthDestinationAction).mockResolvedValue({
      ok: true,
      data: {
        state: "app",
      },
    });

    await replaceToPostAuthDestination(router);

    expect(router.replace).toHaveBeenCalledWith(APP_HOME_PATH);
  });

  it("redirects to sign-in when destination resolution fails", async function testFailureRedirect() {
    const router = createRouter();

    vi.mocked(resolvePostAuthDestinationAction).mockResolvedValue({
      ok: false,
      errorCode: "UNAUTHORIZED",
    });

    await replaceToPostAuthDestination(router);

    expect(router.replace).toHaveBeenCalledWith(SIGN_IN_PATH);
  });
});

function createRouter() {
  return {
    replace: vi.fn(),
  };
}
