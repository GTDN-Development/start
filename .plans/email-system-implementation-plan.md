# Email System Implementation Plan

Datum: 19. 3. 2026

## 1. Cíl

1. Zavést jednoduchý a udržitelný systém pro HTML emaily posílané přes Nodemailer.
2. Použít `React Email` jako oficiální template a preview vrstvu.
3. Držet implementaci KISS:
4. tenký transport
5. tenký render helper
6. minimum shared abstractions
7. žádné předčasné mini-frameworky pro emaily

## 2. Co se změnilo po porovnání s dokumentací React Email

1. `email dev` je oficiální preview workflow a má být primární lokální cesta pro vývoj.
2. `email export` není doporučený způsob běžného renderování při odeslání; React Email výslovně preferuje render v okamžiku sendu přes `render()`.
3. React Email CLI používá pro zobrazení template v preview heuristiku nad soubory v `--dir` a očekává `export default`.
4. `PreviewProps` se mají držet přímo u šablony, ne v centrální preview registru.
5. `email build` a `email start` pracují s generovanou složkou `.react-email`, takže ji máme ignorovat v gitu.
6. Manuální setup React Email doporučuje:
7. `react-email` a `@react-email/preview-server` jako dev dependency
8. `@react-email/components` jako runtime dependency
9. Pro náš use case budeme navíc používat `@react-email/render`, protože chceme centrálně generovat HTML i plain text.
10. Nodemailer guide na webu ukazuje minimalistickou HTML-only variantu s `render` importem z `@react-email/components`; pro tento projekt je vhodnější explicitní `@react-email/render`, protože chceme i `toPlainText()` a jasně oddělenou render vrstvu.

## 3. Rozhodnutí pro první iteraci

### 3.1 Držet architekturu malou

1. Zachovat jen tyto sdílené části:
2. `email-transport.ts`
3. `render-email.ts`
4. `email-theme.ts`
5. `email-layout.tsx`
6. konkrétní template soubory v `src/server/email/templates/*`
7. V první iteraci nevytvářet:
8. `email-primitives.tsx`
9. `email-messages.ts`
10. `_preview-data.ts`
11. generický template registry
12. generické envelope factory vrstvy
13. Důvod:
14. React Email už řeší authoring a preview samo
15. současný projekt má jen několik šablon
16. většina další abstrakce by teď jen přidávala LOC a typy bez reálného zisku

### 3.2 Preview data držet přímo v template souborech

1. Každá previewovatelná šablona bude mít vlastní `PreviewProps`.
2. Důvod:
3. je to přímo doporučené CLI workflow
4. odpadá centrální preview soubor a další mapování
5. preview zůstane blízko komponentě

### 3.3 Používat default export kvůli CLI, ale zachovat pojmenovanou funkci

1. Template soubor bude mít:
2. pojmenovanou komponentu
3. `export default` stejné komponenty
4. Důvod:
5. React Email CLI vyhledává template podle `export default`
6. zároveň chceme čitelné pojmenované funkce a konzistentní styl v kódu

### 3.3.1 Builder naming sjednotit předem

1. Pokud builder nebude ve stejném souboru jako template, používat konvenci:
2. `template-name.builder.ts`
3. Příklady:
4. `workspace-invite.tsx`
5. `workspace-invite.builder.ts`
6. Důvod:
7. je to nejčitelnější varianta
8. builder zůstane fyzicky vedle template
9. nevznikne ad-hoc mix `build-*` a `*.builder`

### 3.4 Nepřehánět typování

1. Nevytvářet vlastní komplexní attachment typy, pokud stačí typy z Nodemaileru.
2. Preferovat malé explicitní lokální typy per template.
3. `replyTo` a `attachments` držet jako volitelné vlastnosti finálního template outputu.
4. Nepřidávat generiky jen kvůli “čistotě”.

### 3.5 Lokalizaci podporovat všude, ale bez separátní email i18n vrstvy

1. `locale` bude součást každého email builderu.
2. Nepostavíme vlastní email-localization systém mimo stávající app směr.
3. KISS varianta:
4. použít stejný locale model jako aplikace
5. copy držet v `messages/*.json`
6. pro emaily přidat jednoduchou sekci `emails`
7. v template/builderech číst jen konkrétní potřebné klíče
8. v previewovaných template souborech nepoužívat `useTranslations`
9. ani `getTranslations`
10. použít `createTranslator` z `next-intl` podle React Email guide
11. s `locale` a importem příslušného messages JSON
8. Důvod:
9. aplikace už stojí na `next-intl`
10. locale podpora je povinný požadavek
11. nechceme vedle toho zavádět druhý paralelní překladový systém jen pro emaily
12. preview server neběží v Next.js request kontextu
13. `createTranslator` je přímo doporučená cesta v React Email docs pro `next-intl`
14. zároveň není potřeba kolem emailů stavět další abstrakce

### 3.5.1 Interní inbox emaily z formulářů

