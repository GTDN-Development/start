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
- Smell test: you are about to write `useEffect(() => setX(deriveFromY(y)), [y])` or keep state that only mirrors props/state.

### Move logic to the event handler

- Replace `setSubmitted(true) -> effect -> POST/toast/redirect` with direct logic in the submit handler.
- Keep the event-specific side effect close to the event source.
- Smell test: state is only acting as a flag so an effect can do the real work.

### Use server/data abstractions

- Replace manual `fetch(...).then(setState)` orchestration with server components, server actions, or the existing data layer.
- Prefer a single source of truth over client effect-driven cache duplication.
- Smell test: the effect does `fetch(...).then(setState(...))` and starts rebuilding caching, retries, cancellation, or stale handling.

### Reset with `key`

- If a component should behave like a fresh instance when identity changes, key the subtree by that identity.
- Do not manually clear local state in an effect on every identity change.
- Prefer conditional mounting or a parent-owned remount boundary when preconditions are not met yet.

### Subscribe with `useSyncExternalStore`

- Use this when there is a synchronous snapshot and subscription API.
- Good repo candidates: auth session cache, `matchMedia`, scroll/visibility/online state, BroadcastChannel-backed client stores.

### Use `useMountEffect`

- Reserve for mount/unmount synchronization with browser APIs, listeners, timers, widget lifecycle, or imperative cleanup.
- Do not treat `useMountEffect` as a lint bypass.
- Smell test:
  - you are synchronizing with an external system
  - the behavior is naturally "setup on mount, cleanup on unmount"
- Failure mode note: mount-only sync bugs are usually binary and loud, while direct `useEffect` bugs often degrade gradually into flaky behavior, performance regressions, or loops.

## Tree design heuristic

- Use the rule as a forcing function for cleaner tree ownership.
- Parents should own orchestration and lifecycle boundaries.
- Children should assume preconditions are already met.
- Prefer conditional mounting over guards inside effects when the external sync should only exist after some prerequisite is true.

## Repo-specific hotspots

- Auth flash success UX: prefer redirect state, cookie state, or render-time status UI over `sessionStorage + mount effect`.
- Invite auth-required redirect: prefer a server redirect path that can set state before redirecting, rather than a client effect that immediately calls a server action.
- Auth session bootstrap: prefer lazy external-store initialization from store subscription code, not from component effects.
- Dev-only debug logging: delete it or move it to the event source instead of keeping a persistent effect.
- When reviewing agent-written code, treat "added just in case" effects as high-risk by default.
