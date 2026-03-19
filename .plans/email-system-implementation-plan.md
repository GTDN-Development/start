# Email System Implementation Plan

Datum: 19. 3. 2026

## 1. Kontext a cíl

1. Cílem je zavést jednotný, snadno upravitelný a prakticky udržovatelný systém pro HTML emaily odesílané z aplikace přes Nodemailer.
2. Systém má mít jedno centrální místo pro:
3. základní vizuální identitu emailu
4. sdílený layout
5. bezpečné výchozí styly
6. opakovaně použitelné primitivy pro obsah
7. dev preview a ladění bez nutnosti posílat reálný email při každé změně
8. jasně popsaný flow pro přílohy, `replyTo`, lokalizaci a render chyby
9. Návrh má být postavený na `React Email`, ale stále konzervativní a robustní pro moderní email klienty, ne maximálně efektní.
10. Priorita je spolehlivost, jednoduchost a snadná změna per projekt/template.

## 2. Aktuální stav v kódu

1. Transport vrstva je už centralizovaná v `src/server/email/send-form-email.ts`.
2. HTML obsah se dnes skládá ručně jako inline string ve více místech:
3. `src/features/marketing/actions/marketing-actions.ts`
4. `src/server/workspaces/workspace-invite-mailer.ts`
5. V projektu dnes neexistuje:
6. shared email layout
7. shared email theme
8. systém pro email preview
9. oddělená render vrstva mezi „daty emailu“ a „HTML výstupem“
10. explicitní contract pro `replyTo`, přílohy a locale
11. Dnešní stav funguje pro jednoduché notifikace, ale při růstu šablon povede k:
12. nekonzistentnímu vzhledu
13. opakování markup vzorů
14. horší údržbě
15. bolestivým změnám brandingu

## 3. Hlavní rozhodnutí a důvody

### 3.1 Použít `React Email` jako template a preview vrstvu

1. Rozhodnutí:
2. V první fázi stavět řešení na `React Email`, konkrétně na `@react-email/components`, `@react-email/render` a `react-email` CLI.
3. Důvod:
4. dostaneme komponentový authoring místo ručních HTML stringů
5. dostaneme oficiální render do HTML i plain textu přes `render()` a `toPlainText()`
6. dostaneme hotový preview workflow přes `email dev`, takže nemusíme stavět vlastní preview app jako základní cestu
7. knihovna je navržená právě pro transactional email use case a oficiálně dokumentuje integraci s Nodemailerem
8. Důsledek:
9. HTML a text budeme generovat z React komponent
10. vlastní vrstva se ztenčí na theme, shared layout, locale messages, envelope contract a transport

### 3.2 Nepoužívat `prose.css` model ani shared web CSS jako source of truth

1. Rozhodnutí:
2. Email styling nebude řešen jako běžný webový stylesheet ve stylu `src/styles/prose.css`, ale jako sada `React Email` komponent s inline styly.
3. Důvod:
4. email klienti mají nekonzistentní podporu CSS
5. CSS variables, nesting, pokročilé selektory a dark-mode stylování nejsou spolehlivý základ
6. HTML email potřebuje konzervativní markup a hlavně inline styly
7. Důsledek:
8. source of truth bude `email-theme.ts` plus shared `React Email` layout, ne `.css` soubor
9. pokud bude potřeba malé doplňkové CSS v `<Head>`, půjde jen o nepovinné enhancementy, ne o core layout

### 3.3 Používat jednoduché světlé defaulty, ne aktivní dark mode strategii

1. Rozhodnutí:
2. Emaily budou mít jednoduché světlé neutrální defaulty s vysokým kontrastem.
3. Důvod:
4. nelze spolehlivě říct, jak klient přepíše email v dark mode
5. aktivní dark-mode hacky často vedou k horším výsledkům než konzervativní neutrální layout
6. chceme, aby email „přežil“ light i dark klienty, ne aby byl pixel-perfect v obou
7. Důsledek:
8. žádné custom dark-mode větve jako hlavní strategie
9. vyhnout se silně invertovatelným kombinacím, komplikovaným pozadím a závislosti na subtilních hranách

### 3.4 Zavést lehký sdílený header/footer, ale ne těžký marketingový chrome

