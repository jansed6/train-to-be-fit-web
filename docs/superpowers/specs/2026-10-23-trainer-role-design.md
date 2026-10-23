# Trénerská rola — návrh

**Dátum:** 2026-10-23 · **Stav:** návrh na schválenie

Náhľady obrazoviek, na ktorých sme sa dohodli, sú v
[`2026-10-23-trainer-role/`](2026-10-23-trainer-role/):

- `trainer-progress.html`: prehľad klienta (vľavo) a detail tréningu. Zvolená je
  **verzia A, karty cvikov**.
- `trainer-plan-editor.html`: zadávanie cieľov v pláne. Zvolená je **verzia B,
  váha pre každú sériu**. Vpravo je aj to, čo klient uvidí pri tréningu.

Náhľady sú drôtené modely. Popisky v nich sú po slovensky, ale v aplikácii budú
po anglicky (pozri Obmedzenia).

## Prečo

Eduard chce zostavovať tréningové plány iným ľuďom, najprv manželke a neskôr
komukoľvek. Plán vznikne priamo v ich vlastnom účte a má odporúčané série,
opakovania aj váhy. Potom chce sledovať, či podľa neho cvičia: koľko tréningov
mali, aké váhy pri každom tréningu išli a či niečo nevynechali.

Dnes je aplikácia čisto pre jedného človeka. Každý vidí iba svoje plány a
tréningy a plán nepozná odporúčanú váhu.

## Ciele

1. Trénerom sa môže stať ktokoľvek. Klienta pozve cez jeho email a klient to v
   aplikácii potvrdí.
2. Tréner vytvára, upravuje a maže plány v účte klienta. Cviky berie z katalógu
   alebo pridá vlastné a pre **každú sériu** nastaví cieľové opakovania a váhu.
3. Klient cvičí podľa plánu ako doteraz. Polia sú vopred vyplnené cieľom od
   trénera, klient ich potvrdí alebo prepíše tým, čo naozaj zvládol.
4. Tréner vidí prehľad klienta:
   - koľko tréningov mal,
   - zoznam tréningov so stavom „podľa plánu / niečo nesedelo“,
   - detail každého tréningu, kde je plán porovnaný s realitou,
   - grafy progresu pri cvikoch.

**Úspech:** Eduard pozve manželku a zostaví jej plán s váhami pre jednotlivé
série. Ona podľa neho odcvičí a on potom v jej profile vidí, koľko tréningov
mala a pri ktorom cviku išla nižšie alebo ho vynechala.

## Mimo rozsahu (v1)

- Správy, chat, komentáre a poznámky trénera k cvikom.
- Emailové notifikácie. Pozvánka sa zobrazí iba v aplikácii.
- Viac trénerov naraz pre jedného klienta.
- Týždenný cieľ, rozvrh a kalendár. Aplikácia nevie, koľkokrát týždenne má
  klient cvičiť.
- Automatické zvyšovanie váh (progresia).
- Úprava alebo mazanie odcvičených tréningov klienta trénerom.
- Cviky na čas (napr. plank v sekundách). Logujú sa naďalej váha × opakovania.
- Platby a predplatné.

## Čo sa nesmie stať (anti-goals)

- Dáta klienta uvidí niekto iný než jeho **aktuálny** tréner.
- Trénerove vlastné dáta sa zmiešajú s dátami klientov. Týka sa to jeho zoznamu
  plánov, histórie, štatistík na Home, grafov progresu aj predvypĺňania váh.
- Klient zmení alebo zmaže plán od trénera, a to ani obídením UI priamo cez
  databázové API.
- Neskoršia úprava plánu zmení porovnanie „plán vs. realita“ pri už odcvičených
  tréningoch.
- Existujúce plány alebo tréningy prestanú fungovať, prípadne sa stratia.

## Súčasný stav (z čoho sa vychádza)

- Next.js 14 (App Router) a Tailwind. Všetko beží na klientovi cez
  `@supabase/supabase-js` s publishable/anon kľúčom. Žiadny vlastný server ani
  API routes. Prístup stráži Row-Level Security.
- Tabuľky `plans` a `sessions` (pozri `supabase/schema.sql`) majú stĺpce
  `id`, `user_id` a `data jsonb` (celý dokument v tvare z `lib/types.ts`).
  Politiky sú „own“ (`auth.uid() = user_id`).
- **Pozor:** dotazy v `lib/repo.ts` (`getAllPlans`, `getAllSessions`, …)
  nefiltrujú podľa `user_id` a spoliehajú sa iba na RLS. Keď tréner dostane
  právo čítať dáta klienta, tieto dotazy mu ich vrátia spolu s jeho vlastnými.
