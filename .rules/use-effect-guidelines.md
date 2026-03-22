# useEffect Guideline

## Scope

- Tento dokument plati pro client komponenty, custom hooks a lokalni interaktivni UI v `src/features/*`, `src/components/*` a `src/hooks/*`.
- Cilem je drzet render cisty, vyhnout se implicitnimu control flow v dependency arrays a pouzivat effecty jen tam, kde React skutecne synchronizujeme s necim mimo React.

## Source of truth

- Zaklad vychazi z oficialnich React docs:
  - `https://react.dev/learn/you-might-not-need-an-effect`
  - `https://react.dev/learn/synchronizing-with-effects`
  - `https://react.dev/learn/removing-effect-dependencies`
  - `https://react.dev/reference/react/useEffect`
  - `https://react.dev/reference/react/useEffectEvent`
  - `https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect`

## Strucny vycuc

- `useEffect` je escape hatch pro synchronizaci Reactu s externim systemem, ne defaultni nastroj pro aplikacni control flow.
- Pokud v logice neni externi system mimo React, je velmi pravdepodobne, ze effect nepotrebujete.
- Odvozena data patri do renderu, user-driven akce do event handleru a reset pri zmene identity do `key`/remount boundary.
- Dependency array ma popisovat synchronizacni vstupy, ne nosit business logiku cele feature.
- Kazdy zbytecny effect pridava implicitni casovani navic: extra rendery, stale closures, race conditions a hure citelny kod.

## Proc tenhle guardrail existuje

- Prakticky benefit z clanku i React docs je stejny: mene infinite loopu, mene race-condition regresi a citelnejsi control flow.
- Dependency arrays skryvaji coupling. Refactor, ktery vypada unrelated, muze tise zmenit effect behavior.
- Effect chains (`A` nastavi state, ktery spusti `B`) zavadeji casove rizeny control flow, ktery se spatne trasuje a snadno regreduje.
- Debugging je horsi, protoze misto jednoho jasneho entrypointu typu render nebo handler resite "proc se to spustilo" a "proc se to nespustilo".
- U agent-generated kodu je to jeste horsi: `useEffect` se casto prida "just in case" a tim se zalozi dalsi loop nebo race condition.

## Pet defaultnich nahrad

1. Derive state, do not sync it.
2. Use server/data abstractions instead of effect-based fetching.
3. Do the work in event handlers, not in effects.
4. Pouzijte `useMountEffect` jen pro jednorazovy external sync typu setup-on-mount a cleanup-on-unmount.
5. Reset pri zmene identity resit `key`, ne dependency choreography.

## Zakladni pravidlo

- Raw `useEffect` je v beznem aplikacnim kodu podezrely default.
- Pokud kod nesynchronizuje komponentu s externim systemem mimo React, `useEffect` je s vysokou pravdepodobnosti spatne primitivum.
- Pokud je potreba mount/unmount sync s browser API, DOM listenerem, timerem nebo third-party widgetem, preferujte `useMountEffect()` misto ad-hoc `useEffect(..., [])`.
- `useLayoutEffect()` ma jeste vyssi latku: jen pro DOM measurement nebo pre-paint sync, ktery by ve `useEffect` zpusobil viditelny flicker.

## Co neni cil

- Cilem neni mechanicky odstranit kazdy effect za kazdou cenu.
- Legitimizovane effecty pro external sync, subscriptions nebo mount/unmount lifecycle nejsou automaticky problem.
- Problem je effect jako nahrada za lepsi model: derivaci, handler, server/data abstraction nebo remount boundary.

## Rozhodovaci strom

1. Lze vysledek spocitat z props/state pri renderu?
   - Derivujte ho pri renderu, nedavejte ho do state + effectu.
2. Je trigger konkretni user action?
   - Presunte logiku do event handleru.
3. Jde o data loading nebo mutaci serverovych dat?
   - Pouzijte server component, server action nebo existujici data abstraction.
4. Ma se komponenta pri zmene identity chovat jako nova instance?
   - Pouzijte `key` nebo posunte remount boundary vyse.
5. Cte komponenta externi mutable source, ktery ma snapshot + subscribe model?
   - Preferujte `useSyncExternalStore`.
6. Jde o mount/unmount synchronizaci s externim systemem?
   - Pouzijte `useMountEffect`.
7. Pokud ani pak nevychazi nic jineho:
   - Pojmenujte externi system, setup, cleanup a proc to nejde deklarativneji.

## Kdy je `useEffect` spatny signal

