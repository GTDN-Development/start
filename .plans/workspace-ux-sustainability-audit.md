# Workspace UX & Sustainability Audit

Datum: 2026-03-23

## Cíl

Zhodnotit aktuální stav workspace modelu ve `Start` z pohledu:

- UX srozumitelnosti
- dlouhodobé udržitelnosti šablony
- připravenosti na další B2B SaaS produkty
- připravenosti na budoucí billing
- možnosti workspace vrstvu později relativně čistě odstranit pro B2C variantu

Audit vychází z:

- lokální implementace v `Start`
- referenční aplikace `better-auth-canary`
- rešerše oficiálních materiálů GitHub, Linear, Figma, Slack a Stripe

## Executive Summary

Aktuální směr je ve své podstatě správný.

`Start` má dnes dobrý základ proto, aby fungoval jako account-first starter s volitelnou collaborative vrstvou. Největší plus je, že workspace není povinný invariant celé aplikace, osobní scope má vlastní routy a workspace scope je odvozený z URL, ne z nějakého skrytého globálního stavu. To je dobré pro UX, billing i budoucí B2C derivát.

Největší slabina dnes není architektura, ale produktová srozumitelnost a naming disciplína. V kódu i copy se míchá `workspace`, `organization`, `personal`, `personal area` a starší `workspaceSwitcher`. To je přesně typ driftu, který v template časem vytvoří produktový dluh a v dalších SaaS forknutích povede k nekonzistentnímu UI.

Z pohledu dlouhodobé udržitelnosti je nejdůležitější rozhodnutí toto:

- ponechat `Personal` jako explicitní first-class scope
- držet `Workspace` jako sdílený collaborative scope
- nepouštět do core app abstrakce pro billing nebo provider-neutral vrstvy dřív, než bude první reálný provider
- ale už teď držet několik pevných pravidel, aby billing a B2C removal později nenarazily

## Objektivní hodnocení aktuálního stavu

| Oblast | Hodnocení | Poznámka |
|---|---|---|
| Architektonický základ | Silný | URL-scoped workspaces, account-first app entry, přímé service boundaries |
| UX srozumitelnost scope | Střední | základ je správně, ale naming a některé popisy jsou stále ne zcela čisté |
| Konzistence terminologie | Slabší střed | `workspace` vs `organization` vs starší `workspaceSwitcher` |
| Billing readiness | Střední | nic kriticky neblokuje, ale chybí jasná pravidla pro billing ownership a seat semantics |
| Připravenost na B2C odříznutí | Silná | workspace integrace jsou relativně lokalizované |
| Riziko přerůstání do overengineeringu | Nízké až střední | principy repo tomu dobře brání, je potřeba je dál držet i při billing rozšíření |

## Co je dnes udělané dobře

### 1. Personal scope není fallback, ale legitimní produktový režim

To je správně.

Aktuální model:

- `/app` je osobní home
- `/settings*` je osobní settings scope
- `/w/[workspaceSlug]/*` je workspace scope
- zero-workspace state je validní

To je výrazně lepší než modely, kde je každý přihlášený uživatel násilně vhazován do nějakého implicitního workspace nebo org kontextu.

Pro B2C variantu je to zásadní výhoda.

### 2. Scope je odvozený z URL, ne z nečitelných session kouzel

`resolveApplicationScope(pathname)` a pathname-driven routing jsou správný směr.

Výhody:

- snadněji se čte chování aplikace
- workspace route opravdu znamená workspace kontext
- osobní route opravdu znamená osobní kontext
- není potřeba globální scope engine
- odstranění workspaces později bude relativně lokální

To je v souladu s vašimi architektonickými principy i s tím, jak by měl fungovat forkable starter.

### 3. `active_workspace` je preference, ne auth invariant

To je důležité a správné rozhodnutí.

Pokud by aktivní workspace určoval celý authenticated entrypoint, template by se rychle začal chovat jako B2B-only aplikace. Takhle zůstává otevřený oběma směrům:

- B2B s collaborative layer
- B2C bez collaborative layer

### 4. Invite flow je promyšlený lépe než v řadě jednodušších SaaS implementací

Silné stránky:

- signed-out handoff přes `pending_invite`
- explicitní outcome states
- redirect do konkrétního workspace jen při skutečném workspace outcome
- default post-auth destination zůstává `/app`

To je dobrý kompromis mezi UX a architektonickou čistotou.

### 5. Workspace code je relativně dobře lokalizovaný

Důležité integrační body jsou omezené hlavně na:

- shell switcher
- contextual navigation
- workspace routes
- invite handoff
- workspace services/actions

To je přesně ten typ bounded integration, který dává template smysl.

## Hlavní problémy a rizika

### 1. Terminologie není ještě dost disciplinovaná

Tohle je dnes největší reálné riziko.

V implementaci se míchá několik mentálních modelů:

- user-facing term `workspace`
- interní term `organization`
- user-facing term `Personal`
- user-facing term `personal area`
- starší namespace `workspaceSwitcher`, i když shell už je `scopeSwitcher`

Konkrétní dopady:

- vývojáři nebudou mít jednotný jazyk pro další produkty
- copy se bude při rozšiřování drolit
- AI agenti i lidé budou při dalších úpravách méně jistí, co je scope, co je entita a co je pouze historický název

Lokální signály:

- `src/features/workspaces/workspace-create-drawer.tsx` stále čte copy z `layout.application.workspaceSwitcher.createDrawer`
- server vrstva používá `createOrganizationWorkspace...`
- `src/types/pocketbase.ts` má `kind: "organization"`
- dokumentace ještě mluví o legacy personal workspaces, ale aktuální typový model už je neobsahuje

Doporučení:

- v UI a copy používat konzistentně `workspace`
- `organization` ponechat jen tam, kde je to čistě interní nebo provider terminology
- sjednotit překladové namespacy tak, aby odpovídaly aktuálnímu shell modelu

### 2. Switcher je funkčně správně, ale část zobrazovaných dat není pro uživatele ideální

Aktuální switcher dělá správnou věc v tom, že:

- na personal routes ukazuje `Personal`
- na workspace routes ukazuje konkrétní workspace

To je dobré.

Horší je, co workspace v switcheru popisuje.

Dnes se jako sekundární řádek používá hlavně slug. To je spíš interní identifikátor než uživatelsky užitečný popis. Pro běžného uživatele je výrazně užitečnější:

- role ve workspace
- počet členů
- případně stručný status typu `Shared with 12 people`

Slug patří do settings, ne do primární navigační orientace.

### 3. Scope legibility je dobrá, ale ještě ne úplně dotažená

Breadcrumbs a mobile chip pomáhají, ale scope není stejně čitelný ve všech kontextech.

Současný stav:

- mobile header ukazuje scope chip
- breadcrumbs často ukazují `Personal / ...` nebo `{WorkspaceName} / ...`
- desktop se hodně opírá o breadcrumbs

To je použitelné, ale pro template bych doporučil scope signal ještě o něco zpřesnit:

- na desktopu mít scope trvale čitelný i mimo breadcrumbs
- po create/invite/switch dát jednoznačné potvrzení, že uživatel vstoupil do shared scope

Ne kvůli efektu, ale kvůli mentálnímu modelu.

### 4. Dokumentace a skutečný stav modelu nejsou ve 100% souladu

To je menší, ale důležitý signál.

`workspace-system.md` ještě říká, že personal workspaces mohou existovat jako legacy varianta, ale aktuální generated PocketBase typ říká:

- `WorkspacesRecord.kind: "organization"`

To znamená, že:

- buď je dokumentace zastaralá
- nebo je runtime/datový model méně explicitní, než dokumentace tvrdí

U starteru je to riziko, protože další aplikace budou pravděpodobně stavět podle docs i podle kódu. Tyto dvě věci musí mluvit stejným jazykem.

