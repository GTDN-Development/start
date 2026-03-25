# Task 2: Sjednotit kanonický active workspace, application entry a workspace navigation state

Date: 2026-03-25
Priority: P1

Tento task konsoliduje druhý nejvýraznější seam napříč audity: různé části application shellu dnes
pracují s trochu jiným modelem aktivního workspace a entry pointu do appky.

## Proč je to důležité

- `src/app/[locale]/(application)/layout.tsx` si lokálně opravuje invalidní
  `activeWorkspaceSlug`.
- `src/features/application/application-entry.ts` řeší application entry samostatně z raw cookie.
- `src/features/application/workspace-routing.ts` má další fallback logiku pro klientský výběr.
- `src/features/workspaces/workspace-navigation-context.tsx` umí jen patch existujícího workspace,
  ale neumí kanonicky pracovat s create/leave/delete/switch scénáři.
- Create, leave, delete, slug change a switch flow dnes používají rozprostřenou redirect politiku,
  takže shell, user menu, account back link a scope switcher mohou krátkodobě driftovat.

## Cíl

Zavést jeden kanonický workspace selection model, ze kterého budou vycházet:

- active workspace v shellu
- application entry href
- scope switcher selection
- account back link a user menu entry
- redirecty po workspace mutacích

## Scope

- Vytvořit jeden sdílený resolver pro validní active workspace a application entry.
- Přestat odvozovat entry link a shell state z různých fallbacků nad stejnou cookie.
- Rozšířit workspace navigation state tak, aby uměl vedle patch i add/remove/setActive nebo jinou
  stejně přímou formu kanonické synchronizace po mutacích.
- Sjednotit redirect policy po create, switch, slug change, leave a delete.
- Explicitně popsat deterministic fallback pro neplatný nebo zastaralý workspace cookie stav.
- Doplnit regresní coverage pro invalid cookie fallback a hlavní mutation roundtripy.

## Acceptance Criteria

- Application layout, scope switcher, user menu a account back link pracují se stejným
  kanonickým active workspace modelem.
- `applicationEntryHref` už nevzniká z oddělené paralelní logiky proti shell state.
- Po create/leave/delete/slug change/switch se klientský navigation state nerozjíždí od serveru.
- Redirect po workspace mutaci je definovaný na jednom místě a nepřekvapuje mezi features.
- Neplatný `activeWorkspaceSlug` cookie vždy skončí stejným deterministickým fallbackem.

## Hlavní soubory

- `src/app/[locale]/(application)/layout.tsx`
- `src/features/application/application-entry.ts`
- `src/features/application/application-root.tsx`
- `src/features/application/workspace-routing.ts`
- `src/features/application/scope-switcher.tsx`
- `src/features/account/account-hero-back-link.tsx`
- `src/features/account/user-account-menu.tsx`
- `src/features/workspaces/workspace-navigation-context.tsx`
- `src/features/workspaces/actions/workspace-actions.ts`
- `src/features/workspaces/workspace-create-drawer.tsx`
- `src/features/workspaces/settings/general/workspace-url-settings-item.tsx`
- `src/features/workspaces/settings/general/workspace-leave-settings-item.tsx`
- `src/features/workspaces/settings/general/workspace-delete-settings-item.tsx`

## Guardrails

- Nevytvářet obecný client state framework ani workspace state machine.
- Nepřidávat abstrakce jen kvůli deduplikaci malých JSX kusů.
- Preferovat jeden přímočarý resolver a malý počet přímých helperů, ne novou vrstvu indirection.
