---
name: use-effect-refactor
description: Use when auditing, refactoring, or reviewing raw useEffect/React.useEffect usage in this project, or when updating repo rules around effect removal. It guides the agent to classify each effect by trigger and replace it with render-time derivation, event handlers, remount boundaries, useSyncExternalStore, or explicit mount sync.
---

# useEffect Refactor

Use this skill when the task is about removing, reviewing, or constraining raw `useEffect` usage in this repo.

## Workflow

1. Read [../../use-effect-guidelines.md](../../use-effect-guidelines.md) and [../../../AGENTS.md](../../../AGENTS.md) before proposing a refactor.
2. Audit raw effect usage first:

```sh
rg -n "\buseEffect\b|React\.useEffect\b|\buseLayoutEffect\b" src .
rg -n "\buseMountEffect\b" src
```

3. For each effect, name the true trigger before changing code:
   - render
   - user event
   - identity change
   - external store subscription
   - mount/unmount external sync

4. Replace the effect in this order:
   - render-time derivation
   - event handler
   - server component, server action, or existing data abstraction
   - `key` remount boundary
   - `useSyncExternalStore`
   - `useMountEffect`
   - explicit exception with documented external system

5. Load [references/replacement-patterns.md](references/replacement-patterns.md) when you need concrete replacement patterns or repo-specific hotspots.

## Rules

- Do not replace a bad `useEffect` with `useMountEffect` unless the code is truly mount/unmount synchronization with an external system.
- Treat the ESLint exception list as temporary debt. If a raw `useEffect` must remain, call that out explicitly.
- For browser-backed subscriptions with a readable snapshot, prefer `useSyncExternalStore`.
- For reset-on-identity flows, prefer `key` or moving ownership up one boundary.
- For page-entry status or flash UX, prefer redirect state, cookie state, or render-time UI over `sessionStorage + effect` when practical.
- `useLayoutEffect` has the same review bar plus an additional requirement: it must need pre-paint DOM synchronization.

## Expected output

- Summarize each effect by trigger, chosen replacement, and expected risk.
- Call out which effects are legitimate exceptions versus migration targets.
- If rules or lint config change, mention the touched files explicitly.
