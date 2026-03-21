# Workspace Model — Dotažení do SaaS standardu

## Kontext

Máme Next.js template s PocketBase backendem, který umí auth, workspaces (personal + organization), device sessions, i18n a marketing web. Workspace model je funkční a architektonicky čistý — jasná separace config / server / features, přímočarý access control pattern, rozumné typy.

Chceme na tomto template stavět komerční SaaS aplikace. Aktuálně víme o dvou, obě budou používat workspaces. Než začneme stavět konkrétní app, chceme workspace model dotáhnout na úroveň, kterou očekává každý standardní SaaS — nic víc, nic míň.

## Cíl

**Workspace model na úrovni SaaS standardu** — tři role (owner / admin / member), member count na workspace response, a config fieldy pro limity. Tři konkrétní změny, které posílí template pro reálné použití.

## Filozofie

Template má být **čistý základ, ne framework**. Nemá obsahovat mrtvý kód, abstrakce pro hypotetické scénáře, ani enforcement pro limity, které nikdy nenastávají. Každá změna musí mít hodnotu sama o sobě — ne jako příprava na něco, co možná přijde.

---

## A. Přidat `admin` roli

### Současný stav

Dvě role: `owner` a `member`. Owner musí dělat všechno — spravovat členy, měnit settings, řešit billing. Není nic mezi tím. To je omezující i pro malé týmy.

### Co změnit

Zavést třetí roli `admin` — SaaS standard (Clerk, Better Auth, Vercel, GitHub Organizations).

| Oprávnění | `owner` | `admin` | `member` |
|---|---|---|---|
| Workspace settings (name, slug, avatar) | ✅ | ✅ | ❌ |
| Members — view | ✅ | ✅ | ✅ read only |
| Members — invite, remove, change role | ✅ | ✅ | ❌ |
| Billing (budoucí, v konkrétní app) | ✅ | ❌ | ❌ |
| Delete workspace | ✅ | ❌ | ❌ |
| Transfer ownership | ✅ | ❌ | ❌ |

### PocketBase změny

**Collection `workspace_members`** — rozšířit `role` select field:

```
role: "owner" | "admin" | "member"    (bylo: "owner" | "member")
```

**Collection `workspace_invites`** — rozšířit `role` select field:

```
role: "admin" | "member"              (bylo: "member")
```

Owner role se nikdy nepřiřazuje invitem — jen transferem.

### Kód

**`src/config/workspace.ts`** — aktualizovat role config:

```ts
roles: {
  memberValues: ["owner", "admin", "member"] as const,
  invitableValues: ["admin", "member"] as const,
},
```

**`src/server/workspaces/workspace-access.ts`** — přidat `requireAdminWorkspaceAccess`:

- Nová access tier: `membership.role === "owner" || membership.role === "admin"`
- Použít pro member management a workspace settings
- `requireOwnerWorkspaceAccess` zůstává pro delete workspace, transfer ownership

**`src/server/workspaces/workspace-members-service.ts`** — refaktor guards:

- `changeWorkspaceMemberRoleForCurrentUser` — vyžadovat admin access místo owner access
- `removeWorkspaceMemberForCurrentUser` — vyžadovat admin access místo owner access
- Admin nesmí měnit roli ani odebírat ownera
- Admin nesmí povýšit člena na ownera (to může jen owner přes transfer)
- `LAST_OWNER_GUARD` zůstává beze změny
- `transferWorkspaceOwnershipForCurrentUser` — zvážit downgrade starého ownera na `"admin"` místo `"member"`

**`src/server/workspaces/workspace-general-service.ts`** — refaktor guards:

- `updateWorkspaceGeneralForCurrentUser` — vyžadovat admin access místo owner access
- `deleteOrganizationWorkspaceForCurrentUser` — zůstává owner-only

**`src/server/workspaces/workspace-invite-service.ts`**:

- Invite operace (create, resend, revoke) — vyžadovat admin access místo owner access
- Invite record musí nést zvolenou roli (`admin` nebo `member`), ne hardcoded `"member"`
- Validace: nikdo nemůže pozvat s rolí vyšší než je jeho vlastní (admin nemůže pozvat jako owner)

**Typy** — aktualizovat `WorkspaceMemberRole` a `WorkspaceInviteRole` všude, kde se odvozují z PB types. Po `pocketbase:typegen` se typy propagují automaticky.

**UI**:

- Member list: zobrazit `admin` badge
- Invite form: dropdown pro výběr role (`admin` / `member`)
- Role change: dropdown s odpovídajícími hodnotami (owner může vše, admin může jen admin/member)

**i18n** — přidat label pro `admin` roli do `messages/en.json` a `messages/cs.json`.

### Odhad

