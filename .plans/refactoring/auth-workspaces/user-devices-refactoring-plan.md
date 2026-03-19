# User Devices Refactoring Plan

Status:
1. Tento dokument je jeden ze tří samostatných refaktoringových úkolů.
2. Je kompatibilní s `.plans/refactoring/auth-workspaces/workspaces-refactoring-plan.md` a `.plans/refactoring/auth-workspaces/auth-refactoring-plan.md`.
3. Po reevaluaci zustava doporucenym samostatnym taskem, ale v uzsim scope nez puvodni plan.

Datum: 19. 3. 2026
Vychází z: `AUDIT-WORKSPACES-AUTH-DEVICES.md`, `.plans/user-devices-implementation-plan.md`, `.plans/refactoring/use-effect/use-effect-refactoring-plan.md`

## 1. Cíl

1. Zlevnit user-devices feature bez zásadního oslabení jejího uživatelského přínosu.
2. Zjednodušit device session hot path v auth flow.
3. Omezit operational complexity kolem cleanup a session cap enforcement.
4. Udržet kompatibilitu s auth i workspace vrstvou.
5. Zachovat standardní UX pro seznam zařízení a revoke flow.

## 2. Baseline

Aktuální odhad pro auditovaný scope:

- soubory: 7
- LOC: 1250

Největší hotspoty:

1. `src/server/device-sessions/device-sessions-service.ts` — 489 LOC
2. `src/features/account/security/your-devices-settings-item.tsx` — 328 LOC
3. `src/features/account/actions/device-session-actions.ts` — 120 LOC
4. `src/server/device-sessions/device-sessions-ua-parser.ts` — 104 LOC

## 2.1 Dopad merge useEffect refaktoru

1. `/account/security` uz nacita device sessions server-side v `src/app/[locale]/(application)/account/security/page.tsx`.
2. `YourDevicesSettingsItem` uz dostava `initialSessions` a neresi initial mount fetch.
3. `listDeviceSessionsAction()` byl odstranen; vracet client-side fetch/effect flow by slo proti aktualnimu guardrailu.
4. Nejvetsi useEffect-motivovany quick win je tedy hotovy a zbytek tasku se tyka hlavne zjednoduseni service hot path a lokalni UI orchestrace.

## 3. Hlavní problémy, které má tento task řešit

1. Na rozsah feature je device-session vrstva architektonicky drahá.
2. V request hot path se míchá validace, cleanup, heartbeat i enforcement.
3. Serverový UA parser sahá do utility, která je jinak primárně browser-oriented.
4. UI je uz po useEffect refaktoru citelnejsi, ale stale ma prostor pro mensi zjednoduseni.
5. Část feature je „luxusní“ vůči V1 prioritám.

## 4. Stabilní kontrakty, které musí zůstat zachované

Tento task je samostatně nasaditelný jen tehdy, pokud zůstanou stabilní tyto veřejné kontrakty:

1. Route a feature entry point:
2. `/account/security`
3. `YourDevicesSettingsItem`
4. Server data loading boundary:
5. `src/app/[locale]/(application)/account/security/page.tsx` zustane server-first loaderem pro initial sessions
6. `YourDevicesSettingsItem` zustane klientskou vrstvou pro post-action updates, ne pro initial load
7. Server action entry pointy:
8. `signOutOtherDevicesAction`
9. `signOutDeviceAction`
10. Shared auth/device kontrakty:
11. `requireCurrentUser()` nebo jeho kompatibilní náhrada
12. `app_device_session` cookie name
13. invalid device session musí nadále znamenat `UNAUTHORIZED` / clear cookies semantics
14. Workspace task nesmí být nucen měnit vlastní business logiku; pouze dál používá auth/device guard jako dnes.

## 5. Scope

In scope:

1. Zjednodušení `device-sessions-service.ts`.
2. Zjednodušení device UI orchestrace.
3. Oddělení server UA heuristiky od browser environment utility.
4. Redukce menších device helper modulů tam, kde jsou zbytečně jemně rozdělené.
5. Zachování standardního device management UX.

Out of scope:

1. Úplné odstranění device sessions feature.
2. Přechod na externí security produkt nebo jiný session model.
3. Změna auth cookie modelu.
4. GeoIP enrichment nebo advanced security telemetry.
5. Změna workspace business flow.

## 6. Co zůstane zachováno a o jaké feature přijdeme

### 6.1 Zachované feature

1. Seznam aktivních zařízení.
2. Current device badge.
3. Sign out konkrétního zařízení.
4. Sign out všech ostatních zařízení.
5. Last seen timestamp.
6. Device session validace jako součást auth guard flow.
7. Server-first initial load bez client-side mount fetch/effectu.

### 6.2 Záměrně ztracené nebo zjednodušené feature

1. Active session cap enforcement ve výchozím request hot path.
2. Opportunistic stale cleanup při více typech requestů.
3. Část detailních runtime heuristik kolem device session maintenance.
4. Část lokálních optimistic UI aktualizací.

Praktický dopad:

1. Feature zůstane z pohledu uživatele standardní.
2. Interně bude méně „enterprise-grade“ a víc přiměřená aktuální fázi produktu.
3. Údržba i debugging budou levnější.

## 7. Cílový stav po refaktoru

### 7.1 Server vrstva

Cílový směr:

