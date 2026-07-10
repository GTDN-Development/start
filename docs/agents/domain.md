# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Layout

This is a single-context repository.

- Read `CONTEXT.md` at the repo root before naming domain concepts.
- Read relevant ADRs in `docs/adr/` before changing architecture or revisiting prior decisions.
- If a referenced file does not exist, proceed silently. Do not create domain docs until a skill resolves real terminology or decision content.

## Use the glossary's vocabulary

When output names a domain concept in an issue title, refactor proposal, hypothesis, or test name, use the term as defined in `CONTEXT.md`. Do not drift to synonyms the glossary explicitly avoids.

If the concept you need is not in the glossary yet, either reconsider the language or note the gap for `/domain-modeling`.

## Flag ADR conflicts

If output contradicts an existing ADR, surface the conflict explicitly instead of silently overriding it.
