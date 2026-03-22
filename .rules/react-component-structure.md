# React Component Structure Guideline

## Scope

- This guideline applies to React components in `src/features/*`, `src/components/*`, and `src/hooks/*`.
- It is a readability convention, not a hard rule for every edge case.
- The goal is to keep components easy to scan top to bottom.

## Default order

Read components as:

`inputs -> state -> derived values -> actions -> sync -> UI`

Recommended order inside a component:

1. Props destructuring and simple local constants.
2. Framework, context, and navigation hooks.
3. Refs.
4. Local state.
5. Data and custom hooks.
6. Derived values.
7. Event handlers and local actions.
8. Effects and other external sync.
9. Early returns.
10. `return` with JSX.

## Notes

- Keep hooks in a stable order.
- Group related setup together and separate groups with a blank line.
- Keep derived values out of JSX when they are reused or non-trivial.
- Prefer handlers over effects for user-triggered logic.
- Follow `.rules/use-effect-guidelines.md` for raw `useEffect`.
- In components that use hooks, place conditional early returns after hook sections to avoid conditional hook calls.

## When to deviate

- Keep closely related code together if that reads better than rigid sectioning.
- Small components do not need every section.
- If setup gets too large, prefer extracting a custom hook or splitting responsibilities over shuffling code around.

## Smells

- State, derived values, handlers, and effects are mixed together without clear grouping.
- Effects sit in the middle of setup without a good reason.
- Derived values are duplicated in JSX instead of being named once above.
- A component is doing multiple interactive jobs and has become hard to scan.

## Review checklist

- Can the component be read top to bottom without jumping around?
- Are hooks grouped and stable?
- Are derived values computed before JSX?
- Are handlers grouped together?
- Is external sync isolated and small?
- Should part of the setup move into a custom hook or parent component?
