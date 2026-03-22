# Application Section Shell Refactor Plan

Datum: 22. 3. 2026
Predpoklad: aktualni application error/loading/not-found improvement je hotovy a v branchi existuje.

## 1. Cil

- Zjednodusit architekturu vnorenych application sekci tak, aby breadcrumbs, title, description, loading a inner sidebar mely jasneho vlastnika.
- Zachovat dobre UX:
  - shell zustava stabilni
  - loading se zobrazuje jen v content oblasti
  - breadcrumbs pusobi prirozene a nejsou "technicky odvozene"
- Zlepsit DX:
  - `page.tsx` resi primarne data a business obsah
  - layout/section shell resi sekcni kompozici
  - metadata, title, description, breadcrumbs a sidebar items se mene rozchazeji
- Drzet KISS: nevytvaret genericky framework pro cely app router, pokud staci maly explicitni section model pro 2 hlavni sekce.

## 2. Soucasny stav

### 2.1 Co funguje dobre

- Application shell je uz stabilni a route-group based.
- `error.tsx`, `not-found.tsx` a `loading.tsx` uz respektuji shell a route hierarchy.
- `account` a `workspace settings` uz maji layout-driven loading scope, takze se neprekresluje cele page chrome.

### 2.2 Kde je problem

- Breadcrumbs jsou aktualne hybrid mezi UX vrstvou a technickou derivaci z inner sidebar state.
- `account` a `workspace settings` maji cast sekcni odpovednosti v:
  - route layoutu
  - `page.tsx`
  - inner sidebar configu
  - prekladech
- Neni uplne jasne, kdo je source of truth pro:
  - root label sekce
  - current item label
  - page title
  - page description
  - loading presentation
- Pri dalsim rustu nested sekci hrozi drift mezi breadcrumby, sidebar itemy a page header copy.

## 3. Ne-cile

- Nepreskladavat cely app router.
- Nezavadet novy globalni navigation framework pro marketing/auth cast.
- Nedelat generic "state engine" pro loading/error/empty.
- Neoptimalizovat breadcrumbs pro kazdy edge case v jedne iteraci.
- Neresit v tomto planu `members` a dalsi future sekce vic nez jako pripravu architektury.

## 4. Design principy

### 4.1 Source of truth musi byt explicitni

- Breadcrumbs nesmi byt tise odvozeny ze sidebar itemu.
- Sidebar itemy a breadcrumbs muzou sdilet data, ale ne pres skrytou derivaci.

### 4.2 Page soubor ma byt tenky

- `page.tsx` ma idealne resit:
  - metadata
  - server data
  - vlastni content blocks
- `page.tsx` nema vlastnit shell composition, pokud jde o sekcni chrome.

### 4.3 Layout nebo section shell vlastni sekcni chrome

- title
- description
- breadcrumbs
- inner sidebar
- loading scope

### 4.4 UX pravidla

- Breadcrumbs max 2 urovne.
- Na desktopu musi byt citelne a prirozene.
- Na mobilu neni nutne breadcrumbs za kazdou cenu zobrazovat.
- Loading zustava v content oblasti.
- Skeleton pouze tam, kde je layout dost stabilni.

## 5. Mozne pristupy

### Varianta A: Minimal explicit resolver per section

Popis:

- Pro `account` a `workspace settings` vytvorit male explicitni resolvery.
- Layout cte resolver a podle aktualni route sklada:
  - breadcrumbs
  - title
  - description
  - inner sidebar items

Vyhody:

- Nejmensi zmena.
- Velmi citelne.
- Dobry KISS fit.

Nevyhody:

- Casem muze rust duplicita.
- Pri dalsich sekcich vznikne vice ad-hoc resolveru.

### Varianta B: Small section config model

Popis:

- Pro kazdou application sekci definovat explicitni config.
- Config drzi:
  - `rootHref`
  - `rootLabelKey`
  - `items`
  - `titleKey`
  - `descriptionKey`
  - `match rules`
  - pripadne `loadingVariant`
- Layout i page cti stejny sekcni model.

Vyhody:

- Nejlepsi balans UX/DX.
- Menne driftu mezi breadcrumby, sidebar a headerem.
- Dobre rozsireni pro dalsi nested pages.

Nevyhody:

- O trochu vyssi abstrakce nez varianta A.
- Je potreba disciplinovane drzet config maly a explicitni.

### Varianta C: Full section shell components

Popis:

