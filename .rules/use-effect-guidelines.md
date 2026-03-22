# useEffect Guideline

## Scope

- This document applies to client components, custom hooks, and local interactive UI in `src/features/*`, `src/components/*`, and `src/hooks/*`.
- The goal is to keep render logic clean, avoid implicit control flow in dependency arrays, and use effects only when React is truly synchronizing with something outside React.

## Source of truth

- This guideline is based on the official React docs:
  - `https://react.dev/learn/you-might-not-need-an-effect`
  - `https://react.dev/learn/synchronizing-with-effects`
  - `https://react.dev/learn/removing-effect-dependencies`
  - `https://react.dev/reference/react/useEffect`
  - `https://react.dev/reference/react/useEffectEvent`
  - `https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect`

## Short version

- `useEffect` is an escape hatch for synchronizing React with an external system, not the default tool for application control flow.
- If there is no external system involved, you very likely do not need an effect.
- Derived data belongs in render, user-driven actions belong in event handlers, and reset-on-identity-change belongs in `key` or another remount boundary.
- A dependency array should describe synchronization inputs, not carry the business logic of an entire feature.
- Every unnecessary effect adds implicit timing: extra renders, stale closures, race conditions, and harder-to-read code.

## Why this guardrail exists

- The practical benefit from the articles and React docs is the same: fewer infinite loops, fewer race-condition regressions, and clearer control flow.
- Dependency arrays hide coupling. A refactor that looks unrelated can silently change effect behavior.
- Effect chains (`A` sets state, which triggers `B`) introduce time-driven control flow that is hard to trace and easy to regress.
- Debugging is worse because instead of one clear entry point like render or a handler, you are asking "why did this run" and "why did this not run."
- In agent-generated code this is even worse: `useEffect` often gets added "just in case," which creates another loop or race condition.

## Five default alternatives

1. Derive state, do not sync it.
2. Use server or data abstractions instead of effect-based fetching.
3. Do the work in event handlers, not in effects.
4. Use `useMountEffect` only for one-time external sync like setup-on-mount and cleanup-on-unmount.
5. Handle reset-on-identity-change with `key`, not dependency choreography.

## Core rule

- Raw `useEffect` is a suspicious default in normal application code.
- If code is not synchronizing the component with an external system outside React, `useEffect` is very likely the wrong primitive.
- If you need mount or unmount sync with a browser API, DOM listener, timer, or third-party widget, prefer `useMountEffect()` over ad-hoc `useEffect(..., [])`.
- `useLayoutEffect()` has an even higher bar: use it only for DOM measurement or pre-paint sync that would visibly flicker in `useEffect`.

## What is not the goal

- The goal is not to mechanically remove every effect at all costs.
- Legitimate effects for external sync, subscriptions, or mount/unmount lifecycle are not automatically a problem.
- The problem is using an effect as a substitute for a better model: derivation, handler logic, server/data abstraction, or a remount boundary.

## Decision tree

1. Can the result be computed from props/state during render?
   - Derive it during render. Do not put it into state plus an effect.
2. Is the trigger a specific user action?
   - Move the logic into the event handler.
3. Is this data loading or a mutation of server data?
   - Use a server component, server action, or an existing data abstraction.
4. Should the component behave like a fresh instance when identity changes?
   - Use `key` or move the remount boundary higher.
5. Is the component reading an external mutable source with a snapshot + subscribe model?
   - Prefer `useSyncExternalStore`.
6. Is this mount/unmount synchronization with an external system?
   - Use `useMountEffect`.
7. If nothing else fits:
   - Name the external system, setup, cleanup, and why it cannot be handled more declaratively.

## When `useEffect` is a bad signal

- The effect only derives state from other state or props.
- The effect does `fetch(...).then(setState)` or manual async data orchestration.
- The effect is triggered by a user action that already has a clear event entry point.
- The effect sets a flag state like `submitted`, `shouldRun`, or `isReady`, and only then performs the real action.
- The effect resets local state when `id`, `slug`, `tab`, `step`, or similar identity changes.
- The effect keeps two local sources of truth "in sync" only so the dependency array can drive business logic.
- The effect exists only for debug logging or `console.log` choreography.
- Reading the code requires mentally simulating the dependency array to understand why something happened.

## Preferred alternatives

### 1. Derive values during render

- Do not hide a derived value in its own state if it can be computed from current props/state.
- Typical anti-pattern: `useEffect(() => setX(deriveFromY(y)), [y])`.
- Prefer a direct calculation or a pure helper.

### 2. Do actions in event handlers

- If the user clicks, submits a form, or changes an input, do the work directly in the handler.
- Do not create a pattern like `setShouldRun(true) -> effect -> side effect -> reset flag`.
- POST requests, redirects, toasts, or analytics tied to a specific submit belong in the handler, not in a dependency array.

### 3. Use server/data abstractions for data

- Do not write your own fetch orchestration in an effect when a server component, server action, query hook, or another shared data layer already exists.
- Effect-based fetching easily leads to race conditions, duplicated cache logic, and unnecessary loading/error state.

### 3a. Prefer page data to be server-first

- If the data is needed to open the page and UX does not suffer, prefer server-side loading in the route/page/server wrapper.
- A client component should ideally receive initial data through props and mainly handle interaction and local UI state.
- Raw fetch in an effect is not the preferred path for page-level business data.

### 3b. Client-side data loading is an exception

