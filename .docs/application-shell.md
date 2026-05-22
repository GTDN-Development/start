# Application Shell

The application shell is the protected logged-in frame for `/app`, `/document-export`, `/account`,
and `/o/...`.

- [ApplicationShellBoundary](/Users/fanda/Dev/start/apps/web/src/features/application/application-shell-boundary.tsx) requires a current user and redirects guests to sign in.
- [application-shell-model.ts](/Users/fanda/Dev/start/apps/web/src/features/application/application-shell-model.ts) builds the shell model: app entry href and organization navigation.
- [ApplicationRoot](/Users/fanda/Dev/start/apps/web/src/features/application/application-root.tsx) provides current account profile, menu labels, app entry href, and cross-tab sign-out sync.
- [ApplicationOrganizationRoot](/Users/fanda/Dev/start/apps/web/src/features/application/application-organization-root.tsx) provides organization navigation state.
- Personal scope uses `/app` and other personal app pages such as `/document-export`; organization
  scope uses `/o/[organizationSlug]`.
- Organization mutations return navigation patches so the sidebar/scope switcher update locally without broad refreshes.
- The active organization cookie decides the preferred app entry when it still points to an accessible organization.
- When organizations are disabled, the shell remains in personal scope and skips organization navigation.

Useful files:

- [scope switcher](/Users/fanda/Dev/start/apps/web/src/features/application/scope-switcher.tsx)
- [application sidebar](/Users/fanda/Dev/start/apps/web/src/features/application/application-sidebar.tsx)
- [menu tree](/Users/fanda/Dev/start/apps/web/src/features/application/application-menu-tree.tsx)
- [application session state](/Users/fanda/Dev/start/apps/web/src/server/application/application-session-state.ts)

Navigation convention:

- Link-like application sidebar items use `NavLink` as the only source of current-route state.
- Style active sidebar links through `data-current`; do not add parallel `isActive` calculations for
  the same link.
- Non-link/custom sidebar controls may own explicit active state when they cannot be represented as
  route links.
