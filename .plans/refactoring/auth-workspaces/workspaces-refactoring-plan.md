# Workspaces Refactoring Plan

Status:
1. Tento dokument je jeden ze tří samostatných refaktoringových úkolů.
2. Je kompatibilní s `.plans/refactoring/auth-workspaces/auth-refactoring-plan.md` a `.plans/refactoring/auth-workspaces/user-devices-refactoring-plan.md`.
3. Po reevaluaci zustava doporucenym taskem, ale hlavne v uzsim scope W3 + W4.

Datum: 19. 3. 2026
Vychází z: `AUDIT-WORKSPACES-AUTH-DEVICES.md`, `.plans/multi-workspace-backend-implementation-plan.md`, `.plans/refactoring/use-effect/use-effect-refactoring-plan.md`

## 1. Cíl

1. Vyrazne zmensit client-side orchestraci v members/invites UI bez zasadniho orezani core workspace feature setu.
2. Zjednodusit invite creation UX tak, aby odpovidal aktualnimu backend flow a V1 prioritam.
3. Zachovat stávající business pravidla: personal workspace restrikce, last-owner guard, invite email match, workspace bootstrap přes `/overview`.
4. Udrzet server-first pending invite flow bez navratu ke klientskym redirect/effect mezivrstvam.
5. Udržet výsledek kompatibilní s auth a user-devices refaktoringem bez nutnosti současného mergování všech tří tasků.

## 2. Baseline

Aktuální odhad pro auditovaný scope:

- soubory: 33
- LOC: 6895

Poznámka:

1. Tato baseline zamerne zahrnuje route vrstvu i server/feature workspace boundary.

Největší hotspoty:

1. `src/features/workspaces/settings/members/workspace-members-management-settings-item.tsx` — 1006 LOC
2. `src/server/workspaces/workspace-invite-service.ts` — 697 LOC
3. `src/server/workspaces/workspace-general-service.ts` — 637 LOC
4. `src/features/workspaces/actions/workspace-actions.ts` — 436 LOC
5. `src/features/workspaces/settings/members/workspace-invite-members-settings-item.tsx` — 415 LOC
6. `src/server/workspaces/workspace-members-service.ts` — 397 LOC

## 2.1 Dopad merge useEffect refaktoru

1. Invite auth-required flow uz neni client-side redirect choreografie; `src/app/[locale]/(auth)/(flow)/invite/[token]/page.tsx` zapisuje pending invite cookie a redirectuje na serveru.
2. `setPendingInviteHashAction()` uz byl odstranen z `src/features/workspaces/actions/workspace-actions.ts`.
3. Z tohoto planu tedy vypadavaji kroky, ktere jen obchazely drivejsi mount/effect flow kolem invite akceptace.
4. Relevantni zustava zjednoduseni `workspace-actions.ts`, members/invites UI a server boundary, ale bez navraceni klientskych redirect/effect mostu.

## 3. Hlavní problémy, které má tento task řešit

1. Nejvetsi realny hotspot je klientska members UI komponenta s velkym mnozstvim lokalni orchestrace.
2. Invite UI je tezsi, nez odpovida aktualnimu backend flow.
3. Cast malych helper/boundary souboru je rozdelena rozumne a neni hlavnim problemem sama o sobe.
4. `workspace-actions.ts` je patterned a citelny; neni to hlavni cil refaktoru.
5. Route-level workspace bootstrapping a guards jsou spis sekundarni cleanup oblast.

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
34. `resolvePostAuthWorkspaceAction`
36. Nesmí se měnit semantics:
37. personal workspace nelze zvát/opustit/smazat
38. last-owner guard zůstává backend enforcement
39. invite accept zůstává vázaný na e-mail
40. invite auth-required redirect zustava server-owned pres `pending_invite` cookie + redirect
41. `/overview` zůstává bootstrap/fallback route

## 5. Scope

In scope:

1. Zjednodušení members/invites UI orchestrace.
2. Zjednodušení invite creation UX z batch editoru na jednodušší flow.
3. Zachovani server-first pending invite flow bez nove client-side redirect vrstvy.
4. Jen navazujici male helper cleanupy, pokud je W3/W4 prirozene vyvolaji.

Out of scope:

1. Změna workspace doménového modelu v PocketBase.
2. Změna URL struktury.
3. Billing, teams, audit log, nové role.
4. Refaktor auth session infrastruktury.
5. Refaktor device-session security flow.
6. Placeholder obsah v overview a dalších WIP routách.
7. Slučování server helperů jen kvůli nižšímu file count.
8. Mechanické štěpení nebo slučování `workspace-actions.ts`, pokud nevznikne nový konkrétní use case.

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
9. Server-first pending invite cookie flow pro auth-required invite vstup.

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

