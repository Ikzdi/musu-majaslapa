# FORMA — premium digitālās studijas mājaslapa (5 lapas)

Daudzlapu (multi-page) premium mājaslapa digitālajai studijai, kas pārdod
mājaslapu izstrādes pakalpojumus. Veidota kā paraugs/portfolio, lai pārdotu
projektus augstākajā cenu segmentā.

> Atsauces: [amnetwork.lv](https://amnetwork.lv) (struktūra/saturs) un
> [nexusmag.eu](https://www.nexusmag.eu) (kustību bagāta, editoriāla estētika).
> Šeit pacelts uz “award-winning” līmeni ar WebGL, lapu pārejām un modāļiem.

## Lapas

| Fails | Lapa |
|------|------|
| [index.html](index.html) | Sākums |
| [pakalpojumi.html](pakalpojumi.html) | Pakalpojumi (detalizēti + cenas) |
| [darbi.html](darbi.html) | Darbi (portfolio ar filtru + projektu modāļi) |
| [par-mums.html](par-mums.html) | Par mums (stāsts, vērtības, komanda) |
| [kontakti.html](kontakti.html) | Kontakti (forma + info) |

## Kā apskatīt

Atver `index.html` pārlūkā (dubultklikšķis) vai palaid lokālo serveri:

```bash
python -m http.server 5050
# atver http://localhost:5050
```

Internets nav obligāts — bez tā fonti atkāpjas uz sistēmas fontiem,
un viss pārējais (efekti, modāļi, pārejas) strādā lokāli.

## Faili

```
*.html                  # 5 lapas (katra dala vienu CSS + JS)
assets/css/styles.css   # dizaina sistēma + visi komponenti
assets/js/main.js       # visi efekti (bez ārējām bibliotēkām)
```

## “Insane” efekti

- **Atvēršanas “wow” intro (“Molten Latch”)** — atverot sākumlapu, 5 necaurredzamas
  kolonnas notur ekrānu ar 00→100 skaitītāju, kamēr aiz tām FORMA WebGL shader
  uzliesmo karstāks; tad kolonnas atveras horeografētā secībā un “paceļ” virsrakstu
  augšā. Tikai sākumlapā; pilnībā izslēdzas pie `prefers-reduced-motion`; strādā arī
  bez WebGL (atklāj CSS fonu). Izvēlēts no 5 koncepcijām ar daudzaģentu novērtējumu.
- **WebGL plūstošs hero fons** — dzīvs shader (vanilla WebGL, bez bibliotēkām).
  Ja ierīce neatbalsta WebGL → automātiski atgriežas uz CSS gradienta fonu.
- **Lapu pārejas** — pārejot starp lapām, ekrānu pārklāj animēts FORMA panelis
  (SPA sajūta uz īstām lapām). Strādā arī bez JS (CSS animācija) un izslēdzas
  pie “mazāk kustību”.
- **Teksta scramble** — virsraksti “atkodējas” no nejaušām rakstzīmēm.
- **Modāļi** — projektu detaļas (klikšķis uz darba kartes) un “Sākt projektu”
  forma (poga). Native `<dialog>` → fokusa slazds, Esc, fona klikšķis aizver.
- Pielāgots kursors, magnētiskas pogas, 3D tilt, kartes “spotlight”, ritināšanas
  progresa josla, skaitītāji, marquee, parallax, FAQ akordeons, darbu filtrs.

## Ko nomainīt uz savu

| Vieta | Ko mainīt |
|------|-----------|
| Zīmols “FORMA” | logo/footer/`<title>` visās `.html`; krāsa `--accent` failā `styles.css` |
| E-pasts | `klavdasmis77@gmail.com` (meklē & aizvieto visās lapās) |
| Telefons | `+371 20 000 000` |
| Soc. tīkli | saites `href="#"` (Instagram / LinkedIn / Behance) |
| Darbi | `darbi.html` un `index.html` — `data-title`, `data-meta`, `data-desc`, `data-tags` uz `.work-card__hit` pogām |
| Komanda | `par-mums.html` |
| Cenas | `pakalpojumi.html` un `index.html` |
| Forma | Pašlaik forma rāda “paldies” ekrānu (bez servera). Lai saņemtu e-pastus, pievieno backend vai pakalpojumu (Formspree, Web3Forms u.c.) `form` elementam. |

## Dizaina sistēma

Visi marķieri ir `styles.css` augšā (`:root`):

- **Akcents:** `--accent` (`#ff4a1c`) — maini vienā vietā, atjaunosies visur.
- **Fonti:** Space Grotesk (virsraksti), Inter (teksts), Instrument Serif (kursīvs).

## Kvalitāte

- **Pieejamība (WCAG AA):** kontrasts ≥ 4.5:1, redzami fokusa apļi, tastatūras
  navigācija, ARIA, “Pāriet uz saturu” saite, modāļi ar fokusa slazdu.
- **Responsivitāte:** mobile-first; kontrolpunkti 560 / 860 / 1024 px; bez
  horizontālās ritināšanas (pārbaudīts 375 px un 1280 px).
- **Kustība ar jēgu:** viss respektē `prefers-reduced-motion` — tad smagie efekti
  (WebGL, pārejas, scramble) izslēdzas, bet saturs paliek pilnībā lietojams.
- **Veiktspēja / robustums:** nulle ārēju bibliotēku izpildlaikā, attēli ģenerēti
  ar CSS/WebGL, lapa strādā arī bez JavaScript (progresīvā uzlabošana).
