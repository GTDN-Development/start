# Auth / Workspace Audit Findings
Date: 2026-03-25

Tento soubor zachycuje pouze moje vlastní zjištění z aktuálního code review nad touto codebase.
Není to návaznost na jiné audity, předchozí plány ani prioritizační dokumenty.

## Celkový stav
Aktuální stav hodnotím jako dobrý.
Core auth, workspace, invite a membership logika je většinou rozumně uspořádaná a nevypadá jako systém, který by potřeboval velký refaktor.
Nejslabší část není doménová logika samotná, ale orchestrace mezi více flow: post-auth destination, app entry, redirect handoff, active workspace a invite redirecty.

Moje stručné zhodnocení:
- základ systému je zdravý
- největší riziko je behavior drift mezi features
- technický dluh je spíš lokální a provozní než strukturální
- není potřeba velký refaktor
- největší návratnost bude mít malá konsolidace několika sdílených rozhodnutí

## Co je v dobrém stavu
- Workspace access pravidla jsou poměrně dobře soustředěná v `src/server/workspaces/workspace-access.ts`.
- Invite validation a accept logika působí konzistentně v `src/server/workspaces/workspace-invite-recipient-service.ts`.
- Workspace mutations jsou čitelné a rozdělené poměrně rozumně mezi general, members a invite service.
- Auth service vrstva má srozumitelně oddělené sign-in, sign-up, sign-out, verify-email, reset-password a confirm-email-change operace.
- Většina interní navigace používá správné lokalizované helpery přes `@/i18n/navigation`.

## Hlavní zjištění

### 1. Protected deep linky nepřežijí auth boundary tak, jak by měly
Tohle je největší konkrétní slabina v celé auditované oblasti.

Když se odhlášený uživatel dostane na protected URL, systém ho sice pošle na sign-in, ale původní destination se nepřenese jako první-class intent skrz celý auth flow. Po přihlášení se pak uživatel typicky nevrací přesně tam, odkud přišel, ale spadne na obecnější app entry logiku.

To není jen UX detail. Je to signál, že auth boundary není navržená jako jeden uzavřený roundtrip. Právě tohle bývá zdroj driftu, kdy různé auth-related flow časem začnou končit na různých místech.

Relevantní místa:
- `src/proxy.ts`
- `src/features/auth/post-auth-redirect.ts`
- `src/server/workspaces/workspace-resolution-service.ts`

### 2. Rozhodnutí "kam má authenticated user jít" nemá jeden source of truth
Tohle je podle mě hlavní architektonické místo, kde už vzniká drift.

Rozhodnutí o destination authenticated usera se dnes dělá na více místech:
- guest auth layout
- post-auth redirect helper
- application entry resolver
- verify-email flow
- invite flow

Důsledek je, že různé surface pracují s různými implicitními pravidly. Někde je přirozený vstup `/app`, jinde poslední aktivní workspace, jinde pending invite. Tyto modely si navzájem nekolidují dramaticky, ale už nejsou sjednocené.

Navíc je v kódu vidět, že některé větve typu `workspace_redirect` přežívají i tam, kde už reálný resolver pracuje jinak. To nevypadá jako kritická chyba, ale jako jasný marker, že systém není dotažený do jedné explicitní politiky.

Relevantní místa:
- `src/features/application/application-entry.ts`
- `src/features/auth/actions/auth-actions.ts`
- `src/features/auth/post-auth-redirect.ts`
- `src/server/workspaces/workspace-resolution-service.ts`
- `src/app/[locale]/(auth)/(guest)/layout.tsx`
- `src/app/[locale]/(auth)/(flow)/verify-email/page.tsx`

### 3. Server-side auth/session gate je zbytečně zduplikovaný
Session gate je dnes implementovaný ve více podobných variantách, hlavně přes `getServerAuthSession()` a `requireCurrentUser()`.

Obě cesty dělají skoro totéž:
- načítají auth cookie
- validují device session
- dělají `authRefresh`
- hlídají verified stav
- řeší cleanup neplatného auth stavu

Samotná duplicita by ještě šla ustát. Problém je, že už se mezi těmito cestami objevují odlišnosti v chování. To znamená, že guest surface, marketing surface a protected application surface nemusí v krajních stavech session reagovat úplně stejně.

