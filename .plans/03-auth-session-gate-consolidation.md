# Task 3: Zúžit auth/session gate na malé množství kanonických helperů

Date: 2026-03-25
Priority: P2

Tento task řeší třetí nejdůležitější opakující se problém: auth/session validace je dnes
implementovaná ve více velmi podobných cestách, které už se v detailech rozcházejí.

## Proč je to důležité

- `src/server/auth/auth-service.ts#getServerAuthSession()` a
  `src/server/auth/current-user.ts#requireCurrentUser()` oba dělají auth refresh, device session
  validaci, verified guard a cleanup cookies, ale ne úplně stejným způsobem.
- `src/features/auth/auth-proxy.ts` kontroluje jen přítomnost auth cookie, takže proxy je jiný
  typ gate než server-side layout a route helpers.
- `(application)` layout autentizuje celý strom, ale některé child routes dělají auth check znovu
  jinou cestou.
- Vzniká drift mezi guest surface, marketing surface a protected application surface.

## Cíl

Nechat v systému jen malé množství jasných auth helperů s jednoznačnými kontrakty:

- optional session lookup
- required authenticated user
- lightweight proxy prefilter

Všechny tři mají sdílet stejnou základní session validační logiku a mají být používané
konzistentně podle typu route.

## Scope

- Vytáhnout sdílené session/device validation rozhodování do jedné přímé interní cesty.
- Srovnat rozdíly mezi `getServerAuthSession()` a `requireCurrentUser()`.
- Ujasnit ownership auth gate mezi proxy, layouty a child routes.
- Omezit zbytečné opakované auth checky v application routách, kde už gate drží parent layout.
- Doplnit cílené regresní scénáře pro invalid auth cookie, invalid device session, unverified
  session a smazaného nebo neplatného usera.

## Acceptance Criteria

- `getServerAuthSession()` a `requireCurrentUser()` sdílí stejný základ validačního toku.
- Je zřejmé, kdy se má použít optional session helper a kdy required user helper.
- Protected application flow neprovádí zbytečně několik rozdílných auth gate rozhodnutí za sebou.
- Cleanup neplatného auth stavu se chová stejně napříč guest, marketing a application surface.
- Nejrizikovější auth/session edge cases mají alespoň minimální regresní coverage.

## Hlavní soubory

- `src/server/auth/auth-service.ts`
- `src/server/auth/current-user.ts`
- `src/server/pocketbase/pocketbase-server.ts`
- `src/features/auth/auth-proxy.ts`
- `src/proxy.ts`
- `src/app/[locale]/(application)/layout.tsx`
- `src/app/[locale]/(auth)/(guest)/layout.tsx`
- `src/app/[locale]/(marketing)/layout.tsx`
- `src/app/[locale]/(application)/(application-shell)/w/[workspaceSlug]/overview/page.tsx`
- `src/app/[locale]/(application)/(application-shell)/w/[workspaceSlug]/settings/page.tsx`

## Guardrails

- Nezavádět provider-neutral auth abstraction ani middleware pipeline.
- Neschovávat jednoduché flow do nových manager/engine vrstev.
- Pokud parent layout už gate vlastní, child routes mají používat přímé navazující helpery, ne
  další paralelní auth orchestration.