1. Rozhodnutí:
2. Každý email dostane minimalistický sdílený wrapper s jednoduchým headerem a footerem.
3. Důvod:
4. header/footer dávají emailům identitu a konzistenci
5. zároveň nechceme emaily přetížit dekoracemi nebo marketingovým layoutem
6. wrapper musí být použitelný pro systémové, transactional i kontaktní emaily
7. Důsledek:
8. header bude obsahovat jen brand/název produktu
9. footer bude obsahovat krátkou identifikaci odesílatele, případně support kontakt nebo odkaz
10. žádné bohaté navigace, velké hero bloky nebo komplikovaná vícesloupcová skladba

### 3.5 Použít `React Email` CLI preview jako primární dev workflow

1. Rozhodnutí:
2. Ladění emailů nebude závislé na reálném odeslání emailu ani na vlastní Next.js preview routě.
3. Důvod:
4. posílat email po každé změně je pomalé a nepraktické
5. `React Email` CLI poskytuje hotový lokální preview server s automatickým rebuildem
6. `PreviewProps` umožní držet preview data přímo u template nebo v navázané preview vrstvě
7. Důsledek:
8. primární preview workflow bude přes `npm run email:dev`
9. vlastní Next.js preview route není součástí první iterace
10. mobilní kontrola se bude dělat přes jednoduchý responsive toggle v browser devtools, což pro první iteraci stačí

### 3.6 Používat Mailpit nebo podobný local inbox jen jako sekundární kontrolu

1. Rozhodnutí:
2. Lokální SMTP catcher nebude hlavní authoring workflow, ale doplňková vrstva.
3. Důvod:
4. `React Email` preview je rychlejší pro ladění layoutu
5. Mailpit je pořád užitečný pro ověření celého mail flow, subjectu, příloh a plain textu
6. Důsledek:
7. preview workflow je povinná část návrhu
8. Mailpit je doporučený volitelný doplněk pro lokální integrační test

### 3.6.1 PocketBase sjednocení řešit přes vizuální kontrakt, ne přes sdílenou render vrstvu

1. Rozhodnutí:
2. designová jednota mezi Nodemailer a PocketBase emaily se bude řídit přes společný vizuální kontrakt, ne přes jeden sdílený technický renderer.
3. Důvod:
4. PocketBase používá jiný templating model než `React Email`
5. technické sjednocení by v této fázi zbytečně zvyšovalo scope i coupling
6. zároveň ale potřebujeme zabránit tomu, aby se dva email systémy vizuálně rozešly
7. Důsledek:
8. `email-theme.ts` a shared layout rozhodnutí budou kanonický návrhový základ
9. při pozdější úpravě PocketBase emailů se budou přenášet stejné tokeny a stejné kompoziční zásady:
10. barvy
11. spacing
12. header/footer struktura
13. CTA vzhled
14. tonalita copy a fallback URL pravidla

### 3.7 Přejmenovat transport vrstvu na `email-transport.ts`

1. Rozhodnutí:
2. `src/server/email/send-form-email.ts` je vhodné při implementaci přejmenovat na `src/server/email/email-transport.ts`.
3. Důvod:
4. soubor už dnes neposílá jen „form email“
5. nový název lépe vystihne odpovědnost za SMTP transport a envelope metadata
6. zároveň zlepší čitelnost nové vrstvy, kde vedle sebe budou `email-layout.ts`, `email-render.ts` a transport
7. Důsledek:
8. importy se sjednotí na názvu, který odpovídá skutečné roli souboru

### 3.7.1 Zachovat lazy transporter singleton jako vědomé rozhodnutí

1. Rozhodnutí:
2. stávající lazy singleton pro Nodemailer transporter na `globalThis` zůstane zachovaný i po přejmenování souboru.
3. Důvod:
4. v dev prostředí tím zamezíme opakovanému vytváření transporteru při hot reloadu
5. jde o stávající fungující pattern a není důvod ho v tomto refaktoru měnit
6. Důsledek:
7. v `email-transport.ts` bude singleton explicitně pojmenovaný podle nové domény, například `__startEmailTransporter`
8. tato volba bude braná jako vědomá součást transport vrstvy, ne jako historický zbytek

### 3.8 Zkrátit názvy template souborů

1. Rozhodnutí:
2. v `src/server/email/templates/*` nepoužívat redundantní suffix `-email`.
3. Důvod:
4. samotná složka `templates` už jasně říká, že jde o email šablony
5. kratší názvy jsou čitelnější a méně upovídané
6. Důsledek:
7. preferované názvy budou `contact-form.tsx`, `support-form.tsx`, `newsletter-signup.tsx`, `workspace-invite.tsx`