- Plán: `Exercise { sets: number; reps: string; catalogId?; … }`. Opakovania sú
  text, aby prežili rozsahy ako „8-10“. Váha v pláne zatiaľ nie je.
- Tréning (`WorkoutSession`) si pamätá iba `planDayName`, odkaz na plán ani deň
  nemá. `useActiveWorkout.finish()` zahodí cviky bez zalogovanej série, takže
  vynechaný cvik dnes po tréningu nezanechá žiadnu stopu.
- `finish()` uloží **každú** sériu s platnou váhou a opakovaniami (`isValidRow`)
  bez ohľadu na to, či je odškrtnutá (`done`). Takto sa uložia aj série, ktoré
  sú iba sivo predvyplnené a nikto sa ich nedotkol. Zmena je v bode 4.
- Predvyplnenie pri tréningu (`useActiveWorkout.prefilledRows`):
  - opakovania sú prvé číslo z cieľa plánu,
  - váhy sú po sériách z posledného tréningu, ktorý daný pohyb obsahoval
    (párovanie cez `catalogId` alebo normalizovaný názov),
  - pri cvikoch s vlastnou váhou (bodyweight) je predvolená 0.
- Počas tréningu sa dajú cviky preusporiadať, odstrániť aj pridať. Plán sa tým
  nemení.
- Grafy progresu (`lib/progress.ts`, `/progress/[slug]`) sa počítajú zo
  zoznamu tréningov.
- Týždeň na Home začína pondelkom (`startOfWeekMs` v `app/page.tsx`).
- Navigácia: dole `NavBar` (mobil) a hore `TopNav` (desktop), obe s položkami
  Home a History.
- Zmeny schémy sa robia ručne: SQL sa spustí v Supabase SQL editore. Migrácie
  ani Supabase CLI sa nepoužívajú.
- Automatické testy v repozitári nie sú.

## Obmedzenia

- Ostávame pri súčasnom stacku: Next.js, Supabase, bez vlastného servera.
  Logika, ktorú klient nesmie obísť, patrí do databázy (RLS politiky alebo
  `security definer` funkcie volané cez RPC).
- Bezpečnostné pravidlá musí vynútiť databáza. Skrytie tlačidla v UI nestačí.
- Zmeny schémy sa dodajú ako SQL na spustenie v Supabase SQL editore a doplnia
  sa do `supabase/schema.sql`. Kde sa dá, nech je SQL idempotentné. Eduard ho
  spustí ručne, preto ho treba na to výslovne upozorniť.
- UI texty sú po anglicky ako zvyšok aplikácie. Slovenské názvy cvikov z
  katalógu zostávajú.
- Doterajšie plány a tréningy musia fungovať ďalej bez ručného zásahu do dát.

## Ako to má fungovať

### 1. Spojenie tréner – klient

- V navigácii (`NavBar` aj `TopNav`) pribudne položka **Clients** pre každého
  používateľa. Cez ňu sa človek stáva trénerom.
- Tréner zadá email klienta a voliteľne meno, pod ktorým ho chce vidieť
  (napr. „Manželka“). *[moja voľba: voliteľné meno]* Bez mena sa zobrazuje email.
- Klient ešte nemusí mať účet. Pozvánka čaká a spáruje sa s ním podľa emailu,
  keď sa prihlási. Email sa porovnáva bez ohľadu na veľké a malé písmená.
- Klient vidí čakajúcu pozvánku v aplikácii, napr. ako pruh na Home. Pri nej je
  uvedené, kto ho pozýva (email trénera), a môže ju **prijať** alebo
  **odmietnuť**.
- Tréner môže čakajúcu pozvánku zrušiť.
- Klient má naraz najviac **jedného** aktívneho trénera. Ak už trénera má, novú
  pozvánku prijať nemôže, kým súčasné spojenie neukončí. Aplikácia mu to
  vysvetlí. *[moja voľba]*
- Tréner môže mať ľubovoľný počet klientov.
- Role sa nevylučujú: tréner môže byť zároveň klientom niekoho iného a stále
  cvičí aj sám pre seba.
- Spojenie môže **ukončiť** ktorákoľvek strana. Potom:
  - tréner okamžite stráca prístup ku všetkým dátam klienta,
  - plány, ktoré tréner klientovi vytvoril, ostanú klientovi ako jeho vlastné a
    klient ich môže odvtedy meniť aj mazať.

