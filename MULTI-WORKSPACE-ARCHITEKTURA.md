# Zadání implementace: Multi-workspace architektura

## 1. Cíl a scope

- Zavést multi-workspace architekturu pro B2C i B2B.
- V1 je záměrně jednoduchá: bez `teams`, bez billing systému.
- Refaktor je čistý, bez zpětné kompatibility na staré URL/názvosloví.
- Každý uživatel musí mít vždy osobní (`personal`) workspace.
- Firemní účet je `organization` workspace + členové.

## 2. Terminologie a canonical URL

- Používat jen: `sign-in`, `sign-up`, `sign-out`, `overview`.

### Canonical URL

- `/[locale]/sign-in`
- `/[locale]/sign-up`
- `/[locale]/overview`
- `/[locale]/w/[workspaceSlug]/overview`
- `/[locale]/w/[workspaceSlug]/settings/general`
- `/[locale]/w/[workspaceSlug]/settings/members`
- `/[locale]/w/[workspaceSlug]/settings/danger`
- `/[locale]/account/settings/general`
- `/[locale]/account/settings/security`
- `/[locale]/account/settings/danger`
- `/[locale]/invite/[token]`

- `/[locale]/overview` je vstupní route, která vždy redirectuje na konkrétní workspace.

### CZ aliasy

- `/prihlasit-se`
- `/registrace`
- `/prehled`

## 3. i18n kontrakt

- `pages.signIn`
- `pages.overview`
- `forms.signIn`
- `layout.platform.signOut`
- `layout.navigation.items.signIn`
- `layout.navigation.items.overview`
- `backToSignIn`

## 4. Informační architektura settings

- Workspace a Account zůstávají oddělené podle scope v URL.
- Použít jeden sdílený settings shell/sidebar komponent.

### Workspace settings stránky

- `general` (name, slug, avatar)
- `members` (members + invites)
- `danger` (transfer ownership, leave, delete)

### Account settings stránky

- `general`
- `security`
- `danger`

## 5. PocketBase schéma (ultimátní KISS)

### `workspaces`

- `name`
- `slug` (unique)
- `kind` (personal | organization)
- `avatar` (optional file)

### `workspace_members`

- `workspace` (relation -> workspaces, cascade delete)
- `user` (relation -> users, cascade delete)
- `role` (owner | member)

### `workspace_invites` (jen aktivní pozvánky)

- `workspace` (relation -> workspaces, cascade delete)
- `email_normalized`
- `role` (member)
- `token_hash` (SHA-256 hex)
- `expires_at`
- `invited_by` (relation -> users)

Poznámka: nepoužívat `status`, `joined_at`, `archived`, `accepted_by`, `accepted_at`, `last_sent_at`.

## 6. Indexy

- `workspaces`: unique(slug)
- `workspace_members`: unique(workspace,user)
- `workspace_members`: index(user)
- `workspace_members`: index(workspace,role)
- `workspace_invites`: unique(token_hash)
- `workspace_invites`: unique(workspace,email_normalized)
- `workspace_invites`: index(workspace)
- `workspace_invites`: index(expires_at)

## 7. Autorizační pravidla a business constraints

- Owner je pouze přes `workspace_members.role = owner` (žádné owner pole ve `workspaces`).
- Membership je hard-delete: záznam existuje = přístup, neexistuje = bez přístupu.

### `personal` workspace

- nelze zvát
- nelze opustit
- nelze smazat

- Last-owner guard je povinný.
- Smazání user účtu blokovat, pokud user vlastní organization workspace bez transferu/deletu.
- Slug generování: retry + suffix při kolizi.

## 8. Bezpečnost invite tokenů

- Token generovat kryptograficky bezpečně (`crypto.randomBytes`).
- Ukládat pouze `token_hash` (SHA-256), nikdy raw token.
- Nepoužívat bcrypt/argon2 pro invite token.
- Při validaci token hashnout a hledat přes indexed `token_hash`.
- Raw token nelogovat.

## 9. Cold invite flow (bez úprav auth formulářů)

- Uživatel otevře `/[locale]/invite/[token]`.
- Server ověří token (existuje + není expirovaný).
- Pokud user není přihlášen:
- nastaví HttpOnly cookie `pending_invite_hash`
- redirect na standardní `/sign-in` (bez query parametru)
- Auth formuláře zůstávají čisté, bez workspace logiky.
- Po úspěšném `sign-in` nebo `sign-up` se v centralizovaném post-auth kroku zkusí uplatnit `pending_invite_hash`.
- Povinná kontrola: `normalize(user.email) === invite.email_normalized`.
- Pokud nesedí e-mail:
- neudělat accept
- nevytvářet membership
- smazat pending cookie
- vrátit chybu typu `INVITE_EMAIL_MISMATCH`
- Accept = vytvořit membership idempotentně + smazat invite.
- Revoke = smazat invite.

## 10. Centrální bootstrap workspace (odolné i pro budoucí OAuth)

- `ensurePersonalWorkspace` volat centrálně v `/[locale]/overview`.
- Nevolat ho jen v sign-up formuláři.

### Flow

- user přijde na `/overview`
- ověří se session
- zavolá se idempotentní `ensurePersonalWorkspace`
- vybere se target workspace
- redirect na `/w/[slug]/overview`

## 11. Redirect a active workspace cookie

- `active_workspace` cookie ukládat jako `workspaceSlug` (ne ID).
- Cookie je jen UX hint, ne autorizační zdroj pravdy.

### `/overview`

- zkusí slug z cookie
- ověří membership
- pokud validní, redirect tam
- jinak redirect na první dostupný workspace

## 12. Resend rate limiting bez extra pole

- Nepřidávat `last_sent_at`.
- Využít PocketBase systémové `updated`.
- Resend povolit jen pokud `now - invite.updated >= 60s`.
- Při resend udělat update invite záznamu (např. rotace tokenu/prodloužení expirace), tím se `updated` přepíše.

## 13. Povinné flows V1

- Sign-in/sign-up/sign-out
- Entry `/overview` + workspace redirect
- Workspace switcher
- Workspace general: change name/slug/avatar
- Workspace members: list/change role/remove/leave
- Invites: create/resend/revoke/accept
- Ownership transfer
- Workspace hard delete (organization only)
- Account settings: general/security/danger

## 14. Implementační etapy

- PocketBase kolekce, indexy, rules, typegen.
- `workspace-service` (membership, slug, ensurePersonalWorkspace).
- `invite-service` (token hash, cooldown, accept/revoke).
- Transakční invite mailer.
- Refaktor routes/features/i18n/menu/guardů na finální názvosloví.
- Implementace settings UI + invite UI.
- E2E hardening a edge-case testy.

## 15. Definition of Done

- Celá app používá výhradně `sign-in/sign-up/sign-out/overview`.
- Workspace/account settings mají konzistentní UX a oddělený scope.
- Invite/member/ownership/delete flows fungují end-to-end.
- Přístup nejde obejít bez membership záznamu.
- `personal` restrikce jsou vynucené backendem i UI.
- `ensurePersonalWorkspace` je centrální v `/overview` a funguje i pro budoucí OAuth.
- Invite nejde zneužít přeposláním odkazu na jiný e-mail.
- Nejsou přítomné artefakty předchozí architektury.
