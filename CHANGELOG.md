# Changelog

## 26-05-29

- Move changelog to the repository root so it tracks the whole project, not only `apps/web`.
- Rename changelog surfaces to version history across routes, menu labels, docs, and content.
- Rename the Czech brand page route and copy to brand identity.
- Reorganize repository docs and adoption checklist.
- Add repository `AGENTS.md` instructions for workspace, PocketBase, and infrastructure boundaries.
- Consolidate PocketBase migrations into one initial schema baseline.
- Remove unused about pages and simplify brand assets config.
- Add accordion FAQ component to the marketing contact page.
- Document Shoptet feed sync scheduling context.
- Clarify PocketBase deployment env requirements.
- Use Turnstile test keys for local registration.
- Set toast notifications to the top center and shorten layout banner cache revalidation.
- Fix organization invite avatar URLs, document export breadcrumbs, invalid avatar toast copy,
  layout banner dismissal, and localized banner links.

## 26-05-28

- Move email delivery and email templates into PocketBase.
- Move Mailpit and Gotenberg deployment wrappers into `infra/`.
- Remove newsletter flow and related docs.
- Add configurable brand assets page.
- Add cookie-backed layout banner dismissal.
- Restore Suspense around marketing layout banners.
- Silence optional layout banner fetch failures.
- Tighten PocketBase support attachments.

## 26-05-22

- Add document export routing and loading state.
- Refine document export PDF defaults and sidebar active state.
- Simplify document export PDF sample.
- Refactor scope switching into an application server action.
- Update repository instructions for app-specific rules.

## 26-05-20

- Add Gotenberg PDF demo integration.
- Require lowercase letters in strong passwords.

## 26-05-18

- Tune blog cache behavior and add blog post skeleton loading state.
- Raise support attachment limit to 8 MB.
- Restore PocketBase auth cookie expiry.
- Fix remembered session sign-out restart coverage.
- Remove auth alert info from PocketBase email.
- Clarify organization feature flag defaults.
- Centralize legal routes in menu config.
- Refactor email normalization and organization role ordering.

## 26-05-15

- Align Start App branding, SEO, legal defaults, and placeholder copy.
- Reset the app changelog baseline for the current Start App era.
- Consolidate web config into product and legal modules.
- Apply shadcn preset `b4gfqwiIa`.
- Hide scope switcher when organizations are disabled.
- Restore avatar fallback after removing profile photos.
- Unify organization members settings spacing.

## 26-05-14

- Add organization feature toggle and enable organizations in E2E.
- Add PocketBase newsletter subscriptions capture.
- Add daily cleanup for cookie consent events.
- Sanitize blog HTML before rendering and hide draft posts.
- Disallow SVG avatars in PocketBase.
- Harden blog, email, cookie consent, and support validation.
- Defer blog and sitemap rendering to request time to avoid PocketBase build failures.
- Fix expired invites, organization limits, PocketBase E2E auth rate limits, and transient auth
  errors for unverified sessions.
- Trim README docs and align web README with the repo structure.

## 26-05-07

- Rename workspace terminology to organization terminology across app, tests, and docs.
- Add password policy configuration and respect password policy counts in validation.
- Update email templates.
- Split PocketBase hooks by responsibility.
- Set new users' email visibility by default.
- Add E2E coverage for account display name updates.
- Expand docs with auth, organization, and application guidance.
- Simplify tooling docs and PocketBase typegen.
- Fix PocketBase typegen env import.
- Replace deprecated `FormEvent` usage.
- Add domain context glossary.

## 26-05-06

- Refactor workspace auth to PocketBase-first adapters.
- Refactor workspace mutations, auth cookies, and invite coordination.
- Add PocketBase smoke tests for workspace hooks.
- Fix PocketBase workspace hook runtime regression.
- Tighten workspace drift and docs.

## 26-04-30

- Simplify auth runtime and remove session sync.
- Simplify workspace and PocketBase deployment layout.
- Document squashed PocketBase schema snapshot.
- Kill the web dev server before running E2E.
- Clean up false positives and footer scroll button behavior.
- Add agent skills and `skills-lock.json`.

## 26-04-17

- Unify auth resolution and simplify device session handling.
- Simplify workspace members and auth runtime hotspots.
- Update repository instructions for app-specific rules.

## 26-04-16

- Burn down remaining coordination-tax hotspots.
- Remove transitional workspace and account seams.
- Contract coordination-tax boundaries across auth, account, and workspaces.
- Add coordination-tax baseline command and docs.

## 26-04-15

- Simplify local dev and split stack orchestration from web dev.
- Add `dev:full` shortcut for local stack and web dev.
- Standardize Turbo root commands and rename `check-types`.
- Unify repo-wide Prettier baseline and formatting commands.
- Use default Next.js Turbopack commands.
- Add shadcn Navigation Menu component.
- Unify site navigation around shared menu data.
- Update auth flow page design and workspace invites.
- Add cross-device password change E2E coverage.
- Fix invite E2E selectors, auth link hydration, signup email retries, verification actions,
  workspace creation rollback, active workspace cookie cleanup, and device session TTLs.