### 3.9 Lokalizaci emailů řešit v první iteraci jako explicitní součást contractu

1. Rozhodnutí:
2. lokalizace není ne-cíl, ale součást návrhu první iterace.
3. Důvod:
4. dnešní emaily jsou mix češtiny a angličtiny
5. bez explicitního locale contractu bychom jen zafixovali současnou nekonzistenci do nové architektury
6. Důsledek:
7. každá template factory dostane `locale`
8. email copy se přesune do dedikovaných email message map, ne zůstane roztroušená v inline stringách
9. první iterace může začít jedním `email-messages.ts`, ale plánovaná evoluční cesta je split na per-template message soubory, pokud soubor začne bobtnat
10. preview data budou umět definovat locale varianty alespoň pro `cs` a `en`

### 3.10 Render chyby fail-closed, ne tiché fallbacky

1. Rozhodnutí:
2. pokud render šablony selže, email se neodešle.
3. Důvod:
4. tichý fallback by maskoval chybu v produkci a mohl posílat nekonzistentní nebo neúplné emaily
5. HTML i plain text vznikají ze stejné template vrstvy, takže chyba typicky znamená problém v celé šabloně, ne jen v jedné větvi
6. Důsledek:
7. render vrstva bude chybu logovat a propagovat volajícímu
8. preview workflow zobrazí diagnostickou chybu místo rozbitého HTML
9. případný text-only nouzový fallback může být v budoucnu opt-in pro konkrétní kritické flow, ale nebude default

## 4. Cíle a ne-cíle

### 4.1 Cíle

1. Jedno místo pro vzhled emailu.
2. Jedno místo pro sdílený layout.
3. Jednoduchá změna barev a brandingu bez zásahu do všech šablon.
4. Jasné oddělení dat emailu od HTML struktury.
5. Snadné přidání nové šablony bez kopírování celé kostry.
6. Email preview pro rychlé ladění.
7. Zachování plain text verze pro všechny emaily.
8. Explicitní podpora pro `replyTo` a přílohy.
9. Konzistentní locale-aware email copy.
10. Preview workflow přes oficiální nástroj knihovny.
11. Architektura, kterou půjde později vizuálně srovnat i s PocketBase emaily.

### 4.2 Ne-cíle

1. Nepokrývat v první iteraci pixel-perfect kompatibilitu se všemi historickými Outlook klienty.
2. Neřešit plnohodnotný email builder nebo drag-and-drop authoring.
3. Neřešit marketing newsletter systém.
4. Nepropojovat teď Nodemailer a PocketBase do jedné technické render vrstvy.
5. Nezavádět v první iteraci složité theme variants, per-locale design variants ani dark mode variants.

## 5. Cílová architektura

### 5.1 Server email vrstva

1. `src/server/email/email-transport.ts`
2. bude cílová transport vrstva
3. bude odesílat finální `subject`, `html`, `text`, `attachments`, `replyTo`
4. původní `send-form-email.ts` bude při migraci odstraněn nebo zredukován na dočasný compat wrapper

4. `src/server/email/email-theme.ts`
5. centrální source of truth pro:
6. brand name
7. app url
8. support contact
9. barvy
10. spacing
11. max width
12. radius
13. Důvod:
14. theme hodnoty se budou měnit často per projekt a musí být na jednom místě

15. `src/server/email/email-layout.tsx`
16. shared wrapper pro všechny HTML emaily postavený na `React Email` komponentech
17. bude řešit:
18. `Html`
19. `Head`
20. `Preview`
21. `Body`
22. centered container
23. header
24. content card
25. footer
26. Důvod:
27. odstraní kopírování kostry a zajistí konzistentní look

28. `src/server/email/email-primitives.tsx`
29. tento soubor nevznikne dopředu automaticky
30. helpery se mají extrahovat až po implementaci alespoň 2-3 šablon, kdy bude jasné, co se opravdu opakuje
31. Důvod:
32. nechceme předčasně navrhovat mini design-system bez reálné potřeby
33. první dvě až tři šablony mají sloužit jako vstup pro rozhodnutí, které primitivy dávají smysl