- Effect jen odvozuje state z jineho state nebo props.
- Effect dela `fetch(...).then(setState)` nebo rucni async orchestration dat.
- Effect je spousteny kvuli akci uzivatele, ktera ma jasny event entrypoint.
- Effect nastavuje "flag" state typu `submitted`, `shouldRun`, `isReady`, aby teprve pak provedl skutecnou akci.
- Effect resetuje lokalni state pri zmene `id`, `slug`, `tab`, `step` nebo podobne identity.
- Effect udrzuje dva lokalni zdroje pravdy "v syncu" jen proto, aby dependency array ridila business logiku.
- Effect existuje jen kvuli debug logu nebo `console.log` choreografii.
- Pri cteni kodu je potreba mentalne simulovat dependency array, aby bylo jasne, proc se neco stalo.

## Preferovane alternativy

### 1. Derivujte hodnoty pri renderu

- Neschovavejte odvozenou hodnotu do vlastniho state, pokud ji lze spocitat z aktualnich props/state.
- Typicky anti-pattern: `useEffect(() => setX(deriveFromY(y)), [y])`.
- Preferujte primy vypocet, pripadne cisty helper.

### 2. Akce provadejte v event handleru

- Pokud uzivatel klikne, submitne form nebo zmeni input, provedte logiku primo v handleru.
- Nevytvarejte pattern `setShouldRun(true) -> effect -> side effect -> reset flag`.
- POST request, redirect, toast nebo analytics navazane na konkretnim submitu patri do handleru, ne do dependency array.

### 3. Pro data pouzivejte server/data abstractions

- Nepisite vlastni fetch orchestration v effectu, pokud uz pro to existuje server component, server action, query hook nebo jina sdilena data vrstva.
- Effect-based fetching snadno vede k race conditions, duplikaci cache logiky a zbytecnym loading/error stavum.

### 3a. Page data preferujte server-first

- Pokud jsou data potreba pro otevreni stranky a UX tim netrpi, preferujte server-side nacitani v route/page/server wrapperu.
- Client komponenta ma idealne dostat initial data pres props a resit hlavne interakce a lokalni UI state.
- Raw fetch v effectu neni preferovana cesta pro page-level business data.

### 3b. Client-side data loading je vyjimka

- Client-side loading je pripustny, pokud je to vedomy UX kompromis a nechceme blokovat prvni render cele stranky.
- Takova vyjimka ma byt explicitne obhajena v review a pokud mozno kratce zdokumentovana v kodu.
- `useMountEffect` neni automaticka nahrada za fetch v `useEffect`; samotne prepsani fetchu do mount helperu neresi architektonicky problem.

### 3c. Po mutaci neobnovujte cely route strom bez duvodu

- `router.refresh()` berte jako posledni moznost pro server-driven view, ne jako default po kazde mutaci.
- Pokud uz mate lokalni nebo sdileny source of truth v Reactu, aktualizujte ten primo (`patch*`, local state, store, provider) a nedublujte to full refreshi.
- Anti-pattern je: mutace uspeje -> lokalne patchnu data -> hned nato zavolam `router.refresh()`.
- Tenhle dvojity orchestration casto zbytecne aktivuje `loading.tsx` / Suspense boundaries, zhorsuje UX flicker a muze odhalit React boundary edge-cases.
- Pokud aktualni view stale stoji na server-rendered props bez client store, je `router.refresh()` pripustny, ale ma byt vedoma vyjimka, ne reflex.
- Po `router.push()` nebo `router.replace()` bezne nedava smysl pridavat dalsi `router.refresh()`.

### 4. Reset resit remountem

- Pokud se komponenta ma pri zmene identity chovat jako nova instance, pouzijte `key`.
- Neresit "reset pri zmene X" pres effect, ktery rucne nulije state nebo znovu vola init logiku.
- Parent ma vlastnit orchestration boundary, child ma dostat uz platne preconditions.
- Pokud je potreba cekat na preconditions, casto je lepsi conditional mounting nez guard uvnitr effectu.

### 5. Subscriptiony resit pres `useSyncExternalStore`

- Pokud jde o externi mutable signal se synchronnim snapshotem a subscribe/unsubscribe API, preferujte `useSyncExternalStore`.
- Typicke kandidaty: auth session store, `matchMedia`, scroll/visibility/online stav, BroadcastChannel-backed state.
- Effect pak nepatri do komponenty; komponenta cte snapshot, store resi subscription lifecycle.

### 5a. Hydration guard resit pres `useHydrated`