## 26-04-10

- Restore PocketBase workspace authorization and invite inspect flow.
- Add workspace guard tests and harden member sorting.
- Add E2E coverage for support form submission flow.
- Add E2E helper for removing workspace members.
- Add PocketBase smoke test and ignore generated message types.
- Refactor workspace membership access resolution.
- Fix account deletion cleanup, invite mismatch handling, active workspace slug cookie on rename,
  Prettier drift, and PocketBase typegen output.

## 26-04-09

- Switch E2E and local dev to a local PocketBase + Mailpit stack.
- Simplify workspace auth and move coarse access rules to PocketBase.
- Lock down user device session access rules.
- Sync PocketBase workspace auth rules and invite inspect hook.
- Fix repo tooling and stop tracking generated message types.

## 26-04-08

- Simplify auth session runtime and cookie handling.
- Simplify env contracts and standardize public URL config.
- Remove redundant auth and PocketBase wrappers.
- Fix public env access in client bundles.

## 26-04-07

- Migrate web and PocketBase into a `pnpm` Turborepo monorepo.
- Add Railway config and deployment docs for PocketBase Docker deploy.
- Replace Mailtrap with Mailpit for dev and test email flows.
- Fix PocketBase Docker build for amd64 and arm64.
- Fix Railway PocketBase Docker context and document Railway root directory requirement.

## 26-04-03

- Add high-value Vitest and Playwright coverage for auth, account, device sessions, invites, and
  workspace flows.
- Refactor auth, account, workspace, feature action, metadata, and app composition boundaries.
- Update docs and upgrade frontend and mail dependencies.
- Simplify ESLint and remove home feature link wrappers.
- Add Start goal rules for template baseline.

## 26-03-26

- Add Vitest and Playwright testing foundation.
- Add auth E2E signup flow, auth E2E coverage, and shared test helpers.
- Sign out all devices after password changes.
- Require sign-in again after email change confirmation.
- Simplify device session cleanup and cap oldest logins.
- Handle workspace route errors explicitly.
- Fix workspace route errors and verification link retries.
- Add `EMAIL_SECURE` env for Nodemailer transport and update test env examples.

## 26-03-24

- Split application routes into account and shell groups.
- Split application and account shell boundaries.
- Enforce hard email verification before app access.
- Refactor workspace members for multi-owner and self-leave flows.
- Add Terms of Service page, config, and translations.
- Add cookie preferences to account profile.
- Improve cookie settings dialog accessibility and disclosure.
- Centralize shared app routes and workspace href helpers.
- Clarify workspace settings labels and metadata.

## 26-03-23

- Refactor workspace invite flow to use inspect-first acceptance.
- Refactor app-first workspace flows and remove personal workspaces.
- Clarify personal and workspace scope in the application shell.
- Refine workspace entry and scope switcher UX.
- Show personal profile in scope switcher.
- Move sidebar support and cookie actions to the footer.
- Replace personal app home with overview placeholders.
- Refine application header and simplify account navigation.
- Add invitation copy link.

## 26-03-22

- Add default avatar color plan and deterministic avatar fallbacks.
- Use hashed colors for all workspace avatar fallbacks.
- Add preferences settings page to account settings.
- Reduce Suspense remounts after client-side server actions.
- Remove manual workspace slug and auto-generate workspace URL.
- Sync application auth state after session refresh.
- Fix auth refresh for settings and email verification.
- Lazy-load avatar image compression to avoid SSR crashes.
- Handle invite mismatch and post-auth workspace outcomes.
- Persist active workspace on direct invite accept.

## 26-03-21

- Add admin roles and member counts to workspaces.
- Add workspace resolution service and migrate usage.
- Improve shell-aware error boundaries.
- Improve application loading and settings navigation.
- Hide Members tab in personal workspaces.
- Fix workspace routing and in-app not found states.

## 26-03-19

- Add React Email support and development script.
- Implement localized React Email templates and docs.
- Add email logo asset and render it in templates.
- Add support link to the application sidebar.
- Update site name to Start App by Gtdn.
- Update sidebar styles, navbar borders, badge variant, toast messages, and workspace settings
  translations.
- Fix invite acceptance redirect for signed-out users and workspace avatar sync after avatar
  removal.

## 26-03-17

- Add homepage feature sections.
- Add contact cards and contact slugs.
- Add support form.
- Update support form flash handling and marketing header.
- Align app with updated shadcn preset structure.
- Relax lint rules for shadcn preset files.

## 26-03-14

