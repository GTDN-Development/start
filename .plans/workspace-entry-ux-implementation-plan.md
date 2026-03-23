# Workspace Entry UX Implementation Plan

Datum: 2026-03-23

## Cíl

Zpřesnit chování návratu do aplikace tak, aby:

- scope switching zůstalo centralizované v app shellu
- marketing web nepůsobil jako nečekaný reset do personal scope
- `Start` zůstal account-first a zároveň workspace-friendly
- nevznikla předčasná globální scope infrastruktura

Součástí plánu je i rozhodnutí pro CTA `Do aplikace` v marketing headeru.

## Rozhodnutí

### 1. Centrální přepínání scope zůstává jen v `ScopeSwitcher`

To znamená:

- pouze `ScopeSwitcher` uvnitř application shellu slouží jako explicitní UI pro změnu scope
- marketing header, footer ani jiné CTA mimo shell nejsou scope switchery
- mimo shell se scope nepřepíná jako uživatelská volba, pouze se obnovuje poslední aktivní app context

### 2. `Do aplikace` nemá vždy vracet na `/app`

Aktuální chování:

- přihlášený uživatel na marketing webu klikne na `Do aplikace`
- CTA vede na `/app`
- i když byl uživatel předtím v konkrétním workspace, dojde k návratu do personal scope

To je UXově matoucí.

Správné pravidlo:

- `Do aplikace` = vrať mě do mého posledního aktivního app contextu
- pokud existuje validní aktivní workspace preference, vrať uživatele do tohoto workspace
- pokud validní aktivní workspace neexistuje, vrať uživatele do `/app`

Toto není porušení centralizovaného switching modelu.
Nejde o nové místo pro přepnutí scope, ale o návrat do naposledy aktivního kontextu.

### 3. Marketing web nesmí uživateli tiše měnit aktivní scope

CTA `Do aplikace` má:

- respektovat existující app context
- neprovádět nový scope switch bez explicitní akce v shellu
- nepřepisovat `active_workspace`

Marketing web tedy pouze otevře správný cíl.
Samotná preference scope zůstává spravovaná existujícím modelem.

## Cílové UX pravidlo

Pro přihlášeného uživatele:

1. Pokud má validní `active_workspace` a je stále členem tohoto workspace:
   - `Do aplikace` vede na `/w/[workspaceSlug]/overview`
2. Pokud `active_workspace` neexistuje nebo je stale:
   - `Do aplikace` vede na `/app`
3. Pokud má uživatel nulový počet workspaces:
   - `Do aplikace` vede na `/app`

Pro nepřihlášeného uživatele:

1. CTA dál funguje jako dnes:
   - `Přihlásit se`
   - `Vytvořit účet`

## Proč je to správnější než tvrdý návrat na `/app`

Výhody:

- respektuje poslední pracovní kontext uživatele
- nebudí dojem, že marketing web scope „vynuloval“
- zachovává `Personal` jako first-class scope
- neplete si návrat do appky se scope switchingem
- funguje dobře pro B2B i B2C variantu

Nevýhoda tvrdého `/app` návratu:

- uživatel ztratí kontinuitu
- vzniká pocit, že workspace není skutečný primární pracovní kontext
- tlačítko `Do aplikace` se chová spíš jako `Jdi na osobní home`, i když to neříká

## Produktové pravidlo pro template

Doporučené trvalé pravidlo:

- `Do aplikace` mimo app shell znamená `Resume app`
- explicitní změna scope probíhá pouze v `ScopeSwitcher`

Tohle pravidlo je dost obecné, aby fungovalo i v dalších SaaS forknutích.

## Architektonické guardraily

Tento plán musí zůstat v souladu s [project-architecture-principles.md](/Users/fanda/Dev/start/.rules/project-architecture-principles.md).

Praktický výklad pro tuto změnu:

- preferovat jeden malý helper před novou systémovou vrstvou
- preferovat přímé napojení layout -> helper -> header
- nepřidávat provider-neutral nebo app-wide routing abstraction
- nepřidávat nový context/provider jen kvůli jednomu CTA
- neskrývat jednoduché rozhodnutí za generické názvy typu `engine`, `manager`, `adapter`

KISS varianta pro tuto změnu:

- jeden server helper pro resolve cíle
- malý prop navíc v marketing layout větvi
- minimální úprava header CTA

To je dostatečně jednoduché a zároveň produkčně kvalitní.

## Implementační plán

## Fáze 1: Uzamknout pravidlo pro application entry

### Úkoly