38. `src/server/email/email-render.ts`
39. helper pro render `React Email` komponent do finálního `html` a `text`
40. může obsahovat:
41. volání `render()`
42. volání `toPlainText()`
43. normalizaci preview textu
44. Důvod:
45. chceme centralizovat render pipeline a nechat šablony pracovat s jednodušším API
46. současný `escapeHtml` se při migraci z transport vrstvy odstraní jako veřejný helper, protože textové uzly bude escapovat React sám; pokud zůstane potřeba specifický escaping helper pro edge case, bude interní součástí render vrstvy

46. `src/server/email/email-messages.ts`
47. počáteční shared místo pro locale-aware copy pro sdílené texty a template-specific textové varianty
48. Důvod:
49. lokalizace se nemá míchat do layoutu ani zůstávat v akcích
50. pokud začne soubor růst, rozdělí se na `src/server/email/messages/*` po jednotlivých šablonách nebo doménách

### 5.2 Konkrétní šablony

1. `src/server/email/templates/contact-form.tsx`
2. `src/server/email/templates/support-form.tsx`
3. `src/server/email/templates/newsletter-signup.tsx`
4. `src/server/email/templates/workspace-invite.tsx`
5. každá šablona vrátí:
6. React komponentu jako default export
7. typed preview props
8. template metadata builder nebo pojmenovaný helper pro `subject`, `previewText`, `replyTo`, `attachments`
12. Důvod:
13. šablony budou explicitní, bez barrelu a bez skryté magie
14. metadata jako `replyTo` a přílohy musí být součástí stejného message contractu, jinak hrozí jejich ztráta mezi template a transport vrstvou

### 5.3 Dev preview vrstva

1. `src/server/email/templates/_preview-data.ts`
2. preview data pro jednotlivé šablony nebo shared fixtures pro `PreviewProps`
3. Důvod:
4. šablony půjde spouštět bez reálných side effectů a bez závislosti na produkčních datech

5. `package.json`
6. přidat script `email:dev`
7. Důvod:
8. lokální preview server bude oficiální součást DX

9. `emails/` root složka není nutná, pokud použijeme `react-email` CLI s `--dir src/server/email/templates`
10. Důvod:
11. chceme zachovat email doménu v `src/server/email`, ne ji vytrhnout mimo stávající server strukturu

## 6. Stylovací pravidla pro emaily

1. Základ dělat přes `React Email` komponenty a inline styly.
2. Spacing dělat přes `padding`, ne přes komplikovaný `margin`.
3. Používat jednoduchý container šířky cca `560-600px`.
4. Používat systémový font stack.
5. Používat jednoduchou paletu:
6. neutrální canvas
7. surface
8. primární text
9. sekundární text
10. border
11. accent
12. Vyhnout se:
13. CSS variables
14. custom fontům
15. gradientům
16. background images
17. vícesloupcovým layoutům v první iteraci
18. komplikovaným dark-mode overrideům
19. Tlačítka stavět přes `Button`/`Link` primitives tak, aby fungovala i jako prostý link fallback.
20. Důležité informace neukládat jen do obrázků.
21. Pokud email obsahuje CTA, zobrazit i fallback raw URL v textové části a podle use case i v HTML pod tlačítkem.

## 7. Theme contract

1. `email-theme.ts` má obsahovat malé množství stabilních tokenů:
2. `brandName`
3. `siteUrl`
4. `supportEmail`
5. `canvasColor`
6. `surfaceColor`
7. `textColor`
8. `mutedTextColor`
9. `borderColor`
10. `accentColor`
11. `accentTextColor`
12. `maxWidth`
13. `radius`
14. `contentPadding`
15. Důvod:
16. per-project branding se nejčastěji mění na těchto úrovních
17. čím menší token surface, tím jednodušší dlouhodobá údržba

## 8. Template contract

1. Každá šablona má mít explicitní props typ.
2. Každá šablona má dostat:
3. obsahová data
4. `locale`
5. případná metadata potřebná pro message envelope
6. Vedle komponenty musí existovat message builder, který vrátí:
7. `subject`
8. `previewText`
9. volitelně `replyTo`
10. volitelně `attachments`
11. render helper z komponenty a builderu složí finální `html` a `text`
12. Pokud email potřebuje CTA, šablona předá layoutu jednoduché `actionLabel` a `actionHref`, nebo použije sdílený button primitive.
13. Pokud email CTA nepotřebuje, zůstane content textový a jednoduchý.
14. Důvod:
15. chceme jednotný shape pro všechny mailery a preview workflow
16. `replyTo` a přílohy nesmí být bokem mimo contract

### 8.1 Envelope contract

