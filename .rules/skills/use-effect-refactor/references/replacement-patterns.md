# Replacement Patterns

## Trigger classification

- `render`: The value can be computed from current props/state during render.
- `user event`: The logic should run because the user clicked, submitted, changed input, or triggered another explicit event.
- `identity change`: The UI should restart for a new `id`, `slug`, `tab`, or step.
- `external store`: The component reads mutable state that lives outside React and offers snapshot + subscribe semantics.
- `mount sync`: The component must connect to or clean up an external system when it appears or disappears.

## Preferred replacements

### Derive in render

- Replace `useEffect(() => setDerived(...), [...])` with direct computation in render or a pure helper.
- If only the initial value should change when identity changes, move the boundary up and remount with `key`.

### Move logic to the event handler

- Replace `setSubmitted(true) -> effect -> POST/toast/redirect` with direct logic in the submit handler.
- Keep the event-specific side effect close to the event source.

### Use server/data abstractions

- Replace manual `fetch(...).then(setState)` orchestration with server components, server actions, or the existing data layer.
- Prefer a single source of truth over client effect-driven cache duplication.

### Reset with `key`

- If a component should behave like a fresh instance when identity changes, key the subtree by that identity.
- Do not manually clear local state in an effect on every identity change.

### Subscribe with `useSyncExternalStore`

- Use this when there is a synchronous snapshot and subscription API.
- Good repo candidates: auth session cache, `matchMedia`, scroll/visibility/online state, BroadcastChannel-backed client stores.

### Use `useMountEffect`

- Reserve for mount/unmount synchronization with browser APIs, listeners, timers, widget lifecycle, or imperative cleanup.
- Do not treat `useMountEffect` as a lint bypass.

## Repo-specific hotspots

- Auth flash success UX: prefer redirect state, cookie state, or render-time status UI over `sessionStorage + mount effect`.
- Invite auth-required redirect: prefer a server redirect path that can set state before redirecting, rather than a client effect that immediately calls a server action.
- Auth session bootstrap: prefer lazy external-store initialization from store subscription code, not from component effects.
- Dev-only debug logging: delete it or move it to the event source instead of keeping a persistent effect.
