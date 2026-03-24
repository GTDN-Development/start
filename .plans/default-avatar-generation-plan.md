# Default Avatar Color Plan

Date: March 22, 2026

## 1. Goal

When a workspace or user account has no uploaded avatar, the initials fallback should display a **deterministic, visually distinct background color** derived from the entity's stable identifier.

This replaces the current behavior where:

- all organization workspaces share the same emerald green fallback
- all user avatar fallbacks share the same gray `bg-muted`

## 2. Current State

### Workspace Fallback

In `src/features/workspaces/workspace-switcher.tsx`, `createWorkspaceOption` assigns:

- personal workspace: `bg-sidebar-primary text-sidebar-primary-foreground`
- organization workspace: `bg-emerald-600 text-white` (hardcoded, identical for all)

### User Fallback

In `src/components/ui/avatar.tsx`, `AvatarFallback` uses `bg-muted text-muted-foreground` for all users.

### What Already Works

- Custom avatar upload and removal for both workspaces and user accounts
- Initials computation via `getUserInitials` in `src/lib/app-utils.ts`
- All avatar components accept `className` for style overrides

## 3. Approach

Pure client-side color derivation. No server changes, no new dependencies, no stored color values.

### 3.1 Hash Function

A simple deterministic string hash that maps any string to a positive integer:

```ts
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}
```

### 3.2 Color Palette

A fixed array of ~12 visually distinct Tailwind class pairs (background + text), each chosen for:

- good contrast with the text color
- visual distinction from neighbors in the list
- reasonable appearance in both light and dark themes

Example palette (exact values to be refined during implementation):

```ts
const AVATAR_COLOR_PAIRS = [
  "bg-rose-600 text-white",
  "bg-red-600 text-white",
  "bg-orange-600 text-white",
  "bg-amber-700 text-white",
  "bg-emerald-600 text-white",
  "bg-teal-600 text-white",
  "bg-cyan-700 text-white",
  "bg-blue-600 text-white",
  "bg-indigo-600 text-white",
  "bg-violet-600 text-white",
  "bg-purple-600 text-white",
  "bg-pink-600 text-white",
];
```

All class strings are written as full literals so Tailwind can detect them statically.

### 3.3 Selector Function

One exported function that takes a seed string and returns the matching class pair:

```ts
function getAvatarColorClass(seed: string): string {
  return AVATAR_COLOR_PAIRS[hashString(seed) % AVATAR_COLOR_PAIRS.length];
}
```

### 3.4 Seed Choice

- For workspaces: `workspace.id` (stable, unique, available in `WorkspaceNavigationItem`)
- For users: `user.email` (stable, unique, available in `UserSettingsMenuViewer` / `AuthUser`)
- For workspace members: `member.email` or `member.userId` (whatever is available at the call site)

The seed does not need to be an ID specifically — any stable unique string works. The point is that two different entities will most likely get different colors.

## 4. Non-Goals

- No server-side avatar generation or storage
- No SVG/PNG rendering
- No new dependencies
- No new database fields
- No new server files or domains
- No rasterization pipeline
- No abstract provider/registry system

## 5. Integration Points

### 5.1 Utility Location

Add `getAvatarColorClass` (and its internal `hashString` + palette) to `src/lib/app-utils.ts` alongside the existing `getUserInitials`.

This is one function with a small constant array — not enough to justify a new file.

### 5.2 Workspace Switcher

File: `src/features/workspaces/workspace-switcher.tsx`

Change `createWorkspaceOption` to derive `chipClassName` from the workspace ID for organization workspaces:

```ts
chipClassName:
  workspace.kind === "personal"
    ? "bg-sidebar-primary text-sidebar-primary-foreground hover:text-sidebar-primary-foreground"
    : `${getAvatarColorClass(workspace.id)} hover:text-white`,
```

Personal workspaces keep their current `bg-sidebar-primary` treatment — they are visually distinct by kind, not by color hash.

### 5.3 User Account Menu

File: `src/features/settings/user-settings-menu.tsx`

Pass the derived color class to `AvatarFallback`:

```tsx
<AvatarFallback className={getAvatarColorClass(currentViewer.email)}>
  {initials}
</AvatarFallback>
```

### 5.4 Workspace Members List

File: `src/features/workspaces/settings/members/workspace-members-management-settings-item.tsx`

Same pattern — derive color from member identity and pass it to `AvatarFallback`.

### 5.5 Settings Avatars

Files:

- `src/features/settings/profile/avatar-settings-item.tsx`
- `src/features/workspaces/settings/general/workspace-avatar-settings-item.tsx`

Same pattern — pass derived color class to the fallback component's `className`.

### 5.6 Shared Avatar Components (Optional)

The fallback components in `src/components/ui/avatar.tsx` and `src/features/workspaces/workspace-avatar.tsx` keep their current default `bg-muted` styling. The color override is applied via `className` at the call site, which is already how the workspace switcher works today.

This avoids changing the shared component API or adding a required `seed` prop.

## 6. Verification

- Create two organization workspaces — they should (most likely) show different fallback colors
- Personal workspace keeps its `sidebar-primary` color
- User avatar in account menu shows a color derived from email, not gray
- Uploading a custom avatar still works and takes priority over the color fallback
- Removing a custom avatar falls back to the colored initials
- Colors are stable across page reloads (same entity = same color every time)

## 7. Implementation Steps

1. Add `getAvatarColorClass` to `src/lib/app-utils.ts` with the hash function and color palette.
2. Update `workspace-switcher.tsx` to use `getAvatarColorClass(workspace.id)` for organization workspaces.
3. Update `user-settings-menu.tsx` to pass the derived color class to `AvatarFallback`.
4. Update `workspace-members-management-settings-item.tsx` for member avatars.
5. Update `avatar-settings-item.tsx` and `workspace-avatar-settings-item.tsx` for settings previews.
6. Visually verify the palette works well in both light and dark themes and adjust specific color shades if needed.