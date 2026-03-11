# Finální Feature Checklist (End-to-End kontrola)

Použití: odškrtávej položky postupně při implementaci/verifikaci. Každá položka obsahuje flow a očekávaný výsledek.

## 1) Data a kontrakty
- [ ] Flow: PocketBase kolekce `workspaces`, `workspace_members`, `workspace_invites` existují a odpovídají schématu. | Očekávaný výsledek: Všechna pole jsou správně nastavená a používaná backendem bez runtime workaroundů.
- [ ] Flow: DB indexy a unique constraints jsou aplikované (slug, workspace+user, token_hash, workspace+email). | Očekávaný výsledek: Nevznikají duplicitní workspace/membership/invite záznamy.
- [ ] Flow: PocketBase rules odpovídají schválenému baseline. | Očekávaný výsledek: Přístupová pravidla jsou vynucená na DB vrstvě.
- [ ] Flow: Spuštěn `npm run pocketbase:typegen`. | Očekávaný výsledek: `src/types/pocketbase.ts` je aktuální vůči kolekcím.
- [ ] Flow: Workspace API vrací jednotný `WorkspaceResponse` (`ok: true/false`) a stabilní `errorCode`. | Očekávaný výsledek: UI řeší chyby jen přes `errorCode`, bez parsování textu.

## 2) Auth plugin + bootstrap
- [ ] Flow: Uživatel dokončí `sign-up`. | Očekávaný výsledek: Auth flow je úspěšný, bez workspace regresí.
- [ ] Flow: Uživatel jde po auth na `/overview`. | Očekávaný výsledek: `ensurePersonalWorkspace` proběhne idempotentně a dojde k redirectu na `/w/[workspaceSlug]/overview`.
- [ ] Flow: Post-auth hook zpracuje pending invite. | Očekávaný výsledek: Invite se buď bezpečně zkonzumuje, nebo vrátí explicitní status (`none/consumed/email_mismatch/invalid_or_expired/transient_error`).
- [ ] Flow: Hook vrátí `transient_error`. | Očekávaný výsledek: `sign-in/sign-up` zůstane `ok: true` (fail-open), jen se zaloguje warning.
- [ ] Flow: Pending invite je `email_mismatch` nebo `invalid_or_expired`. | Očekávaný výsledek: `pending_invite_hash` cookie se vždy smaže.

## 3) Workspace lifecycle
- [ ] Flow: První vstup uživatele bez workspace. | Očekávaný výsledek: Vytvoří se právě jeden personal workspace.
- [ ] Flow: Paralelní requesty volají `ensurePersonalWorkspace`. | Očekávaný výsledek: Nevznikne více personal workspace pro jednoho uživatele.
- [ ] Flow: Vytvoření organization workspace se stejným názvem/sluhem. | Očekávaný výsledek: Aplikuje se suffix policy `-2`, `-3`, ... (max 10 pokusů).
- [ ] Flow: Pokus použít reserved slug (`overview`, `settings`, `account`, `api`, `invite`, `sign-in`, `sign-up`, `sign-out`). | Očekávaný výsledek: Request je zamítnut validační chybou.
- [ ] Flow: `active_workspace` cookie ukazuje na nedostupný workspace. | Očekávaný výsledek: Systém přepne na validní fallback (valid cookie workspace -> personal -> první dostupný).
- [ ] Flow: Uživatel chce smazat nebo opustit personal workspace. | Očekávaný výsledek: Akce je zablokovaná serverovým guardem.

## 4) Members + ownership
- [ ] Flow: Owner načte members list. | Očekávaný výsledek: Vidí korektní seznam členů pro vybraný workspace.
- [ ] Flow: Owner změní roli člena. | Očekávaný výsledek: Role se aktualizuje a UI se refreshne bez nekonzistence.
- [ ] Flow: Pokus degradovat posledního ownera. | Očekávaný výsledek: Akce je blokována (`LAST_OWNER_GUARD`).
- [ ] Flow: Owner odebere člena nebo člen opustí workspace. | Očekávaný výsledek: Oprávněné akce projdou, neoprávněné selžou bez leaků.
- [ ] Flow: Ownership transfer (`promote target -> demote source`). | Očekávaný výsledek: Nikdy nevznikne stav bez ownera.
- [ ] Flow: Demote krok při transferu selže po úspěšném promote. | Očekávaný výsledek: Vrátí se `OWNERSHIP_TRANSFER_PARTIAL`, workspace zůstane bezpečně se 2 ownery.

