# Workspaces Refactoring Plan

Status:
1. Tento dokument je jeden ze tří samostatných refaktoringových úkolů.
2. Je kompatibilní s `.plans/refactoring/auth-refactoring-plan.md` a `.plans/refactoring/user-devices-refactoring-plan.md`.
3. Může být realizován samostatně, pokud zůstanou zachované stabilní kontrakty ze sekce 4.

Datum: 17. 3. 2026
Vychází z: `AUDIT-WORKSPACES-AUTH-DEVICES.md`, `.plans/multi-workspace-backend-implementation-plan.md`

## 1. Cíl

1. Zmenšit fragmentaci workspace domény bez zásadního ořezání core feature setu.
2. Zjednodušit boundary vrstvy a server-action glue, které dnes zvyšují file count i mentální overhead.
3. Výrazně zmenšit client-side orchestrace v members/invites UI.
4. Zachovat stávající business pravidla: personal workspace restrikce, last-owner guard, invite email match, workspace bootstrap přes `/overview`.
5. Udržet výsledek kompatibilní s auth a user-devices refaktoringem bez nutnosti současného mergování všech tří tasků.

## 2. Baseline

Aktuální odhad pro auditovaný scope:

- soubory: 33
- LOC: 6781

Největší hotspoty:

1. `src/features/workspaces/settings/members/workspace-members-management-settings-item.tsx` — 1016 LOC
2. `src/server/workspaces/workspace-invite-service.ts` — 659 LOC
3. `src/server/workspaces/workspace-general-service.ts` — 637 LOC
4. `src/features/workspaces/actions/workspace-actions.ts` — 464 LOC
5. `src/features/workspaces/settings/members/workspace-invite-members-settings-item.tsx` — 404 LOC
6. `src/server/workspaces/workspace-members-service.ts` — 398 LOC

## 3. Hlavní problémy, které má tento task řešit

1. Příliš mnoho malých helper/boundary souborů ve `src/server/workspaces/*` a `src/features/workspaces/*`.
2. Přetížený glue modul `src/features/workspaces/actions/workspace-actions.ts`.
3. Přetížená klientská members UI komponenta s velkým množstvím lokální orchestrace a optimistic state.
4. Invite UI je těžší, než odpovídá aktuálnímu backend flow.
5. Route-level workspace bootstrapping a guards jsou čitelné, ale už začínají být repetitivní.

## 4. Stabilní kontrakty, které musí zůstat zachované

Tento task je samostatně nasaditelný jen tehdy, pokud zůstanou stabilní tyto veřejné kontrakty:

1. Routy:
2. `/overview`
3. `/w/[workspaceSlug]/overview`
4. `/w/[workspaceSlug]/settings`
5. `/w/[workspaceSlug]/settings/members`
6. `/invite/[token]`
7. Cookie názvy:
8. `active_workspace`
9. `pending_invite`
10. Error code kontrakt:
11. `BAD_REQUEST`
12. `SLUG_NOT_AVAILABLE`
13. `UNAUTHORIZED`
14. `FORBIDDEN`
15. `NOT_FOUND`
16. `RATE_LIMITED`
17. `PERSONAL_WORKSPACE_RESTRICTED`
18. `LAST_OWNER_GUARD`
19. `INVITE_INVALID_OR_EXPIRED`
20. `INVITE_EMAIL_MISMATCH`
21. `UNKNOWN_ERROR`
22. Musí zůstat zachovány veřejné entry pointy pro klienta:
23. `createOrganizationWorkspaceAction`
24. `switchWorkspaceAction`
25. `updateWorkspaceGeneralAction`
26. `leaveWorkspaceAction`
27. `deleteOrganizationWorkspaceAction`
28. `changeMemberRoleAction`
29. `removeMemberAction`
30. `transferOwnershipAction`
31. `createInviteAction`
32. `resendInviteAction`
33. `revokeInviteAction`
34. `setPendingInviteHashAction`
35. `resolvePostAuthWorkspaceAction`
36. Nesmí se měnit semantics:
37. personal workspace nelze zvát/opustit/smazat
38. last-owner guard zůstává backend enforcement
39. invite accept zůstává vázaný na e-mail
40. `/overview` zůstává bootstrap/fallback route