- Client-side loading is acceptable when it is a deliberate UX tradeoff and you do not want to block the first render of the entire page.
- That exception should be explicitly justified in review and, when possible, briefly documented in code.
- `useMountEffect` is not an automatic replacement for fetch in `useEffect`; rewriting fetch into a mount helper does not solve the architectural problem.

### 3c. Do not refresh the whole route tree after a mutation without a reason

- Treat `router.refresh()` as a last resort for server-driven views, not as the default after every mutation.
- If you already have a local or shared source of truth in React, update that directly (`patch*`, local state, store, provider) and do not duplicate it with a full refresh.
- The anti-pattern is: mutation succeeds -> I patch data locally -> I immediately call `router.refresh()`.
- That double orchestration often needlessly activates `loading.tsx` / Suspense boundaries, worsens UX flicker, and can surface React boundary edge cases.
- If the current view still depends entirely on server-rendered props with no client store, `router.refresh()` is allowed, but it should be a deliberate exception, not a reflex.
- After `router.push()` or `router.replace()`, adding another `router.refresh()` usually makes no sense.

### 4. Handle reset with remount

- If the component should behave like a fresh instance when identity changes, use `key`.
- Do not handle "reset when X changes" with an effect that manually clears state or reruns init logic.
- The parent should own the orchestration boundary; the child should receive valid preconditions.
- If you need to wait for preconditions, conditional mounting is often better than a guard inside an effect.

### 5. Handle subscriptions with `useSyncExternalStore`

- If you are dealing with an external mutable signal with a synchronous snapshot and subscribe/unsubscribe API, prefer `useSyncExternalStore`.
- Typical candidates: auth session store, `matchMedia`, scroll/visibility/online state, BroadcastChannel-backed state.
- The effect should not live inside the component; the component should read a snapshot and the store should own subscription lifecycle.

### 5a. Handle hydration guard with `useHydrated`

- If the problem is only that the server cannot know the same snapshot as the browser until hydration, prefer a small hydration guard hook like `useHydrated()`.
- This is most useful for client-only UI tied to browser runtime, for example `next-themes`.
- `useHydrated()` is not a direct replacement for a generic `isMounted` hook.
- `useHydrated()` is not a general replacement for `useEffect`; it is a narrow server/client snapshot guard.

### 6. Isolate mount/unmount sync into `useMountEffect`

- The one common exception is synchronization with an external system outside React.
- Typical examples: `addEventListener`/`removeEventListener`, timer setup/cleanup, third-party widget init/destroy, clipboard cleanup, imperative focus, or scroll on mount.
- `useMountEffect` is not a universal replacement for a bad `useEffect`. If there is no mount/unmount sync with an external system, do not use the helper.
- Smell test:
  - are you really synchronizing an external system
  - is the behavior naturally `setup on mount, cleanup on unmount`

### 7. Keep legitimate effects small and precise

- One effect should represent one synchronization responsibility.
- Cleanup must mirror setup.
- If a legitimate effect needs to read the latest props/state without unnecessary re-subscription, consider `useEffectEvent`.

## When to leave the effect alone

- Browser event subscriptions like `window.addEventListener(...)`.
- `matchMedia`, `ResizeObserver`, `IntersectionObserver`, and similar browser subscriptions.
- Third-party widget lifecycle.
- Imperative DOM sync after mount when it cannot be handled declaratively.
- Small logging/reporting effects when they are not a source of coupling or race conditions.
- Even in these cases, prefer small isolated effects with a clear setup/cleanup contract.

## What `useMountEffect` does not solve

- `useMountEffect` is not permission to fetch on mount when the data belongs in the server/page layer.
- `useMountEffect` is not a replacement for an event handler.
- `useMountEffect` is not a replacement for deriving values during render.
- `useMountEffect` is not a replacement for syncing props into local state.
- If rewriting `useEffect` -> `useMountEffect` keeps the same control flow, it is not a real refactor.

## What `useHydrated` does not solve

- `useHydrated` is not a direct replacement for `isMounted`.
- `useHydrated` is not permission to hide app logic behind `if (!hydrated) return null`.
- `useHydrated` is not a replacement for `useSyncExternalStore` for real subscriptions or for render-time derivation.
- If the problem is not a server/client snapshot mismatch, `useHydrated` is probably not the right solution.

## Forcing function for architecture

- Restricting raw `useEffect` acts as a forcing function for a cleaner component tree.
- The parent should own orchestration and lifecycle boundaries.
- The child should ideally assume the preconditions already hold and do one thing well.
- This usually leads to simpler components, fewer hidden side effects, and clearer nesting boundaries.

## Review checklist

- What is the real trigger of the logic: render, user event, identity change, subscription, or mount/unmount?
- Which external system is the component synchronizing with?
- Could this be handled with render, a handler, `key`, a server/data abstraction, or `useSyncExternalStore` instead?
- Does cleanup exactly mirror setup?
- Does the dependency array describe reactive inputs only, or has it become a carrier for business logic?
- If an exception remains, is it explicitly justified and treated as temporary debt?

## Practical goal for this project

- Gradually remove raw `useEffect` from normal feature code.
- Treat the ESLint allowlist as a temporary list of audited exceptions, not as a precedent for more code.
- Treat `useMountEffect` as an escape hatch, not the default style.
- Treat `useHydrated` as a narrow hydration guard, not a new name for `isMounted`.
- During future refactors, audit `useMountEffect` consumers too, so the helper does not become a new name for the same problem.
- Shadcn-managed `src/components/ui/**/*` and `src/hooks/use-mobile.ts` are deliberate upstream-compatibility exceptions.
