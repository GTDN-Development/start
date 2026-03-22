# Plan: Client Boundary Warnings + React Component Structure Cleanup

## Cíl

Odstranit všechny warningy typu:

`Props must be serializable for components in the "use client" entry file`

a současně srovnat komponenty s pravidly z:

- `.rules/react-component-structure.md`
- `.rules/project-architecture-principles.md`

Hlavní princip pro tento refaktor:

- nepřejmenovávat běžné klientské callbacky na fake `*Action`, pokud to nejsou skutečné Server Actions
- raději posunout `use client` boundary výš na skutečný entry point
- nepřidávat nové obecné abstraction layers
- preferovat přímou kompozici a konkrétní lokální soubory

To odpovídá architektonickým principům repa: méně indirection, žádné hypotetické abstractions, čitelné top-to-bottom flow.

## Audit Summary

### 1. Confirmed serializable-props warning sources

Repo audit nad exporty v `use client` entry souborech našel 6 skutečných zdrojů warningu:

1. `src/components/ui/turnstile.tsx`
   - problem props: `onSuccess`, `onError`, `onExpire`
   - doporučení: odstranit `"use client"` z leaf komponenty a nechat boundary na formulářích, které ji používají

2. `src/features/workspaces/workspace-create-drawer.tsx`
   - problem prop: `onOpenChange`
   - doporučení: odstranit `"use client"` z drawer leafu a boundary ponechat ve `workspace-switcher.tsx`

3. `src/features/workspaces/settings/members/workspace-invite-members-settings-item.tsx`
   - problem prop: `onInviteCreated`
   - doporučení: odstranit `"use client"` z leaf komponenty a boundary ponechat ve `workspace-members-settings-section.tsx`

4. `src/features/workspaces/settings/members/workspace-members-management-settings-item.tsx`
   - problem props: `onInviteRemoved`, `onInviteResent`, `onMemberRemoved`, `onMemberRoleChanged`, `onOwnershipTransferred`
   - doporučení: odstranit `"use client"` z leaf komponenty a boundary ponechat ve `workspace-members-settings-section.tsx`

5. `src/features/error-handling/error-state-content.tsx`
   - problem prop: `reset`
   - doporučení: odstranit `"use client"`; boundary už správně existuje v route-level `error.tsx` entry souborech

6. `src/features/auth/post-auth-redirect.ts`
   - problem source: helper bere `router`, jehož typ obsahuje callbacky `push`, `replace`, `prefetch`, `back`, `forward`, `refresh`
   - doporučení: odstranit `"use client"` a helper zúžit na plain client-graph utility, ideálně s lokálním minimálním router kontraktem místo `ReturnType<typeof useRouter>`

### 2. Why boundary shift is the right fix

Všechny nalezené případy jsou běžné klientské callbacky, ne Server Actions. Přejmenování na `action` / `*Action` by warning umlčelo, ale zavedlo by misleading API a zhoršilo čitelnost. To je v rozporu s `.rules/project-architecture-principles.md`.

Preferovaný směr:

- nechat `use client` jen na skutečných entry pointechtech importovaných ze server component stromu
- leaf komponenty a utility, které žijí jen uvnitř client graphu, nechat bez `"use client"`

## Proposed Refactor Scope

### A. Client-boundary cleanup

#### A1. `Turnstile`

Soubor:

- `src/components/ui/turnstile.tsx`

Změna:

- odstranit `"use client"`
- ponechat komponentu jako interní client-graph leaf
- zachovat stávající API i ref forwarding

Dopad:

- bez změn call sites v:
  - `src/features/auth/sign-up/sign-up-form.tsx`
  - `src/features/auth/forgot-password/forgot-password-form.tsx`
  - `src/features/marketing/contact/contact-form.tsx`
  - `src/features/marketing/newsletter/newsletter-form.tsx`

Poznámka:

- pokud by někdo chtěl `Turnstile` importovat přímo ze server componenty, tohle je špatná hranice už z principu; správně má boundary zůstat na formuláři

