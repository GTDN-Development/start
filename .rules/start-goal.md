# Start Goal

This repository is a pre-launch starter template under active development.
The primary goal is to reach a clean, opinionated, low-debt baseline before real projects or users depend on it.

## What We Optimize For

- architectural correctness over temporary convenience
- one clear and consistent way to implement common flows
- explicit Next.js 16 boundaries and server responsibilities
- direct PocketBase-backed implementation without unnecessary abstraction
- readable top-to-bottom control flow
- predictable file placement and low cognitive load for contributors

## What We Do Not Optimize For Yet

- preserving temporary patterns just because they already exist
- compatibility shims unless they solve a real current problem
- minimizing churn inside the template itself
- abstractions for hypothetical reuse

## Baseline Rules

- render-time server code is read-only
- cookie writes, redirects with side effects, and other mutations belong only in response-writing boundaries
- prefer direct flows such as `route/page -> action or route handler -> service -> repository/helper`
- prefer one explicit implementation over multiple partial patterns
- if the current baseline is wrong, fix the baseline instead of teaching contributors the wrong pattern

## Rewrite Bias

Rewriting is acceptable when it improves the template baseline.
If a pattern is architecturally wrong, inconsistent, or likely to spread, prefer redesigning it now rather than carrying it into downstream projects.

That does not justify building a framework inside the starter.
Redesign should stay concrete, local, and easy to trace.

## Success Looks Like

- a new contributor can understand the main flows quickly
- auth, workspace, and cookie boundaries are explicit and consistent
- there are no hidden fallbacks that silently ignore invalid architecture
- new features extend the template by adding focused files, not generic layers