### 5. Oprava stale `active_workspace` cookie zatím nevypadá jako plně persistovaná

V app layoutu se stale hodnota opravuje do `repairedActiveWorkspaceSlug`, ale z lokální implementace není vidět, že by se tahle oprava zapsala zpět do cookie při renderu shellu.

To není kritický bug, ale je to:

- malý rozdíl mezi deklarovaným modelem a realitou
- potenciální zdroj nečekaného chování při dalších rozšířeních

Pro template je lepší, když preference repair buď:

- opravdu persistuje
- nebo je v docs jasně řečeno, že jde jen o runtime repair pro shell render

### 6. Role model je dnes dostačující pro collaboration, ale není ještě billing-ready jako produktové oprávnění

`owner` / `admin` / `member` je dobrý minimum model.

Na collaboration to stačí.

Na billing a větší B2B správu ale obvykle nestačí.

Reálné produkty často oddělují:

- content/admin oprávnění
- billing oprávnění
- security oprávnění
- team-level delegated admin

Pokud později uděláte billing pouze jako další schopnost `owner` nebo `admin`, může to fungovat. Ale musíte to rozhodnout vědomě.

Největší riziko je opačné:

- nechat `admin` přirozeně bobtnat
- a po čase zjistit, že `admin` znamená zároveň správu členů, bezpečnosti, fakturace, exportů a integrací

To je dlouhodobě neudržitelné.

## Co ukazují jiné produkty

## 1. GitHub: personal account je trvalý základ, organization je sdílený kontejner

GitHub je velmi dobrý referenční model pro to, jak držet osobní identitu oddělenou od sdíleného kontextu.

Z jejich dokumentace:

- každý uživatel se vždy přihlašuje osobním účtem
- organizace je shared account pro spolupráci
- přístup se řídí rolemi
- billing manager je oddělená role od běžných členů
- doporučují alespoň dva owners

Poučení pro `Start`:

- osobní identita má zůstat nadřazená workspace členství
- workspace je sdílený kontext, ne náhrada osobního účtu
- billing permissions není dobré slepit s běžným membership modelem
- continuity pravidlo se dvěma owners je správný default

## 2. Linear: silná workspace identita, ale jemně delegovaná správa

Linear ukazuje dobrý model pro B2B produkt, který je přesto čitelný.

Relevantní patterny:

- workspace-level roles jsou jasně popsané
- existuje rozdíl mezi workspace owner, admin a team owner
- suspended member okamžitě ztrácí přístup a zároveň vypadává z dalšího billing cyklu
- členové umí rychle zjistit, kdo je workspace admin

Poučení pro `Start`:

- pro budoucí SaaS produkty se vyplatí mít snadno dohledatelné workspace adminy/owners
- team-level delegated admin dává smysl až tehdy, kdy opravdu vzniknou týmy uvnitř workspace
- billing a member lifecycle by měly být propojené v doménovém rozhodnutí, ne až v UI

## 3. Figma: workspaces jako dodatečná strukturální vrstva, ne jako náhrada osobního prostoru

Figma je velmi relevantní hlavně kvůli tomu, že kombinuje:

- osobní drafts
- teams
- organization
- v enterprise i workspaces jako další vrstvu

Důležité patterny:

- `Drafts` jsou explicitně osobní prostor
- workspaces jsou strukturální vrstva nad týmy, ne náhrada celé identity
- workspace admins mají menší scope než organization admins

Poučení pro `Start`:

- osobní scope a shared scope musí být mentálně velmi dobře odlišené
- další vrstvu delegace má smysl přidat jen pokud je reálný důvod
- billing responsibility může být oddělená od běžné správy workspace

## 4. Slack: jeden stabilní vstup pro přechod mezi kontexty

Slack je silný v tom, že přechod mezi workspaces drží na jednom stabilním místě.

Relevantní patterny:

- join/leave workspaces se děje z jednoho známého menu
- uživatel může discover/join/leave podle typu membership
- některé default workspaces nejde opustit bez admin zásahu