## 5) Invite flow
- [ ] Flow: Owner vytvoří invite. | Očekávaný výsledek: Vznikne pozvánka s `token_hash` (raw token se nikam neukládá).
- [ ] Flow: Owner dá resend invite dřív než za 60 sekund. | Očekávaný výsledek: Akce je rate-limited (`RATE_LIMITED`).
- [ ] Flow: Owner revoke invite. | Očekávaný výsledek: Pozvánka je zneplatněna a dál nejde přijmout.
- [ ] Flow: Guest otevře `/invite/[token]`. | Očekávaný výsledek: Uloží se `pending_invite_hash` a proběhne redirect na `/sign-in`.
- [ ] Flow: Přihlášený uživatel přijme validní invite se stejným e-mailem. | Očekávaný výsledek: Vznikne membership idempotentně, invite se spotřebuje a uživatel jde do cílového workspace.
- [ ] Flow: Přihlášený uživatel přijme invite s jiným e-mailem. | Očekávaný výsledek: Invite se nepřijme, vrátí se `INVITE_EMAIL_MISMATCH`.

## 6) Routing + UI wiring
- [ ] Flow: Přístup přes `/overview`. | Očekávaný výsledek: Vždy redirect do konkrétního `/w/[workspaceSlug]/overview`.
- [ ] Flow: Přístup na `/w/[workspaceSlug]/settings` a `/settings/members`. | Očekávaný výsledek: Server validuje membership, cizí workspace není přístupný.
- [ ] Flow: Staré cesty `/w/workspace/*`. | Očekávaný výsledek: Jsou odstraněné a nikde se nepoužívají.
- [ ] Flow: Workspace switcher přepne workspace. | Očekávaný výsledek: Zavolá `POST /api/workspaces/switch`, nastaví `active_workspace` a navigace se přepne na nový slug.
- [ ] Flow: Settings UI (general/members/invites). | Očekávaný výsledek: Běží nad reálným API, bez mock dat.
- [ ] Flow: Workspace UI copy a error messages. | Očekávaný výsledek: Žádné hardcoded user-facing stringy mimo `messages/en.json` a `messages/cs.json`.

## 7) Security + provoz
- [ ] Flow: Mutační endpoint bez validního `Origin`. | Očekávaný výsledek: Vrací `400 BAD_REQUEST`.
- [ ] Flow: Neautorizovaný přístup na workspace endpointy. | Očekávaný výsledek: `403/404` bez potvrzení existence cizího workspace.
- [ ] Flow: Audit kritických akcí (invite create/revoke/accept, role change, workspace delete). | Očekávaný výsledek: Akce jsou zalogované bez úniku tokenů/hashů.
- [ ] Flow: Logování citlivých dat. | Očekávaný výsledek: Raw token ani `token_hash` se nikdy neobjeví v logu.

## 8) Testy + rollout
- [ ] Flow: Unit testy `workspace-service` a `workspace-invite-service`. | Očekávaný výsledek: Pokrývají happy path i edge casy.
- [ ] Flow: API integration testy workspace mutací. | Očekávaný výsledek: Pokryté create/switch/leave/delete/invite/role/transfer flow.
- [ ] Flow: E2E scénáře (signup bootstrap, switch, invite cold flow, mismatch, last-owner, personal restrictions). | Očekávaný výsledek: Všechny kritické uživatelské cesty jsou zelené.
- [ ] Flow: Security test cross-origin mutací. | Očekávaný výsledek: `POST/PATCH/DELETE` na workspace API vrací `400`.
- [ ] Flow: Auth regression testy (`sign-in/sign-up/sign-out/session`). | Očekávaný výsledek: Vše zelené i se zapnutým workspace pluginem.
- [ ] Flow: Rollout po etapách (backend za flagem -> overview/routing -> settings mutace). | Očekávaný výsledek: Nasazení je postupné a reverzibilní.
- [ ] Flow: Rollback workspace feature flagu. | Očekávaný výsledek: Rychlý návrat bez dopadu na auth endpointy.

## Finální release gate
- [ ] Flow: Kontrola všech bodů tohoto checklistu. | Očekávaný výsledek: 100% pokrytí scope původního plánu před produkčním release.