1. `contact-form`, `support-form` a `newsletter-signup` jsou interní emaily na `FORM_RECIPIENT_EMAIL`.
2. KISS cesta:
3. tyto flow budou používat fixní locale `routing.defaultLocale`
4. tedy aktuálně `cs`
5. Recipient-facing emaily jako `workspace-invite` budou dál dostávat skutečné `locale` podle flow.
6. Důvod:
7. podporu locale tím nerozbíjíme
8. ale nekomplikujeme interní inbox use case zbytečným přepínáním jazyka

### 3.6 Styling držet konzervativní

1. Používat základní React Email komponenty:
2. `Html`
3. `Head`
4. `Preview`
5. `Body`
6. `Container`
7. `Section`
8. `Heading`
9. `Text`
10. `Button`
11. `Link`
12. `Hr`
13. Nepoužívat v první iteraci `Tailwind` wrapper.
14. Důvod:
15. docs ho podporují, ale pro tento projekt by to byla další vrstva navíc
16. jednoduché inline styly a základní komponenty jsou čitelnější a bezpečnější pro email klienty

## 4. Cílová struktura

```text
src/server/email/
  email-transport.ts
  render-email.ts
  email-theme.ts
  email-layout.tsx
  templates/
    contact-form.tsx
    newsletter-signup.tsx
    support-form.tsx
    workspace-invite.tsx
```

1. Pokud později vzniknou shared template helpery uvnitř preview adresáře, prefixovat složku `_`.
2. Příklad:
3. `src/server/email/templates/_components`
4. Důvod:
5. React Email CLI takové složky ignoruje v sidebaru preview serveru

## 5. Minimal contract

### 5.1 Template soubor

1. Každý template soubor má obsahovat:
2. `Props` typ
3. pojmenovanou React komponentu
4. `export default` stejné komponenty
5. jeden jednoduchý builder pro odeslání
6. `locale`
7. volitelně `PreviewProps`
8. Pokud builder používá jen preview-safe importy, může zůstat ve stejném `.tsx` souboru.
9. Pokud by builder potřeboval server-only importy nebo jiný Next-specifický runtime, přesunout ho do vedlejšího `.ts` souboru.

### 5.2 Builder output

1. Builder nemá vracet raw `Mail.Options`.
2. Builder má vracet jednoduchý objekt ve stylu:
3. `subject`
4. `react`
5. volitelně `replyTo`
6. volitelně `attachments`
7. volitelně `text`
8. Builder input má obsahovat `locale`.
9. Překlady se mají brát z existujících `next-intl` messages, ne z extra email message vrstvy.
10. Důvod:
11. template zůstane oddělená od nízkoúrovňového transport API
12. ale zároveň nevznikne překomplikovaná message DSL

### 5.3 Textová verze

1. Pokud template explicitně nevrátí `text`, `render-email.ts` ji odvodí přes `toPlainText()` z vyrenderovaného HTML.
2. Důvod:
3. menší duplicita
4. méně ruční údržby
5. `toPlainText()` podle React Email docs převádí odkazy i CTA na text včetně URL
6. možnost explicitního override zůstane tam, kde ho budeme opravdu potřebovat

## 6. Sdílené soubory

### 6.1 `src/server/email/email-transport.ts`

1. Přejmenovaný dnešní `send-form-email.ts`.
2. Zodpovědnost:
3. vytvoření a cachování Nodemailer transporteru
4. `from`
5. `to`
6. `replyTo`
7. `subject`
8. `html`
9. `text`
10. `attachments`
11. Žádný rendering React komponent uvnitř transportu.
12. Lazy singleton na `globalThis` zůstane zachovaný.

### 6.2 `src/server/email/render-email.ts`

1. Jediný shared helper pro renderování.
2. Bude používat:
3. `render()` z `@react-email/render`
4. `toPlainText()` z `@react-email/render`
5. Zodpovědnost:
6. vzít builder output
7. vyrenderovat `html`
8. dopočítat `text`, pokud není dodané
9. vrátit data připravená pro transport
10. Pokud render selže, helper chybu vyhodí dál.
11. Po migraci se odstraní veřejný `escapeHtml` helper, protože JSX escapuje textové uzly automaticky.

### 6.3 `src/server/email/email-theme.ts`

1. Držet jen malé množství stabilních tokenů:
2. `brandName`
3. `siteUrl`
4. `supportEmail`
5. `canvasColor`
6. `surfaceColor`
7. `textColor`
8. `mutedTextColor`
9. `borderColor`
10. `accentColor`
11. `maxWidth`
12. `radius`
13. `contentPadding`
14. `brandName`, `siteUrl` a `supportEmail` nemají být duplicitní hardcode.
15. `brandName` a `siteUrl` brát z existujícího app configu.
16. `supportEmail` brát z existujícího legal configu.
17. `email-theme.ts` nemá míchat config a env pro tyto základní identifikační údaje.

### 6.4 `src/server/email/email-layout.tsx`

1. Shared wrapper pro všechny HTML emaily.
2. Má řešit jen:
3. `Html`
4. `Head`
5. `Preview`
6. `Body`
7. kontejner
8. jednoduchý header
9. jednoduchý footer
10. `lang` na `<Html>` podle props
11. Neobsahovat business copy konkrétních emailů.

## 7. Styling pravidla