Poučení pro `Start`:

- scope switcher jako jedna stabilní shell plocha je správný pattern
- leave rules a non-leavable contexts mají být explicitní, ne implicitní
- pro uživatele je důležité, aby vždy věděl, kde mění kontext

## 5. Stripe: seat billing musí mít jasný source of truth

Stripe per-seat model je přímočarý:

- seat count odpovídá `quantity`
- provisioning se má řídit webhooky a subscription events

Poučení pro `Start`:

- neodvozovat billing z UI countu nebo z nahodilých client-side seznamů
- seat semantics definovat serverově
- provider customer/subscription IDs nikdy nevázat na slug
- provisioning a access changes držet přes explicitní server logiku

## Porovnání se `better-auth-canary`

`better-auth-canary` je užitečná inspirace, ale jako produktový template bych ho nebral jako cílový UX model jedna ku jedné.

Co je na něm užitečné:

- organization plugin počítá s aktivním organization contextem
- invite acceptance nastavuje accepted organization jako aktivní context
- stripe plugin počítá s organization customer a seat syncem

Co je u vás lepší:

- route model je čitelnější pro forkable starter
- account-first entrypoint je vhodnější pro kombinaci B2B i B2C
- workspace code je lépe ohraničený jako volitelná vrstva

Co si z něj vzít:

- aktivní shared context po přijetí pozvánky je správně
- billing hooks mají být navázané na membership lifecycle
- provider integration má jít přes explicitní domain seams, ne přes UI logiku

## Doporučený produktový směr pro `Start`

## 1. Uzamknout mentální model

Doporučuji držet tento model jako oficiální produktové pravidlo:

- `Personal` = můj soukromý účet a moje osobní nastavení
- `Workspace` = sdílený prostor pro spolupráci s dalšími lidmi
- `Account` = stránka/nastavení uvnitř personal scope, ne synonymum pro celý scope
- `Organization` = interní nebo provider term, ne defaultní user-facing term v šabloně

Praktický důsledek:

- v UI mluvte o `workspace`
- v docs pro template mluvte o `personal scope` a `workspace scope`
- termín `organization` používejte jen tam, kde odpovídá konkrétnímu provideru nebo backendu

## 2. Zlepšit labels a microcopy

Doporučené labely pro shell:

- `Personal`
- skupina `Workspaces`
- CTA `Create workspace`

Doporučené popisy:

- `Personal`: `Your private account, settings, and personal work.`
- prázdný stav workspace group: `No workspaces yet`
- prázdný stav popis: `Create a workspace when you need to collaborate with your team.`

V české variantě:

- `Personal` bych v produktu klidně nechal jako anglický brandový term pouze pokud bude celý app jazykově anglický
- pokud má být čeština plnohodnotná, zvažte `Osobní`
- důležité je hlavně držet to všude stejně

Nejdůležitější copy doporučení:

- v switcheru nepoužívat slug jako hlavní sekundární popis workspace
- místo toho ukazovat něco jako `Owner • 8 members` nebo `Member • 8 members`
- slug nechat do workspace settings

## 3. Udělat scope ještě čitelnější bez nového systému

Bez nové abstrakce bych doporučil:

- zachovat jeden stabilní switcher v shellu
- doplnit scope chip nebo scope label i na desktopu, nejen nepřímo přes breadcrumbs
- po create/switch/invite acceptance zobrazit explicitní potvrzení `You are now in {workspaceName}`
- na personal home mít zcela zřejmé, že uživatel je mimo shared context

To není kosmetika.
Je to prevence proti časté chybě: uživatel neví, jestli mění svoje osobní nastavení, nebo nastavení týmu.

## 4. Připravit budoucí billing, ale nepřebudovávat kód předčasně

Tady je podle mě správná hranice:

Co nedělat teď:

- nezavádět provider-neutral billing abstraction
- nevytvářet empty `billing adapter` layer
- nerozšiřovat workspace services o spekulativní billing hooks bez prvního providera

