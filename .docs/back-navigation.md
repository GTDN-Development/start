# Back Navigation

Shared UI for links that should become a real browser back action after in-app navigation.

- Main file: [back-navigation.tsx](/Users/fanda/Dev/start/apps/web/src/components/ui/back-navigation.tsx)
- `BackLink` renders the fallback link on direct entry or new tab.
- After client-side navigation, `BackLink` renders a button that calls `window.history.back()`.
- Path history is tracked by [use-browser-pathname-state.ts](/Users/fanda/Dev/start/apps/web/src/hooks/use-browser-pathname-state.ts) with `useSyncExternalStore`.
- Use `BackNavigation` or `useBackNavigation()` only for custom rendering.

Current consumers: support, sales, blog detail, and account settings back links.
