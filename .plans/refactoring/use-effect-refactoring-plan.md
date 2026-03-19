# useEffect Refactoring Plan

Datum: 19. 3. 2026

## 1. Kontekst a cil

1. Cilem je postupne odstranit raw `useEffect` z bezneho feature code.
2. `useEffect` ma zustat jen jako escape hatch pro synchronizaci s externim systemem mimo React.
3. Nestaci pouze zakazat synchronni `setState` v effectu. Spravne pravidlo je:
4. render-time derivation pred state synchronizaci
5. event handler pred effect orchestration
6. `key` pred reset logikou v dependency array
7. `useSyncExternalStore` pred browser subscription effectem
8. `useMountEffect` jen pro mount/unmount sync s externim systemem

## 2. Vstupni zdroje a rozhodnuti

1. Hlavni zdroj pravdy jsou oficialni React docs:
2. `https://react.dev/learn/you-might-not-need-an-effect`
3. `https://react.dev/learn/synchronizing-with-effects`
4. `https://react.dev/learn/removing-effect-dependencies`
5. `https://react.dev/reference/react/useEffect`
6. `https://react.dev/reference/react/useEffectEvent`
7. `https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect`
8. X clanek od Alvina Sng (`Why we banned React's useEffect`) byl nakonec doplnen ze screenshotu dodanych v threadu.
9. Plan a guideline ted zohlednuji jak oficialni React docs, tak hlavni teze z tohoto clanku:
10. raw `useEffect` nema byt default pro app control flow
11. lepsi defaulty jsou derivace v renderu, event handlery, server/data abstractions, `key` a external-store model
12. `useMountEffect` je jen pojmenovany mount/unmount escape hatch pro external sync, ne mechanicka nahrada za business logiku
13. zakaz raw `useEffect` funguje jako forcing function pro cistsi tree design a jasnejsi orchestration boundaries
14. realny prinos guardrailu je mene infinite loopu, mene race conditions a citelnejsi control flow

## 3. Co uz bylo zavedeno

1. Rozsirena pravidla v `.rules/use-effect-guidelines.md`.
2. Doplnena state pravidla v `AGENTS.md`.
3. ESLint ted:
4. drzi `react-hooks/set-state-in-effect` jako `error`
5. zakazuje raw named `useEffect` import a `React.useEffect`
6. pouziva docasny allowlist pro auditovane vyjimky
7. Dulezita poznamka z implementace:
8. puvodni pristup pres `no-restricted-imports` byl moc hruby a flagoval i bezne `import * as React from "react"`.
9. Finalni reseni je pres `no-restricted-syntax`, aby se chytal jen realny `useEffect` import/usage.
10. Byl vytvoren skill `.rules/skills/use-effect-refactor`.
11. Skill validator `quick_validate.py` nesel pustit kvuli chybejicimu Python modulu `yaml` v lokalnim prostredi. Nejde o chybu skill struktury, ale o environment blocker.
12. `src/app/[locale]/(application)/account/security/page.tsx` uz nacte user device sessions na serveru a preda je jako `initialSessions` do klientske komponenty.
13. `src/features/account/security/your-devices-settings-item.tsx` uz neresi initial data fetch v mount effectu. Na klientu zustava jen lokalni stav pro post-action updates po `signOut`.
14. Po tomto presunu byla odstranena uz nepotrebna `listDeviceSessionsAction()` ze `src/features/account/actions/device-session-actions.ts`.
15. `.rules/use-effect-guidelines.md` uz obsahuje i strucny vycuc z React docs a zmineneho X clanku, vcetne `five default replacements`, forcing-function argumentu a smell testu.
16. `src/features/cookies/cookie-context.tsx` uz nema debug `useEffect`; debug logging zustava jen jako explicitni helper volany z handleru.
17. Auth flash flow uz nepouziva `sessionStorage -> mount effect -> toast`.
18. Flash vrstva byla nakonec odstranena uplne; verify/reset flow po success jen redirectuji na `/sign-in` bez dalsi UI choreografie.
19. `src/features/auth/sign-in/sign-in-flash-toast.tsx` byl odstraneny.
20. `src/app/[locale]/(auth)/(flow)/invite/[token]/page.tsx` uz dela pending-invite cookie + redirect ciste na serveru.
21. `src/features/auth/invite/token/invite-token-auth-required-redirect.tsx` byl odstraneny.
22. `src/features/workspaces/actions/workspace-actions.ts` uz neobsahuje zbytecnou `setPendingInviteHashAction()`.
23. `src/features/auth/auth-client.ts` uz nema komponentovy `useEffect`; bootstrap session store se spousti ze subscription lifecycle.
24. `src/hooks/use-mobile.ts` a `src/components/ui/**/*` jsou vedoma shadcn/preset vyjimka a zustavaji blizko upstream vanilla implementaci.
25. ESLint pro tyto upstream-managed soubory nevynucuje `no-restricted-syntax` ani `react-hooks/set-state-in-effect`.
26. `src/components/layout/floating-bar.tsx` byl po UX a hydration auditu vracen na puvodni working implementaci.
27. `floating-bar.tsx` je ted vedoma auditovana vyjimka, protoze jednodussi originalni tradeoff vysel lepe nez dalsi refactor pokusy.
28. `src/components/layout/theme-switcher.tsx` uz nepouziva `useMountEffect`; hydration guard je reseny pres `useSyncExternalStore` server/client snapshot pattern.