Co si ale pevně rozhodnout už teď:

- billable owner je vždy konkrétní entita: buď user, nebo workspace
- workspace billing se váže na stabilní `workspace.id`, ne na slug
- membership count a billing seats nejsou automaticky totéž
- billing permissions nemusí být totéž co `admin`
- v budoucnu bude existovat oddělený billing surface:
  - personal: `/settings/billing`
  - workspace: `/w/[workspaceSlug]/settings/billing`

Tohle lze držet jen jako produktové rozhodnutí a dokumentaci, bez předčasného kódu.

## 5. Připravit workspace settings na budoucí růst

Pro template bych doporučil tento dlouhodobý IA směr:

- `General`
- `Members`
- `Billing` později
- `Security` později, pokud to konkrétní app bude potřebovat
- `Integrations` později, pokud to konkrétní app bude potřebovat

Výhoda:

- uživatel od začátku chápe, že workspace je shared operational scope
- billing se později přidá přirozeně
- B2C varianta může workspace settings route jednoduše smazat bez dopadu na account settings

## 6. Držet B2C removal path jako první-class dokumentovaný scénář

Aktuální architektura tomu nahrává. Doporučuji to posunout ještě o krok dál:

- udržovat workspace integration points explicitně zdokumentované
- nenechat workspace termy prosakovat do account features, které je nepotřebují
- až budete psát AI prompt pro odstranění workspace vrstvy, opřít ho o bounded seznam integračních bodů, ne o heuristiku

Zjednodušeně:

- B2C removal má být odebrání vrstvy
- ne rekonstrukce celé authenticated app

## Konkrétní doporučení po prioritách

## Priorita A: udělat před dalším SaaS forkem

1. Sjednotit terminologii napříč kódem, docs a messages.
2. Přestat používat starý `workspaceSwitcher` namespace tam, kde už je produktově `scopeSwitcher`.
3. Upravit switcher copy tak, aby sekundární řádek workspace nebyl slug.
4. Srovnat dokumentaci s realitou kolem legacy personal workspace modelu.
5. Jasně sepsat produktové pravidlo: `Personal` je first-class scope a default authenticated landing.

## Priorita B: udělat před billing integrací

1. Rozhodnout, kdo smí spravovat billing:
   - pouze owner
   - owner + speciální billing permission
2. Rozhodnout, co je seat:
   - všichni members
   - jen billable roles
   - případně budoucí guest režim mimo billable seats
3. Zavést pravidlo, že provider identifiers se vážou na stabilní ID, ne slug.
4. Připravit route a IA slot pro workspace billing bez zavádění provider abstraction.

## Priorita C: udělat před enterprise-heavy B2B derivátem

1. Přidat snadno dohledatelný seznam workspace admins/owners.
2. Zvážit oddělení billing responsibility od běžného `admin`.
3. Zvážit delegated admin layer až při reálné potřebě týmů uvnitř workspace.
4. Zvážit guest/external collaborator model jen pokud to konkrétní produkt opravdu potřebuje.

## Praktická doporučení k UX detailům

### Doporučené chování switcheru

- `Personal` je vždy první položka
- `Workspaces` je samostatná skupina
- `Create workspace` je samostatná akce
- selected state musí vždy znamenat aktuální scope, ne jen poslední preference
- na personal routes se neukazuje workspace jako aktivní context

### Doporučené popisy

V switcheru:

- `Personal`: krátký popis osobního kontextu
- workspace položka: role a počet členů

Na personal home:

- explicitně vysvětlit, že collaborative layer je volitelný upgrade pracovního režimu
- po vytvoření workspace nabídnout další krok:
  - `Invite teammates`
  - `Open workspace`
  - `Do this later`

### Doporučené guardraily proti zmatení

- nikdy nepoužívat stejnou vizuální formulaci pro personal settings a workspace settings bez scope labelu
- destruktivní akce vždy psát scope-explicitně:
  - `Delete workspace`
  - ne jen `Delete`