1. Sepsat krátké interní pravidlo:
   - marketing CTA obnovuje app context
   - shell switcher mění scope
2. Ujistit se, že tým používá stejný jazyk:
   - `app entry`
   - `scope switch`
   - `active workspace preference`

### Výstup

- produktově jednoznačné rozhodnutí, které se nebude znovu otevírat při dalších úpravách

### Odhad LoC

- 0 až 15 LoC

Poznámka:

- pokud stačí jen doplnění stávající dokumentace/plánu, není potřeba žádný nový runtime kód

## Fáze 2: Zavést serverový resolver pro app entry cíl

### Cíl

Nedržet logiku cílového app odkazu v marketing headeru natvrdo jako `/app`.

### Doporučený směr

Přidat jeden malý server-side resolver, například:

- `resolveApplicationEntryHrefForCurrentUser()`

Resolver má vrátit:

- `/w/[workspaceSlug]/overview`, pokud existuje validní aktivní workspace
- jinak `/app`

### Požadavky na resolver

- nesmí vytvářet nový globální stav
- má používat stávající `active_workspace` cookie jako preference
- má ověřit, že workspace v cookie je stále dostupný
- při neplatné hodnotě má bezpečně spadnout na `/app`
- ideálně může zároveň vrátit i `resolvedWorkspaceName`, pokud by se později hodil pro jemnější UI copy

### Poznámka k architektuře

Tohle není nová abstraktní vrstva.
Je to malý route/navigation helper, který patří do současného modelu.

### Doporučené umístění

- buď rozšířit stávající `src/features/application/workspace-routing.ts`
- nebo přidat jeden nový focused server helper poblíž application/workspace routing logiky

Preferované rozhodnutí:

- pokud helper zůstane malý a čitelný, rozšířit existující route helper soubor
- nový soubor přidat jen pokud by míchání client a server concerns zhoršilo čitelnost

### Odhad LoC

- 25 až 60 LoC

Guard rail:

- pokud resolver začne růst přes přibližně 60 LoC čisté logiky, zastavit a zkontrolovat, zda se do něj netlačí více zodpovědností, než má mít

## Fáze 3: Napojit marketing header na resolved app entry

### Cíl

Nahradit natvrdo použitý `personalApplicationMenu.home.href` dynamickým app entry cílem.

### Úkoly

1. Upravit server marketing layout tak, aby kromě `viewer` předal i `applicationEntryHref`.
2. Upravit `MarketingLayout`, aby tento href prop přeposlal do `MarketingHeader`.
3. Upravit `MarketingHeader`, aby CTA `Do aplikace` používalo resolved href místo pevného `/app`.

### Důležité pravidlo

- pokud resolver vrátí workspace overview, label CTA může zůstat `Do aplikace`
- netřeba z toho dělat druhý switcher

Volitelně později:

- malý secondary hint typu název workspace
- ale ne v první iteraci

### Odhad LoC

- 20 až 45 LoC

Guard rail:

- první iterace bez nového UI komponentu
- bez dynamického secondary labelu
- bez nového dropdown behavior

To drží změnu malou a snižuje riziko nechtěného UX driftu.

## Fáze 4: Sjednotit další vstupy do appky

### Cíl

Aby se návrat do appky nechoval rozdílně podle povrchu.

### Zkontrolovat

1. marketing header CTA
2. marketing footer CTA, pokud existuje
3. invite result fallback CTA `Go to app`
4. případné další authenticated CTA na marketing pages
5. případně user menu odkazy, pokud někde mimo shell míří natvrdo na `/app`

### Doporučení

Ne všechny linky musí nutně používat restored context.
Ale musí být jasně rozdělené:

- `Go to app` nebo `Do aplikace` = obnovit app context
- `Personal home` = explicitně vést na `/app`

Tohle rozlišení je důležité i v copy.

### Odhad LoC

- 10 až 40 LoC

Guard rail:

- neměnit routy ani app shell behavior
- jen sjednotit semantics existujících CTA
- pokud některý povrch není jistý, ponechat ho beze změny a zapsat jako follow-up

## Fáze 5: Zpřesnit copy a semantics

### Cíl

Odlišit:

- návrat do appky
- návrat do personal scope

### Doporučené pravidlo pro labels

- `Do aplikace` = restore current app context
- `Osobní přehled` nebo `Personal home` = explicitní link na `/app`

### Dopad

To znamená, že současné použití `personalApplicationMenu.home` jako univerzální app CTA je sémanticky nepřesné a mělo by být oddělené.

### Odhad LoC

- 5 až 20 LoC

