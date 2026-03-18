# useEffect Refactoring Plan

Datum: 18. 3. 2026

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
8. X post odkazany v zadani se pres tooling nepodarilo rozumne nacist, takze pravidla a plan jsou postavene na oficialnich React zdrojich.

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

## 4. Aktualni audit raw effect usage

### 4.1 Raw `useEffect` / `React.useEffect`

1. `src/components/layout/floating-bar.tsx`
2. `src/features/cookies/cookie-context.tsx`
3. `src/app/[locale]/error.tsx`
4. `src/components/ui/sidebar.tsx`
5. `src/features/auth/auth-client.ts`
6. `src/features/auth/sign-in/sign-in-flash-toast.tsx`
7. `src/features/auth/invite/token/invite-token-auth-required-redirect.tsx`
8. `src/hooks/use-mount-effect.ts` - schvaleny wrapper

### 4.2 `useLayoutEffect`

1. `src/components/layout/floating-bar.tsx`

### 4.3 `useMountEffect` consumery k druhe vlne auditu

1. `src/hooks/use-mobile.ts`
2. `src/components/layout/theme-switcher.tsx`
3. `src/components/ui/copy-button.tsx`

## 5. Klasifikace po souborech

### 5.1 `src/features/cookies/cookie-context.tsx`

1. Trigger: debug log pri zmene lokalniho state.
2. Hodnoceni: effect je zbytecny.
3. Duvod:
4. nejde o synchronizaci s externim systemem
5. logika je jen dev-only logging choreografie
6. Plan:
7. smazat effect uplne
8. pokud je debug stale potreba, logovat primo v handlerech `commitConsent`, `openSettingsDialog`, `closeSettingsDialog`
9. Priorita: P1 quick win

### 5.2 `src/features/auth/sign-in/sign-in-flash-toast.tsx`

1. Trigger: page-entry toast po predchozim flow.
2. Hodnoceni: effect je architektonicky spatne.
3. Duvod:
4. flow je dnes `sessionStorage -> mount effect -> toast`
5. nejde o mount sync s externim systemem, ale o doruceni statusu mezi routami
6. Navazane soubory:
7. `src/features/auth/auth-flash.ts`
8. `src/app/[locale]/(auth)/(guest)/sign-in/page.tsx`
9. `src/features/auth/verify-email/verify-email-form.tsx`
10. `src/features/auth/reset-password/reset-password-form.tsx`
11. Plan:
12. nahradit `sessionStorage` flow kratkodobym cookie/search-param/render-time stavem
13. preferovat render-time status UI nebo route-driven toast trigger bez mount effectu
14. po refaktoru odstranit `SignInFlashToast` komponentu uplne
15. Priorita: P1 quick win

### 5.3 `src/features/auth/invite/token/invite-token-auth-required-redirect.tsx`

1. Trigger: immediate client orchestration po nacteni stranky.
2. Hodnoceni: effect je spatny pattern.
3. Duvod:
4. komponenta se mountne jen proto, aby okamzite zavolala server action a redirect
5. jde o server-driven flow, ne o klientsky side effect
6. Navazane soubory:
7. `src/app/[locale]/(auth)/(flow)/invite/[token]/page.tsx`
8. `src/features/workspaces/actions/workspace-actions.ts`
9. `src/server/workspaces/workspace-cookie.ts`
10. Plan:
11. zavedeni server redirect path nebo route handleru, ktery nastavi pending invite cookie a rovnou redirectne na sign-in
12. odstranit client effect a z komponenty udelat bud cisty fallback state, nebo ji smazat uplne
13. Priorita: P1 quick win

### 5.4 `src/features/auth/auth-client.ts`

1. Trigger: store bootstrap v `useSession()`.
2. Hodnoceni: current direction je skoro spravna, ale stale je tam komponentovy effect navic.
3. Duvod:
4. kod uz pouziva `useSyncExternalStore`
5. bootstrap a prvni `refreshSession()` jsou stale spoustene z `useEffect` v hooku
6. uvnitr store jsou browser subscriptions (`BroadcastChannel`, `visibilitychange`, `online`), ktere odpovidaji external-store modelu
7. Plan:
8. `useSession()` nechat jako ciste `useSyncExternalStore`
9. presunout init a lazy bootstrap do store lifecycle, idealne do `subscribeToSessionStore` nebo explicitniho store initializeru
10. zachovat cross-tab a online/visibility sync bez komponentoveho `useEffect`
11. Priorita: P2 architektonicka vrstva

### 5.5 `src/components/layout/floating-bar.tsx`