1. `to` zůstane mimo template output, protože jde o transport metadata určovaná volajícím use casem.
2. `replyTo` bude součástí template message builderu, protože je obsahově navázané na konkrétní flow.
3. `attachments` budou součástí template message builderu u flow, kde jsou přirozenou součástí emailu, například support formulář.
4. Důvod:
5. template vrstva musí umět popsat celý email payload kromě cílového příjemce a low-level transport detailů

### 8.2 Lokalizační contract

1. Každá template factory bude přijímat `locale`.
2. Copy se nebude hardcodovat v akcích ani v layoutu.
3. První iterace má pokrýt minimálně `cs` a `en`.
4. Locale policy pro recipient-facing emaily:
5. uložená preference příjemce, pokud existuje
6. jinak aktuální app locale z request kontextu
7. jinak výchozí locale aplikace
8. Interní emaily posílané do našeho inboxu mohou mít fixní projektový jazyk.
9. Důvod:
10. emaily jsou user-facing obsah a nemají zůstat jako nekonzistentní mix jazyků
11. jazyk prohlížeče je jen počáteční odhad, ne stabilní preference

## 9. Preview a debug workflow

### 9.1 Primární workflow

1. Vývojář spustí `npm run email:dev`.
2. Otevře lokální `React Email` preview server.
3. Vybere šablonu.
4. Vidí vizuální preview s `PreviewProps`.
5. Při úpravě šablony nebo theme vidí změnu okamžitě.
6. Pro mobile-width kontrolu použije jednoduchý responsive toggle v browser devtools.

### 9.2 Proč `React Email` CLI preview

1. Důvod:
2. jde o oficiální preview workflow knihovny
3. odpadá potřeba udržovat vlastní interní preview app
4. preview data lze držet přímo u šablon přes `PreviewProps`

### 9.3 Sekundární workflow s Mailpit

1. Volitelně pustit Mailpit lokálně.
2. V `.env.local` přesměrovat SMTP na Mailpit.
3. Ověřit:
4. reálné odeslání
5. předmět
6. plain text část
7. přílohy
8. linky
9. Důvod:
10. `React Email` preview je rychlé, Mailpit ověří skutečný delivery payload

### 9.4 Co preview workflow vědomě negarantuje

1. `React Email` preview není plnohodnotná simulace Gmailu ani Outlooku.
2. Neodhalí všechny client-specific quirk stavy.
3. Finální smoke test je stále potřeba alespoň v:
4. Gmail web/mobile
5. Apple Mail
6. Outlook nebo Outlook.com podle cílového trhu

## 10. Bezpečnost a produkční guardraily

1. Preview server běží jen lokálně přes `react-email` CLI.
2. Není součástí produkční Next aplikace.
3. Důvod:
4. interní tooling se tak vůbec neexponuje do produkce

### 10.1 Render failure handling

1. Render helpery musí vyhazovat explicitní chyby s názvem template a use case kontextem.
2. Transport vrstva nesmí poslat email, pokud render nedopadne úspěšně.
3. Chyba se zaloguje strukturovaně na serveru.
4. Volající action nebo mailer vrstva rozhodne, jestli chybu přemapuje na user-safe generic error.
5. Preview workflow místo rozbitého HTML zobrazí čitelnou diagnostiku v dev serveru.

## 11. Migrační plán podle fází

### Fáze 1 - Základ shared email vrstvy

1. Nainstalovat `@react-email/components`, `@react-email/render` a `react-email`.
2. Vytvořit `email-theme.ts`.
3. Vytvořit `email-layout.tsx`.
4. Vytvořit `email-render.ts`.
5. Vytvořit `email-messages.ts` pro locale-aware copy.
6. Přejmenovat `send-form-email.ts` na `email-transport.ts`.
7. Zachovat a přejmenovat lazy singleton transporter na nový doménový název.
8. Odebrat `escapeHtml` z transport vrstvy a přejít na default React escaping.
6. Acceptance criteria:
7. existuje jedno centrální místo pro vizuální tokeny
8. existuje shared HTML wrapper
9. existuje jednotný contract pro `replyTo`, přílohy a locale
10. lze manuálně vyrenderovat jeden ukázkový email bez duplikace kostry

### Fáze 2 - Preview infrastruktura