### 2. Plány od trénera

- Plán od trénera patrí klientovi, teda je v jeho účte. Navyše si pamätá, ktorý
  tréner ho zostavil.
- U klienta sa zobrazuje v zozname plánov na Home s označením „from your
  trainer“. Klient ho môže používať, ale **nemôže ho upraviť ani zmazať**. UI
  tieto akcie skryje a databáza ich odmietne.
- Tréner plány klienta vytvára, upravuje a maže z profilu klienta. Používa na to
  ten istý editor ako dnes (`PlanEditor` / `DayEditor` / `ExercisePicker`),
  rozšírený o ciele pre každú sériu (bod 3).
- Klient si naďalej môže robiť vlastné plány a pridávať si štartovacie plány.
- Úpravy počas tréningu (preusporiadanie, odstránenie a pridanie cviku) ostávajú
  klientovi. Sú súčasťou záznamu tréningu, plán nemenia.

### 3. Ciele pre každú sériu (zvolená verzia B)

- Každý cvik v pláne má zoznam sérií. Každá séria má:
  - **cieľové opakovania**, ako text kvôli rozsahom „8-10“,
  - **voliteľnú cieľovú váhu v kg**, desatinné hodnoty ako 27,5 sú povolené.
- V editore sa séria pridá tlačidlom „+ Add set“ a dá sa aj odobrať.
- Platí to pre **všetky** plány, aj pre tie, ktoré si človek robí sám pre seba.
  Váha je vždy nepovinná. *[moja voľba]*
- Staré plány (`sets` + `reps`, bez váhy) fungujú ďalej. V editore sa ukážu ako
  N rovnakých sérií s danými opakovaniami a prázdnou váhou.

### 4. Tréning podľa plánu

- Predvyplnenie každej série má toto poradie:
  1. cieľ z plánu (váha a opakovania danej série), ak je zadaný,
  2. inak váha z posledného tréningu daného pohybu (dnešné správanie),
  3. inak 0 pri cvikoch s vlastnou váhou, prípadne prázdne pole.

  Predvyplnené hodnoty sú sivé ako dnes.
- **Uložia sa iba odškrtnuté série (✓).** Rozhodol Eduard. Platí to pre všetky
  tréningy všetkých používateľov, aj pre tie, ktoré si človek robí sám pre
  seba. Vyplnené, ale neodškrtnuté série sa po ukončení zahodia. Cvik bez
  jedinej odškrtnutej série sa ráta ako vynechaný.
  - Pred uložením tréningu, v ktorom ostali neodškrtnuté série, sa aplikácia
    opýta, napr. „3 sets aren't ticked — finish anyway?“. Ponúkne pokračovanie
    v tréningu alebo ukončenie.
  - Bez tohto pravidla by sa sivo predvyplnené ciele trénera uložili ako
    splnené a porovnanie s plánom by neplatilo.
  - Vedľajší efekt, ktorý je žiaduci: z histórie, grafov a predvypĺňania
    zmiznú série, ktoré sa naozaj necvičili.
  - Staré tréningy sa nemenia.
- Pri cviku je viditeľný cieľ, napr. `Target 3 × 10 · 25 kg`. Ak sa série
  líšia, ukáže sa skrátená podoba, napr. `12/10/8 · 20–27,5 kg`.
- **Každý nový tréning** (podľa akéhokoľvek plánu, nielen trénerovho) si uloží:
  - z ktorého plánu a dňa vznikol,
  - **snímku cieľov** všetkých cvikov dňa v podobe, akú mali v čase tréningu,
    vrátane cvikov, pri ktorých nezaloguje ani jednu sériu. Vďaka tomu sa dá
    zistiť vynechanie a neskoršia úprava plánu nezmení porovnanie,
  - označenie cvikov, ktoré pridal až počas tréningu.
- Staré tréningy snímku nemajú. Zobrazujú sa ako dnes, bez porovnania s plánom.

### 5. Prehľad klienta pre trénera

Pozri `trainer-progress.html`, ľavý telefón.

- **Clients** obsahuje zoznam klientov a čakajúcich pozvánok, tlačidlo na
  pozvanie a pri každom klientovi možnosť ukončiť spojenie.