1. Používat inline style objekty.
2. Držet šířku kontejneru přibližně `560-600px`.
3. Používat jednoduchý světlý layout s vysokým kontrastem.
4. Používat systémový font stack.
5. Vyhnout se:
6. custom fontům
7. gradientům
8. background images
9. vícesloupcovým layoutům v první iteraci
10. dark mode hackům
11. Pokud email obsahuje důležitou akci, CTA má mít:
12. klikací tlačítko v HTML
13. fallback URL v plain textu
14. podle potřeby i viditelnou URL v HTML

## 8. Preview workflow

1. Přidat script:
2. `email:dev`: `email dev --dir src/server/email/templates`
3. Primární workflow:
4. spustit `npm run email:dev`
5. otevřít preview server
6. ladit template přes `PreviewProps`
7. Sekundární workflow:
8. volitelně přesměrovat SMTP do Mailpit a ověřit reálný payload
9. React Email CLI má jen jedny `PreviewProps` na soubor.
10. KISS cesta:
11. držet v template jedny výchozí `PreviewProps` pro primární locale
12. druhou locale ověřit přes dočasné přepnutí `PreviewProps` nebo přes Mailpit/local send
13. nevytvářet kvůli tomu extra preview wrapper soubory
14. Nezavádět vlastní Next.js preview route.

## 9. Git a generated files

1. Přidat `/.react-email/` do `.gitignore`.
2. `/out/` už ignorované je, takže pro `email export` není potřeba další změna.
3. `emails/static` ekvivalent v našem `--dir` je source složka, ne generated output, takže se ignorovat nemá.

## 10. Migrační pořadí

### Fáze 1

1. Nainstalovat:
2. runtime:
3. `@react-email/components`
4. `@react-email/render`
5. dev:
6. `react-email`
8. Přidat `email:dev`.
9. Přidat `/.react-email/` do `.gitignore`.
10. Přejmenovat `send-form-email.ts` na `email-transport.ts`.
11. Přidat `render-email.ts`, `email-theme.ts`, `email-layout.tsx`.
12. Přidat email překlady do `messages/en.json` a `messages/cs.json` pod sekci `emails`.
13. V první implementaci neinstalovat `@react-email/preview-server` samostatně, pokud se neukáže konkrétní problém s CLI.

### Fáze 2

1. Migrovat `workspace-invite` jako první referenční template.
2. Důvod:
3. je to nejčistší user-facing email s CTA
4. dobře ověří layout, preview text a HTML render
5. V této fázi explicitně ověřit kvalitu `toPlainText()` výstupu pro CTA a URL.

### Fáze 3

1. Migrovat všechny tři interní form emaily v jedné společné fázi:
2. `contact-form`
3. `newsletter-signup`
4. `support-form`
5. U `contact-form` přidat explicitní `replyTo` na email odesílatele.
6. `support-form` dělat v rámci téže fáze jako poslední podkrok, protože nese attachment flow.

## 11. Co vědomě nedělat v první iteraci

1. Nezavádět globální `email-messages.ts` mimo `next-intl`.
2. Nezavádět per-template registry, lookup mapy ani factory factory vrstvy.
3. Nezavádět shared primitive knihovnu bez reálného opakování.
4. Nezavádět druhý paralelní překladový systém vedle `messages/*.json`.
5. Nezavádět vlastní preview app.
6. Nezavádět `email export` jako běžný produkční render flow.
7. Neřešit teď technické sjednocení PocketBase emailů.
8. Nezdvojovat preview šablony jen kvůli druhé locale.

## 12. Rizika a mitigace

### 12.1 Preview vypadá dobře, klient ne

1. Držet se konzervativního HTML/CSS subsetu.
2. Udělat smoke test alespoň v Gmailu a Outlook.com.

### 12.2 Šablony začnou bobtnat

1. Extrahovat helper nebo primitivu až po opakování ve více emailech.

### 12.3 Migrace rozbije `replyTo` nebo attachments

1. `replyTo` a `attachments` držet explicitně v builder outputu.
2. Support email migrovat až jako poslední.

### 12.4 Scope a LoC začne růst

1. Guardrail pro celou feature je přibližně `400-750 LoC`.
2. Pokud implementace míří pod `400 LoC`, pravděpodobně chybí layout nebo lokalizace.
3. Pokud implementace míří nad `750 LoC`, je vysoká šance, že je řešení overengineered.
4. V takové chvíli zastavit a zjednodušit:
5. omezit helpery
6. nesplitovat zbytečně soubory
7. nepřidávat další abstraction layer

## 13. Definice hotového stavu

1. Všechny současné Nodemailer emaily používají React Email komponenty.
2. Preview běží přes `npm run email:dev`.
3. Transport zůstává jednoduchý a neobsahuje render logiku.
4. Generated `.react-email` není trackované v gitu.
5. HTML i plain text vznikají z jednoho jednoduchého render flow.
6. `replyTo` funguje tam, kde je očekávané.
7. Attachment flow funguje i po migraci support emailu.
8. Email copy je lokalizované přes existující `next-intl` messages.
9. Výsledná vrstva je malá a snadno upravitelná bez zbytečné typové nebo architektonické komplexity.
