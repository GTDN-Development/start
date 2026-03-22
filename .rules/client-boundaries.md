# Next.js Boundary Rules

## Default

- Use `"use client"` only on real client entry points.
- Keep leaf components and helpers plain when they live inside an existing client subtree.
- Prefer the highest truthful client boundary, not the most local one.

## When Next.js Warns About Serializable Props

- First check whether the file should be a client entry point at all.
- If not, remove `"use client"` from that file and keep the boundary in the parent.
- Do not rename normal callbacks to fake `*Action` props just to silence the warning.

## Server Actions vs Client Callbacks

- Use action-style naming only for real Server Actions.
- Props like `onSuccess`, `onOpenChange`, `onInviteCreated`, or `reset` are normal client callbacks and should stay named that way.

## Helpers

- Client helpers usually do not need `"use client"`.
- Prefer minimal local contracts over wide framework types.
- If a helper only needs `router.replace`, type only `replace`.

## Architecture

- Do not add providers, reducers, or abstraction layers just to move callbacks around.
- Prefer direct composition and clear parent ownership of client state.
- Large files are fine if the boundary and ownership stay clear.

## Quick Check

- Is this file a real server-to-client boundary?
- Would removing `"use client"` keep behavior the same inside a client subtree?
- Is this a normal callback rather than a Server Action?
- Is the fix reducing indirection rather than adding it?
