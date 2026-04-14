# Produkční checklist pro kancelářské testování

Použití: otevřít produkční doménu `<DOMÉNA>` a projít níže uvedené flows. Cíl je ověřit auth, account, workspace management, role a invite flows v reálném provozu. Placeholder obsah v overview lze ignorovat, tady jde hlavně o funkčnost.

## Doporučený setup pro každého testera

- [ ] Testuji na produkci `<DOMÉNA>`.
- [ ] Mám aspoň 2 e-mailové adresy, ideálně 3:
  - účet A = hlavní účet / owner
  - účet B = druhý účet / admin nebo member
  - účet C = účet pro invite edge cases
- [ ] Aspoň jednou to zkusím na mobilu.
- [ ] Aspoň jednou to zkusím v desktop browseru.
- [ ] U kritických flows zkusím i druhý browser nebo anonymní okno.
- [ ] Nepoužívám citlivá reálná data, jen testovací obsah.

## Co mi pak máte vrátit

- [ ] Co prošlo bez problému
- [ ] Co bylo rozbité nebo matoucí
- [ ] Na čem jste to testovali: zařízení + browser
- [ ] Screenshot nebo krátké video u každé chyby
- [ ] U každé chyby popsat přesně kroky, co jste čekali a co se stalo

## 1. Auth a onboarding

- [ ] Vytvořím nový účet přes sign-up.
- [ ] Dorazí verifikační e-mail a jde z něj účet ověřit.
- [ ] Po ověření se můžu přihlásit.
- [ ] Odhlásím se a znovu se přihlásím stejným účtem.
- [ ] Zkusím přihlášení se špatným heslem a chyba je srozumitelná.
- [ ] Zkusím registraci na už existující e-mail a chyba je srozumitelná.
- [ ] Zkusím „Zapomenuté heslo“, dorazí reset e-mail a jde nastavit nové heslo.
- [ ] Po resetu hesla staré heslo nefunguje a nové ano.
- [ ] Zkusím otevřít chráněnou stránku bez přihlášení a aplikace mě pošle na sign-in.
- [ ] Zkusím neověřený účet: přihlášení mě vede na verify email flow, ne do aplikace.
- [ ] Zkusím z verify-email flow znovu odeslat verifikační e-mail.

## 2. Account -> Profil

- [ ] Otevřu `Account`.
- [ ] Nahraju avatar.
- [ ] Změním avatar za jiný obrázek.
- [ ] Avatar zase odeberu.
- [ ] Změním display name a změna se projeví v UI.
- [ ] Zkusím změnu e-mailu na nový e-mail.
- [ ] Na nový e-mail dorazí potvrzovací odkaz.
- [ ] Po potvrzení už nejde přihlášení starým e-mailem.
- [ ] Po potvrzení jde přihlášení novým e-mailem.

## 3. Account -> Preferences

- [ ] Otevřu `Account > Preferences`.
- [ ] Změním jazyk aplikace a zůstanu na odpovídající stránce.
- [ ] Proklikám alespoň jednu další stránku a jazyk zůstane konzistentní.
- [ ] Změním theme na light.
- [ ] Změním theme na dark.
- [ ] Změním theme na system.
- [ ] Theme se po refreshi zachová.
- [ ] Pokud je vidět cookie settings, otevřu je a změním preference.

## 4. Account -> Security

- [ ] Otevřu `Account > Security`.
- [ ] Změním heslo po zadání aktuálního hesla.
- [ ] Po změně hesla mě aplikace odhlásí nebo vrátí na sign-in flow.
- [ ] Přihlášení starým heslem už nefunguje.
- [ ] Přihlášení novým heslem funguje.
- [ ] Přihlásím se na druhém zařízení nebo v druhém browseru.
- [ ] Na hlavním zařízení vidím oba device sessions.
- [ ] Odhlásím konkrétní jiné zařízení a ten session zmizí.
- [ ] Znovu vytvořím druhý session a otestuji `Sign out all other devices`.
- [ ] Opravdu zůstane přihlášené jen aktuální zařízení.

## 5. Osobní scope a založení workspace

- [ ] Po přihlášení se dostanu do osobního scope `/app`.
- [ ] Scope switcher funguje a umí zůstat v `Personal`.
- [ ] Z personal scope založím nový workspace.
- [ ] Po vytvoření skončím ve správném workspace overview.
- [ ] Vrátím se přes scope switcher zpět do `Personal`.
- [ ] Znovu se přepnu do workspace a funguje to bez chyby.