- member/invite obrazovky nikdy nezpřístupňovat z personal scope

## Doporučené technické guardraily

Tyto guardraily doporučuji zapsat do interních pravidel pro další práce na template:

- nepřidávat billing abstraction dřív, než existuje první provider
- nepřidávat nový global scope state, pokud pathname derivation dál stačí
- nevracet do shellu generic `Workspace` page item v personal scope
- billing a entitlements vždy navrhovat nad stabilním ID, ne nad URL slug
- role model nerozšiřovat ad hoc per feature; každé nové oprávnění musí mít jasnou produktovou logiku

## Doporučený verdikt

Pokud to shrnu stručně:

`Start` je už teď dobrý základ pro account-first SaaS starter s volitelnými workspaces.

Není potřeba měnit celkový směr.
Je potřeba:

- dotáhnout naming disciplínu
- zvýšit čitelnost scope pro uživatele
- vědomě rozhodnout budoucí billing ownership model
- udržet workspace vrstvu jako lokalizovaný doplněk, ne jako nový střed celé aplikace

Jinými slovy:

- architekturu bych teď nepřekopával
- UX a produktový jazyk bych zpřesnil co nejdřív
- billing bych zatím jen rámcově připravil pravidly, ne abstrahovaným kódem

## Zdroje

### Lokální zdroje

- `./.rules/project-architecture-principles.md`
- `./.docs/workspace-system.md`
- `./src/features/application/scope-switcher.tsx`
- `./src/features/application/application-menu-tree.tsx`
- `./src/features/application/application-scope.ts`
- `./src/app/[locale]/(application)/layout.tsx`
- `./src/features/workspaces/workspace-create-drawer.tsx`
- `./src/features/workspaces/actions/workspace-actions.ts`
- `./src/types/pocketbase.ts`
- `/Users/fanda/Dev/better-auth-canary/docs/content/docs/plugins/organization.mdx`
- `/Users/fanda/Dev/better-auth-canary/demo/nextjs/app/dashboard/_components/organization-card.tsx`
- `/Users/fanda/Dev/better-auth-canary/demo/nextjs/lib/auth.ts`

### Externí zdroje

- [GitHub Docs: About organizations](https://docs.github.com/en/organizations/collaborating-with-groups-in-organizations/about-organizations)
- [GitHub Docs: Roles in an organization](https://docs.github.com/en/organizations/managing-peoples-access-to-your-organization-with-roles/roles-in-an-organization)
- [GitHub Docs: Maintaining ownership continuity](https://docs.github.com/en/organizations/managing-peoples-access-to-your-organization-with-roles/maintaining-ownership-continuity-for-your-organization)
- [GitHub Docs: Adding a billing manager](https://docs.github.com/en/organizations/managing-peoples-access-to-your-organization-with-roles/adding-a-billing-manager-to-your-organization)
- [Linear Docs: Members and roles](https://linear.app/docs/members-roles)
- [Figma Help: Guide to files and projects](https://help.figma.com/hc/en-us/articles/1500005554982-Guide-to-files-and-projects)
- [Figma Help: Guide to workspaces](https://help.figma.com/hc/en-us/articles/7576392133527-Guide-to-workspaces)
- [Figma Help: Admins in Figma](https://help.figma.com/hc/en-us/articles/4420557724439-Admins-in-Figma)
- [Figma Help: View and join organization teams](https://help.figma.com/hc/en-us/articles/360039957674-Teams-in-an-Organization)
- [Slack Help: Join or leave workspaces in an Enterprise organisation](https://slack.com/intl/en-gb/help/articles/220266727-Join-or-leave-workspaces-in-an-Enterprise-organisation)
- [Stripe Docs: Build a subscriptions integration](https://docs.stripe.com/billing/subscriptions/per-seat)
- [Stripe Docs: Set up per-seat pricing](https://docs.stripe.com/subscriptions/pricing-models/per-seat-pricing)