## 4. Aktualni audit raw effect usage

### 4.1 Raw `useEffect` / `React.useEffect`

1. `src/app/[locale]/error.tsx`
2. `src/components/ui/sidebar.tsx` - shadcn vanilla vyjimka
3. `src/hooks/use-mount-effect.ts` - schvaleny wrapper

### 4.2 `useLayoutEffect`

1. `src/components/layout/floating-bar.tsx`

### 4.3 `useMountEffect` consumery k druhe vlne auditu

1. `src/components/layout/floating-bar.tsx`
2. `src/components/layout/theme-switcher.tsx`
3. `src/components/ui/copy-button.tsx`
4. `src/components/ui/sidebar.tsx`

## 5. Klasifikace po souborech

### 5.1 `src/features/cookies/cookie-context.tsx`

1. Stav: hotovo.
2. Vysledek:
3. raw `useEffect` byl odstraneny
4. debug logging je explicitni helper, ne dependency-driven effect
5. Poznamka:
6. soubor uz neni ESLint vyjimka

### 5.2 Auth flash flow (`sign-in/page.tsx`, verify/reset forms)

1. Stav: hotovo.
2. Vysledek:
3. `sessionStorage` flow zmizel
4. toast/flash mezivrstva byla odstranena uplne
5. verify/reset success jen redirectuji na `/sign-in`
6. `SignInFlashToast` komponenta byla odstranena
7. Poznamka:
8. je to vedomy posun k jednodussimu flow bez post-redirect success choreografie

### 5.3 Invite auth-required flow (`invite/[token]/page.tsx`)

1. Stav: hotovo.
2. Vysledek:
3. pending invite cookie se nastavuje primo na serveru
4. redirect na sign-in probiha v page/server vrstve
5. klientska redirect komponenta byla odstranena
6. Poznamka:
7. spolu s tim zmizela i uz nepotrebna workspace action pro ulozeni pending invite hashe

### 5.4 `src/features/auth/auth-client.ts`

1. Stav: hotovo.
2. Vysledek:
3. `useSession()` je ted ciste `useSyncExternalStore`
4. store bootstrap a prvni `refreshSession()` se spousti ze `subscribeToSessionStore`
5. cross-tab, visibility a online sync zustaly zachovane bez komponentoveho `useEffect`
6. Poznamka:
7. soubor uz neni ESLint vyjimka

### 5.5 `src/components/layout/floating-bar.tsx`

1. Stav: auditovana vyjimka.
2. Trigger:
3. mount gating
4. scroll subscription
5. pre-paint visual sync
6. Hodnoceni:
7. po pokusech o dalsi zjednoduseni vysel puvodni working model jako lepsi tradeoff mezi stabilitou a slozitosti
8. Duvod:
9. alternativy vedly bud k hydration mismatchum, nebo k viditelnemu flashi spatneho stavu pri refreshi ve scrolled pozici
10. Plan:
11. ponechat puvodni implementaci a brat ji jako vedomou auditovanou vyjimku
12. Priorita: uzavreno

### 5.6 `src/components/ui/sidebar.tsx`

1. Stav: vedoma vyjimka.
2. Trigger: keyboard listener pro browser event.
3. Vysledek:
4. soubor zustava v shadcn-friendly raw `React.useEffect` podobe
5. duvodem je snazsi sync s preset/upstream zmenami v `src/components/ui`
6. Poznamka:
7. u upstream-managed UI souboru je preference vanilla kompatibility pred lokalnim effect refaktorem

