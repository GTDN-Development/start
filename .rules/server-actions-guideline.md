# Server Actions Guideline

## Scope

- Tento dokument plati pro `src/features/*`, `src/server/*` a `src/app/api/*`.
- Cilem je mit mutace primarne pres Server Actions a API routes jen tam, kde to dava smysl.

## Kam davat Server Actions

- Server Actions patri do feature slozek v `src/features/*`.
- Pokud je action route-specific, colocate k dane casti feature (napr. `src/features/marketing/contact/contact-actions.ts`).
- Action soubor ma mit top-level `"use server"`.
- Actions maji byt tenke adaptery:
- validace vstupu (Zod)
- auth/guard kontrola
- volani domennich funkci v `src/server/*`
- jednotny response shape

## Kam davat domenovou logiku

- Hlavni business logika patri do `src/server/*` (napr. auth/account/captcha/email).
- Action ani route handler nemaji obsahovat komplexni domenovou logiku.
- Stejna logika se nesmi duplikovat mezi action a route handlerem.

## Kdy pouzit API Route Handler

- Externi callbacky/webhooky a verejne HTTP endpointy.
- Endpointy, ktere musi byt volatelne mimo vlastni frontend.
- Specialni GET API, ktere potrebuje klientsky polling/sync (napr. session refresh).

## Co udrzet konzistentni

- Nemit paralelni implementaci stejne mutace (`action` + `api route`) bez duvodu.
- Drzet jednotne error code mapovani a response kontrakt.
- Cookies nastavovat/mazat centralne v server vrstve helperem.

## Next.js poznamky

- Server Actions jsou primarne pro mutace.
- Pri uploadu souboru hlidat `serverActions.bodySizeLimit` v `next.config.ts`.

