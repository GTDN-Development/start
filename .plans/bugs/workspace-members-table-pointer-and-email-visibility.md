# Workspace Members Table: Pointer Clickability and Email Visibility

## Summary

Při doplňování E2E pro odebrání člena přes UI se ukázaly `2` problémy v members tabulce:

1. action trigger `Otevřít akce člena` není v tabulce spolehlivě kliknutelný pointerem
2. u cizích členů se v tabulce aktuálně nevypisuje e-mail, i když typový kontrakt s e-mailem počítá

První bod je potvrzený UI bug. Druhý bod je buď bug, nebo nedořešený produktový kontrakt a je potřeba ho rozhodnout a srovnat.

## Confirmed Bug: Action Button Is Not Reliably Clickable

### Symptoms

- v E2E `admin-removes-member-and-target-loses-access.spec.ts` pointer click na `Otevřít akce člena` visel až do timeoutu
- Playwright trace ukazuje:
  - element je `visible`, `enabled` a `stable`
  - ale click je opakovaně blokovaný hláškou:
    - `<div data-slot="main" class="relative isolate min-w-0">…</div> intercepts pointer events`
- stejný flow funguje přes přístupovou cestu `focus + Enter`

### Practical Impact

- menu pro změnu role / odebrání člena může být v reálném browseru flaky nebo nekliknutelné myší
- E2E je teď zelené díky přístupnému keyboard fallbacku, ne proto, že by pointer UX bylo v pořádku

### Likely Affected Files

- [/Users/fanda/Dev/start/apps/web/src/features/workspaces/settings/members/workspace-members-table.tsx](/Users/fanda/Dev/start/apps/web/src/features/workspaces/settings/members/workspace-members-table.tsx)
- případně i související layout / stacking context v:
  - [/Users/fanda/Dev/start/apps/web/src/features/workspaces/settings/members/workspace-members-management-settings-item.tsx](/Users/fanda/Dev/start/apps/web/src/features/workspaces/settings/members/workspace-members-management-settings-item.tsx)
  - nebo shared table / shell wrapperu, pokud tam vzniká overlay nebo stacking conflict

### Expected Behavior

- button `Otevřít akce člena` musí být normálně kliknutelný pointerem bez keyboard fallbacku
- po kliknutí se otevře dropdown menu s akcemi člena

### Acceptance Criteria

- pointer click na `Otevřít akce člena` funguje stabilně v desktop layoutu
- není potřeba testový workaround přes `focus + Enter`
- `removeWorkspaceMember(...)` helper v E2E se může vrátit zpět na běžný `.click()`

## Open Product / UI Contract Question: Missing Email for Non-Self Members

### Symptoms

- v members tabulce se u current user/admin řádku e-mail zobrazuje
- u ostatních členů byl v trace snapshotu druhý řádek identity prázdný
- E2E proto nemohlo cílového člena spolehlivě identifikovat přes e-mail a dočasně používá jméno

### Why This Is Suspicious

- UI typ očekává `WorkspaceSettingsMember.email: string`
- renderer v `WorkspaceMemberIdentityCell` vždy vykresluje druhý řádek s `member.email`
- prázdný druhý řádek u non-self members naznačuje, že hodnota není do UI dotažená konzistentně

### Practical Impact

- owner/admin nemusí v members tabulce vidět e-mail ostatních členů
- hůř se rozlišují členové se stejným nebo podobným jménem
- testy i UX jsou zbytečně méně robustní

### Likely Affected Files

- [/Users/fanda/Dev/start/apps/web/src/server/workspaces/workspace-mappers.ts](/Users/fanda/Dev/start/apps/web/src/server/workspaces/workspace-mappers.ts)
- [/Users/fanda/Dev/start/apps/web/src/server/workspaces/workspace-members-service.ts](/Users/fanda/Dev/start/apps/web/src/server/workspaces/workspace-members-service.ts)
- [/Users/fanda/Dev/start/apps/web/src/features/workspaces/settings/members/workspace-members-table.tsx](/Users/fanda/Dev/start/apps/web/src/features/workspaces/settings/members/workspace-members-table.tsx)

### Decision Needed

Je potřeba potvrdit zamýšlený produktový stav:

- `A)` owner/admin mají vidět e-mail všech členů
- `B)` owner/admin mají vidět e-mail jen u sebe

Pokud platí `A`, je to bug a měl by se opravit.
Pokud platí `B`, je potřeba to udělat explicitně a sjednotit:

- typy
- mapper
- UI rendering
- E2E expectation

### Expected Behavior

- UI musí konzistentně odpovídat zvolenému produktu kontraktu
- nemá existovat stav, kdy typ tvrdí `email: string`, ale některé rows ho renderují prázdně bez jasného důvodu

## Current Test State

Aktuální E2E jsou zelené, ale s těmito kompromisy:

- `admin-removes-member-and-target-loses-access.spec.ts`
  - otevírá member action menu přes `focus + Enter`
  - cílí člena podle jména místo e-mailu

To je přijatelné jako dočasné coverage, ale po opravě tabulky je vhodné test vrátit na přímý pointer click a e-mail-based targeting.
