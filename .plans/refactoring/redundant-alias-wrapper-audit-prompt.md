# Redundant Alias / Wrapper Audit Prompt

Go through the codebase and find unnecessary aliases, wrappers, and renames that only work around a name collision or copy an existing helper without adding value.

Focus mainly on these patterns:

- import aliases such as `import { foo as bar } ...`, where the alias does not resolve real ambiguity and can be removed
- a local wrapper function that only calls an imported function with the same meaning and no extra logic
- a local helper that only forwards arguments into another function and adds no validation, transformation, or domain meaning
- `const X = importedY(...)` or `function getX() { return importedY(...) }`, where it is only redundant renaming
- abstractions created only to avoid small duplication, with no semantic value
- helper names like `getConfigured*`, `resolve*`, `create*`, `build*`, `normalize*` when the implementation is only passthrough with no real transformation
- an alias/import/wrapper introduced only because there is an unnecessary local function with the same name

For each finding:

1. say why it is redundant
2. propose the simplest refactor
3. label it as:
   - safe cleanup
   - readability improvement
   - possible semantic wrapper, keep as-is

Prioritize KISS:

- prefer direct import and direct call
- prefer one source of truth
- do not treat as a problem a wrapper that really adds domain meaning, validation, fallback, normalization, or boundary semantics
- do not overdo it: do not mark a helper as a smell if it has real value

I want the output as a list of concrete candidates by file, ordered by confidence. Once you have complete research, we can move on to the fixes.

Skip this audit inside `components/ui/*`.