~250 LoC

---

## B. `memberCount` na workspace response

### Současný stav

`UserWorkspace` typ neobsahuje počet členů. Pro zobrazení "3 members" nebo budoucí seat counting je potřeba extra query.

### Co změnit

Přidat `memberCount` do workspace response typů. Jednoduchá změna, kterou bude potřebovat každá reálná app.

### Kód

**`src/server/workspaces/workspace-types.ts`** — rozšířit `WorkspaceSummary`:

```ts
export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  kind: WorkspaceKind;
  avatarUrl: string | null;
  memberCount: number;          // ← nové
};
```

**`src/server/workspaces/workspace-repository.ts`** — přidat:

```ts
export async function countWorkspaceMembers(
  pb: PocketBase,
  workspaceId: string
): Promise<number>
```

**`src/server/workspaces/workspace-mappers.ts`** — `mapWorkspaceSummary` a `mapUserWorkspaceSummary` potřebují member count. Dvě možnosti:

1. **Eager load** — count query per workspace při `listUserWorkspaceMemberships` (N+1, ale workspaces per user budou typicky < 10)
2. **Batch count** — jeden query s group by workspace ID pro všechny workspace IDs najednou

Doporučení: začít s eager load, optimalizovat až při potřebě.

**`src/features/workspaces/workspace-types.ts`** — rozšířit `WorkspaceNavigationItem`:

```ts
export type WorkspaceNavigationItem = {
  id: string;
  slug: string;
  name: string;
  kind: "personal" | "organization";
  role: "owner" | "admin" | "member";
  avatarUrl: string | null;
  memberCount: number;          // ← nové
};
```

### Odhad

~80 LoC

---

## C. Limit config fieldy

### Současný stav

`workspaceConfig.limits` obsahuje validační limity (name length, slug length, avatar size). Neobsahuje business limity na počet workspaces nebo členů.

### Co změnit

Přidat dva config fieldy s `null` defaultem (unlimited). Žádný enforcement kód — ten přijde v konkrétní app, kde bude limit pravděpodobně dynamický, ne statický z configu.

### Kód

**`src/config/workspace.ts`** — rozšířit limits:

```ts
export const workspaceConfig = {
  limits: {
    nameMaxLength: 32,
    slugMaxLength: 48,
    avatarMaxSizeBytes: 1024 * 1024,
    maxWorkspacesPerUser: null as number | null,       // ← nové
    maxMembersPerWorkspace: null as number | null,     // ← nové
  },
  // ...
} as const;
```

Tím vznikne jedno centrální místo, kde konkrétní app nastaví výchozí limity, případně je nahradí dynamickými hodnotami.

### Proč ne enforcement kód

- V template budou limity vždy `null` → enforcement kód nikdy neprojede → mrtvý kód
- Enforcement vyžaduje nové error codes, i18n messages a UI error states pro chyby, které v template nenastávají
- V reálné app bude enforcement pravděpodobně dynamický, ne statický if-check nad configem — takže by se ten kód stejně přepsal

### Odhad

~10 LoC

---

## Souhrn PocketBase změn

### Collection `workspace_members`

| Field | Změna |
|---|---|
| `role` | Rozšířit select values: `"owner"` \| `"admin"` \| `"member"` (bylo `"owner"` \| `"member"`) |

### Collection `workspace_invites`

| Field | Změna |
|---|---|
| `role` | Rozšířit select values: `"admin"` \| `"member"` (bylo `"member"`) |

### Žádné nové collections

Template nepřidává žádné nové collections.

---

## Co jsme záměrně vynechali

| Věc | Důvod |
|---|---|
| **Limit enforcement kód** | Mrtvý kód v template (limity jsou `null`). Enforcement přijde v konkrétní app. |
| **Active workspace na session** | Cookie `active_workspace` stačí. |
| **Invite soft-delete / audit trail** | Pro template zbytečné, hard-delete stačí. |

---

## Pořadí prací

1. **A — Admin role** (PB schema change → typegen → server guards → invite refaktor → UI → i18n)
2. **B — memberCount** (repository → mappers → typy → UI)
3. **C — Config fieldy** (dva řádky v `workspaceConfig`)

A by mělo jít první, protože B potřebuje aktualizované typy (role `"admin"` v `WorkspaceNavigationItem`). C je nezávislé.

Po A: spustit `npm run pocketbase:typegen` pro regeneraci typů.

---

## Celkový odhad

| Sekce | LoC |
|---|---|
| A. Admin role | ~250 |
| B. Member count | ~80 |
| C. Config fieldy | ~10 |
| **Celkem** | **~340** |

Tři konkrétní změny, žádný mrtvý kód, žádné abstrakce pro hypotetickou budoucnost.