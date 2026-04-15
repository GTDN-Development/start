# Back Navigation

## What This Solves

This primitive handles "back" UI that behaves differently based on navigation context.

- direct entry or new tab: render a fallback link such as "Back to contact"
- internal client-side navigation: render a short back action such as "Back"

The goal is a simple shared UI primitive without coupling page code to browser history heuristics.

## API

File:

- [back-navigation.tsx](/Users/fanda/Dev/start/apps/web/src/components/ui/back-navigation.tsx)

Exports:

- `BackNavigationProvider`
- `useBackNavigation()`
- `BackNavigation`
- `BackLink`

## How It Works

`BackNavigationProvider` tracks the previous app pathname through `usePathname()` and an internal `usePreviousValue()` helper.

That means:

- fresh page load has no previous pathname, so fallback content is used
- in-app route transitions have a previous pathname, so the back action is enabled

## Recommended Usage

Use `BackLink` for the common page-level case where you want:

- a fallback internal link
- a different label when back navigation is available

Use `useBackNavigation()` or `BackNavigation` when a custom render is needed.

## Current Consumers

- [support page](</Users/fanda/Dev/start/apps/web/src/app/[locale]/(marketing)/contact/support/page.tsx>)
- [sales page](</Users/fanda/Dev/start/apps/web/src/app/[locale]/(marketing)/contact/sales/page.tsx>)
- [blog detail page](</Users/fanda/Dev/start/apps/web/src/app/[locale]/(marketing)/blog/[slug]/page.tsx>)
