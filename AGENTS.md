# Start Repository Instructions

This repository uses `pnpm` workspaces and Turborepo.

## Scope

- `apps/web/**`: follow [apps/web/AGENTS.md](/Users/fanda/Dev/start/apps/web/AGENTS.md)
- `apps/pocketbase/**`: follow the PocketBase rules below
- `infra/**`: follow the infrastructure rules below
- repo root: workspace tooling, scripts, docs, and cross-app configuration only

## Repo Rules

- Keep app-specific code and config inside the owning `apps/*` directory.
- Keep deploy wrappers for external services inside the owning `infra/*` directory.
- Do not introduce shared packages, provider layers, adapters, registries, or compatibility facades before there is a real current need.
- Prefer direct imports, concrete files, and explicit composition. Small duplication is acceptable when an abstraction would hide simple control flow.

## PocketBase App Rules

These rules apply to `apps/pocketbase/**`.

- Treat `apps/pocketbase` as a PocketBase deployment app, not as a Next.js or Node application.
- Keep the structure direct: `Dockerfile`, `pb_migrations`, `pb_hooks`, `pb_public`, and focused docs.
- Do not edit already deployed migrations in place; add a new migration for each schema change.
- Keep schema and auth configuration in committed migrations, but keep environment-specific settings outside the repository.
- Never commit `pb_data/` or local PocketBase binaries.

## Infrastructure Rules

These rules apply to `infra/**`.

- Treat `infra/*` directories as deployment wrappers for external services, not application packages.
- Keep each wrapper focused on the service's Dockerfile, deployment config, and focused docs.
- Do not add package manager metadata unless the infrastructure wrapper actually needs its own scripts or dependencies.
