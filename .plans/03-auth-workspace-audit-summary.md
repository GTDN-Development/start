# Auth, Workspace, Invite a Redirect Audit

Date: 2026-03-25

## Kontext

Audit jsem dělal se zaměřením na:
- auth flow
- workspace entry a aktivní workspace
- invite flow
- verify-email flow
- redirecty, linky a application entry rozhodování

Cíl nebyl navrhovat velký refactor. Cíl byl najít místa, kde už vzniká drift a kde se stejná věc
řeší paralelně na více místech. Celkově je codebase v dobrém stavu, ale auth a workspace entry
vrstva už nemá úplně jeden kanonický model.

## Hlavní zjištění

### P1. Post-auth redirect není sjednocený
- `resolvePostAuthDestination()` dnes vrací jen `invite_redirect` nebo `app`
- `src/features/auth/post-auth-redirect.ts` ale stále počítá i s `workspace_redirect`
- verify-email page má vlastní server-side redirect logiku a ta také pořád počítá s `workspace_redirect`
- vedle toho existuje ještě `resolveApplicationEntryHref()`, která řeší vstup do appky samostatně

Problém:
- stejné rozhodnutí po přihlášení není vyjádřené jedním bodem
- část větví už působí jako mrtvý kód
- změna post-auth chování se bude muset udržovat ve více souborech

Reference:
- `src/server/workspaces/workspace-resolution-service.ts`
- `src/features/auth/post-auth-redirect.ts`
- `src/features/application/application-entry.ts`
- `src/app/[locale]/(auth)/(flow)/verify-email/page.tsx`

### P1. Resend verify-email flow je slabší než ostatní veřejné auth flow
- sign-up používá Turnstile
- forgot-password používá Turnstile
- resend verify-email Turnstile nepoužívá
- verify-email screen dovoluje resend jen na základě `email` query parametru

Problém:
- ochrana veřejných auth flow není konzistentní
- resend verifikačních e-mailů je zbytečně slabší místo pro abuse a spam
- když už je Turnstile zavedený pattern, tohle je zbytečná výjimka

Reference:
- `src/features/auth/actions/auth-actions.ts`
- `src/features/auth/verify-email/verify-email-form.tsx`
- `src/features/auth/forgot-password/forgot-password-form.tsx`
- `src/features/auth/sign-up/sign-up-form.tsx`

### P2. Auth gating je rozdělený do více vrstev, které se rozcházejí
- `auth-proxy` kontroluje jen přítomnost auth cookie
- `getServerAuthSession()` dělá session refresh a validaci jedním způsobem
- `requireCurrentUser()` dělá podobnou validaci jiným způsobem
- `(application)` layout autentizuje celý strom, ale některé child routes auth kontrolují znovu
- některé workspace routes používají `getServerAuthSession()`, jiné `requireCurrentUser()`

Problém:
- přibývá počet míst, kde se rozhoduje, jestli je uživatel opravdu přihlášený
- stejný request může projít různou sadou pravidel podle route
- změna session policy se snadno opraví jen v části systému

Reference:
- `src/features/auth/auth-proxy.ts`
- `src/server/auth/auth-service.ts`
- `src/server/auth/current-user.ts`
- `src/app/[locale]/(application)/layout.tsx`
- `src/app/[locale]/(application)/(application-shell)/w/[workspaceSlug]/overview/page.tsx`
- `src/app/[locale]/(application)/(application-shell)/w/[workspaceSlug]/settings/page.tsx`

### P2. Active workspace není vedený jako jeden kanonický stav
- application layout si lokálně opravuje invalidní `activeWorkspaceSlug`
- `resolveSelectedWorkspaceSlug()` má vlastní fallback logiku pro klient
- `resolveApplicationEntryHref()` se stále opírá o raw cookie a samostatnou validaci

Problém:
- sidebar může pracovat s jiným "aktivním workspace" než application entry link
- uživatel může vidět jeden workspace jako vybraný a přitom být poslaný jinam
- je to malý drift dnes, ale bude růst s dalšími workspace features

Reference:
- `src/app/[locale]/(application)/layout.tsx`
- `src/features/application/workspace-routing.ts`
- `src/features/application/application-entry.ts`
- `src/server/workspaces/workspace-cookie.ts`

### P3. Invite link origin není sjednocený s runtime redirecty
- invite URL do e-mailu se skládá přes statické `app.site.url`
- invite route redirecty se skládají přes `request.nextUrl.origin`
- runtime a e-mailová vrstva tedy nepoužívají stejný zdroj pravdy pro origin

Problém:
- na hlavní doméně to může fungovat bez viditelného problému
- preview, staging nebo custom domény jsou přesně prostředí, kde se to rozjede

Reference:
- `src/server/workspaces/workspace-invite-url.ts`
- `src/config/app.ts`
- `src/app/[locale]/(auth)/(flow)/invite/[token]/start/route.ts`
- `src/app/[locale]/(auth)/(flow)/invite/[token]/accept/route.ts`

## Doporučené pořadí oprav

1. Sjednotit post-auth entry a odstranit mrtvé větve.
2. Doplnit konzistentní ochranu resend verify-email flow.
3. Zúžit auth gating na menší počet kanonických helperů.
4. Sjednotit active workspace resolution a application entry rozhodování.
5. Srovnat policy pro origin invite linků a redirectů.

## Závěr

Nevidím potřebu velkého refactoru. Je ale potřeba dotáhnout auth a workspace entry vrstvu tak,
aby systém měl menší počet "pravd" a redirect chování bylo čitelnější a konzistentní.