1. Zachovat stavajici `general / members / invites` rozdeleni.
2. Helper boundaries menit jen pokud to vyplyne z W3/W4 nebo zretelne snizi coupling.
3. Neslucovat moduly jen kvuli file count, pokud uz dnes nesou jednu citelnou zodpovednost.

### 7.2 Feature vrstva

Cílový směr:

1. `workspace-members-management-settings-item.tsx` ponechat jako jednu feature boundary, ale výrazně omezit lokální stav a local mirror data.
2. `workspace-invite-members-settings-item.tsx` zjednodušit na single-invite flow.
3. `workspace-actions.ts` menit jen minimalne a jen pokud to vyzaduji W3/W4.

### 7.3 Route vrstva

1. Zachovat server-first data loading.
2. Invite auth-required bridge ponechat v route/server vrstve; nevracet klientsky redirect helper nebo effect choreography.
3. Pokud pri W3/W4 vznikne potreba maleho route-level cleanupu, drzet ho lokalniho a nerozsirovat scope o novou orchestration vrstvu.
4. Nesmí vzniknout nová API vrstva ani další orchestration abstrakce.

## 8. Navržené konkrétní změny po PR krocích

## PR W1: Konsolidace malých modulů

Status: nedoporuceno jako samostatny krok.

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

1. Potencialne mensi file count.
2. Soucasne riziko horsi citelnosti; aktualne to neresi hlavni problem domeny.
3. Aktualni doporuceni: nerealizovat samostatne.

## PR W2: Zjednodušení server action boundary

Status: nedoporuceno jako samostatny krok.

1. Rozdělit nebo zjednodušit `src/features/workspaces/actions/workspace-actions.ts`.
2. Vytáhnout společné helpery:
3. `safeParse -> BAD_REQUEST`
4. `finalizeWorkspaceAction`
5. revalidation helpery
6. Cílový stav:
7. buď dva action soubory (`workspace-general-actions.ts`, `workspace-members-actions.ts`)
8. nebo jeden výrazně kratší soubor se sdílenými helper funkcemi
9. Nezavadet zpet `setPendingInviteHashAction` ani jinou klientskou mezivrstvu pro pending invite flow.
10. Nezavádět novou transportní vrstvu ani fetch přes interní API.

Výsledek:

1. Potencialne mensi glue layer.
2. Prakticky ale maly prinos, protoze soubor uz je patterned a citelny.
3. Aktualni doporuceni: nemenit, pokud to nevyzaduje W3/W4.

## PR W3: Members UI de-orchestrace

Status: doporuceno.

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

Status: doporuceno.

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

1. Pro doporuceny scope W3 + W4 je realisticky cil hlavne mensi UI complexity a mensi LOC v members/invite UI.
2. File-count reduction neni primarni metrika uspechu.
3. Pokud se W1/W2 nerealizuji, server-side file count se muze zmenit jen minimalne nebo vubec.

## 10. Rizika a mitigace

1. Riziko: zjednodušení invite UI bude vnímané jako funkční regres.
2. Mitigace: explicitně potvrdit, že batch invite není core feature a resend/revoke zůstává.
3. Riziko: méně optimistic UI může působit pomaleji.
4. Mitigace: držet toast + server refresh + korektní loading states.
5. Riziko: snaha zaroven delat W1/W2 rozsiri scope a snizi focus na realne hotspoty.
6. Mitigace: drzet task v uzkem scope W3 + W4.

## 11. Definice hotového stavu

1. Workspace feature set zůstává zachovaný kromě záměrně odstraněného multi-row invite editoru.
2. Members/invites UI používá jednodušší a čitelnější server-first refresh model.
3. Workspace server boundary zustava stabilni a neni zbytecne prekopana kvuli file count.
4. `workspace-actions.ts` se meni jen pokud to vyzaduje W3/W4.
5. Auth ani user-devices task není k deployi tohoto tasku nutný.

## 12. Aktualni doporuceni

1. Implementovat W3 a W4.
2. W1 a W2 nerealizovat jako samostatne kroky.
3. Pokud pri W3/W4 vznikne potreba maleho helper cleanupu, resit ji lokalne a nepresouvat task zpet do sirokeho konsolidacniho refaktoru.

## 13. Doporučené pořadí vůči ostatním taskům

1. Tento task může jít jako první nebo druhý.
2. Pokud půjde první, auth a user-devices na něj nemusí čekat.
3. Pokud půjde po auth tasku, je potřeba jen ověřit, že zůstaly stabilní auth entry pointy pro `/overview`, invite flow a account/workspace redirecty.
