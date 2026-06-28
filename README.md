# FORMA — premium digitālās studijas mājaslapa (5 lapas, SEO)

Daudzlapu (multi-page) premium mājaslapa digitālajai studijai, kas pārdod
mājaslapu izstrādes pakalpojumus. Tumšs, “award-winning” dizains ar WebGL, lapu
pārejām un modāļiem + pilna SEO optimizācija (latviešu valodā, Rīga / Latvija).

> Iedvesma: [amnetwork.lv](https://amnetwork.lv) (saturs/struktūra),
> [nexusmag.eu](https://www.nexusmag.eu) (kustība) un
> [thrivelearning.com](https://www.thrivelearning.com) (“polish” — klientu siena,
> ciļņu sadaļa, lielie rezultātu skaitļi). SEO pēc
> [claude-seo](https://github.com/AgricIDaniel/claude-seo) metodikas.

## Lapas

| Fails | Lapa | Primārais atslēgvārds |
|------|------|----------------------|
| [index.html](index.html) | Sākums | mājaslapu izstrāde Rīgā |
| [pakalpojumi.html](pakalpojumi.html) | Pakalpojumi | mājaslapu izstrādes pakalpojumi |
| [darbi.html](darbi.html) | Darbi / portfolio | mājaslapu izstrādes darbi portfolio |
| [par-mums.html](par-mums.html) | Par mums | web studija Rīgā |
| [kontakti.html](kontakti.html) | Kontakti | mājaslapas izstrādes cena |

`backup-v1-molten/` = iepriekšējā versija (pirms SEO/Thrive izmaiņām).

## Kā apskatīt

Atver `index.html` pārlūkā vai palaid serveri:

```bash
python -m http.server 5050   # http://localhost:5050
```

> Lai redzētu intro un WebGL — atver **īstā pārlūkā ar ieslēgtām animācijām**
> (Windows: Settings → Accessibility → Visual effects → Animation effects → On)
> un veic **Ctrl+F5** (cache).

## ⚠️ PIRMS PUBLICĒŠANAS (obligāti SEO)

1. **Nomaini domēnu.** Visur lietots placeholder `https://www.forma.lv`.
   Aizvieto to ar savu reālo domēnu šajos failos: visu 5 lapu `<head>`
   (canonical, og:url, og:image, JSON-LD `@id`/url), `robots.txt`, `sitemap.xml`.
   (Meklē & aizvieto “www.forma.lv”.)
2. **Attēli, uz kuriem norāda SEO** (✅ jau pievienoti):
   - `assets/img/forma-og.jpg` — sociālo tīklu attēls (1200×630 px), ģenerēts no Veo hero kadra
   - `assets/img/forma-logo.png` — logo (kvadrāts, ~512×512)
3. **Pieslēdz formu** reālai e-pasta sūtīšanai (tagad rāda “paldies”, bet nesūta).
   Ātrākais: [Formspree](https://formspree.io) vai [Web3Forms](https://web3forms.com) —
   viena rinda `<form>` elementā. Vai nomaini e-pastu/telefonu uz savu.
4. **Reģistrē** Google Search Console + iesniedz `sitemap.xml`; izveido un aizpildi
   Google Business Profile (lokālajam SEO ļoti svarīgi — kategorija + atsauksmes).

## SEO, kas jau ieviests

- **Meta dati** katrai lapai: unikāls `<title>` (50–60 z.), `meta description`
  (150–160 z.), `canonical`, `robots`, **Open Graph + Twitter Card**, `lang="lv"`.
- **Viens H1** ar primāro atslēgvārdu katrā lapā; loģiska H2/H3 hierarhija;
  atslēgvārdi pirmajos 100 vārdos; dabiska blīvuma latviešu copy.
- **Struktūrdati (JSON-LD)** katrā lapā: `Organization`, `ProfessionalService`
  (LocalBusiness — Rīga, areaServed Latvija, ģeo, darba laiks, aggregateRating),
  `WebSite`, `BreadcrumbList`, lapas tips (`WebPage`/`CollectionPage`/`AboutPage`/
  `ContactPage`), kā arī `Service`, `ItemList` (portfolio) un `FAQPage` (kur ir
  redzama BUJ sadaļa). NAP (nosaukums/adrese/tālrunis) konsekvents visur.
- **Lokālais SEO:** Rīga + Latvija signāli virsrakstos, H1 un saturā; `tel:` saites.
- **Tehniski:** `sitemap.xml`, `robots.txt`, semantisks HTML, ātrs, bez ārējām
  izpildlaika bibliotēkām.

## “Wow” efekti un Thrive “polish”

- Atvēršanas intro **“Molten Latch”** (kolonnu aizvars + WebGL uzliesmojums;
  reduced-motion → maiga izgaišana), WebGL hero fons, lapu pārejas, teksta scramble.
- **Thrive iedvesma:** klientu siena (`.logos`), interaktīva **ciļņu sadaļa**
  (`.showcase`, ar tastatūru), lielie **rezultātu skaitļi** (`.results`), tīrākas
  kartes un vairāk gaisa.
- Pielāgots kursors, magnētiskas pogas, 3D tilt, modāļi (projekts + “Sākt projektu”),
  darbu filtrs, FAQ akordeons, ritināšanas progress.

## Interaktīvie “premium” bloki (jaunie)

- **Cenu konfigurators** (`.config`, `pakalpojumi.html`) — “Uzbūvē savu piedāvājumu”:
  projekta tips, lapu skaits, termiņš un papildinājumi; cena pārrēķinās uzreiz, un
  poga **aizpilda kontaktformu** ar konfigurāciju + aptuveno cenu (`#qm-msg`/`#qm-budget`).
- **Before/After slīdnis** (`.ba`, `index.html`) — velc rullīti (vai bultiņas/taustiņi),
  lai redzētu klienta veco lapu pārtopam par FORMA dizainu; `clip-path` + rAF-lerp,
  pieskāriena un tastatūras atbalsts (WAI-ARIA `slider`). Attēli `assets/img/ba/`.
- **WebGL portfolio hover** (`assets/js/portfolio-gl.js`, darbi + sākums) — uz hover
  darbu attēls tiek renderēts uz GL plaknes ar šķidruma viļņojumu ap kursoru + RGB
  nobīdi. **Viens koplietots WebGL konteksts**, kas pārvietojas uz aktīvo kartīti.
  Fallback: nav WebGL / reduced-motion / skārienekrāns → paliek CSS hover.
- **“Lenis-stila” gluds ritinājums + ātruma slīpums** (`main.js`) — svarīga (weighty)
  inerce; ritināšanas ātrums dod vieglu `skewY` media elementiem (`[data-skew]`), kas
  dabiski izgaist līdz ar inerci. Tikai desktopā; reduced-motion → izslēgts.
- **Gludāka “samontēšanās”** (`.build`) — pārrakstīts kontrolieris: viena rAF cilpa ar
  lerp-izlīdzinātu scrubu, kešots izmērs, peles parallakss pa dziļuma slāņiem,
  `will-change` pārvaldība, reduced-motion → statiski samontēta lapa.

## Hero video + 3D animācijas

- **Veo molten hero film** (`assets/video/forma-hero.*`) — īsts AI ģenerēts (Veo 3.1)
  kino klips: kūstošs zelta/lavas metāls melnā void, ar tukšu vietu kreisajā pusē
  virsrakstam. Atskaņojas **muted/loop/playsinline**; `poster` kadrs nodrošina
  tūlītēju LCP; pauzējas ārpus ekrāna / kad cilne paslēpta. `mp4` (3.1 MB, H.264) +
  `webm` (2.8 MB, VP9) avoti.
- **3D molten hero objekts** (`assets/js/hero3d.js`, Three.js) — tagad **fallback**:
  ja video neatskaņojas (kļūda vai bloķēts autoplay), spīd peldošs molten objekts ar
  peles parallaksu. (Iepriekš tas bija primārais hero fons.)
- **3D “assembly” animācija** (`.assembly`) — CSS 3D perspektīvā mājaslapas makets,
  kas “samontējas” no detaļām, ritinot lapu. Bez bibliotēkām, strādā arī bez interneta.

> **Graceful fallback (hero fons):** dzīvs Veo video → (reduced-motion / no-JS)
> statisks poster → (video neielādējas) Three.js molten objekts → (nav WebGL)
> raw-shader fons → (nav JS) CSS blobi. Nekad nav melns ekrāns.
>
> **AI video (Veo) prasa billing.** Klips ģenerēts ar **billing** ieslēgtu Gemini API
> atslēgu (`veo-3.1-generate-preview`, ~$0.40/sek). Bezmaksas līmenī Veo = 0. Atslēga
> glabājas lokāli `.gemini_key` (`.gitignore`’ots — nekad necommito).

## Faili

```
*.html                  # 5 lapas
robots.txt, sitemap.xml # tehniskais SEO
assets/css/styles.css   # dizaina sistēma + visi komponenti
assets/js/main.js       # visi efekti (+ hero video, before/after, konfigurators, gluds scroll)
assets/js/hero3d.js     # Three.js 3D molten hero objekts (video fallback)
assets/js/portfolio-gl.js # WebGL hover-distortion darbu attēliem (koplietots konteksts)
assets/video/           # Veo hero film: forma-hero.mp4 / .webm (+ -source.mp4 masters)
assets/img/forma-hero-poster.jpg  # hero poster (LCP + reduced-motion still)
assets/img/work/        # 8 darbu mājaslapu maketi (portfolio + build pieces)
assets/img/services/    # 6 pakalpojumu maketi (Imagen): web, e-veikals, UI/UX, zīmols, SEO, uzturēšana
assets/img/ba/          # before.jpg / after.jpg — Before/After slīdnim
backup-v1-molten/       # iepriekšējā versija
```

## Kvalitāte

- **Pieejamība (WCAG AA):** kontrasts ≥ 4.5:1, fokusa apļi, tastatūras navigācija,
  ARIA, “Pāriet uz saturu”, modāļi ar fokusa slazdu, ciļņas ar bultiņu vadību.
- **Responsivitāte:** mobile-first; bez horizontālās ritināšanas (375 px / 1280 px).
- **Kustība ar jēgu:** viss respektē `prefers-reduced-motion`.
- **Robustums:** strādā bez JavaScript un bez WebGL (graceful fallback).
