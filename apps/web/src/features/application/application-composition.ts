import type PocketBase from "pocketbase";
import type { UsersRecord } from "@/types/pocketbase";
import { APP_HOME_PATH, getInviteHref, getWorkspaceOverviewHref } from "@/config/routes";
import type { AppHref } from "@/i18n/navigation";
import type { WorkspaceNavigationItem } from "@/features/workspaces/workspace-navigation-types";
import {
  clearActiveWorkspaceSlugCookie,
  clearPendingInviteTokenCookie,
} from "@/server/workspaces/workspace-cookie";
import {
  getActiveWorkspaceSlugCookie,
  getPendingInviteTokenCookie,
} from "@/server/workspaces/workspace-cookie";
import {
  listUserWorkspacesWithClient,
  resolvePostAuthDestination,
} from "@/server/workspaces/workspace-resolution-service";
import type { ServerWorkspaceResponse, UserWorkspace } from "@/server/workspaces/workspace-types";

export type ApplicationWorkspaceNavigation = {
  workspaces: WorkspaceNavigationItem[];
  activeWorkspaceSlug: string | null;
};

export type ApplicationShellModel = {
  applicationEntryHref: AppHref;
  workspaceNavigation: ApplicationWorkspaceNavigation | null;
};

export type ApplicationPostAuthState = {
  href: AppHref;
  activeWorkspaceSlug?: string;
  clearPendingInviteToken?: boolean;
};

export async function buildApplicationShellModel(input: {
  pb: PocketBase;
  user: UsersRecord;
}): Promise<ServerWorkspaceResponse<ApplicationShellModel>> {
  const userWorkspacesResponse = await listUserWorkspacesWithClient(input.pb, input.user.id);

  if (!userWorkspacesResponse.ok) {
    return userWorkspacesResponse;
  }

  const workspaceNavigation = await resolveApplicationWorkspaceNavigation(
    userWorkspacesResponse.data.workspaces
  );

  return {
    ok: true,
    data: {
      applicationEntryHref: workspaceNavigation?.activeWorkspaceSlug
        ? getWorkspaceOverviewHref(workspaceNavigation.activeWorkspaceSlug)
        : APP_HOME_PATH,
      workspaceNavigation,
    },
  };
}

export async function resolveApplicationPostAuthState(input: {
  userId: string;
  userEmail: string;
}): Promise<ServerWorkspaceResponse<ApplicationPostAuthState>> {
  const pendingInviteToken = await getPendingInviteTokenCookie();
  const destinationResponse = await resolvePostAuthDestination({
    userId: input.userId,
    userEmail: input.userEmail,
    pendingInviteToken,
  });

  if (!destinationResponse.ok) {
    return destinationResponse;
  }

  if (destinationResponse.data.state === "invite_redirect") {
    return {
      ok: true,
      data: {
        href: getInviteHref(destinationResponse.data.inviteToken),
        clearPendingInviteToken: true,
      },
    };
  }

  if (destinationResponse.data.state === "workspace_redirect") {
    return {
      ok: true,
      data: {
        href: getWorkspaceOverviewHref(destinationResponse.data.workspaceSlug),
        activeWorkspaceSlug: destinationResponse.data.workspaceSlug,
      },
    };
  }

  return {
    ok: true,
    data: {
      href: APP_HOME_PATH,
    },
  };
}

export async function clearSessionScopedApplicationState(): Promise<void> {
  await clearActiveWorkspaceSlugCookie();
  await clearPendingInviteTokenCookie();
}

async function resolveApplicationWorkspaceNavigation(
  workspaces: UserWorkspace[]
): Promise<ApplicationWorkspaceNavigation | null> {
  const mappedWorkspaces = workspaces.map(mapWorkspaceNavigationItem);

  if (mappedWorkspaces.length === 0) {
    return null;
  }

  const requestedActiveWorkspaceSlug = await getActiveWorkspaceSlugCookie();
  const activeWorkspaceSlug =
    requestedActiveWorkspaceSlug &&
    mappedWorkspaces.some((workspace) => workspace.slug === requestedActiveWorkspaceSlug)
      ? requestedActiveWorkspaceSlug
      : null;

  return {
    workspaces: mappedWorkspaces,
    activeWorkspaceSlug,
  };
}

function mapWorkspaceNavigationItem(workspace: UserWorkspace): WorkspaceNavigationItem {
  return {
    id: workspace.id,
    slug: workspace.slug,
    name: workspace.name,
    role: workspace.role,
    avatarUrl: workspace.avatarUrl,
  };
}