To je přesně ten druh dluhu, který nejdřív vypadá malý, ale postupně vytváří těžko vysvětlitelné edge casy.

Relevantní místa:
- `src/server/auth/auth-service.ts`
- `src/server/auth/current-user.ts`
- `src/server/pocketbase/pocketbase-server.ts`

### 4. Invite flow je z větší části zdravý, ale handoff do auth flow je příliš implicitní
Invite flow samotný hodnotím spíš pozitivně než negativně.

Dobře působí hlavně toto:
- validace tokenu je centralizovaná
- email mismatch je explicitní stav
- `already_member` je ošetřený
- accept flow správně překlápí invite do membership a uklízí po sobě

Slabší místo je handoff mezi invite flow a auth flow, hlavně přes `pending_invite` cookie. Tady se část redirect intentu přenáší implicitně, což je praktické, ale zároveň to vytváří edge casy. Redirect intent může přežívat déle, než by měl, nebo vzniknout i v situaci, kdy už session existuje.

Nevidím v tom důvod k přepisování invite systému. Vidím v tom ale typickou hranu systému, kterou je dobré narovnat dřív, než na ní začne vznikat další logika.

Relevantní místa:
- `src/app/[locale]/(auth)/(flow)/invite/[token]/start/route.ts`
- `src/server/workspaces/workspace-cookie.ts`
- `src/app/[locale]/(auth)/(flow)/invite/[token]/page.tsx`
- `src/server/workspaces/workspace-invite-recipient-service.ts`

### 5. Active workspace a application entry nejsou úplně stejný model
Tohle není akutní bug, ale je to důležité systémové pozorování.

Application shell si umí lokálně opravit neplatný active workspace slug pro sidebar a context. Zároveň se ale application entry v jiných místech odvozuje samostatně z raw cookie nebo z jiného rozhodovacího místa.

Výsledek je, že různé části UI mohou implicitně pracovat s trochu jiným modelem toho, co je aktivní workspace nebo kam má uživatel směřovat.

Typické riziko:
- shell ukazuje jeden aktivní workspace
- jiná entry linka směřuje jinam
- post-auth flow se rozhoduje podle jiného pravidla než samotná shell navigace

Tohle je přesně druh nekonzistence, který dlouho nevypadá jako bug, ale postupně zhoršuje předvídatelnost systému.

Relevantní místa:
- `src/app/[locale]/(application)/layout.tsx`
- `src/features/application/application-entry.ts`
- `src/features/application/application-root.tsx`
- `src/features/workspaces/workspace-navigation-context.tsx`

### 6. Největší rizikové roundtripy nejsou kryté testy
Během auditu jsem nenašel cílené testy na auth/workspace/invite redirect roundtripy.

To je důležité proto, že hlavní problém už dnes není v základní business logice. Hlavní problém je v orchestrace vrstvách. Právě tyhle vrstvy bez integračního pokrytí začnou driftovat nejrychleji.

Za nejrizikovější považuju hlavně tyto scénáře:
- protected route -> sign-in -> návrat na původní destination
- invite -> sign-in -> návrat na invite flow -> accept -> workspace
- verify-email -> post-auth destination
- neplatný active workspace cookie -> deterministic fallback

## Co z těch zjištění nevyplývá
Z těchto findings mi nevyplývá, že by bylo potřeba:
- dělat velký architektonický refaktor
- zavádět novou obecnou abstrakční vrstvu pro auth/workspace orchestrace
- překopávat workspace services od základu
- měnit invite logiku jako doménový model

Naopak mi z toho vyplývá, že core je dostatečně zdravý a slabina je hlavně v tom, že stejné rozhodnutí je rozdělené mezi více míst.

## Závěr
Objektivně je to v dobrém stavu, ale ještě ne v úplně dotaženém stavu.
Core systém funguje rozumně. Největší dluh je v tom, že stejné rozhodnutí se v několika místech dělá víckrát a ne vždy stejně.
To je dobrá zpráva, protože problém není hluboký. Je to typ práce, který jde opravit bez velkého refaktoru, ale s vysokou návratností, protože po konsolidaci začne auth/workspace systém působit jako jeden sjednocený celek.