1. `validateDeviceSessionOrInvalidate()` zůstane klíčový guard entry point.
2. Cleanup a session cap enforcement nebudou hlavní součástí běžné request cesty.
3. `device-sessions-ua-parser.ts` nebude záviset na browser-oriented utilitě z `src/lib/device-environment.ts`.
4. Malé typové/helper soubory sloučit tam, kde samostatný soubor nepřináší významný přínos.
5. Realne priority jsou server hot path a UA parser boundary; zbytek je sekundarni.

### 7.2 UI vrstva

Cílový směr:

1. `YourDevicesSettingsItem` ponechat jako jednu feature boundary.
2. Nevracet `listDeviceSessionsAction` ani client-side initial fetch; server-first `initialSessions` zustavaji baseline.
3. Zjednodušit per-row a global pending orchestrace.
4. Po mutacích více využívat refresh-driven nebo jednodušší lokální patch model.
5. Zachovat standardní seznamový UX.

## 8. Navržené konkrétní změny po PR krocích

## PR D1: Zjednodušení service hot path

Status: doporuceno.

1. V `src/server/device-sessions/device-sessions-service.ts` oddělit:
2. auth validation path
3. maintenance path
4. V běžném validate flow ponechat jen:
5. validaci cookie/tokenu
6. kontrolu aktivního záznamu
7. případný heartbeat update
8. Cleanup stale sessions přesunout do omezenějších momentů:
9. například jen při sign-in/sign-up
10. případně do explicitní maintenance helper funkce
11. Active session cap enforcement vypnout z default request hot path a ponechat jen jako volitelnou nebo pozdější feature.

Výsledek:

1. Menší request complexity.
2. Menší pravděpodobnost vedlejších efektů v auth flow.

## PR D2: Oddělení UA parseru od browser utility

Status: doporuceno.

1. `src/server/device-sessions/device-sessions-ua-parser.ts` osamostatnit.
2. Nepoužívat pro server heuristiku `src/lib/device-environment.ts`.
3. Přesunout potřebnou device-type logiku přímo do server parseru nebo do malé server-only utility.
4. `src/lib/device-environment.ts` ponechat čistě pro browser/device environment use cases.

Výsledek:

1. Čistší boundary.
2. Menší architektonický leak mezi klientem a serverem.

## PR D3: Zjednodušení UI a actions

Status: volitelne, mensi priorita.

1. Zmenšit `src/features/account/security/your-devices-settings-item.tsx`.
2. Omezit ručně držené paralelní pending state větve.
3. Zachovat:
4. server-first initial load pres `initialSessions`
5. revoke one
6. revoke others
7. unauthorized redirect
8. Nevracet:
9. client-side initial fetch action
10. mount-time effect orchestration pro nacteni seznamu
11. Zjednodušit success/error handling tam, kde se dnes opakuje.
12. Zvážit sloučení `src/features/account/actions/device-session-actions.ts` do `src/features/account/actions/account-actions.ts`, pokud to sníží file count bez zhoršení čitelnosti.

Výsledek:

1. Menší file count.
2. Menší UI orchestrace.
3. Prinos je sekundarni proti D1 a D2.

## PR D4: Lehká konsolidace malých device modulů

Status: nizka priorita.

Kandidáti:

1. `device-sessions-types.ts` sloučit do `device-sessions-service.ts` nebo do většího `device-sessions-contract.ts`
2. podle výsledku ponechat `device-sessions-cookie.ts` samostatně jen pokud bude dál jasně přinášet hodnotu

Výsledek:

1. Menší file count.
2. Méně navigace mezi drobnými moduly.

## 9. Odhad snížení počtu souborů a LOC

1. Pro doporuceny scope D1 + D2 je realisticky cil mensi LOC uspora a hlavne citelnejsi request hot path.
2. File-count reduction neni hlavni metrika uspechu.
3. D3 a D4 mohou prijit az sekundarne, pokud po D1 + D2 zustane potreba dal cistit UI nebo helpery.

## 10. Rizika a mitigace

1. Riziko: méně aggressive cleanup povede k pomalejšímu úklidu starých záznamů.
2. Mitigace: cleanup přesunout do méně častých, ale jasných triggerů.
3. Riziko: vypnutí session cap enforcement může dočasně povolit více aktivních session.
4. Mitigace: explicitně to popsat jako záměrné zjednodušení V1 security surface, nikoli bug.
5. Riziko: sloučení device actions do account actions zhorší čitelnost.
6. Mitigace: udělat to jen pokud výsledný soubor zůstane přehledný.

## 11. Aktualni doporuceni

1. Implementovat D1 a D2.
2. D3 drzet jako volitelny follow-up, pokud bude potreba dal cistit account security UI.
3. D4 neni priorita.

## 12. Definice hotového stavu

1. Device management UX zůstává zachovaný.
2. Auth guard flow dál respektuje invalid device session.
3. Request hot path je jednodušší a levnější.
4. Device parser už není koncepčně promíchaný s browser environment utilitami.
5. File count a LOC mohou, ale nemuseji, klesnout; hlavni metrika je jednodussi service behavior.

## 13. Doporučené pořadí vůči ostatním taskům

1. Tento task může jít jako druhý nebo třetí.
2. Pokud půjde před auth refaktorem, musí zachovat kompatibilní `requireCurrentUser` a auth-session semantics.
3. Pokud půjde po auth refaktoru, bude těžit z jednodušší session vrstvy, ale není na ní blokovaně závislý.