- `AccountSectionShell`
- `WorkspaceSettingsSectionShell`
- Route layout je tenka vrstva a vsechno sekcni sklada feature shell komponenta.

Vyhody:

- Nejlepsi separace odpovednosti.
- Silna znovupouzitelnost.

Nevyhody:

- Dnes zrejme zbytecne drahe.
- Vyssi pocet souboru a vrstev.

## 6. Doporučení

Doporucena varianta: Varianta B, ale v male verzi.

Prakticky:

- Zavadet sekcni config pouze pro:
  - `account`
  - `workspace settings`
- Neresit zatim zadny generic engine pro vsechny app sekce.
- Z configu skladat:
  - breadcrumbs
  - sidebar items
  - page title
  - page description
- Loading nechavat route-based jako dnes, ale navazat ho na stejnou sekcni vrstvu.

To dava:

- velmi dobre UX
- citelne breadcrumbs
- stabilni loading scope
- dobrou dlouhodobou udrzitelnost
- minimalni overengineering

## 7. Cilova struktura

Navrhovana struktura:

```text
src/features/application/sections/
  account-section.ts
  workspace-settings-section.ts
  application-section-types.ts
  application-section-breadcrumbs.tsx
  application-section-layout.tsx
```

Volitelne, pokud by se to ukazalo jako uzitecne:

```text
src/features/application/sections/
  account-section-loading.tsx
  workspace-settings-section-loading.tsx
```

## 8. Navrh sekcniho modelu

Minimalni datovy model:

```ts
type ApplicationSectionItem = {
  id: string;
  href: AppHref;
  labelKey: string;
  icon?: string;
  matchNested?: boolean;
  activePathnames?: string[];
  activePathPrefixes?: string[];
  pageTitleKey?: string;
  pageDescriptionKey?: string;
  breadcrumbLabelKey?: string;
};

type ApplicationSectionConfig = {
  id: "account" | "workspace-settings";
  rootHref: AppHref;
  rootLabelKey: string;
  navTitleKey: string;
  rootPageTitleKey?: string;
  rootPageDescriptionKey?: string;
  items: ApplicationSectionItem[];
};
```

Dulezite:

- `breadcrumbLabelKey` ma byt explicitni.
- `pageTitleKey` a `pageDescriptionKey` nemaji byt automaticky odvozovany z item labelu.
- `rootLabelKey` a `rootPageTitleKey` mohou byt ruzne.

Priklad:

- sidebar item muze byt `General`
- breadcrumb current muze byt `Security`
- page title muze byt `Security`
- root breadcrumb muze byt `My Account`

To jsou ctyri ruzne role a nema smysl je nasilne spojovat, pokud to UX nechce.

## 9. Navrh odpovednosti

### 9.1 Route layout

Route layout ma:

- nacist locale-specific translations
- nacist section config
- vyrenderovat:
  - `ApplicationPageShell`
  - breadcrumbs
  - sidebar
  - container
  - section content wrapper

### 9.2 Section breadcrumbs renderer

Mala komponenta:

- dostane section config
- dostane current pathname
- explicitne rozhodne:
  - root only
  - root + current

Pravidla:

- pokud current route odpovida root itemu, zobrazit jen root breadcrumb page
- pokud current route odpovida child itemu, zobrazit root link + current page
- zadna implicitni vazba na loading state

### 9.3 Page

Page ma:

- nacist data
- vratit content
- pripadne dopsat metadata

Page nema:

- renderovat breadcrumbs
- renderovat inner sidebar
- renderovat root section title/description, pokud to patri shellu

### 9.4 Loading

Loading ma:

- zustat route-driven
- renderovat pouze content fallback
- nepokouset se menit breadcrumbs visibility
- pouzivat sekcni skeleton nebo loading variant podle sekce

## 10. Konkretní refactoring po sekcich

### 10.1 Account section

Cil:

- `account/layout.tsx` bude plny vlastnik shellu.
- `account/page.tsx` a `account/security/page.tsx` budou resit hlavne obsah.

Presunout do account section config:

- root breadcrumb label
- root page title/description
- nav items:
  - general
  - security

Result:

- jednotne breadcrumbs
- jednotny loading skeleton
- jednodussi account pages

### 10.2 Workspace settings section

Cil:

- `w/[workspaceSlug]/settings/layout.tsx` bude plny vlastnik shellu.
- `settings/page.tsx` a `settings/members/page.tsx` budou resit hlavne obsah.

Presunout do workspace section config:

- root breadcrumb label
- root page title/description
- nav items:
  - general
  - members

Dulezite:

- `members` musi jit jednoduse vypnout pro personal workspace bez toho, aby se rozbil zbytek shellu.
- To patri do section config resolution vrstvy, ne do breadcrumb rendereru.

## 11. Jak resit personal workspace variaci

Pro `workspace settings` jsou 2 mozne pristupy:

### A. Section config factory

- `createWorkspaceSettingsSectionConfig(workspaceKind, workspaceSlug, t)`

Vyhoda:

- nejcistsi
- visibility `members` je rozhodnuta hned pri skladani sekce

Nevyhoda:

- config neni uplne staticky

### B. Static config + filter layer

- staticky config drzi vsechny items
- layout nebo helper itemy filtruje podle workspace kind

Vyhoda:

- jednodussi puvodni config

Nevyhoda:

- o krok vic orchestracni logiky

Doporuceni:

- A, section config factory.

## 12. Breadcrumb ergonomie

Doporucena pravidla:

- `account`
  - `/account` -> `My Account`
  - `/account/security` -> `My Account / Security`

- `workspace settings`
  - `/w/[workspaceSlug]/settings` -> `Settings`
  - `/w/[workspaceSlug]/settings/members` -> `Settings / Members`

Poznamka:

- Root breadcrumb se ma chovat vic jako sekcni kotva nez jako doslovne zkopirovany nav label.
- Pokud user testing ukaze, ze `Settings / Members` je moc genericke, lze pozdeji zvazit:
  - `Workspace / Members`
  - `Workspace Settings / Members`

To ale nema byt technicka derivace, nybrz vedome UX rozhodnuti.

## 13. Loading strategie

Co nechat:

- route-level loading
- content-only loading scope
- skeleton pro stabilni settings layouts

Co nedelat:

- skrivat breadcrumbs pres globalni context
- nahrazovat breadcrumbs loading labelem
- delat odlisny skeleton pro kazdou jednotlivou settings card, pokud to neprinasi realny benefit

Doporuceni:

- settings skeleton nechat generic a page-shaped
- section shell ma drzet title/description area stabilni
- loading fallback ma jen nahradit obsah pod shell chrome

## 14. Konkretni implementacni faze

### Faze 1: Zavedeni sekcniho configu

- pridat `application-section-types.ts`
- pridat `account-section.ts`
- pridat `workspace-settings-section.ts`
- pridat helper pro preklad labelu a resolve current item

### Faze 2: Breadcrumb renderer

- nahradit aktualni `inner-sidebar-breadcrumbs` novym `application-section-breadcrumbs`
- explicitne pracovat se section configem
- odstranit posledni zbytky implicitni derivace breadcrumbs ze sidebar itemu

### Faze 3: Layout refinement

- `account/layout.tsx` a `settings/layout.tsx` prepnout na section config source of truth
- title/description/breadcrumbs/sidebar items brat z jedne vrstvy

### Faze 4: Page thinning

- zjednodusit `page.tsx` soubory
- nechat v nich jen:
  - data loading
  - content blocks
  - metadata

### Faze 5: Loading alignment

- loading soubory navazat na sekcni shell
- zachovat generic skeleton
- nevytvaret dalsi globalni loading coordination

## 15. Rizika

- Prilis chytry section config muze byt horsi nez dnesni explicitni kod.
- Metadata mohou zustat duplicni, pokud se budou title/description resit napul v page a napul v shellu.
- Workspace-specific route params mohou svadet k tomu, aby se sekcni config smichal s business daty.

Mitigace:

- config drzet maly
- business data nenechavat v configu
- copy keys drzet explicitni
- route params injectovat jen do href resolveru, ne do celeho UI modelu

## 16. Acceptance criteria

- Breadcrumbs u `account` a `workspace settings` jsou explicitni a snadno upravitelne.
- Sidebar items, breadcrumbs, page title a page description jsou skladane z jedne sekcni vrstvy.
- `page.tsx` soubory jsou kratsi a vic obsahove zamerené.
- Loading zustava omezeny na content oblast.
- Neni potreba dalsi globalni context kvuli breadcrumb/loading koordinaci.
- Personal workspace varianta nevytvari condition spaghetti.

## 17. Doporuceny dalsi krok

Prvni konkretni refactor udelat pouze pro `account` sekci a potvrdit, ze model funguje.

Pokud bude vysledek dobry:

- aplikovat stejny vzor na `workspace settings`

To drzi scope maly, umozni porovnat DX pred/po a nevyrobi zbytecne velky refactor jednim skokem.