#### A2. Workspace drawer

Soubor:

- `src/features/workspaces/workspace-create-drawer.tsx`

Změna:

- odstranit `"use client"`
- boundary nechat v `src/features/workspaces/workspace-switcher.tsx`

Dopad:

- žádná změna veřejného API není nutná
- zároveň srovnat pořadí sekcí v komponentě podle `inputs -> hooks -> state -> derived -> actions -> UI`

#### A3. Workspace members leaf components

Soubory:

- `src/features/workspaces/settings/members/workspace-invite-members-settings-item.tsx`
- `src/features/workspaces/settings/members/workspace-members-management-settings-item.tsx`

Změna:

- odstranit `"use client"` z obou leaf komponent
- jediný public client entry pro tento subtree ponechat na:
  - `src/features/workspaces/settings/members/workspace-members-settings-section.tsx`

Dopad:

- callbacks zůstanou normálně pojmenované
- žádná nová context vrstva ani reducer infrastruktura není potřeba
- velký management file nerozdělovat jen kvůli délce; je koherentní a pravidla repa explicitně říkají, že velké soubory jsou v pořádku, pokud nemíchají concerns

#### A4. Error state content

Soubor:

- `src/features/error-handling/error-state-content.tsx`

Změna:

- odstranit `"use client"`

Dopad:

- route-level error boundaries v:
  - `src/app/[locale]/error.tsx`
  - `src/app/[locale]/(application)/error.tsx`
  - `src/app/[locale]/(auth)/error.tsx`
  - `src/app/[locale]/(marketing)/error.tsx`
  zůstávají jedinými entry pointy s legitimním `reset` callbackem

#### A5. Post-auth redirect helper

Soubor:

- `src/features/auth/post-auth-redirect.ts`

Změna:

- odstranit `"use client"`
- nahradit `type AppRouter = ReturnType<typeof useRouter>` explicitním minimálním router kontraktem, např. jen `replace`
- helper ponechat jako plain utility používanou z client formulářů

Dopad:

- call sites beze změny nebo jen s drobným typovým zpřesněním
- odstraní se warning vyvolaný router type shape

## React Component Structure Audit

### High-confidence cleanup candidates

Tyto soubory mají zřetelné odchylky od doporučeného pořadí sekcí a měly by se srovnat v rámci stejného PR:

1. `src/features/workspaces/workspace-create-drawer.tsx`
   - srovnat skupiny `hooks -> state/derived schema -> form hook -> handlers -> UI`

2. `src/features/workspaces/settings/members/workspace-invite-members-settings-item.tsx`
   - přesunout derived values typu `isReadOnly` až pod local state
   - držet handlers pohromadě

3. `src/features/workspaces/settings/members/workspace-members-management-settings-item.tsx`
   - local state dřív, derived values až po něm
   - zachovat akce v jedné sekci před JSX

4. `src/features/workspaces/settings/general/workspace-name-settings-item.tsx`
   - local state před derived snapshoty
   - schema + form hook držet v jedné čitelné skupině

5. `src/features/workspaces/settings/general/workspace-url-settings-item.tsx`
   - stejné srovnání jako u name settings

6. `src/features/workspaces/settings/general/workspace-delete-settings-item.tsx`
   - srovnat hooks/state/derived/form sections

7. `src/features/workspaces/settings/general/workspace-leave-settings-item.tsx`
   - srovnat hooks/state/derived/form sections

8. `src/features/auth/sign-in/sign-in-form.tsx`
   - potvrdit konzistentní pořadí schema/form setupu

9. `src/features/auth/sign-up/sign-up-form.tsx`
   - přesunout `ref` nad local state
   - držet schema/form setup v jednom bloku

10. `src/features/auth/forgot-password/forgot-password-form.tsx`
    - stejné srovnání jako sign-up

11. `src/features/auth/reset-password/reset-password-form.tsx`
    - stejné srovnání schema/form setupu

