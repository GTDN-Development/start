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

## Zakladni pravidlo

- Raw `useEffect` je v beznem aplikacnim kodu podezrely default.
- Pokud kod nesynchronizuje komponentu s externim systemem mimo React, `useEffect` je s vysokou pravdepodobnosti spatne primitivum.
- Pokud je potreba mount/unmount sync s browser API, DOM listenerem, timerem nebo third-party widgetem, preferujte `useMountEffect()` misto ad-hoc `useEffect(..., [])`.
- `useLayoutEffect()` ma jeste vyssi latku: jen pro DOM measurement nebo pre-paint sync, ktery by ve `useEffect` zpusobil viditelny flicker.

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

### 4. Reset resit remountem

- Pokud se komponenta ma pri zmene identity chovat jako nova instance, pouzijte `key`.
- Neresit "reset pri zmene X" pres effect, ktery rucne nulije state nebo znovu vola init logiku.
- Parent ma vlastnit orchestration boundary, child ma dostat uz platne preconditions.

### 5. Subscriptiony resit pres `useSyncExternalStore`

- Pokud jde o externi mutable signal se synchronnim snapshotem a subscribe/unsubscribe API, preferujte `useSyncExternalStore`.
- Typicke kandidaty: auth session store, `matchMedia`, scroll/visibility/online stav, BroadcastChannel-backed state.
- Effect pak nepatri do komponenty; komponenta cte snapshot, store resi subscription lifecycle.

### 6. Mount/unmount sync izolujte do `useMountEffect`

- Jedina bezna vyjimka je synchronizace s externim systemem mimo React.
- Typicke priklady: `addEventListener`/`removeEventListener`, timer setup/cleanup, third-party widget init/destroy, clipboard cleanup, imperative focus nebo scroll po mountu.
- `useMountEffect` neni univerzalni nahrada za spatny `useEffect`. Pokud tam neni mount/unmount sync s externim systemem, helper nepouzivejte.

### 7. Legitimizovane effecty drzte male a presne

- Jeden effect ma reprezentovat jednu synchronizacni zodpovednost.
- Cleanup musi byt zrcadlem setupu.
- Pokud legitimizovany effect potrebuje cist nejnovejsi props/state bez zbytecne re-subscription, zvazte `useEffectEvent`.

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
- Pri dalsim refactoringu auditovat i `useMountEffect` consumery, aby se z helperu nestalo jen nove jmeno pro stejny problem.
