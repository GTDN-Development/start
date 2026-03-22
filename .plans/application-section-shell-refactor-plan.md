# Application Section Shell Refactor Plan

Date: March 22, 2026
Assumption: the current application error/loading/not-found improvement is complete and the branch already exists.

## 1. Goal

- Simplify the architecture of nested application sections so breadcrumbs, title, description, loading, and the inner sidebar each have a clear owner.
- Keep good UX:
  - the shell stays stable
  - loading appears only in the content area
  - breadcrumbs feel natural and are not "technically derived"
- Improve DX:
  - `page.tsx` focuses primarily on data and business content
  - layout/section shell owns section composition
  - metadata, title, description, breadcrumbs, and sidebar items drift less
- Keep KISS: do not build a generic framework for the whole app router if a small explicit section model is enough for the two main sections.

## 2. Current state

### 2.1 What already works well

- The application shell is already stable and route-group based.
- `error.tsx`, `not-found.tsx`, and `loading.tsx` already respect the shell and route hierarchy.
- `account` and `workspace settings` already have layout-driven loading scope, so the entire page chrome does not rerender.

### 2.2 Where the problem is

- Breadcrumbs are currently a hybrid between a UX layer and technical derivation from inner sidebar state.
- `account` and `workspace settings` currently split section responsibility across:
  - route layout
  - `page.tsx`
  - inner sidebar config
  - translations
- It is not fully clear what the source of truth is for:
  - section root label
  - current item label
  - page title
  - page description
  - loading presentation
- As nested sections grow, breadcrumbs, sidebar items, and page header copy may drift apart.

## 3. Non-goals

- Do not reshuffle the entire app router.
- Do not introduce a new global navigation framework for marketing/auth areas.
- Do not build a generic "state engine" for loading/error/empty.
- Do not optimize breadcrumbs for every edge case in a single iteration.
- Do not solve `members` and other future sections in this plan beyond architecture preparation.

## 4. Design principles

### 4.1 Source of truth must be explicit

- Breadcrumbs must not be silently derived from sidebar items.
- Sidebar items and breadcrumbs may share data, but not through hidden derivation.

### 4.2 Page files should stay thin

- `page.tsx` should ideally handle:
  - metadata
  - server data
  - content blocks
- `page.tsx` should not own shell composition when it is section chrome.

### 4.3 Layout or section shell owns section chrome

- title
- description
- breadcrumbs
- inner sidebar
- loading scope

### 4.4 UX rules

- Breadcrumbs should have at most 2 levels.
- They must be readable and natural on desktop.
- They do not have to be forced onto mobile at all costs.
- Loading stays inside the content area.
- Use skeletons only where the layout is stable enough.

## 5. Possible approaches

### Option A: Minimal explicit resolver per section

Description:

- Create small explicit resolvers for `account` and `workspace settings`.
- The layout reads the resolver and builds:
  - breadcrumbs
  - title
  - description
  - inner sidebar items

Pros:

- Smallest change.
- Very readable.
- Strong KISS fit.

Cons:

- Duplication may grow over time.
- More sections would create more ad-hoc resolvers.

### Option B: Small section config model

Description:

- Define an explicit config for each application section.
- The config owns:
  - `rootHref`
  - `rootLabelKey`
  - `items`
  - `titleKey`
  - `descriptionKey`
  - `match rules`
  - optionally `loadingVariant`
- Both layout and page read the same section model.

Pros:

- Best UX/DX balance.
- Less drift between breadcrumbs, sidebar, and header.
- Good extension path for more nested pages.

Cons:

- Slightly more abstraction than Option A.
- The config must stay disciplined, small, and explicit.

### Option C: Full section shell components

Description:

- `AccountSectionShell`
- `WorkspaceSettingsSectionShell`
- The route layout becomes a thin layer, and a feature shell component composes everything section-related.

Pros:

- Best separation of responsibility.
- Strong reusability.

Cons:

- Probably too expensive today.
- Higher number of files and layers.

## 6. Recommendation

Recommended option: Option B, but in a small version.

In practice:

- Introduce section config only for:
  - `account`
  - `workspace settings`
- Do not build any generic engine for all app sections yet.
- Build these from the config:
  - breadcrumbs
  - sidebar items
  - page title
  - page description
- Keep loading route-based as it is today, but align it with the same section layer.

This gives:

- very good UX
- readable breadcrumbs
- stable loading scope
- good long-term maintainability
- minimal overengineering

## 7. Target structure

Proposed structure:

```text
src/features/application/sections/
  account-section.ts
  workspace-settings-section.ts
  application-section-types.ts
  application-section-breadcrumbs.tsx
  application-section-layout.tsx
```

Optional, if it turns out useful:

```text
src/features/application/sections/
  account-section-loading.tsx
  workspace-settings-section-loading.tsx
```

## 8. Section model proposal

Minimal data model:

```ts
type ApplicationSectionItem = {
  id: string;
  href: AppHref;
  labelKey: string;
  icon?: string;
  matchNested?: boolean;
  activePathnames?: string[];
  activePathPrefixes?: string[];
  pageTitleKey?: string;
  pageDescriptionKey?: string;
  breadcrumbLabelKey?: string;
};

type ApplicationSectionConfig = {
  id: "account" | "workspace-settings";
  rootHref: AppHref;
  rootLabelKey: string;
  navTitleKey: string;
  rootPageTitleKey?: string;
  rootPageDescriptionKey?: string;
  items: ApplicationSectionItem[];
};
```

Important:

- `breadcrumbLabelKey` should be explicit.
- `pageTitleKey` and `pageDescriptionKey` should not be automatically derived from item labels.
- `rootLabelKey` and `rootPageTitleKey` may be different.

Example:

- a sidebar item may be `General`
- the current breadcrumb may be `Security`
- the page title may be `Security`
- the root breadcrumb may be `My Account`

These are four different roles, and there is no reason to force them together unless the UX explicitly wants that.

## 9. Responsibility proposal

### 9.1 Route layout

The route layout should:

- load locale-specific translations
- load section config
- render:
  - `ApplicationPageShell`
  - breadcrumbs
  - sidebar
  - container
  - section content wrapper

### 9.2 Section breadcrumbs renderer

A small component should:

- receive section config
- receive current pathname
- decide explicitly between:
  - root only
  - root + current

Rules:

- if the current route matches the root item, render only the root breadcrumb page
- if the current route matches a child item, render root link + current page
- no implicit dependency on loading state

### 9.3 Page

The page should:

- load data
- return content
- optionally add metadata

The page should not:

- render breadcrumbs
- render the inner sidebar
- render the root section title/description if that belongs to the shell

### 9.4 Loading

Loading should:

- stay route-driven
- render only the content fallback
- not try to change breadcrumb visibility
- use a section skeleton or loading variant by section

## 10. Concrete refactor by section

### 10.1 Account section

Goal:

- `account/layout.tsx` becomes the full owner of the shell.
- `account/page.tsx` and `account/security/page.tsx` focus mainly on content.

Move into the account section config:

- root breadcrumb label
- root page title/description
- nav items:
  - general
  - security

Result:

- consistent breadcrumbs
- consistent loading skeleton
- simpler account pages

### 10.2 Workspace settings section

Goal:

- `w/[workspaceSlug]/settings/layout.tsx` becomes the full owner of the shell.
- `settings/page.tsx` and `settings/members/page.tsx` focus mainly on content.

Move into the workspace section config:

- root breadcrumb label
- root page title/description
- nav items:
  - general
  - members

Important:

- `members` must be easy to disable for personal workspaces without breaking the rest of the shell.
- That belongs in the section config resolution layer, not in the breadcrumb renderer.

## 11. Handling the personal workspace variant

For `workspace settings`, there are two reasonable approaches:

### A. Section config factory

- `createWorkspaceSettingsSectionConfig(workspaceKind, workspaceSlug, t)`

Pros:

- cleanest option
- `members` visibility is decided immediately when the section is assembled

Cons:

- the config is not fully static

### B. Static config + filter layer

- a static config holds all items
- layout or a helper filters items by workspace kind

Pros:

- simpler original config

Cons:

- one more step of orchestration logic

Recommendation:

- A, section config factory.

## 12. Breadcrumb ergonomics

Recommended rules:

- `account`
  - `/account` -> `My Account`
  - `/account/security` -> `My Account / Security`

- `workspace settings`
  - `/w/[workspaceSlug]/settings` -> `Settings`
  - `/w/[workspaceSlug]/settings/members` -> `Settings / Members`

Note:

- The root breadcrumb should behave more like a section anchor than a literal copy of the nav label.
- If user testing later shows that `Settings / Members` is too generic, it can be revisited as:
  - `Workspace / Members`
  - `Workspace Settings / Members`

That should be a deliberate UX decision, not technical derivation.

## 13. Loading strategy

Keep:

- route-level loading
- content-only loading scope
- skeletons for stable settings layouts

Do not do:

- hide breadcrumbs through a global context
- replace breadcrumbs with a loading label
- create a different skeleton for every individual settings card unless it brings real value

Recommendation:

- keep settings skeletons generic and page-shaped
- the section shell should keep the title/description area stable
- the loading fallback should only replace content below the shell chrome

## 14. Concrete implementation phases

### Phase 1: Introduce section config

- add `application-section-types.ts`
- add `account-section.ts`
- add `workspace-settings-section.ts`
- add a helper for translating labels and resolving the current item

### Phase 2: Breadcrumb renderer

- replace the current `inner-sidebar-breadcrumbs` with a new `application-section-breadcrumbs`
- work explicitly from section config
- remove the last implicit breadcrumb derivation from sidebar items

### Phase 3: Layout refinement

- switch `account/layout.tsx` and `settings/layout.tsx` to the section config source of truth
- source title, description, breadcrumbs, and sidebar items from one layer

### Phase 4: Page thinning

- simplify `page.tsx` files
- keep only:
  - data loading
  - content blocks
  - metadata

### Phase 5: Loading alignment

- align loading files with the section shell
- keep the skeleton generic
- do not introduce more global loading coordination

## 15. Risks

- An overly clever section config could be worse than today's explicit code.
- Metadata may stay duplicated if title/description are handled half in the page and half in the shell.
- Workspace-specific route params may tempt the section config to mix with business data.

Mitigation:

- keep config small
- keep business data out of config
- keep copy keys explicit
- inject route params only into href resolution, not into the whole UI model

## 16. Acceptance criteria

- Breadcrumbs in `account` and `workspace settings` are explicit and easy to edit.
- Sidebar items, breadcrumbs, page title, and page description are composed from one section layer.
- `page.tsx` files are shorter and more content-focused.
- Loading stays limited to the content area.
- No additional global context is needed for breadcrumb/loading coordination.
- The personal workspace variant does not create conditional spaghetti.

## 17. Recommended next step

Do the first concrete refactor only for the `account` section and confirm that the model works.

If the result is good:

- apply the same pattern to `workspace settings`

That keeps the scope small, makes DX before/after easier to compare, and avoids turning it into one unnecessarily large refactor.