12. `src/features/auth/confirm-email-change/confirm-email-change-form.tsx`
    - stejné srovnání schema/form setupu

13. `src/features/account/general/display-name-settings-item.tsx`
    - srovnat hooks/state/derived/form sekce

14. `src/features/account/general/email-change-settings-item.tsx`
    - srovnat hooks/state/derived/form sekce

15. `src/features/account/general/delete-account-settings-item.tsx`
    - srovnat hooks/state/derived/form sekce

16. `src/features/account/security/password-settings-item.tsx`
    - srovnat hooks/state/derived/form sekce

17. `src/features/account/security/your-devices-settings-item.tsx`
    - derived values `hasOtherDeviceSessions` a `isSignOutOthersDisabled` přesunout před handlers
    - zachovat akce v jedné souvislé sekci

18. `src/features/marketing/contact/contact-form.tsx`
    - přesunout `ref` nad local state
    - schema + form hook držet pod state/ref blokem

19. `src/features/marketing/contact/support-form.tsx`
    - srovnat attachment schema, state, ref, form hook a handlers

20. `src/features/marketing/newsletter/newsletter-form.tsx`
    - přesunout `ref` nad local state
    - schema + form hook držet pohromadě

### Review-only / low-priority candidates

Tyto soubory heuristika označila, ale úpravu dělat jen pokud po otevření opravdu zlepší čitelnost:

- `src/components/layout/locale-switcher.tsx`
- `src/features/application/application-layout.tsx`
- `src/components/ui/copy-button.tsx`

Poznámka:

- u `src/components/ui/copy-button.tsx` jde navíc o hook `useClipboard`, ne o business component; změna není nutná, pokud nepřinese jasně lepší flow

## Suggested Execution Plan

### Phase 1: Remove invalid client entry boundaries

1. Odebrat `"use client"` z 6 potvrzených leaf/util souborů.
2. U `post-auth-redirect.ts` zpřesnit router typ tak, aby nepřenášel zbytečně celý hook return shape.
3. Znovu spustit audit, že už neexistuje žádný exportovaný `use client` entry s běžným function propem.

### Phase 2: Normalize component setup order

1. Začít high-confidence kandidáty ve `src/features/workspaces/*`, `src/features/auth/*`, `src/features/account/*`, `src/features/marketing/*`.
2. Dělat jen lokální reorder a malé rename uvnitř souborů.
3. Nezavádět shared helpers jen kvůli deduplikaci několika řádků JSX.
4. Nerozdělovat koherentní soubory jen kvůli délce.

### Phase 3: Manual review of low-priority files

1. Otevřít review-only kandidáty.
2. Pokud je flow už čitelné top-to-bottom, nechat beze změny.
3. Pokud bude změna jen kosmetická bez jasného benefitu, neprovádět ji.

### Phase 4: Verification

1. Spustit `npm run build`.
2. Spustit `npm run lint`.
3. Zopakovat repo audit na exporty v `use client` entry souborech.
4. Udělat krátký spot-check nejdůležitějších flows:
   - sign-in
   - sign-up
   - forgot-password
   - workspace create drawer
   - invite / resend / revoke invite
   - application/auth/marketing error boundaries

## Definition of Done

Hotovo bude ve chvíli, kdy:

- v repu nebude žádný potvrzený warning tohoto typu na běžných callback props
- `use client` zůstane jen na skutečných entry pointech
- high-confidence strukturální kandidáti budou čitelné ve flow `inputs -> state -> derived values -> actions -> sync -> UI`
- nevznikne žádná nová generic abstraction vrstva, barrel ani mezivrstva jen kvůli tomuto refaktoru

## Non-goals

- nepřepisovat API callbacků na fake `*Action`
- nezavádět reducer/context infrastrukturu bez reálné potřeby
- nerozsekávat velké, ale koherentní soubory jen kvůli line count
- nedělat vizuální/UI redesign