## 5. Scope

In scope:

1. Sloučení malých workspace helper souborů tam, kde je modulární přínos nízký.
2. Zjednodušení `workspace-actions.ts`.
3. Zjednodušení members/invites UI orchestrace.
4. Zjednodušení invite creation UX z batch editoru na jednodušší flow.
5. Menší sjednocení route-level loader/guard patternů.
6. Lehká konsolidace workspace view-model typů.

Out of scope:

1. Změna workspace doménového modelu v PocketBase.
2. Změna URL struktury.
3. Billing, teams, audit log, nové role.
4. Refaktor auth session infrastruktury.
5. Refaktor device-session security flow.
6. Placeholder obsah v overview a dalších WIP routách.

## 6. Co zůstane zachováno a o jaké feature přijdeme

### 6.1 Zachované feature

1. Personal workspace bootstrap.
2. Workspace switching.
3. Workspace general settings: name, slug, avatar.
4. Members: role change, remove member, transfer ownership.
5. Invites: create, resend, revoke, accept.
6. Post-auth workspace resolve.
7. Active workspace cookie.
8. Invite token flow.

### 6.2 Záměrně ztracené nebo zjednodušené feature

1. Multi-row invite batching v UI.
2. Jemné optimistic aktualizace members/invites tabulek po každé mutaci.
3. Část čistě lokálního UI state managementu pro dialogy a seznamy.

Praktický dopad:

1. Invite flow bude jednodušší: jeden invite formulář místo více řádků.
2. Po mutaci bude zdrojem pravdy server refresh/revalidation, ne lokální mirror seznamů.
3. UX zůstane standardní, ale méně „chytré“ v mikrodetailech.

## 7. Cílový stav po refaktoru

### 7.1 Server vrstva

Cílový směr:

1. Sloučit `workspace-auth-context.ts` a `workspace-access.ts` do jednoho guard modulu.
2. Sloučit `workspace-constants.ts` a `workspace-errors.ts` do sdíleného workspace utility modulu nebo přímo do servisní vrstvy.
3. Zvážit sloučení `workspace-invite-utils.ts` přímo do `workspace-invite-service.ts`, pokud po zjednodušení zůstane malý.
4. Zachovat rozdělení `general / members / invites`, protože to odpovídá doméně.

### 7.2 Feature vrstva

Cílový směr:

1. Zmenšit `workspace-actions.ts` vytažením společného action helperu nebo rozdělením na menší tematické action moduly.
2. Sjednotit workspace view-model typy do jednoho feature-level souboru.
3. `workspace-members-management-settings-item.tsx` ponechat jako jednu feature boundary, ale výrazně omezit lokální stav.
4. `workspace-invite-members-settings-item.tsx` zjednodušit na single-invite flow.

### 7.3 Route vrstva

1. Zachovat server-first data loading.
2. Sjednotit guard/resolve pattern tam, kde dnes duplikuje stejnou kombinaci auth + workspace access checku.
3. Nesmí vzniknout nová API vrstva ani další orchestration abstrakce.

## 8. Navržené konkrétní změny po PR krocích

## PR W1: Konsolidace malých modulů

1. Nahradit:
2. `src/server/workspaces/workspace-auth-context.ts`
3. `src/server/workspaces/workspace-access.ts`
4. jedním souborem `src/server/workspaces/workspace-guards.ts`
5. Nahradit:
6. `src/server/workspaces/workspace-constants.ts`
7. `src/server/workspaces/workspace-errors.ts`
8. jedním souborem `src/server/workspaces/workspace-service-utils.ts`
9. Sloučit:
10. `src/features/workspaces/workspace-types.ts`
11. `src/features/workspaces/settings/workspace-settings-types.ts`
12. do `src/features/workspaces/workspace-view-models.ts`
13. Zvážit přesun `workspace-invite-utils.ts` do `workspace-invite-service.ts`, pokud po úpravě zůstane pod ~40 LoC.

Výsledek:

1. Méně navigace mezi malými soubory.
2. Menší file count bez změny business chování.

## PR W2: Zjednodušení server action boundary