1. Přidat `email:dev` script do `package.json`.
2. Nastavit `react-email` CLI na `--dir src/server/email/templates`.
3. Přidat `PreviewProps` nebo shared preview fixtures pro všechny šablony.
4. Ověřit locale varianty v preview datech.
6. Acceptance criteria:
7. vývojář vidí email bez odeslání
8. změny theme a šablon se projevují okamžitě
9. preview nepadá bez reálných backend dat
10. preview umí ukázat locale varianty alespoň přes fixture data

### Fáze 3 - Migrace stávajících Nodemailer emailů

1. Migrovat kontaktní email.
2. Migrovat support email.
3. Migrovat newsletter signup email.
4. Migrovat workspace invite email.
5. U kontaktního emailu zachovat stávající obsah a přitom explicitně přidat nové behavior `replyTo` na email odesílatele.
6. U support emailu zachovat attachments flow v novém contractu bez změny behavioru.
7. Každou migraci dělat po jednom souboru a jasně rozlišit:
8. co je čistý presentation refactor
9. co je behavior change
6. Acceptance criteria:
7. všechny stávající mailery používají shared layout/theme
8. business text zůstává funkčně ekvivalentní
9. plain text varianta zůstává zachovaná
10. support attachments dál fungují bez změny behavioru
11. kontaktní flow má nově funkční `replyTo`, což je vědomá behavior změna mimo čistý presentation refactor

### Fáze 4 - Volitelný lokální SMTP catcher

1. Dopsat krátkou dokumentaci do README nebo developer docs.
2. Popsat doporučený `React Email` preview workflow a Mailpit workflow.
3. Případně přidat jednoduchý `docker compose` snippet nebo instrukci pro lokální běh.
4. Acceptance criteria:
5. vývojář umí snadno přepnout na lokální inbox

### Fáze 5 - PocketBase vizuální sjednocení

1. Tato fáze není součástí scope první implementace.
2. Slouží jen jako follow-up směr pro pozdější sjednocení PocketBase emailů s novým Nodemailer designem.
3. Až přijde na řadu, porovnat nový Nodemailer email frame s PocketBase emaily.
4. Přenášet se mají zejména:
5. barvy
6. spacing
7. header/footer copy
8. CTA vzhled
9. fallback URL pravidla
10. Důvod:
11. technická render vrstva bude jiná, ale vizuální pravidla mají zůstat stejná
12. Acceptance criteria pro tuto implementaci:
13. žádné
14. PocketBase změny nejsou podmínkou hotového stavu této práce

## 12. Návrh implementačních detailů

### 12.1 `email-transport.ts`

1. Soubor zůstane zodpovědný jen za:
2. SMTP transporter
3. `from`
4. `to`
5. `replyTo`
6. `subject/html/text/attachments`
7. lazy singleton lifecycle přes `globalThis`
8. Důvod:
9. nechceme míchat transport a render logiku
10. zároveň chceme zachovat dnešní efektivní chování transporteru v dev prostředí

### 12.1.1 `replyTo`

1. Kontaktní formulář musí nastavovat `replyTo` na email odesílatele.
2. U support flow se `replyTo` může nastavit na email aktuálního uživatele, pokud to dává smysl pro support inbox workflow.
3. `replyTo` nebude dopočítávané skrytě uvnitř transportu; musí být explicitně předané template/message builder vrstvou.
4. Důvod:
5. jde o behaviorální součást konkrétního email flow, ne o globální transport default

### 12.1.2 Přílohy

1. Transport vrstva zůstane posledním místem, kde se attachments předávají do Nodemailer API.
2. Template/message builder contract ale musí umět attachments nést až do tohoto bodu.
3. Support formulář zůstává referenční use case, který ověří, že nový contract nepoškodil existující behavior.

### 12.2 Šablony nebudou vracet raw `Mail.Options`

1. Rozhodnutí:
2. šablony budou exportovat React komponentu a vedle ní message builder
3. Důvod:
4. lepší oddělení doménového obsahu od Nodemailer API
5. snadná znovupoužitelnost i pro preview tooling

### 12.2.1 `escapeHtml`

1. `escapeHtml` se z původního `send-form-email.ts` přesune pryč z veřejného API.
2. Většina současného escapingu přestane být potřeba, protože React escapuje textové uzly defaultně.
3. Pokud zůstane potřeba specializovaný helper pro edge case, bude interní součástí render vrstvy.

### 12.3 Preview fixtures budou explicitní, ne generované z runtime akcí

1. Rozhodnutí:
2. preview data se budou definovat ručně.
3. Důvod:
4. preview nesmí záviset na auth session, DB stavu ani side effectech
5. musí být stabilní a rychlé