1. Trigger:
2. mount init state
3. scroll subscription
4. pre-paint visual sync
5. Hodnoceni: mix legitimniho external sync a zbytecne choreografie.
6. Duvod:
7. `isMounted` effect je podezrely workaround
8. `isScrolledRef` sync effect jen zrcadli state do ref
9. scroll listener sam o sobe je legitimni browser subscription
10. Plan:
11. odstranit raw `useEffect` pro `isMounted`
12. odstranit sync `useEffect` mezi `isScrolled` a `isScrolledRef`
13. zvazit store-style scroll snapshot pres `useSyncExternalStore`
14. `useLayoutEffect` ponechat jen pokud po refaktoru zustane nutny kvuli pre-paint mereni nebo flickeru
15. Priorita: P2 architektonicka vrstva

### 5.6 `src/components/ui/sidebar.tsx`

1. Trigger: keyboard listener pro browser event.
2. Hodnoceni: legitimni external sync, ale raw `useEffect` neni nutny.
3. Plan:
4. prepsat na `useMountEffect` nebo maly sdileny `useWindowEvent`/`useHotkey` hook
5. zachovat cleanup listeneru
6. Priorita: P3 clean-up legit vyjimky

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

1. Trigger: browser subscription na `matchMedia`.
2. Hodnoceni: kandidat na `useSyncExternalStore`.
3. Plan:
4. zabalit `matchMedia` do external-store patternu
5. odstranit lokalni mount-only state sync
6. Priorita: P2 spolu s auth-client/floating-bar

### 6.2 `src/components/layout/theme-switcher.tsx`

1. Trigger: mount guard kvuli hydration/theme hodnotam.
2. Hodnoceni: potrebuje znovu navrhnout, ne jen prebalit do helperu.
3. Plan:
4. proverit jestli jde pouzit SSR-safe render, `ClientOnly` pattern nebo jine reseni z `next-themes`
5. nesmi zustat jen "setMounted(true) v mount effectu" bez obhajoby
6. Priorita: P3

### 6.3 `src/components/ui/copy-button.tsx`

1. Trigger: cleanup timeru pri unmountu.
2. Hodnoceni: legitimni `useMountEffect` usage.
3. Plan:
4. ponechat, pokud nevznikne jednodussi cleanup pattern bez hooku
5. Priorita: P4 low risk

## 7. Doporucene implementacni faze

### Faze 1 - quick wins

1. Smazat debug effect v `cookie-context.tsx`.
2. Prekopat auth flash flow a odstranit `SignInFlashToast`.
3. Prekopat invite auth-required redirect na server-driven flow.

### Faze 2 - external-store refactor

1. Dodelat `auth-client.ts` bez komponentoveho `useEffect`.
2. Prekopat `use-mobile.ts` na `useSyncExternalStore`.
3. Prekopat `floating-bar.tsx` na cistsi scroll subscription model.

### Faze 3 - legit vyjimky a cleanup

1. `sidebar.tsx` prepsat na `useMountEffect` nebo sdileny listener hook.
2. `theme-switcher.tsx` rozhodnout mezi SSR-safe renderem a explicitni vyjimkou.
3. `error.tsx` bud nechat jako auditovanou vyjimku, nebo schovat do sdileneho error reporting wrapperu.
4. Znovu projit allowlist v ESLintu a zmensit ho po kazde fazi.

## 8. Aktualni ESLint status

1. Lint po zavedeni pravidel prochazi.
2. Raw `useEffect` je blokovany globalne.
3. Vyjimky jsou docasne povolene pro:
4. `src/app/[locale]/error.tsx`
5. `src/components/layout/floating-bar.tsx`
6. `src/components/ui/sidebar.tsx`
7. `src/features/auth/auth-client.ts`
8. `src/features/auth/invite/token/invite-token-auth-required-redirect.tsx`
9. `src/features/auth/sign-in/sign-in-flash-toast.tsx`
10. `src/features/cookies/cookie-context.tsx`
11. `src/hooks/use-mount-effect.ts` je povoleny wrapper

## 9. Verifikacni checklist pro kazdou dalsi PR

1. Zmizel raw `useEffect`, nebo je jeho existence explicitne obhajena?
2. Nepresunula se business logika jen z `useEffect` do `useMountEffect`?
3. Lze trigger logic pojmenovat jako render, event, identity change nebo external store?
4. Nepribyl druhy source of truth jen kvuli choreography dependencies?
5. Projde `npm run lint -- .`?
6. Zmensil se ESLint allowlist?