### 5.7 `src/app/[locale]/error.tsx`

1. Trigger: logging/reporting pri zobrazeni error boundary.
2. Hodnoceni: mozna vedoma vyjimka.
3. Duvod:
4. jde o reporting side effect navazany na render error boundary
5. pokud je cil absolutni minimum raw effectu, je lepsi schovat to do sdileneho reporting helperu
6. Plan:
7. kratkodobe muze zustat v allowlistu
8. dlouhodobe presunout do explicitniho error reporting escape hatchu nebo Sentry wrapperu
9. Priorita: P4 auditovana vyjimka

## 6. Druha vlna: audit `useMountEffect`

### 6.1 `src/hooks/use-mobile.ts`

1. Stav: vedoma vyjimka.
2. Vysledek:
3. hook zustava blizko shadcn vanilla implementaci
4. duvodem je snadny preset/upstream merge v souborech, ktere shadcn casteji prepisuje

### 6.2 `src/components/layout/theme-switcher.tsx`

1. Stav: hotovo.
2. Trigger: hydration guard kvuli `next-themes`.
3. Vysledek:
4. `useMountEffect` zmizel
5. client-only render je reseny pres `useSyncExternalStore` server/client snapshot pattern
6. Poznamka:
7. guard zustava, ale bez mount-time state choreografie

### 6.3 `src/components/ui/copy-button.tsx`

1. Trigger: cleanup timeru pri unmountu.
2. Hodnoceni: legitimni `useMountEffect` usage.
3. Plan:
4. ponechat, pokud nevznikne jednodussi cleanup pattern bez hooku
5. Priorita: P4 low risk

### 6.4 `src/components/layout/floating-bar.tsx`

1. Trigger: mount init + browser scroll sync.
2. Hodnoceni: legitimni kandidat na druhou vlnu auditu, ne uz raw-effect poruseni.
3. Plan:
4. posoudit, jestli `useMountEffect` jen neskriva mount workaround
5. posoudit, jestli `useLayoutEffect` opravdu potrebuje blokovat paint
6. pokud ne, zjednodusit a vyradit soubor z efektovych vyjimek
7. Priorita: P2

## 7. Doporucene implementacni faze

### Faze 1 - hotove quick wins

1. Smazan debug effect v `cookie-context.tsx`.
2. Prekopan auth flash flow a odstranena `SignInFlashToast`.
3. Invite auth-required redirect presunut na server-driven flow.

### Faze 2 - hotove external-store refactory

1. `auth-client.ts` uz je bez komponentoveho `useEffect`.
2. `use-mobile.ts` a `sidebar.tsx` byly nakonec vraceny do upstream-friendly vyjimky kvuli shadcn preset workflow.

### Faze 3 - dalsi doporucene kroky

1. `error.tsx`: bud nechat jako auditovanou vyjimku, nebo schovat do sdileneho error reporting wrapperu.
2. Znovu auditovat `copy-button.tsx`, jestli nejde cleanup vyresit jeste jednoduseji, i kdyz momentalne nevypada problematicky.
3. Shadcn-managed `src/components/ui/**/*` a `src/hooks/use-mobile.ts` drzet co nejbliz upstream vanilla podobe a neresit je stejnym guardrailem jako app-specific feature code.

## 8. Aktualni ESLint status

1. Lint po aktualni refaktor vlne prochazi.
2. Raw `useEffect` je blokovany globalne.
3. Vyjimky z raw-effect guardrailu plati pro:
4. `src/app/[locale]/error.tsx`
5. `src/components/layout/floating-bar.tsx` - auditovana vyjimka po UX/hydration auditu
6. `src/components/ui/**/*.{ts,tsx}` - shadcn/upstream-managed UI vrstva
7. `src/hooks/use-mobile.ts` - shadcn companion hook
8. `src/hooks/use-mount-effect.ts` je povoleny wrapper

## 9. Verifikacni checklist pro kazdou dalsi PR

1. Zmizel raw `useEffect`, nebo je jeho existence explicitne obhajena?
2. Nepresunula se business logika jen z `useEffect` do `useMountEffect`?
3. Lze trigger logic pojmenovat jako render, event, identity change nebo external store?
4. Nepribyl druhy source of truth jen kvuli choreography dependencies?
5. Projde `npm run lint -- .`?
6. Zmensil se ESLint allowlist?
