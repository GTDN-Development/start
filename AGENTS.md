# Start Repository Instructions

This repository uses `pnpm` workspaces and `turborepo`.

## Scope

- `apps/web/**`: follow [apps/web/AGENTS.md](/Users/fanda/Dev/start/apps/web/AGENTS.md)
- `apps/pocketbase/**`: follow the PocketBase rules below
- repo root: use this file for workspace, shared tooling, deployment notes, and documentation changes

## Repository Rules

- Keep the workspace layout simple and predictable
- Put app-specific code and config inside the owning app directory
- Keep shared repo concerns at the root: workspace tooling, root scripts, docs, and rules
- Add new apps under `apps/*`
- Prefer direct configuration over extra shared packages until there is a real need for them

## PocketBase Rules

These rules apply to `apps/pocketbase/**`.

- Treat `apps/pocketbase` as a deployment app for PocketBase, not as a Next.js or Node application
- Keep the structure direct: `Dockerfile`, `pb_migrations`, `pb_hooks`, `pb_public`, and focused docs
- Keep schema and auth configuration in committed migrations
- Keep environment-specific settings outside the repository
- Do not edit already deployed migrations in place; add a new migration for each schema change
- `pb_data/` and local PocketBase binaries are local-only and must never be committed
- Keep Railway and Docker behavior explicit and easy to trace from the files in `apps/pocketbase`
