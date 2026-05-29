# useEffect Guideline

## Scope

- Applies to client components, custom hooks, and local interactive UI in `apps/web/src/features/*`, `apps/web/src/components/*`, and `apps/web/src/hooks/*`.
- The goal is to keep render logic clean, avoid implicit control flow in dependency arrays, and use effects only when React is truly synchronizing with something outside React.
- Shadcn-managed `apps/web/src/components/ui/**/*` and `apps/web/src/hooks/use-mobile.ts` are deliberate upstream-compatibility exceptions.

## Source of truth

This guideline is based on the official React docs:

- https://react.dev/learn/you-might-not-need-an-effect
- https://react.dev/learn/synchronizing-with-effects
- https://react.dev/learn/removing-effect-dependencies
- https://react.dev/reference/react/useEffect
- https://react.dev/reference/react/useEffectEvent
- https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect

## Short version

- `useEffect` is an escape hatch for synchronizing React with an external system, not the default tool for application control flow.
- If there is no external system involved, you very likely do not need an effect.
- Derived data belongs in render, user-driven actions belong in event handlers, and reset-on-identity-change belongs in `key` or another remount boundary.
- A dependency array should describe synchronization inputs, not carry the business logic of an entire feature.
- Every unnecessary effect adds implicit timing: extra renders, stale closures, race conditions, and harder-to-read code.

## Core rule

- Raw `useEffect` is a suspicious default in normal application code.
- If code is not synchronizing the component with an external system outside React, `useEffect` is very likely the wrong primitive.
- If you need mount or unmount sync with a browser API, DOM listener, timer, or third-party widget, prefer `useMountEffect()` over ad-hoc `useEffect(..., [])`.
- `useLayoutEffect()` has an even higher bar: use it only for DOM measurement or pre-paint sync that would visibly flicker in `useEffect`.

## Why this guardrail exists

- Dependency arrays hide coupling. A refactor that looks unrelated can silently change effect behavior.
- Effect chains (`A` sets state, which triggers `B`) introduce time-driven control flow that is hard to trace and easy to regress.
- Debugging is worse because instead of one clear entry point like render or a handler, you are asking "why did this run" and "why did this not run."
- In agent-generated code, `useEffect` often gets added "just in case," which creates another loop or race condition.

## Decision tree

1. Can the result be computed from props/state during render?
   - Derive it during render. Do not put it into state plus an effect.
2. Is the trigger a specific user action?
   - Move the logic into the event handler.
3. Is this data loading or a mutation of server data?
   - Use a server component, server action, or an existing data abstraction.
4. Should the component behave like a fresh instance when identity changes?
   - Use `key` or move the remount boundary higher.
5. Is the component reading an external mutable source with a snapshot and subscribe model?
   - Prefer `useSyncExternalStore`.
6. Is this mount/unmount synchronization with an external system?
   - Use `useMountEffect`.
7. If nothing else fits:
   - Name the external system, setup, cleanup, and why it cannot be handled more declaratively.

## Default alternatives

### Derive values during render

- Do not hide a derived value in state if it can be computed from current props/state.
- Typical anti-pattern: `useEffect(() => setX(deriveFromY(y)), [y])`.
- Prefer a direct calculation or a pure helper.

### Do actions in event handlers

- If the user clicks, submits a form, or changes an input, do the work directly in the handler.
- Do not create a pattern like `setShouldRun(true)` -> effect -> side effect -> reset flag.
- POST requests, redirects, toasts, or analytics tied to a specific submit belong in the handler, not in a dependency array.

### Use server/data abstractions for data

- Do not write custom fetch orchestration in an effect when a server component, server action, query hook, or another shared data layer already exists.
- If the data is needed to open the page and UX does not suffer, prefer server-side loading in the route/page/server wrapper.
- Client-side loading is acceptable when it is a deliberate UX tradeoff and should not block the first render of the entire page.
- `useMountEffect` is not an automatic replacement for fetch in `useEffect`; moving fetch into a mount helper does not solve the architectural problem.

### Avoid reflexive route refreshes

- Treat `router.refresh()` as a last resort for server-driven views, not as the default after every mutation.
- If you already have a local or shared source of truth in React, update that directly and do not duplicate it with a full refresh.
- The anti-pattern is: mutation succeeds -> patch data locally -> immediately call `router.refresh()`.
- After `router.push()` or `router.replace()`, adding another `router.refresh()` usually makes no sense.

### Handle reset with remount

- If the component should behave like a fresh instance when identity changes, use `key`.
- Do not handle "reset when X changes" with an effect that manually clears state or reruns init logic.
- The parent should own the orchestration boundary; the child should receive valid preconditions.
- If you need to wait for preconditions, conditional mounting is often better than a guard inside an effect.

### Handle subscriptions with useSyncExternalStore

- If you are dealing with an external mutable signal with a synchronous snapshot and subscribe/unsubscribe API, prefer `useSyncExternalStore`.
- Typical candidates: auth session store, `matchMedia`, scroll/visibility/online state, and BroadcastChannel-backed state.
- The effect should not live inside the component; the component should read a snapshot and the store should own subscription lifecycle.

### Use useHydrated only for hydration guards

- If the problem is only that the server cannot know the same snapshot as the browser until hydration, prefer a small hydration guard hook like `useHydrated()`.
- This is most useful for client-only UI tied to browser runtime, for example `next-themes`.
- `useHydrated()` is not a direct replacement for a generic `isMounted` hook.
- `useHydrated()` is not a general replacement for `useEffect`; it is a narrow server/client snapshot guard.

### Isolate mount/unmount sync into useMountEffect

- The common exception is synchronization with an external system outside React.
- Typical examples: `addEventListener`/`removeEventListener`, timer setup/cleanup, third-party widget init/destroy, clipboard cleanup, imperative focus, or scroll on mount.
- `useMountEffect` is not a universal replacement for a bad `useEffect`. If there is no mount/unmount sync with an external system, do not use the helper.
- Smell test: are you really synchronizing an external system, and is the behavior naturally setup on mount plus cleanup on unmount?

## When useEffect is a bad signal

- The effect only derives state from other state or props.
- The effect does `fetch(...).then(setState)` or manual async data orchestration.
- The effect is triggered by a user action that already has a clear event entry point.
- The effect sets a flag state like `submitted`, `shouldRun`, or `isReady`, and only then performs the real action.
- The effect resets local state when `id`, `slug`, `tab`, `step`, or similar identity changes.
- The effect keeps two local sources of truth "in sync" only so the dependency array can drive business logic.
- The effect exists only for debug logging or `console.log` choreography.
- Reading the code requires mentally simulating the dependency array to understand why something happened.

## When to leave the effect alone

- Browser event subscriptions like `window.addEventListener(...)`.
- `matchMedia`, `ResizeObserver`, `IntersectionObserver`, and similar browser subscriptions.
- Third-party widget lifecycle.
- Imperative DOM sync after mount when it cannot be handled declaratively.
- Small logging/reporting effects when they are not a source of coupling or race conditions.
- Even in these cases, prefer small isolated effects with a clear setup/cleanup contract.

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