- Pokud je problem pouze v tom, ze server neumi znat stejny snapshot jako browser az po hydrataci, preferujte maly hydration guard hook typu `useHydrated()`.
- To je vhodne hlavne pro client-only UI zavisle na browser runtime, napr. `next-themes`.
- `useHydrated()` neni prima nahrada za genericky `isMounted` hook.
- `useHydrated()` neni obecna nahrada za `useEffect`; je to uzky server/client snapshot guard.

### 6. Mount/unmount sync izolujte do `useMountEffect`

- Jedina bezna vyjimka je synchronizace s externim systemem mimo React.
- Typicke priklady: `addEventListener`/`removeEventListener`, timer setup/cleanup, third-party widget init/destroy, clipboard cleanup, imperative focus nebo scroll po mountu.
- `useMountEffect` neni univerzalni nahrada za spatny `useEffect`. Pokud tam neni mount/unmount sync s externim systemem, helper nepouzivejte.
- Smell test:
  - opravdu synchronizujete externi system
  - chovani je prirozene `setup on mount, cleanup on unmount`

### 7. Legitimizovane effecty drzte male a presne

- Jeden effect ma reprezentovat jednu synchronizacni zodpovednost.
- Cleanup musi byt zrcadlem setupu.
- Pokud legitimizovany effect potrebuje cist nejnovejsi props/state bez zbytecne re-subscription, zvazte `useEffectEvent`.

## Kdy effect nechat byt

- Browser event subscriptions typu `window.addEventListener(...)`.
- `matchMedia`, `ResizeObserver`, `IntersectionObserver` a podobne browser subscriptions.
- Third-party widget lifecycle.
- Imperativni DOM sync po mountu, pokud nejde resit deklarativne.
- Male logging/reporting effecty, pokud nejsou zdrojem coupling nebo race conditions.
- I v techto pripadech ale preferujte male, izolovane effecty s jasnym setup/cleanup kontraktem.

## Co `useMountEffect` neresi

- `useMountEffect` neni schvaleni pro fetch pri mountu, pokud data patri do server/page vrstvy.
- `useMountEffect` neni nahrada za event handler.
- `useMountEffect` neni nahrada za derivaci hodnot pri renderu.
- `useMountEffect` neni nahrada za sync props do local state.
- Pokud by prepis `useEffect` -> `useMountEffect` jen zachoval stejny control flow, nejde o skutecny refactor.

## Co `useHydrated` neresi

- `useHydrated` neni prima nahrada za `isMounted`.
- `useHydrated` neni schvaleni pro schovavani app logiky za `if (!hydrated) return null`.
- `useHydrated` neni nahrada za `useSyncExternalStore` pro realne subscriptiony ani za render-time derivaci.
- Pokud problem neni server/client snapshot mismatch, `useHydrated` pravdepodobne neni spravne reseni.

## Forcing function pro architekturu

- Zakaz raw `useEffect` funguje jako forcing function pro cistsi strom komponent.
- Parent ma vlastnit orchestration a lifecycle boundaries.
- Child ma idealne predpokladat, ze preconditions uz plati, a delat jednu vec dobre.
- To obvykle vede k jednodussim komponentam, mene skrytym side effectum a jasnejsim nesting boundaries.

## Review checklist

- Co je skutecny trigger dane logiky: render, user event, zmena identity, subscription nebo mount/unmount?
- S jakym externim systemem se komponenta synchronizuje?
- Neslo by to resit pres render, handler, `key`, server/data abstraction nebo `useSyncExternalStore`?
- Odpovida cleanup presne setupu?
- Popisuje dependency array jen reaktivni vstupy, nebo se z ni stal nosic business logiky?
- Pokud exception zustava, je explicitne obhajena a vedena jako docasny dluh?

## Prakticky cil pro tento projekt

- Postupne odstranit raw `useEffect` z bezneho feature code.
- ESLint allowlist brat jako docasny seznam auditovanych vyjimek, ne jako precedens pro dalsi kod.
- `useMountEffect` brat jako escape hatch, ne jako defaultni styl.
- `useHydrated` brat jako uzky hydration guard, ne jako nove jmeno pro `isMounted`.
- Pri dalsim refactoringu auditovat i `useMountEffect` consumery, aby se z helperu nestalo jen nove jmeno pro stejny problem.
- Shadcn-managed `src/components/ui/**/*` a `src/hooks/use-mobile.ts` jsou vedoma upstream kompatibilni vyjimka.