1. Rozdělit nebo zjednodušit `src/features/workspaces/actions/workspace-actions.ts`.
2. Vytáhnout společné helpery:
3. `safeParse -> BAD_REQUEST`
4. `finalizeWorkspaceAction`
5. revalidation helpery
6. Cílový stav:
7. buď dva action soubory (`workspace-general-actions.ts`, `workspace-members-actions.ts`)
8. nebo jeden výrazně kratší soubor se sdílenými helper funkcemi
9. Nezavádět novou transportní vrstvu ani fetch přes interní API.

Výsledek:

1. Menší glue layer.
2. Lepší čitelnost a menší riziko regressí při dalších změnách.

## PR W3: Members UI de-orchestrace

1. V `workspace-members-management-settings-item.tsx` odstranit lokální mirror seznamů jako primární source of truth.
2. Po úspěšných mutacích preferovat:
3. server revalidation
4. `router.refresh()` nebo konzistentní refresh pattern
5. Zredukovat dialog state na jeden generický action state místo několika paralelních větví tam, kde to nepokazí čitelnost.
6. Zachovat desktop i mobile render variantu, ale vytlačit opakovanou logiku do menších interních funkcí nebo lokálních subkomponent.
7. Zachovat jednu feature boundary, nepřidávat mnoho nových souborů.

Výsledek:

1. Výrazně menší UI state complexity.
2. Lepší navázání na server-first architekturu.

## PR W4: Zjednodušení invite creation UX

1. V `workspace-invite-members-settings-item.tsx` odstranit multi-row editor.
2. Nahradit ho jednoduchým formulářem:
3. `email`
4. `role`
5. submit
6. Po úspěchu:
7. zobrazit toast
8. refreshnout data
9. Zachovat resend/revoke v management sekci.

Výsledek:

1. Menší LOC.
2. Menší mentální overhead.
3. Prakticky nulová ztráta core functionality.

## 9. Odhad snížení počtu souborů a LOC

### 9.1 Konzervativní varianta

- soubory: z 33 na 29 až 30
- čistá úspora: minus 3 až 4 soubory
- LOC: z 6781 na cca 6480 až 6550
- čistá úspora: minus cca 230 až 300 LOC

### 9.2 Doporučená varianta

- soubory: z 33 na 27 až 29
- čistá úspora: minus 4 až 6 souborů
- LOC: z 6781 na cca 6240 až 6460
- čistá úspora: minus cca 320 až 540 LOC

### 9.3 Agresivnější varianta

- soubory: z 33 na 26 až 28
- čistá úspora: minus 5 až 7 souborů
- LOC: z 6781 na cca 6100 až 6350
- čistá úspora: minus cca 430 až 680 LOC

Doporučení:

1. Jít doporučenou variantou.
2. Agresivní variantu dělat jen pokud je cílem maximalizovat zjednodušení ještě před větší produktovou expanzí workspace domény.

## 10. Rizika a mitigace

1. Riziko: zjednodušení invite UI bude vnímané jako funkční regres.
2. Mitigace: explicitně potvrdit, že batch invite není core feature a resend/revoke zůstává.
3. Riziko: méně optimistic UI může působit pomaleji.
4. Mitigace: držet toast + server refresh + korektní loading states.
5. Riziko: při slučování helperů vznikne přerostlý utility soubor.
6. Mitigace: slučovat jen malé a skutečně související moduly, ne celé services.

## 11. Definice hotového stavu

1. Workspace feature set zůstává zachovaný kromě záměrně odstraněného multi-row invite editoru.
2. Members/invites UI používá jednodušší a čitelnější server-first refresh model.
3. Workspace server boundary má méně malých souborů a lepší discoverability.
4. `workspace-actions.ts` už není hlavní hotspot glue komplexity.
5. Auth ani user-devices task není k deployi tohoto tasku nutný.

## 12. Doporučené pořadí vůči ostatním taskům

1. Tento task může jít jako první nebo druhý.
2. Pokud půjde první, auth a user-devices na něj nemusí čekat.
3. Pokud půjde po auth tasku, je potřeba jen ověřit, že zůstaly stabilní auth entry pointy pro `/overview`, invite flow a account/workspace redirecty.
