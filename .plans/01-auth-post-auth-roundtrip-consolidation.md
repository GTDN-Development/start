# Task 1: Konsolidovat post-auth roundtrip a destination policy

Date: 2026-03-25
Priority: P1

Tento task vznikl jako syntéza všech tří auditů a byl ověřený v aktuálním kódu.
Je to nejvyšší priorita, protože stejné rozhodnutí "kam má uživatel po auth boundary pokračovat"
je dnes rozdělené mezi více míst a protected deep link intent se po cestě ztrácí.

## Proč je to důležité

- `src/proxy.ts` dnes pošle odhlášeného uživatele na sign-in bez přenesení původní destination.
- `src/server/workspaces/workspace-resolution-service.ts` vrací jen `invite_redirect` nebo `app`.
- `src/features/auth/post-auth-redirect.ts`, `src/features/auth/actions/auth-actions.ts` a
  `src/app/[locale]/(auth)/(flow)/verify-email/page.tsx` stále branchují i na
  `workspace_redirect`, takže v kódu zůstaly mrtvé nebo nedotažené větve.
- Guest auth layout, verify-email flow, invite handoff a post-auth helper dnes nepoužívají jednu
  explicitní politiku s jedním pořadím priorit.

## Cíl

Zavést jeden kanonický server-side rozhodovací bod pro post-auth destination a jeden explicitní
roundtrip přes auth boundary pro:

- protected deep link
- invite handoff
- sign-in / sign-up follow-up
- verify-email
- confirm-email-change

## Scope

- Zavést first-class auth intent handoff místo slepého redirectu na sign-in z `src/proxy.ts`.
- Sjednotit post-auth rozhodování do jednoho resolveru nebo jednoho úzkého orchestration helperu.
- Odstranit `workspace_redirect` z typů a call sites, pokud už není reálný use case.
- Přesměrovat `src/features/auth/post-auth-redirect.ts`,
  `src/features/auth/actions/auth-actions.ts`,
  `src/app/[locale]/(auth)/(flow)/verify-email/page.tsx` a
  `src/app/[locale]/(auth)/(guest)/layout.tsx` na stejnou politiku.
- Zachovat invite flow jako first-class scénář, ale s explicitní a čitelnou precedence politikou.
- Doplnit regresní coverage pro nejrizikovější roundtripy.

## Acceptance Criteria

- Protected route -> sign-in -> návrat na původní destination funguje deterministicky.
- Invite -> auth -> invite -> accept -> workspace zůstává funkční a nejede přes paralelní logiku.
- Verify-email a confirm-email-change končí přes stejný post-auth resolver jako sign-in.
- V kódu zůstává jen jedna explicitní politika pro post-auth destination.
- Žádný runtime branch už nečeká na `workspace_redirect`, pokud tento stav není skutečně vracený.

## Hlavní soubory

- `src/proxy.ts`
- `src/features/auth/auth-proxy.ts`
- `src/features/auth/post-auth-redirect.ts`
- `src/features/auth/actions/auth-actions.ts`
- `src/app/[locale]/(auth)/(guest)/layout.tsx`
- `src/app/[locale]/(auth)/(flow)/verify-email/page.tsx`
- `src/server/workspaces/workspace-resolution-service.ts`
- `src/server/workspaces/workspace-types.ts`

## Guardrails

- Nevytvářet generic redirect engine nebo policy registry.
- Nepřepisovat invite doménový model, pokud problém leží jen v orchestration vrstvě.
- Držet řešení v KISS stylu: jeden jasný resolver, přímé call sites, minimum mezivrstev.