## 6. Workspace -> General settings

- [ ] Otevřu `Workspace > Settings`.
- [ ] Změním název workspace.
- [ ] Změním URL / slug workspace.
- [ ] Po změně slugu skončím na nové URL.
- [ ] Stará URL se nechová rozbitě a nevede do loopu.
- [ ] Nahraju workspace avatar.
- [ ] Změním workspace avatar.
- [ ] Workspace avatar odeberu.

## 7. Workspace -> Members a permissions

- [ ] Otevřu `Workspace > Settings > Members`.
- [ ] Jako owner nebo admin mohu pozvat dalšího člověka.
- [ ] Mohu vybrat roli pozvánky `admin` nebo `member`.
- [ ] Po vytvoření pozvánky ji vidím mezi pending invites.
- [ ] Mohu z pending invite zkopírovat invite link.
- [ ] Mohu invite znovu odeslat.
- [ ] Mohu invite zrušit / odebrat.
- [ ] Jako owner nebo admin mohu změnit roli existujícímu členovi.
- [ ] Jako owner nebo admin mohu odebrat existujícího člena.
- [ ] Jako member vidím members page pouze read-only.
- [ ] Jako member nemohu posílat invites ani měnit role.

## 8. Invite flows

- [ ] Pošlu pozvánku na účet B a přijmu ji z e-mailu, když nejsem přihlášený.
- [ ] Po přijetí pozvánky skončím ve správném workspace.
- [ ] Otevřu invite link už jako existující member a aplikace mě nenechá ustrnout v divném stavu.
- [ ] Otevřu invite link pod špatným účtem a dostanu srozumitelnou informaci o mismatchi.
- [ ] Po odhlášení a přihlášení správným účtem jde v invite flow pokračovat.
- [ ] Zkusím invite flow s neověřeným účtem a po ověření se vrátím zpět do invite flow.
- [ ] Zkusím neplatný nebo expirovaný invite a stav je srozumitelný.

## 9. Leave, transfer ownership, remove member, delete workspace

- [ ] Jako member opustím workspace a přijdu o přístup.
- [ ] Zkusím otevřít původní workspace URL po opuštění a nedostanu se dovnitř.
- [ ] Jako owner přidám druhého ownera.
- [ ] Původní owner potom workspace opustí a vše projde korektně.
- [ ] Poslední owner nemá možnost workspace opustit.
- [ ] Poslední owner nemá možnost zrušit vlastnictví tak, aby ve workspace nezůstal žádný owner.
- [ ] Jako owner smažu workspace a aplikace mě vrátí bezpečně zpět do personal scope.
- [ ] Po smazání nejde stará workspace URL normálně otevřít.

## 10. Account deletion

- [ ] U účtu bez vlastnictví workspace jde účet smazat.
- [ ] Po smazání účtu dojde k odhlášení a účet už nejde použít.
- [ ] Pokud jsem poslední owner nějakého workspace, smazání účtu je zablokované srozumitelnou hláškou.

## 11. Mobilní smoke test

- [ ] Sign-up / sign-in je pohodlně použitelný na mobilu.
- [ ] Account pages jsou na mobilu použitelné bez rozbitého layoutu.
- [ ] Workspace settings jsou na mobilu použitelné bez rozbitého layoutu.
- [ ] Members a pending invites jdou ovládat i na mobilu.
- [ ] Invite flow z e-mailu je na mobilu funkční od otevření odkazu až po acceptance.

## 12. Co sledovat během testování

- [ ] Nečekané odhlášení
- [ ] Nekonečné loadingy
- [ ] Redirect loopy
- [ ] Nesprávný aktivní workspace po přijetí invite nebo po switchi scope
- [ ] Nesoulad mezi desktop a mobilem
- [ ] Nesrozumitelné texty, tlačítka nebo stavy
- [ ] Cokoli, co vypadá „technicky správně“, ale uživatelsky matoucně

## Krátký feedback formát

Použijte prosím u každého nálezu tento formát:

- Flow:
- Zařízení + browser:
- Účet / role:
- Kroky:
- Očekávaný výsledek:
- Skutečný výsledek:
- Screenshot / video:

## Doporučení k rozdělení v kanceláři

- Člověk 1: auth + account + security
- Člověk 2: workspace creation + general settings
- Člověk 3: invites + members + role changes
- Člověk 4: mobilní průchod a UX feedback
- Člověk 5: edge cases se špatným účtem, expirovaným invite a posledním ownerem
