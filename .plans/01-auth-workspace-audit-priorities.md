# Auth, Workspace and Redirect Audit Priorities

Date: 2026-03-25

## Context

Invite acceptance flow itself looks correct:

- invite -> auth -> back to invite -> accept -> redirect to invited workspace

The main issues are around general post-auth entry, application entry consistency, and client-side
workspace navigation drift.

## Priorities

### P1. Unify post-auth entry into one canonical decision point

Current state:

- invite flow is handled correctly
- outside invite flow, the code still carries `workspace_redirect` branches
- the actual resolver currently returns only `invite_redirect` or `app`

Why this matters:

- auth, verify-email, and confirm-email-change no longer share one clear post-auth policy
- dead branches increase drift and make future changes risky

Primary references:

- `src/server/workspaces/workspace-resolution-service.ts`
- `src/features/auth/actions/auth-actions.ts`
- `src/features/auth/post-auth-redirect.ts`
- `src/app/[locale]/(auth)/(flow)/verify-email/page.tsx`

### P1. Remove the split between `applicationEntryHref` and active workspace resolution

Current state:

- the application layout repairs an invalid active workspace locally
- `applicationEntryHref` is computed separately from the raw cookie
- header links, account back link, and user menu can point somewhere else than the sidebar state

Why this matters:

- navigation becomes inconsistent inside the same shell
- users can see one workspace as active and still be sent to `/app` or an old workspace

Primary references:

- `src/app/[locale]/(application)/layout.tsx`
- `src/features/application/application-entry.ts`
- `src/features/application/application-root.tsx`
- `src/features/application/application-page-header.tsx`
- `src/features/account/account-hero-back-link.tsx`
- `src/features/account/user-account-menu.tsx`

### P2. Consolidate client-side workspace navigation state

Current state:

- the workspace navigation context only supports patching an existing workspace
- create, leave, and delete flows do not fully synchronize the in-memory workspace state
- current route context can temporarily drift from the workspace list in the shell

Why this matters:

- scope switcher and generated workspace links can be temporarily wrong
- the issue is small at first but compounds as more workspace flows are added

Primary references:

- `src/features/workspaces/workspace-navigation-context.tsx`
- `src/features/workspaces/workspace-create-drawer.tsx`
- `src/features/workspaces/settings/general/workspace-leave-settings-item.tsx`
- `src/features/workspaces/settings/general/workspace-delete-settings-item.tsx`
- `src/features/workspaces/settings/members/workspace-members-management-settings-item.tsx`
- `src/features/application/workspace-routing.ts`
- `src/features/application/application-menu-tree.tsx`

### P2. Define one shared policy for where to go after workspace mutations

Current state:

- create goes to workspace overview
- slug change goes to workspace settings with new slug
- leave and delete go to `/app`
- workspace switching goes to workspace overview

Why this matters:

- the behavior is distributed across several files
- the rules are not obviously wrong, but they are not expressed in one place
- this is a likely source of future UX drift

Primary references:

- `src/features/application/scope-switcher.tsx`
- `src/features/workspaces/settings/general/workspace-url-settings-item.tsx`
- `src/features/workspaces/settings/general/workspace-leave-settings-item.tsx`
- `src/features/workspaces/settings/general/workspace-delete-settings-item.tsx`
- `src/features/workspaces/settings/members/workspace-members-management-settings-item.tsx`

### P3. Clean up small redirect/helper duplications before they spread

Current state:

- localized redirect helpers are duplicated in invite routes
- redirect decisions are spread across proxy, auth guest layout, email-link route, and flow pages

Why this matters:

- not an acute bug today
- but this is how redirect behavior slowly drifts between features

Primary references:

- `src/app/[locale]/(auth)/(flow)/invite/[token]/start/route.ts`
- `src/app/[locale]/(auth)/(flow)/invite/[token]/accept/route.ts`
- `src/proxy.ts`
- `src/app/api/pocketbase/email-link/route.ts`
- `src/app/[locale]/(auth)/(guest)/layout.tsx`

## Recommended Order

1. Unify post-auth entry.
2. Fix `applicationEntryHref` vs active workspace consistency.
3. Consolidate workspace navigation state.
4. Define one policy for post-mutation redirects.
5. Clean up smaller redirect/helper duplications.
