# useEffect Guideline

## Scope

- Tento dokument plati pro client komponenty, custom hooks a lokalni interaktivni UI v `src/features/*`, `src/components/*` a `src/hooks/*`.
- Cilem je omezit implicitni synchronization logiku a presunout control flow z dependency arrays do deklarativniho renderu, event handleru a specializovanych abstractions.

## Zakladni pravidlo

- `useEffect` se nema volat primo v beznem aplikacnim kodu.
- Pokud je potreba jednorazovy sync s externim systemem pri mountu, pouzijte dedikovany `useMountEffect()` helper misto ad-hoc `useEffect(..., [])`.
- Pokud logika nevychazi z mount/unmount lifecycle nebo synchronizace s browser/API/widgetem mimo React, je velmi pravdepodobne, ze `useEffect` neni spravne reseni.

## Proc tohle pravidlo mame

- `useEffect` casto presouva jednoduchou logiku do implicitniho casoveho flow zavisleho na dependency array.
- Kod je pak hur citelny, protoze misto jasneho triggeru typu render nebo user action musime dohledavat, proc se effect spustil nebo nespustil.
- Effecty casto zavadime i tam, kde React uz ma lepsi primitiva: derivovany state, event handlery, remount pres `key` nebo datove abstractions.
- V praxi to vede k extra renderum, race conditions, nekonecnym loopum a krehkym refactorum.
- Cilem neni "zakazat side effects", ale donutit kod pouzivat presnejsi a citelnejsi model pro kazdy typ logiky.

## Kdy je `useEffect` spatny signal

- Effect jen odvozuje state z jineho state nebo props.
- Effect dela `fetch(...).then(setState)` nebo jinou rucni async synchronizaci dat.
- Effect je spousteny kvuli akci uzivatele, ktera ma jasny event entrypoint.
- Effect nastavuje "flag" state jen proto, aby nasledne provedl skutecnou akci.
- Effect resetuje lokalni state pri zmene `id`, `slug`, `tab`, `step` nebo podobne identity.
- Pri cteni kodu je potreba mentalne sledovat dependency array, aby bylo jasne proc se neco stalo.

## Preferovane alternativy

### 1. Derivujte state misto jeho synchronizace

- Neschovavejte odvozenou hodnotu do vlastniho state, pokud ji lze spocitat pri renderu.
- Typicky anti-pattern: `useEffect(() => setX(deriveFromY(y)), [y])`.
- Preferujte primy vypocet, pripadne cisty helper/function.

### 2. Akce provadejte v event handleru

- Pokud uzivatel klikne, submitne form nebo zmeni input, provedte logiku primo v handleru.
- Nevytvarejte pattern `setShouldRun(true) -> effect -> side effect -> reset flag`.
- Event-driven chovani ma mit jasny vstupni bod v handleru, ne v dependency array.

### 3. Pro data pouzivejte fetch/query abstractions

- Nepisite vlastni fetch orchestration v effectu, pokud uz pro to existuje server component, server action, query hook nebo jina sdilena data vrstva.
- Effect-based fetching snadno vede k race conditions, duplikaci cache logiky a slozitemu loading/error stavu.

### 4. Mount/unmount side effects izolujte do `useMountEffect`

- Jedina bezna vyjimka je synchronizace s externim systemem mimo React.
- Typicke priklady: DOM integrace, browser API subscriptions, third-party widget lifecycle, focus, scroll, listener setup/cleanup.
- Tyto pripady maji byt explicitni a citelne pres pojmenovany helper typu `useMountEffect(() => { ... })`.

### 5. Reset resit remountem, ne choreografii dependencies

- Pokud se komponenta ma pri zmene identity chovat jako nova instance, pouzijte `key`.
- Neresit "reset pri zmene X" pres effect, ktery rucne nulije state nebo znovu vola init logiku.
- Parent ma vlastnit orchestration hranice, child ma dostat uz platne preconditions.

## Doporuceny refactoring checklist

- Nejdriv si pojmenujte, co je skutecny trigger dane logiky: render, user event, mount nebo zmena identity.
- Pokud je trigger render, odvodte hodnotu primo z props/state.
- Pokud je trigger user action, presunte logiku do handleru.
- Pokud je trigger data loading, pouzijte existujici data vrstvu misto effectu.
- Pokud je trigger mount externiho systemu, zabalte ho do `useMountEffect`.
- Pokud je trigger "zacni znovu pro novou entitu", preferujte `key` a remount.

## Review pravidla

- Kazdy novy `useEffect` ma byt povazovan za podezrely default a vyzaduje obhajitelny duvod.
- Pri review se nejdriv hleda, jestli effect neni jen nahrada za derivaci, handler, query abstraction nebo remount boundary.
- Dependency array se nema stat nosicem business logiky.

## Prakticky cil pro tento projekt

- Postupne refaktorovat existujici `useEffect` usage na deklarativni patterny.
- Direct `useEffect` volani v aplikacnim kodu brat jako technicky dluh, pokud nejde o jasny mount/unmount sync s externim systemem.
- Po zavedeni helperu a lint pravidla smerovat k tomu, aby bezny feature code pouzival `useMountEffect` jen vyjimecne a `useEffect` vubec.