Guard rail:

- nevytvářet nový config systém pro labels
- držet změnu v existujících messages a props flow

## Fáze 6: Ošetřit edge cases

### Edge cases

1. `active_workspace` cookie odkazuje na smazaný workspace
   - fallback na `/app`
2. uživatel už není členem workspace z cookie
   - fallback na `/app`
3. uživatel nikdy žádný workspace neměl
   - `/app`
4. uživatel má workspaces, ale žádný aktivní workspace není uložený
   - doporučeně `/app`
   - marketing web nemá sám vybírat „první workspace“ bez explicitního signálu

### Důležitá produktová nuance

Na marketing webu bych nedoporučil automaticky otevírat první workspace jen proto, že nějaký existuje.

Důvod:

- cookie reprezentuje známou uživatelskou preferenci
- „první workspace v seznamu“ není preference, ale heuristika

Správné chování mimo shell je:

- obnovit známý kontext
- jinak jít do osobního vstupu `/app`

### Odhad LoC

- 0 až 20 LoC nad rámec resolveru

Poznámka:

- většina edge cases by měla být absorbovaná už přímo v resolveru, ne rozesetá po více komponentách

## Fáze 7: QA scénáře

### Ověřit

1. Uživatel je v personal scope, přejde na web, klikne `Do aplikace`
   - očekávání: vrátí se na `/app`
2. Uživatel je ve workspace scope, přejde na web, klikne `Do aplikace`
   - očekávání: vrátí se na `/w/[workspaceSlug]/overview`
3. Uživatel má stale `active_workspace`
   - očekávání: bezpečný návrat na `/app`
4. Uživatel má zero-workspace state
   - očekávání: `/app`
5. Invite acceptance nastaví active workspace, uživatel přejde na marketing a vrátí se
   - očekávání: návrat do přijatého workspace

### Odhad LoC

- 0 až 15 LoC

Poznámka:

- ideálně nejdřív jako dokumentovaný manuální checklist
- automatizované testy přidat jen pokud v repu už existuje přirozené místo, kam je dát bez rozšiřování testovací infrastruktury

## Rozsah změn

Nízký až střední.

Nejde o refaktor celé workspace vrstvy.
Jde o zpřesnění application entry semantics v několika bodech:

- marketing layout
- marketing header
- malý server-side resolver
- případně sjednocení několika CTA labelů

### Celkový odhad LoC

- minimální varianta: 35 až 70 LoC
- realistická produkční varianta: 60 až 140 LoC
- horní bezpečná hranice pro tuto změnu: přibližně 180 LoC

Pokud implementace začne růst nad tuto hranici, je to signál, že se řeší víc než application entry semantics a je potřeba scope znovu zúžit.

## Produkční acceptance kritéria

Změna je hotová teprve když:

1. `Do aplikace` vrací přihlášeného uživatele do validního posledního app contextu.
2. Zero-workspace a stale-cookie scénáře bezpečně padají na `/app`.
3. Nikde nevznikl druhý scope switcher mimo app shell.
4. Nebyl přidán nový globální state/provider jen kvůli této funkci.
5. Chování je konzistentní alespoň mezi marketing header CTA a dalšími hlavními `Go to app` vstupy.
6. Implementace zůstává top-to-bottom čitelná:
   - layout
   - helper
   - header

## Co naopak nedělat

1. Nevytvářet nový globální scope store.
2. Nevytvářet session-driven workspace context bez URL identity.
3. Nedělat z marketing headeru druhý scope switcher.
4. Nevracet `Do aplikace` natvrdo na `/app`, pokud má uživatel validní aktivní workspace context.
5. Nevybírat mimo shell „první workspace“ jako implicitní návratový cíl, pokud není uložená preference.

## Doporučené pořadí implementace

1. Uzamknout produktové pravidlo pro `Do aplikace`
2. Přidat server resolver pro application entry href
3. Napojit marketing header na resolver
4. Projít další CTA a rozlišit `Go to app` vs `Personal home`
5. Dopsat QA scénáře do workspace/app shell dokumentace

## Doporučený verdikt

Ano, tvoje intuice je správná:

současné chování, kdy `Do aplikace` vždy vede do personal scope, není ideální.

Správné řešení je:

- scope switching ponechat centrálně v `ScopeSwitcher`
- ale návrat z marketingu do appky nechat obnovovat poslední aktivní app context

Tím získáš:

- lepší kontinuitu pro workspace uživatele
- stále čistý a srozumitelný model
- žádnou novou zbytečnou abstrakci
