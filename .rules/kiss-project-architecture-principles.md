# KISS Project Architecture Principles

This project aims to keep technical debt as low as reasonably possible.
We follow a KISS approach with as little ceremony and accidental complexity as possible, while still treating this repository as a production-grade starter for PocketBase-based SaaS applications.
Simplicity here does not mean cutting corners. It means choosing clear, durable, maintainable solutions that hold up to real product use without introducing unnecessary architecture.

This project is a forkable SaaS starter, not a framework, plugin platform, or internal SDK.

Default goal:

- keep code easy to read top to bottom
- keep file placement predictable
- grow by adding focused files, not by building systems for hypothetical reuse

## Simplicity Bar

Use PocketBase as a style reference for operational simplicity, not as a feature-scope target.

We want features to feel closer to:

- one obvious operation per user intent
- one primary contract per operation
- one clear owner of mutable state
- one clear place for side effects and error handling
- minimal translation between route, action, service, and UI

We are not trying to remove necessary product behavior.
We are trying to remove unnecessary orchestration around that behavior.

If a simple create, update, or membership change requires tracing many wrappers, aliases, mappers, or competing state owners, the design is too indirect for this repo.

## KISS In This Repo

- prefer direct imports over indirection
- prefer concrete files over generic abstractions
- prefer explicit composition in routes, actions, and services
- prefer a few well-bounded files over many tiny files
- prefer small duplication over abstractions that hide simple control flow

Large files are acceptable if they stay coherent.
Mixed-concern files are not.

## Default Growth Rule

Extension by addition:

- add `auth-oauth-service.ts` when OAuth exists
- add `src/server/billing/` when billing exists
- add a route-local feature file near the route that needs it

Do not prepare empty abstraction layers in advance.

## Good Boundaries

Split a file only when the seam is already real:

- clearly different concerns
- different call sites
- different future growth path

Do not split a file only because it became long.
Do not create single-function files unless the concept is genuinely standalone.

## Prefer Explicit Composition

Direct function calls are the default extension model.

Prefer:

- action -> service -> repository/helper
- sign-in -> post-auth workspace resolution
- route-local orchestration

Be skeptical of:

- hook registries
- middleware pipelines
- event buses
- compatibility facades
- provider-neutral abstractions before the first real provider exists

## Overengineering Smells

- abstractions for hypothetical future reuse
- barrel files in features
- `shared/` folders inside features
- generic helper layers that only rename simple logic
- policy engines for rules that still fit clearly inside one service
- preserving old import paths after a refactor without a real need
- generic names like `manager`, `engine`, `provider`, `adapter`, `registry` for still-concrete code

## Decision Check

Before adding an abstraction, ask:

1. Do we have more than one real use case today?
2. Does it reduce current complexity instead of moving it?
3. Would a new contributor understand it faster than the direct code?
4. Could one new focused file or one direct function call solve this more clearly?

If not, keep the direct implementation.

## Mental Model To Preserve

A contributor should be able to trace behavior like this:

- route/page
- server action
- service
- repository or helper

If a change adds indirection without making current code easier to understand, it is probably overengineered for this project.
