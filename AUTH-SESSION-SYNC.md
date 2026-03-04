# Auth Session Sync — stav infrastruktury

## Shrnutí

`auth-client.ts` obsahuje plně implementovanou vrstvu pro cross-tab synchronizaci session,
visibility-based refetch a online recovery. Tato infrastruktura je aktuálně **dormantní** —
kód je v produkčním stavu, ale nemá žádného živého consumera, takže se za běhu nikdy neaktivuje.

## Co je připravené

Tři sync mechanismy v `src/features/auth/auth-client.ts`:

| Mechanismus | Trigger | Co dělá |
|---|---|---|
| **BroadcastChannel cross-tab sync** | `signIn`, `signUp`, `signOut` broadcastují signál | Ostatní taby volají `refreshSession()` proti serveru |
| **Visibility refetch** | `visibilitychange → "visible"` | Authenticated tab po návratu do popředí refreshne session |
| **Online recovery** | `window.online` event | Po přechodu offline → online refreshne session |

Všechny tři sdílejí rate limit `REFETCH_RATE_LIMIT_MS` (5 s).

## Proč je vrstva dormantní

Inicializace všech tří mechanismů běží přes `ensureSessionSyncInitialized()`, která se volá
**pouze** uvnitř `useSession()` hooku (řádek 220). Řetězec závislostí:

```
useSession()                        ← jediný entry point pro sync init
  └─ useEmailVerification()         ← jediný consumer useSession()
       └─ (žádná komponenta)        ← nikde není mountovaný
```

### Důsledky

- `syncChannel` (`BroadcastChannel`) zůstává `null` — nikdy se nevytvoří.
- `visibilitychange` listener se nikdy neregistruje.
- `online` listener se nikdy neregistruje.
- `broadcastSessionChanged()` / `broadcastSignedOut()` v auth mutacích (`signIn`, `signUp`,
  `signOut`, `verifyEmailToken`, `confirmEmailChange`) jsou tiché no-ops díky optional chaining
  na `null` channel (`syncChannel?.postMessage(...)`).
- `setSessionState()` v auth mutacích updatuje module-level stav, ale nikdo na něj není
  subscribed přes `useSyncExternalStore`, takže se nevyvolá žádný re-render.

## Runtime dopad

**Nulový.** Žádný listener se neregistruje, žádný network request se neposílá, žádný
re-render se netriggeruje. Kód je tree-shake-safe pro funkce, které se neimportují,
ale `signIn`/`signUp`/`signOut` se importují v komponentách, takže modul se bundluje —
dormantní funkce v něm zůstávají jako mrtvý kód s minimálním size footprintem.

## Jak vrstvu aktivovat

Stačí v libovolné renderované komponentě zavolat `useSession()`. Například:

```tsx
// v application header, sidebar, nebo layout komponentě
import { useSession } from "@/features/auth/auth-client";

export function SessionIndicator() {
  const { status, session } = useSession();
  // ...
}
```

Jakmile se `useSession()` mountne, `ensureSessionSyncInitialized()` se zavolá jednou
a všechny tři mechanismy se automaticky aktivují. Žádné další zapojování není potřeba.

### Proč headery nepoužívají `useSession()`

`ApplicationHeader` a `MarketingHeader` zobrazují `UserAccountMenu` s avatarem a údaji o uživateli,
ale data čerpají ze **server-driven props**, ne z `useSession()`. Důvody:

1. **Server layouty už validují session na každou navigaci.** Oba layouty (`(application)/layout.tsx`,
   `(marketing)/layout.tsx`) volají `getServerAuthSession()` v Server Component — data jsou vždy
   čerstvá při každém přechodu stránky.
2. **Redundantní fetch.** `useSession()` by na mount vyvolal `GET /api/auth/session`, přestože
   server právě tatáž data dodal.
3. **Hydration mismatch.** `useSession()` startuje v `idle` → `loading` → `authenticated`.
   Server renderuje s reálnými daty — vznikl by flash/skeleton, který nedává smysl.
4. **Dva zdroje pravdy.** Server props + client store pro stejná data = nutnost reconcilace.
5. **In-session mutace řeší `AccountProfileContext`.** Změny avataru, jména apod. propaguje
   `useOptionalAccountProfile()` v `UserAccountMenu` — `useSession()` tohle neřeší.
6. **Cross-tab sign-out je pokrytý.** Cookie `pb_auth` je sdílená — po odhlášení v tab A
   jakákoliv navigace/server action v tab B session chytí a redirectne. Jediná mezera je
   „uživatel sedí na tab B bez interakce" — extrémně úzký gap za cenu architekturální komplikace.

### Typické use cases pro aktivaci

- **Session-aware header/nav** — zobrazení jména, avataru, stavu uživatele.
- **Email verification banner** — `useEmailVerification()` je připravený hook,
  stačí ho mountnout v application layoutu.
- **Cross-tab sign-out** — odhlášení v jednom tabu okamžitě clearuje session v ostatních.
- **Stale session detection** — návrat na tab po delší době odhalí revokovanou/expirovanou session.

## Rozhodnutí

Infrastruktura je záměrně ponechána v kódu jako pre-built základ. Odstranění by ušetřilo
minimální komplexitu, ale vyžadovalo by reimplementaci ve chvíli, kdy session-aware UI
bude potřeba. Headery zůstávají server-driven — `useSession()` se aktivuje až pro
dlouhožijící interaktivní features (real-time overview, chat, collaborative editor),
kde uživatel typicky nenaviguje a stale session = broken UX.