### 12.4 Lokalizace

1. Email copy se nebude dávat do `messages/*.json`, dokud nebude jasné, že chceme emaily spravovat stejným i18n mechanismem jako web UI.
2. V první iteraci vznikne dedikovaná email locale vrstva v `src/server/email/*`.
3. Důvod:
4. emaily mají jiný lifecycle a jinou strukturu copy než webové UI
5. nechceme teď násilně míchat app UI messages a server email content
6. Evoluční cesta:
7. začít jedním `email-messages.ts`
8. při růstu rozdělit do `src/server/email/messages/*` podle šablon nebo domén

## 13. Rizika a mitigace

### 13.1 Riziko: preview bude „vypadat dobře“, ale klient ne

1. Mitigace:
2. držet se konzervativního HTML/CSS subsetu
3. finální smoke test dělat v reálných klientech
4. nepoužívat preview workflow jako jediný zdroj pravdy pro kompatibilitu

### 13.2 Riziko: šablony začnou bobtnat do custom mini-frameworku

1. Mitigace:
2. udržet malý počet primitives
3. nepřidávat abstrakce bez reálného opakovaného užití
4. nové helpery přidávat až po opakování ve více šablonách

### 13.3 Riziko: častý per-project branding povede k editaci více souborů

1. Mitigace:
2. všechny vizuální tokeny držet v `email-theme.ts`
3. layout dělat generic a bez embedded copy navázané na konkrétní use case

### 13.4 Riziko: preview tooling bude nejasný nebo nevyužívaný

1. Mitigace:
2. použít oficiální `react-email` CLI jako jedinou doporučenou preview cestu
3. přidat jednoduchý `email:dev` script a krátkou dokumentaci

### 13.5 Riziko: ztratí se `replyTo` nebo attachments při migraci

1. Mitigace:
2. zavést explicitní contract pro envelope metadata
3. migrovat nejdřív kontaktní a support flow jako referenční use cases
4. při review kontrolovat i transport payload, ne jen HTML výstup

### 13.6 Riziko: jazyková nekonzistence přetrvá i po refaktoru

1. Mitigace:
2. locale udělat povinnou součást template factory
3. nové inline stringy v akcích a mailerech považovat za regresi

### 13.7 Riziko: render chyba shodí odeslání bez dostatečné diagnostiky

1. Mitigace:
2. strukturované logování s názvem template
3. čitelná diagnostika v `React Email` preview
4. fail-closed behavior explicitně zahrnout do acceptance criteria

## 14. Rozhodnuté detaily pro implementaci

1. Footer má obsahovat i základní právní identifikaci, ne jen brand a support email.
2. CTA emaily mají mít fallback URL v plain textu a podle use case i v HTML pod tlačítkem.
3. Pro mobile preview v první iteraci stačí browser responsive mode nad `React Email` preview.
4. PocketBase parity checklist se teď odkládá, není součástí první implementace.

## 15. Doporučení pro první implementaci

1. Začít rovnou s `React Email`.
2. Postavit tenkou shared email vrstvu nad existujícím Nodemailer transportem.
3. Současně s tím opravit naming:
4. `send-form-email.ts` -> `email-transport.ts`
5. `templates/*-email.ts` -> `templates/*.tsx`
6. Nejdřív doručit theme + layout + `email:dev` preview workflow.
7. Až potom migrovat konkrétní emaily.
8. Mailpit držet jako doplněk, ne jako hlavní authoring workflow.

## 16. Definice hotového řešení

1. Všechny Nodemailer emaily používají shared layout a theme.
2. Nový projekt umí změnit vzhled emailu editací jednoho theme souboru a maximálně jednoho layout souboru.
3. Vývojář umí lokálně ladit email bez reálného odeslání.
4. Plain text varianta je u všech šablon zachovaná.
5. `replyTo` funguje u flow, kde je očekávané.
6. Attachments flow funguje i po migraci support emailu.
7. Locale je explicitní součást email template contractu.
8. Preview workflow běží přes `React Email` CLI a nevyžaduje reálné odesílání.
9. Render chyby se posílají fail-closed a jsou diagnostikovatelné.
10. PocketBase emaily ještě nemusí být upravené, ale existuje jasný vizuální kontrakt, podle kterého se budou později srovnávat.
11. Výsledný systém je dostatečně jednoduchý na časté úpravy při bootstrapu nového projektu.