- Integrate Turnstile CAPTCHA across auth flows.
- Organize workspace feature into more files.
- Harden invite flow, auth session cleanup, and app shell error handling.
- Improve device session heartbeat handling and cleanup.
- Normalize schemas and config.

## 26-03-12

- Refactor auth and account flows to server actions.
- Add first working workspace implementation.
- Add create-workspace drawer.
- Preserve current subpage on workspace switch.
- Convert marketing forms to actions.
- Add permissions UX plan for multi-workspace.
- Set max workspace name length to 32.

## 26-03-03

- Stabilize PocketBase auth and document testing baseline.
- Migrate forms to TanStack React Form.
- Rename dashboard to overview and login to sign-in.
- Add Terms of Service page, config, and translations.
- Display forgot password link near the password input.
- Move EmailNotVerifiedBanner to new auth path.

## 26-02-24

- Add PocketBase package, typegen, environment docs, and auth flow.
- Implement auth flow with PocketBase.
- Refactor PocketBase cookies and same-origin logout.
- Implement KISS PocketBase auth flows and account UI polish.
- Add avatar component and update user menu design.
- Add page metadata helper and new default OG image.
- Add consent API and migrate PocketBase env vars.
- Improve verify email flow.

## 26-02-20

- Add new home page direction and new login/sign-up page design.
- Update copy to Production-Ready SaaS Starter Template.

## 26-02-16

- Update branding and design of the app (new logo, fonts, layout, pages etc...).
- Add explicit menu config and update translations.
- Switch font to Inter and remove Features section.
- Add auth layout and update footer nested item rendering.

## 26-02-06

- Migrate UI library to `@base-ui/react` primitives and drop `radix-ui`.
- Refactor components to use new `render` prop via `useRender` and drop old `asChild` prop.
- Update imports and usage across whole app (Button, DropdownMenuTrigger, Nav).

## 26-02-05

- Implement `next-intl` and everything related to it.
- Translate app strings.
- Add locale-based routing and translations with `next-intl`.
- Refactor navigation and add proper translations to it.

## 26-02-03

- Update packages and add security patches.
- Introduced App Router route groups for marketing/auth/dev and mirrored component structure.
- Added dev-only component + color playground pages with production guard.
- Added login/sign-up pages, forms, and stub API routes.
- Updated overall folder structure and reflect the changes inside `AGENTS.md`.

## 26-01-12

- Add `<CoppyButton />` component with `useClipboard` hook.
- Changed a `<Header />` layout a bit to more modern with centered navigation.
- Update Home page features styling.

## 26-01-09

- Updated `<Container />` component implementation (unified sizing with screen breakpoints and
  default tailwindcss `.container` class).
- Updated `<Hero />` component and created brand new `pattern.tsx`; all patterns will now be part
  of this file and not the Hero component.
- Updated packages.

## 25-11-27

- Add Newsletter.
- EsLint - Enforce ESLint stricter rules and fix violations.
- Updated all packages to latest versions.
- Add a new `spinner` component.
- Add `format` command into the `package.json`.
- Contact form updates:
  - Add field prefixing to prevent conflicts between multiple forms on the same page.
  - Move the feedback alert below the form.
  - Fix the text wrapping inside the checkbox label.

## 25-11-02

- Add `not-found.tsx` (404 page).
- Turnstile - Add dev mode placeholder when API key is missing.
- Contact form - Use standard render props pattern and international date format (as timestamp).
- Add `CHANGELOG.md` (this file).

## 25-10-27

- Add statically typed links (new Next.js 16 feature).
- Create new `contact` page and place the contact form there.
- Add cards with described features of this template on the `home` page.

## 25-10-26

- Add basic SEO - Implemented basic SEO configuration with automatic generation of OG images.
- Fix the shadcn `textarea` so it can be sized with the `rows` prop.

## 25-10-23

- Upgrade to Next.js 16 - Enable React compiler, switch to Turbopack.

## 25-10-21

- Add Cloudflare Turnstile CAPTCHA (using `@marsidev/react-turnstile`).

## 25-10-20

- Add `@svgr/webpack`.
- Update `.env.example` (so we have more clear and unified env names).
- New form system - refactored to use new shadcn `Field` component and switched to
  `@tanstack/react-form` package (previously `react-hook-form`).

## 25-10-06

- Add `AGENTS.md`.

## 25-10-03

- Cookie consent (native) - Implemented system for the whole front-end part of the cookie content
  solution with all the EU compliance requirements. This includes consent banner, settings dialog,
  server side cookie management, global app context, mechanism for loading third party scripts and
  enabling them based on the context, compliance policy text etc.

## 25-10-01

- Layout updates, dynamic links, unified config folder.
- Add example contact form.

## 25-09-30

- Modified dialogs to support scroll when content is too long to fit within the viewport.

## 25-09-XX

- Project init (file structure, layout system, header, footer, basic shadcn components, dark mode &
  theme switcher etc.).