- **Profil klienta** obsahuje:
  - Hlavičku s menom alebo emailom klienta a názvami plánov od trénera.
  - Dve dlaždice: počet tréningov **tento týždeň** (pondelok až nedeľa, rovnako
    ako na Home) a počet za **posledných 30 dní**. Porovnanie s cieľom typu
    „2 / 3“ tam nebude. *[moja voľba, aplikácia cieľ nepozná]*
  - Pás aktuálneho týždňa Po až Ne s bodkou pri dni, keď cvičil. Ak tréning
    nesedel s plánom, bodka je odlíšená.
  - Zoznam **všetkých** tréningov klienta od najnovšieho, teda aj tých z jeho
    vlastných plánov. Pri každom je dátum, názov dňa, trvanie a stav:
    - „✓ all to plan“: všetky plánované cviky aj série splnené,
    - „N skipped“: N plánovaných cvikov bez jedinej zalogovanej série,
    - „below target on N“: pri N cvikoch bola niektorá séria pod cieľom alebo
      chýbala.

    Tréning bez snímky cieľov stav nemá. Presné znenie textov nechávam na
    staviteľovi.
  - Tlačidlá **Edit plan**, ktoré otvorí editor plánov klienta, a **Exercise
    progress** s grafmi progresu cvikov počítanými z tréningov klienta.
    Grafy sú rovnaké ako dnešné `/progress`.

### 6. Detail tréningu — karty cvikov (zvolená verzia A)

Pozri `trainer-progress.html`, verzia A.

- Pri každom plánovanom cviku je karta s názvom, riadkom cieľa
  (`Plan: 3 × 10 · 25 kg` alebo po sériách) a pod ním čipy so zalogovanými
  sériami (`25 kg × 10`).
- Séria **pod cieľom** má čip zvýraznený varovnou farbou. Je to séria, ktorá má
  oproti zodpovedajúcej plánovanej sérii nižšiu váhu alebo menej opakovaní.
  - Pri rozsahu opakovaní sa porovnáva s dolnou hranicou.
  - Bez cieľovej váhy sa porovnávajú iba opakovania.
  - Plánované série, ktoré sa vôbec neodcvičili, sú viditeľne naznačené ako
    chýbajúce. *[moja voľba]*
- Viac, než bol cieľ (vyššia váha, viac opakovaní alebo sérií), sa ako problém
  **neoznačuje**.
- Vynechaný cvik má stlmenú kartu s označením „skipped“ a cieľom, bez čipov.
- Cvik pridaný počas tréningu má označenie „added“ a nemá cieľ.

### 7. Bezpečnosť a prístup k dátam

Toto všetko musí vynútiť databáza:

| Kto | Čo smie |
|---|---|
| Klient | Všetko so svojimi plánmi, ktoré nie sú od trénera. Čítať plány od trénera. Všetko so svojimi tréningami. |
| Aktívny tréner | Čítať plány aj tréningy svojho klienta. Vytvárať, meniť a mazať plány, ktoré tomuto klientovi sám zostavil. Do tréningov klienta nezapisuje. |
| Bývalý tréner, ostatní | Nič. |

- Pri ukončení spojenia sa trénerove plány klienta zmenia na jeho vlastné.
  Musí to urobiť databáza (napr. funkcia), lebo podľa pravidiel vyššie by to
  inak nemohla urobiť ani jedna strana.
- Párovanie pozvánky cez email nesmie umožniť zisťovať, aké emaily či účty v
  systéme existujú. Nesmie ani odhaliť emaily iných používateľov.
- **Všetky** dotazy v `lib/repo.ts` a hookoch, ktoré vracajú „moje“ plány alebo
  tréningy, musia po novom filtrovať podľa aktuálneho používateľa. To isté
  platí pre predvypĺňanie váh v `useActiveWorkout`, štatistiky na Home,
  históriu a progres. Dáta klienta sa načítavajú iba vedome v trénerských
  obrazovkách.

## Ponechané na staviteľa

- Názvy tabuliek a stĺpcov, štruktúra pozvánok a spojení. Rozhodnutie, čo
  vyriešia politiky a čo RPC funkcie.
- Presný tvar JSON pre ciele sérií a pre snímku v tréningu. Spôsob, akým sa
  staré plány prevedú do nového tvaru (pri čítaní alebo pri uložení).
- Štruktúra adries (napr. `/clients`, `/clients/[id]`,
  `/clients/[id]/workouts/[sid]`, `/clients/[id]/plans/...`).
- Ktoré komponenty sa znovu použijú a ktoré pribudnú. Vizuálne detaily v rámci
  existujúceho dizajnu (farby, `Card`, `StatTile`, …).
- Presné anglické texty v UI.
- Poradie kariet v detaile tréningu (podľa plánu alebo podľa toho, ako sa
  cvičilo).
