# CLAUDE.md: working conventions of this repository

Instructions for Claude Code (and any other assistant) working in this repository. Keep this
file current: when a preference emerges from a conversation, record it here, with its date,
rather than relying on it being remembered. Sections are numbered by hand.

This repository follows the harness of **thebox**, the template of every repository of the
GitHub organization **theplanet-earth** (Section 11). The rules shared with people
(commands, branches, commits, versions, checks, confidentiality, writing style) are in
`CONTRIBUTING.md`, imported here so that they are always in context:

@CONTRIBUTING.md

## 1. The repository

**thesite** is the project site of the GitHub organization **theplanet-earth**. The
repository is **public**: everything committed here, including branches and pull requests,
is visible to anyone (Section 8).

The site is a Jekyll site in `docs/`, the 2024 prototype folded in on 2026-11-23 from the
branches `glob_coverage` and `hyde_theme` (opened in this order, then deleted). Its home page
shows a 3D globe (`src/globe/`, three.js bundled by esbuild), which replaced the Leaflet map
of the prototype on 2026-11-23, with the latest edits to OpenStreetMap as orange spikes and
arcs (issue #1, Section 2): those of the build first, then those the browser reads every 19
minutes while the globe is shown. `/globe/` explains it and credits the work it builds on.
The page Map (`/map/`, since 2026-11-26) shows the Standard map of OpenStreetMap in Leaflet;
Home and Map are one document with two views (`docs/_includes/world.html`), and the globe
opens into the map and closes again (Section 2). In production a Worker (`wrangler.jsonc`, `worker/`) serves the site and reads the edits
once for every visitor. `npm run build` builds it into `build/pages/`, `npm run serve`
previews it (`npm run serve:stage` as the stage site). Two environments, decided by the owner
on 2026-11-23 following issue #2, both live since 2026-11-25:

| Environment | Branch | Where | How | State |
|---|---|---|---|---|
| Stage | `stage` | `https://theplanet.wtf/`, GitHub Pages of this repository | `.github/workflows/stage.yml` on every push to `stage`, built with `JEKYLL_ENV=stage`: the banner *Work in progress* at the top and at the bottom of every page (Section 2) | live since 2026-11-25 (#14) |
| Production | `master` | `https://theplanet.observer/`, a Cloudflare Worker serving `build/pages/` as static assets | `.github/workflows/production.yml`, called by `release.yml` after every release while the repository variable `DEPLOY_PRODUCTION` is `true`; built with `JEKYLL_ENV=production`, without the banner | live since `v0.2.0`, 2026-11-25 (#24, issue #2) |

What the site shows and how it links the other repositories of the organization are decided
by the owner, request by request.

**Golden rule: sources, traceability, no silent fixes.**

- A statement about external work, a third-party API or a tool carries a link to its source.
- Inconsistencies between sources (code, documentation, data, issues, what a service actually
  returns) are **never corrected in silence**: report both values, say which source each comes
  from, and flag the point to the owner.
- Generated files (`build/`, caches, files written by a tool) are never edited by hand and
  never committed unless the repository says so: change their source and generate them again.

## 2. Instructions of the owner

Dated, in the owner's words where possible. Add every new standing instruction here.

- 2026-11-23, "prendi tutta la harness che ti puoi prendere da thebox-master.zip
  riadattandola a questa repo": thesite adopts every part of the harness of thebox that
  applies to it (Section 11).
- 2026-11-23, "usa thebox-master.zip poi buttalo e pulisci tutto quello che non ti serve":
  archives and extracted copies used to set up the repository are deleted once used, never
  committed (Section 8).
- 2026-11-23, "folda i due branch attualmente presenti sulla repo [...] l'uno sull'altro e poi
  su dev e poi cancellali e pusha dev": `glob_coverage` and `hyde_theme` were merged into `dev`
  and deleted. Asked again the same day, against point 4 of issue #5 (keep them until the
  first release of `thestory`), the owner chose to leave them deleted; their commits are in
  the history of `dev` (`c8a2c5d`, `ec8acac`).
- 2026-11-23, "voglio creare anche stage e pubblicare [...] master su theplanet.observer e
  stage su theplanet.wtf": production at `theplanet.observer`, stage at `theplanet.wtf`
  (Section 1). Told that GitHub Pages serves one domain per repository, the owner chose the
  split of issue #2: stage on GitHub Pages, production on Cloudflare.
- 2026-11-23, "per master voglio usare una cf worker non page": production is a Cloudflare
  Worker with static assets, deployed by `wrangler deploy`, not a Cloudflare Pages project.
- 2026-11-23, "voglio poi usare la skill [ui-ux-pro-max] per migliorare la pagina e apportare
  dei cambiamenti che ti dirò": the plugin is enabled in `.claude/settings.json` (Section 10);
  the changes to the page come from the owner, request by request.
- 2026-11-23, "voglio anche creare dei task per vederla in anteprima qui dal codespace":
  `npm run serve` and the task *Preview: site (live reload)*, port 4000 forwarded.
- 2026-11-23, "voglio anche sistemare il codice qui nel progetto, mi sembra un po'
  disordinato": the prototype in `docs/` was cleaned up on 2026-11-24 (Section 4).
- 2026-11-23, "aggiungi anche la skill della issue #4 e implementiamo la #5": the skill
  `security-audit` of Cloudflare is installed for the user by `scripts/install-skills.sh`; the
  branches `dev` and `stage` and the stage deploy follow issue #5.
- 2026-11-23, "in thebox è stato risolto: risolvilo anche qui" (the warning "Default
  interpreter path '${workspaceFolder}/.venv/bin/python' could not be resolved"): thesite
  follows thebox v0.1.2 (Section 11), which also brings the squash merges along the chain.
- 2026-11-23, "vorrei pubblicare master così com'è e intanto sviluppare su stage e pubblicarla
  una versione migliora nella cui home iniziamo a sviluppare un globo come questo [GitHub
  globe] creditando il lavoro qui descritto adeguatamente. in realtà utilizzando anche un
  apikey di meshy.ai vorrei trasformare questo globo qui in uno più simile a quello del nostro
  logo, aggiungendogli, gambre, braccia, occhiali": the home of the stage site gets a 3D globe
  built on the techniques of
  [How we built the GitHub globe](https://github.blog/engineering/engineering-principles/how-we-built-the-github-globe/)
  (Tobias Ahlin, GitHub, 2020), credited on the site; a model of the mascot of the logo,
  generated with the API of [Meshy](https://docs.meshy.ai/en/api/image-to-3d), follows. The
  key of Meshy lives only in the environment (`MESHY_API_KEY`), never in a file.
- 2026-11-23, the owner's answers on that plan: production gets "the prototype plus two
  fixes" (the style of `/about/` and the tiles of the map; the rest of the cleanup and the
  globe go to stage after the first release); the globe **replaces** the Leaflet map on the
  home of stage (the coverage of issue #1 will come as points and arcs on the globe); Meshy
  on a **paid plan**, so the generated models belong to the organization (Meshy terms, 3.2),
  "procedi"; nothing done yet on issues #6 and #7.
- 2026-11-24, "non mi piace questo modello 3d al posto del globo stile github, rimetti il globo
  stile github com'era prima, ma tieni il modello committato nel repo da qualche parte (magari
  lo utilizzeremo da thegame, come easter egg) però leva la texture fatta a mo di globo di
  github": the home keeps the globe of #9; the mascot is kept, with its own texture, in
  `media/mascot/`, outside the published site. The same day: the points and arcs of issue #1
  in the orange of the palette, "come per le issue e pr su github, [...] andando a leggere i
  contributi su osm", the cleanup of `docs/`, and "vai avanti più possibile da solo fino alla
  fine".
- 2026-11-24, after installing the plugin `ui-ux-pro-max` (version 2.13.0 of its manifest,
  user scope): "farai tu i due merge (e tutto il resto al contrario, compreso anche eliminare
  le branch che non ti servono più) ma prima voglio finire di fare tutto il necessario per poi
  vedere il deploy automatico funzionare sui due domini": once the owner has finished issues
  #6, #7 and #2 and says so, Claude squash-merges #11, then #14, merges each target back down
  the chain, and deletes the merged branches of work (`globe`, `mascot`, `cleanup`, `home`).
  Done on 2026-11-25, after "va bene il globo in produzione, procedi pure": #11 (`v0.1.0`),
  #14 and #24 (`v0.2.0`, the globe in production) squash-merged and merged back, the
  branches of work deleted; only `dev`, `stage` and `master` are left (issue #2).
- 2026-11-24, on the issue of thegame for the easter egg of the mascot: "ricordami di aprirla
  fino a che non ricreiamo il devcontainer": every recap reminds it, until a Codespace created
  after the change of the devcontainer can open it. On the other files of Meshy: "per adesso
  sì", they are kept in `media/mascot/`.
- 2026-11-24, on the home page: "Global reach" instead of "Global coverage"; "fai in modo che
  non debba scrollare verso il basso per vedere tutto" (the home page and `/globe/` fit one
  window); the credits of the globe move to a page `/globe/`, linked under the globe and not
  from the menu, while the attribution of OpenStreetMap stays next to the globe, as its
  guidelines require; About is left to the project; a GitHub icon instead of "Source on
  GitHub"; and the edits of OpenStreetMap "in tempo reale [...] a quando sta visualizzando
  l'utente e non a build time", about as many as the build keeps (113 to 120).
- 2026-11-25, asked why the caption always said 120: option A, "finestra di tempo fissa, numero
  che varia", "come finestra di tempo per adesso fai 20 minuti [...] ma non dire nel messaggio
  che sono negli ultimi 20 minuti [...] allinea anche in fase di build il lasso temporale a 20
  minuti precedenti": the build, the browser and the Worker keep the edits closed in the 20
  minutes before the replication last ran (`WINDOW_MINUTES` of `src/globe/replication.js`,
  the same in `scripts/osm-activity.py`); the caption shows their number, not the window.
  The same day, of `/globe/`: "lui può anche menzionarlo [...] dei 20 minuti intendo": the
  page that explains the globe names the window, the caption under the globe does not.
- 2026-11-24, on the edits read by every browser: "fallo, magari non ogni minuto, ma ogni 19
  minuti": the Worker of production reads the replication at most every 19 minutes per data
  centre and serves that copy to every visitor (`/api/osm-edits.json`); the browser asks
  every 19 minutes, the Worker where there is one, the replication where there is none. On
  the sidebar: "torna ai font originali, alle dimensioni del logo originali e soprattutto
  alla scritta THEPLANET su 3 righe originale, controllando sì che non compaia la scroll
  bar, ma neanche riducendo così tanto la spaziatura verticale", and a smaller GitHub icon.
- 2026-11-23, "aggiungi una issue per cambiare la licenza di questa repo (apri una issue
  analoga per tutte le altre repo dell'org) mettendo a confronto diverse licenze papabili per
  la repo e spiegandone il motivo e le differenze tra queste": issue #10 here; the same issue
  in every other repository of the organization, which a Codespace may open only with the
  permission below (Section 12).
- 2026-11-24, "modifica il devcontainer per avere il permesso di aprire issue su tutte le repo
  dell'org": the devcontainer asks for write on the `issues` of every repository of the
  organization, read on the rest, and nothing more (Section 10); the caution at the top of
  `README.md` lists what it allows. It applies to the Codespaces created after the change.
- 2026-11-25, on the alternatives of issue #10: "andiamo con A. MIT per il codice, CC BY 4.0
  per i testi, logo e mascotte riservati", without cluttering the sidebar, and as the holder
  "proprio il mio nome e basta": `LICENSE` is the MIT License, © 2024 Andrea Gallegati; the
  texts of the pages are CC BY 4.0; the logo and the mascot are not licensed (`README.md`,
  *License*). The sidebar keeps one line, the notice, which links to that section;
  `author` in `docs/_config.yml` holds the name.
- 2026-11-25, "fai 2024-2026 nella barra laterale [...] però aggiungi una action (schedulata)
  che buildi per aggiornare la data all'inizio di ciascun anno, sennò rimane vecchia": the
  notice reads "© 2024-<year of the build>", and `.github/workflows/new-year.yml` starts a
  build of the published sites on 1 January (Section 12).
- 2026-11-25, on that workflow, which could rebuild only stage: "bravo aggiungila" (the
  production): `.github/workflows/production.yml` builds `master` and deploys it with the
  Worker (`scripts/worker.sh deploy`); `release.yml` calls it after every release and
  `new-year.yml` starts it on 1 January. It runs only once the owner sets the repository
  variable `DEPLOY_PRODUCTION` to `true`, after the environment `production` and its secrets
  exist (issues #6, #7).
- 2026-11-25, "l'ho generato con ChatGPT (DALL-E), aggiungi la provenienza (devo verificare
  prompt etc...) ricordami che ti serve e te lo darò in futuro": `media/README.md` records
  what git and the metadata of the files say; the owner will give the prompt, the model, the
  date and the image chosen (Section 12, issue #19).
- 2026-11-25, "aggiungi a https://theplanet.wtf/ (stage) un banner (su ogni pagina, servita
  sotto quel dominio) in stile "work in progress" per segnalare che quella versione del sito
  è solo una preview. fai in modo di aggiungerlo automaticamente a ogni merge di dev su stage
  e di levarlo a ogni merge su master di stage": the banner
  (`docs/_includes/preview-banner.html`, `docs/assets/css/preview.css`) is in the code of
  every branch and appears only in a build for stage, `JEKYLL_ENV=stage`
  ([Jekyll environments](https://jekyllrb.com/docs/configuration/environments/)), which
  `stage.yml` sets at every merge into `stage`; production builds with
  `JEKYLL_ENV=production`, which `scripts/worker.sh` forces, and never shows it. No file is
  added or removed at the merges: a file that `stage` had and `master` had not would come back
  to `dev` with the merge back and reach `master` with the next squash.
  `scripts/check-site.py` checks both, before each deploy: the banner on every page of the
  build for stage, on no page of any other. It links the production site.
- 2026-11-25, on seeing it: "replica lo stesso identico banner anche in fondo alla pagina.
  aggiungi all'avviso una second frase del tipo "Here is where stunning features happen." o
  qualcosa del genere migliorato (deve stare tutto in un'unica riga)": the same banner at the
  top and at the bottom of every page, both checked by `check-site.py`; the text reads "Work
  in progress: only a preview of theplanet.observer. New features take shape here first."
  (no "stunning", which the writing style of `CONTRIBUTING.md` excludes), on one line from a
  window 768 pixels wide, on two on a phone 390 pixels wide.
- 2026-11-25, "forse è il caso di aggiungere un tab "Privacy" con l'informativa sulla privacy,
  cookies ai sensi del GDPR e di tutte le altre normative applicabili?", and the owner's
  answers on the plan: a page *Privacy* in the menu, in English only (`docs/privacy.md`);
  the fonts served by the site instead of Google Fonts, so that no resource comes from
  another host; as the address of the controller, "privacy@theplanet.dev visto che possiedo
  anche quel dominio, li faremo delle configurazioni per creare anche altri indirizzi mail
  con le regole di cf": the addresses of the project live on `theplanet.dev`, routed by
  Cloudflare Email Routing (Section 12). The site sets no cookie, so it shows no consent
  banner.
- 2026-11-25, after seeing the page in a preview, "perfetta, va benissimo, prima di mergiare
  su dev aggiungi comunque un popoup (in stile arancione, come il banner wip) che costringa il
  lettore a leggere brevemente che c'è una sezione privacy apposta e a chiudere questo popup
  prima di poter fare nulla sul sito [...] giusto per far vedeer che non si è ignorata la
  questione": the notice of privacy, a modal dialog on every page but `/privacy/`
  (`docs/_includes/privacy-notice.html`, `src/notice/`), opened at the start of a visit.
  It stores nothing, so that the page stays true: a visit starts when the page was not
  reached from another page of the site (`document.referrer`), and a reload or a step in the
  history is not a new one; it opens again at the next visit.
- 2026-11-25, "quando lo visualizzo da cellulare vorrei che il logo THEPLANET fosse alto tanto
  quanto il logo. aggiustali in questo caso per fare si che mantengano le proporzioni": on
  narrow screens the logotype is as high as the mascot, 3.5rem, and each keeps its
  proportions: the mascot takes its width from its height, the logotype scales its text,
  padding and border together (`docs/assets/css/theplanet.css`).
- 2026-11-25, "sistemami il README.md, rimpicciolendo il logo e mettendolo sopra a tutto,
  migliorando il titolo e aggiungendo dei badge che ti sembrano appropriati (non a caso, non
  necessariamente tanti)": `README.md` opens with the logo, 160 pixels wide, then the title
  with the organization as its subtitle, one line on the globe and four badges, then the
  caution, before every section (`tests/test_readme.py`). Each badge says something the
  reader needs: the two sites, which [shields.io](https://shields.io/badges/website) finds up
  or down (the address, or "down"); the latest release
  ([GitHub release](https://shields.io/badges/git-hub-release)); the license, "MIT + CC BY
  4.0", a [static badge](https://shields.io/badges/static-badge) linking to *License*, since
  the badge that GitHub reads from `LICENSE` would say MIT only. No badge of CI: it runs on
  pull requests only. The alt text of the logo was "The Pipeline", a leftover.
- 2026-11-25, "ho fatto anche i ruleset su dev stage e master, documenta tutto da qualche
  parte": the owner created the rulesets `chain` (`stage`, `master`) and `dev` (`dev`) of
  issue #25; they are described in `CONTRIBUTING.md` (*Branches and pull requests*), in the
  caution of `README.md` and in Section 12. The same day the owner set the email records
  against spoofing of `theplanet.observer` (issue #3).
- 2026-11-25, on what was left of issue #3: HSTS, "rimandiamolo, segnalo"; Always Use HTTPS
  on `theplanet.observer` and DNSSEC on the three domains, "facciamoli", done by the owner
  the same day (Section 12). The proxy of `theplanet.wtf` (the orange cloud) stays off: it
  serves neither of the two, since Always Use HTTPS acts only on the traffic that crosses
  Cloudflare ([documentation](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/always-use-https/))
  and DNSSEC signs every record of the zone; it comes back with HSTS, which on
  `theplanet.wtf` needs it.
- 2026-11-25, "mergia tutto su master e rimergia indietro le cose per non complicarci la vita
  poi": Claude squash-merged #39 into `stage` and #40 into `master` (`v0.3.0`: the banner of
  the stage site, the edits of 20 minutes, the page *Privacy* and its notice, now in
  production), then merged `master` into `stage` and `stage` into `dev`; the three branches
  held the same files, and the merge back closed issue #25 (Section 12).
- 2026-11-26, after two proofs of concept outside the repository: "un'altra voce: "Map" tra
  Home e About che apre una pagina /map con una transizione fluida tra l'attuale globo (come
  che venisse zoommato e "aperto") e [...] una mappa 2D di tutto il mondo [...] cliccando di
  nuovo su home, ci dev'essere la transizione inversa"; of the first map, "vorrei una mappa
  che fosse presa da OSM (citata a dovere) e che non fosse "ellissioidale" [...] la
  preferisco rettangolare così com'è quella di osm proprio [...] non si devono assomigliare";
  of the spikes and arcs, "quando clicco su maps vorrei che la transizione facesse scomparire
  (e ricomparire poi) anche loro, in maniera fluida"; and "sviluppalo e mergia una PR su dev
  [...] leva questo "Home closes it back into the globe." nella didascalia e "Map" in alto
  sopra la mappa". The page Map (`docs/map.html`, `nav_order` 1, About 2, Privacy 3) shows the
  Standard tiles of OpenStreetMap in Leaflet, credited on the map and under it, with no
  visible title (an `h1` for assistive technologies only). Following the link from Home, the
  spikes, arcs and rings sink and fade, the globe turns to Greenwich, comes closer and opens
  from the back into Web Mercator, its sea and land take the colours of the tiles, the dots
  fill the land, and the tiles fade in over it; Home plays it backwards
  (`src/globe/transition.js`). The owner asked Claude to merge the pull request into `dev`.
- 2026-11-26, on `/globe/`, `/about/` and `/privacy/`: "il font mi piace molto, ma c'è
  qualcosa che non mi convince nel come appare il testo. migliorale usando
  https://github.com/nextlevelbuilder/ui-ux-pro-max-skill"; "non mi piace che il testo copra
  tutta la schermata in orizzontale: restringilo"; and an index "che ti segue mano a mano che
  scrolli" and marks the section on screen, "molto minimal, senza scroll bar", which, when it
  does not fit, scrolls slowly by itself with the marked entry and, under the pointer, by the
  wheel alone, with an invisible scrollbar. Done on the branch `reading`, in a worktree of its
  own while another session worked on `map`: the pages of text (`_layouts/page.html`,
  `assets/css/page.css`) keep PT Sans, at 18 pixels in a column of 30em (57 to 76 characters
  a line), with headings on the left edge of the text, more room above them than below,
  links underlined and code in the dark of the page, after the UX guidelines of
  `ui-ux-pro-max`; the index (`src/toc/`) stands beside the text from 1200 pixels and is a list
  under the title below (Section 12). `/globe/` had no headings: its three bold lead-ins
  became its sections. **Against the instruction of 2026-11-24** that `/globe/` fit one
  window: with lines of 70 characters its text no longer fits one, at 1280x800 nor at
  1920x1080 (1268 pixels high); the home page still does. Reported to the owner, who asked
  Claude to merge the pull request (#43) into `dev`, after the page Map (#42).
- 2026-11-27, on the same pages: "c'è qualcosa che continua a non convincermi dello stile [...]
  puoi farmi una proposta tu, hai completa libertà, giusto non tradire lo stile e i colori
  dell'attuale soluzione, ma fai tutto quello che ritieni necessario". The proposal, on the
  branch `typography`: the pages of text mirror the sidebar,
  whose logotype is Roboto Mono, bold, in capitals, in a square, `#444` on `#ddd`, where the
  content is `#ddd` on `#444`. Titles in Roboto Mono capitals (the page title, Global reach
  on the home page, and the index's first entry, as the title of the notice of privacy
  already is); the opening paragraph larger; sections opened by a hairline and, from two
  sections up, numbered 01, 02, ... in Roboto Mono and in the orange of the globe, in the
  margin on wide screens, with the same numbers in the index; square list markers and code
  with square corners; links with a fainter underline; a small orange square at the end of a
  text with sections. The page 404 takes the layout `page`, without index. No colour is
  added: the orange, the blue of the links and the greys are those of the site. The owner
  took it, "mi piace, mergiala a dev": Claude merged it into `dev` (#44).

Rules of the organization, carried over from thebox or from its issues (keep them unless the
owner decides otherwise):

- "Vai più avanti possibile da solo": Claude proceeds autonomously as far as it can; **the
  owner only merges the pull requests on `stage` and `master`** (Section 9).
- 2026-11-14 and 2026-11-15 (issue #5), "su ogni repo ci sia sempre un ramo dev che poi
  mergiano su staging e poi staging su master" and "usiamo stage per tutti i repo": `dev` into
  `stage`, `stage` into `master`, by pull requests (`CONTRIBUTING.md`, *Branches and pull
  requests*).
- 2026-11-23 (thebox v0.1.1), "dev va sempre squashata dentro stage (se c'è) e master, che
  poi vanno rimergiate dentro dev per evitare conflitti": pull requests along the chain `dev`,
  `stage`, `master` are **squash-merged**; right after each, the target is **merged back down
  the chain to `dev`** (`CONTRIBUTING.md`, *Branches and pull requests*). Pull requests of the
  branches of work into `dev` are not squashed: merge commit. Claude completes any missing
  merge back at the start of the work ("fallo sempre all'inizio se serve").
- SemVer releases at every merge on `master`; **Claude increments only minor or patch, a major
  only when the owner explicitly asks for it**, and never adds the `release:major` label on its
  own (`CONTRIBUTING.md`, *Versions and releases*).
- Every session closes, in the chat, with a short recap of what was done and of what is still
  missing.
- Code, tests, documentation, `README.md`, `CONTRIBUTING.md` and this file always aligned
  (Section 7).
- Confidential names and credentials never in the repository (Section 8).
- A devcontainer with everything needed, and the Playwright MCP server for visual checks
  (Section 10).

## 3. Language

- **Everything that lands in the repository is written in English** (`CONTRIBUTING.md`,
  *Writing style*).
  No deliverable of thesite is in another language so far; if the site gets pages in another
  language, list here which files follow it.
- **Reply to the user in the language they used.** Asked in Italian, answer in Italian in the
  chat, and still write English into the files.
- The writing style of `CONTRIBUTING.md` applies to the chat too, **em dash included**: never
  use one.

## 4. Repository map

| Path | Content |
|---|---|
| `README.md` | What the repository is and how to start |
| `CONTRIBUTING.md` | Rules shared by people and assistants (imported above) |
| `CLAUDE.md` | This file: instructions for assistants |
| `package.json` | The command surface: every command is an npm script (`CONTRIBUTING.md`, *Commands*) |
| `scripts/lib.sh` | Helpers shared by the shell scripts: repository root, `build/`, `$PY`, `log`, `warn`, `die`, `need`, `project_version` |
| `scripts/build.sh`, `test.sh`, `check.sh` | Build (the site into `build/pages/`), unit tests, every check (the entry points of CI) |
| `scripts/serve.sh` | Live preview of the site at `http://localhost:4000` (`npm run serve`; `npm run serve:stage` as the stage site, with its banners), with the bundle rebuilt on every change of `src/` |
| `scripts/bundle.sh`, `scripts/bundle.mjs` | esbuild bundles `src/globe/main.js`, three.js and Leaflet into `docs/assets/bundle/globe.js`, `src/notice/main.js` into `docs/assets/bundle/notice.js`, and `src/toc/main.js` into `docs/assets/bundle/toc.js` (generated, git-ignored), with the licences of three.js and Leaflet beside it, and the stylesheet and images of Leaflet (`leaflet.css`, `images/`); run by `build.sh` and `serve.sh`; in watch mode it touches the bundle a second after each build (Section 12) |
| `wrangler.jsonc`, `worker/` | The Worker of production (issue #2): static assets from `build/pages/`, custom domain `theplanet.observer`; `worker/index.js` runs only for `/api/*`, `worker/edits.js` serves `/api/osm-edits.json`, read at most every 19 minutes and cached |
| `scripts/worker.sh` | wrangler at a pinned version: `npm run worker:check` (dry run), `npm run worker:dev` (the site with the Worker at `http://localhost:8787`), and `deploy`, run by `production.yml` with the token and the account in the environment; each builds the site with `JEKYLL_ENV=production` and runs `check-site.py` before wrangler |
| `media/mascot/` | The mascot of the logo in 3D, not used by the site: the five files Meshy made (walking, running, rigged, without skeleton, preview; 20 MB), `provenance.json` and a `README.md` on what each may serve; kept for thegame (Section 2) |
| `scripts/meshy.py` | The mascot of the logo as a 3D model by the API of Meshy: Image to 3D, rigging, the GLB files and their provenance in `build/meshy/<date>/` (`npm run mascot:generate`) |
| `scripts/osm-activity.py` | The latest edits to OpenStreetMap for the globe, from the minutely replication of changesets, into `docs/_data/activity.json` (generated at every build, git-ignored; `npm run globe:activity`) |
| `scripts/land-mask.py` | The land mask of the globe, `docs/assets/globe/land.png`, from Natural Earth (`npm run globe:land`) |
| `scripts/install-skills.sh` | Claude Code skills installed for the user, pinned to a commit (Section 10) |
| `scripts/check-confidential.py` | Confidentiality guard (pre-commit hook and `npm run check`) |
| `scripts/check-template.sh` | Lists the `TEMPLATE` markers left; none since 2026-11-24, so `npm run check` runs it with `--strict` |
| `scripts/check-site.py` | Check of the built site: every local link and resource of `build/pages/` exists, none loads over `http` or from another host, the notice of privacy is on every page but `/privacy/`, a page with the map of OpenStreetMap links its copyright page, nothing unpublishable is published, and the banner of the stage site is at the top and at the bottom of every page of a build for stage and on no page of any other, by `JEKYLL_ENV` (`npm run check:site`) |
| `scripts/version.py` | Version, next version and release notes from the tags and the commits |
| `scripts/setup-python.sh` | `.venv/` from `requirements.txt`, reinstalled only when it changes |
| `tests/` | `unittest` checks of the harness scripts, of `check-site.py`, of `land-mask.py`, of `osm-activity.py`, of the permissions of the devcontainer, of the header of `README.md`, of the license and of the deploys (standard library only); `notice.test.mjs` (when the notice of privacy opens), `toc.test.mjs` (the index of the pages of text), `globe.test.mjs`, `replication.test.mjs`, `live.test.mjs` (the live edits and the Worker, against fakes), `transition.test.mjs` (the transition between Home and Map, and the first view of the map) and `route.test.mjs` (which links play it), with `node --test` |
| `src/globe/` | The globe of the home page and the map of Map: `geometry.js` (dots of the land, spikes, arcs, quality tiers, Web Mercator and the first view of the map; no three.js), `transition.js` (the transition between Home and Map over time; no DOM), `route.js` (which links play it; no DOM), `replication.js` (the replication of changesets: paths, parsing, merging; no DOM), `live.js` (every 19 minutes, the edits from the Worker or from the replication; shared with the Worker), `scene.js` (the three.js scene, and its opening into the map), `map.js` (the Leaflet map, created only when shown), `main.js` (the two views, the transition, the History API) |
| `src/toc/` | The index of the pages of text: `spy.js` (the section being read, where the index scrolls, how slowly; no DOM), `main.js` (builds it from the title and the headings, follows the reading) |
| `src/notice/` | The notice of privacy: `visit.js` (whether a visit starts, from the referrer and the type of navigation; no DOM), `main.js` (opens the dialog of `docs/_includes/privacy-notice.html`) |
| `package.json`, `package-lock.json` | Also the dependencies of the site, pinned: three.js, Leaflet and esbuild (Section 10) |
| `.devcontainer/` | `Dockerfile`, `devcontainer.json`, `post-create.sh` (Section 10) |
| `.vscode/` | Recommended extensions, settings, and every command as a task |
| `.mcp.json` | Project MCP servers for Claude Code: Playwright |
| `.claude/settings.json` | Project settings of Claude Code: the plugin marketplaces and plugins of the repository (Section 10) |
| `.githooks/pre-commit` | Confidentiality guard, enabled by `post-create.sh` |
| `.github/workflows/` | `ci.yml` (pull requests to `stage` and `master`), `stage.yml` (push to `stage`: the stage site on GitHub Pages), `release.yml` (merge on `master`; its job `production` calls `production.yml`), `production.yml` (the Worker at `theplanet.observer`, once `DEPLOY_PRODUCTION` is `true`), `new-year.yml` (1 January: starts `stage.yml` on `stage` and `production.yml` on `master`, so that the year of the notice moves on) |
| `.github/pull_request_template.md` | Checklist of every pull request |
| `.github/copilot-instructions.md` | Points GitHub Copilot to these conventions |
| `build/` | Every output (git-ignored): `build/release/`, `build/pages/` |

`LICENSE` is the MIT License of thesite, © 2024 Andrea Gallegati; the texts of the pages are
CC BY 4.0, the logo and the mascot are not licensed, third-party work keeps its own license
(`README.md`, *License*, Section 2, 2026-11-25). The license is not part of the harness.

The site, cleaned up on 2026-11-24 (`CONTRIBUTING.md`, *Conventions of this repository*):

| Path | Content |
|---|---|
| `docs/` | Jekyll 4.3 site: `_config.yml`, `Gemfile` and `Gemfile.lock` (Jekyll, and the three gems Ruby 3.3 warns about), `_layouts/` (`default`, `page`: the pages of text, with their index), `_includes/` (`head`, `sidebar`, `preview-banner`, the banner of the stage site, `privacy-notice`, `world`, Home and Map as two views of one document), `index.html` (the globe), `map.html` (the map of OpenStreetMap, the same document with the other view shown), `globe.md` (how the globe is made, in three sections, linked under it, not in the menu), `about.md`, `privacy.md` (the notice under the GDPR, Section 2), `404.html` (the layout `page`, without index); the menu lists the pages with a `nav_order` |
| `docs/_data/coverage.yml` | The places shown as orange rings on the globe (issue #1) |
| `docs/_data/activity.json` | The latest edits to OpenStreetMap, the orange spikes and arcs of the globe: generated at every build by `scripts/osm-activity.py`, git-ignored |
| `docs/public/` | The Hyde theme on Poole, third-party, MIT, with the dark colours of the project: its CSS, icons and `LICENSE.md`, published with them as the licence asks |
| `docs/assets/` | The project's own CSS (`theplanet.css`, `globe.css`, `fonts.css`, `notice.css`, `page.css`, loaded by the pages of text only, and `preview.css`, loaded by the stage site only), the fonts (`fonts/`: PT Sans and Roboto Mono, OFL 1.1, with their licence texts; third-party, committed), the logo, `globe/land.png` (generated by `scripts/land-mask.py` and **committed** as data of the site: it changes only with its source), and `bundle/` (generated by `scripts/bundle.sh`, git-ignored) |
| `media/` | Files of the repository that the site does not publish: `theplanetearth.png` (the image of `README.md`), `mascot/`, and `README.md`, the provenance of the logo (issue #19) |

## 5. Checks before reporting a change as done

1. `npm run build` succeeds and `npm run check` passes.
2. **Look at what changed**, do not only build it. For anything with a user interface, use the
   **Playwright MCP server** (`.mcp.json`): start the application or its preview, open it,
   take screenshots at 1280x800 and at 390x844, try the interactions the change touches, and
   check that there is no console error, no broken image or link and no horizontal scroll. MCP
   output goes to `.playwright-mcp/` (git-ignored).
3. When the change touches an output in another format (PDF, Office files, archives, images),
   build it and inspect it; say what was not verified.
4. Report results faithfully: if a check fails or was skipped, say so with its output.

For the site: `npm run serve` (or the task *Preview: site (live reload)*), then open
`http://localhost:4000` with the Playwright MCP server, the home page with its globe (drag it,
turn it with the arrow keys), Map from the menu and back (the transition both ways; in the
console `window.__globeSlow = 5` plays it five times slower), `/map/` loaded directly, and
`/about/` at least. Home must ask nothing of `tile.openstreetmap.org` before Map is followed. A change of the layout is looked at with
`npm run serve:stage` too (task *Preview: site as stage (live reload)*): the stage site has
its banners above and below the pages. After `npm run build`, `npm run check:site` checks the links and
resources of `build/pages/`, that nothing loads over `http` or from another host, that the
notice of privacy is on every page but `/privacy/`, that nothing unpublishable
(`README.md`, `CNAME`, `Gemfile`) is published, and the banner of the stage site: run it with
the `JEKYLL_ENV` of the build (`JEKYLL_ENV=stage npm run build`, then
`JEKYLL_ENV=stage npm run check:site`).

## 6. How to handle the owner's requests (permanent)

1. **Explain in the chat**, simply, with examples taken from the project.
2. **Make it clear in the repository too**, in the lightest way: a comment where the doubt
   arose, a line in `README.md`, a paragraph of the documentation.
3. **When new data or facts are needed**, look for them in primary or official sources, link
   them, and update **in cascade**: the data (the source of truth), the code that reads them,
   the documentation, then this file and `README.md`. Inconsistencies are reported, never
   resolved in silence.
4. **Close every request** with: build and checks green, screenshots when the appearance
   changed, the alignment rule checked (Section 7), then the commit, the push and the pull
   request, which the owner merges (Section 9), and the recap of what is still missing.

## 7. Alignment rule (mandatory)

Every change that alters what a user or a reader sees or does goes, **in the same commit or
pull request**, with:

1. the tests of the changed behavior;
2. the update of the documentation and of `README.md`;
3. the update of `CONTRIBUTING.md` when the workflow changes, and of this file (structure,
   commands, versions, known issues);
4. the update of the harness (devcontainer, tasks, workflows) when a command or a tool changes;
5. green checks (`npm run build`, `npm run check`).

## 8. Confidentiality: what Claude adds

The rules are in `CONTRIBUTING.md`, *Confidentiality*. In addition:

- Clones of other repositories, downloads and archives stay in the scratchpad or a temporary
  folder, never in this repository.
- Never paste a value read in a clone, a log or an environment (password, token, key, private
  address) into a file, a commit, a pull request or an issue. Name the file that holds it;
  list the value in `confidential-terms.local` so that the checks block it; tell the owner.
- Never print the content of `confidential-terms.local` in the chat or in a log.

## 9. Git: what Claude adds

- **Claude commits, pushes and prepares the pull request; the owner merges it.** When a
  request is done and the checks are green, Claude commits its changes on the working branch,
  pushes it and opens the pull request from `dev` to `stage`, or lets the open one grow when
  the work belongs to it; a separate piece of work goes on a new branch, merged into `dev`.
  Once the owner has merged into `stage` and checked the stage site, Claude may open the pull
  request from `stage` to `master` when the owner asks for a release.
- The working branch is **`dev`** unless the owner names another; a separate piece of work
  goes on a new branch from `dev`, whose pull request goes into `dev` and is merged with a
  merge commit.
- **Never merge a pull request into `stage` or `master` on your own initiative, push to
  `master`, force-push or rewrite pushed commits.** Merging is the owner's decision. When the
  owner asks Claude to merge a pull request, Claude squash-merges it with the subject and body
  that `CONTRIBUTING.md` describes (`gh pr merge --squash --subject ... --body ...`), then
  merges the target back down the chain. The only push to `stage` outside a pull request is
  the merge back of `master` into it. The rulesets of issue #25 enforce part of this on
  GitHub, but the token of a Codespace may bypass them as the owner
  (`current_user_can_bypass: always`): GitHub does not stop Claude, this rule does.
- **Before working on `dev`**, fetch and complete any merge back the chain lacks (`master`
  into `stage`, `stage` into `dev`): the owner may have squash-merged a pull request without
  merging it back. Merging them into the working branch is always allowed.
- **Stage only your own changes.** When the working tree holds changes Claude did not make,
  ask before committing them; files the owner staged stay staged, never unstage them
  (`git reset`, `git restore --staged`). Move files with plain `mv`: git detects the rename.
- Never bypass the hooks (`--no-verify`, `git add -f`).
- Attribution: every commit written by Claude ends with the trailer
  `Co-Authored-By: Claude <model name> <noreply@anthropic.com>` (the model in use), and every
  pull request description ends with the line
  `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.

## 10. Environment

- **Devcontainer** (`.devcontainer/`): Ubuntu 24.04 (`mcr.microsoft.com/devcontainers/base:noble`)
  with Python 3 and its `venv`; Node, GitHub CLI and Claude Code as features. More system
  packages go in the `EXTRA_PACKAGES` build argument of `devcontainer.json`; a tool that needs
  more than a package gets an install script in `scripts/`, used by the `Dockerfile` and by
  the workflows, so that the devcontainer and CI install the same version.
- `post-create.sh` enables the git hooks (`core.hooksPath .githooks`), runs `npm ci` and
  `npm run setup:python` when the repository has a `package-lock.json` or a
  `requirements.txt`, installs the Chromium of the Playwright MCP server, the gems of the
  site (`docs/Gemfile.lock`) and the skills of the user (`scripts/install-skills.sh`), and
  runs a first build.
- **Ruby 3.3** for the site: the devcontainer feature `ghcr.io/devcontainers/features/ruby`
  and `ruby/setup-ruby` in the workflows, both on the latest 3.3 release. Jekyll 4.3.3 of
  `docs/Gemfile.lock` does not start on Ruby 3.4 (`csv` is no longer a default gem): moving
  to 3.4 means updating Jekyll first.
- **Ports**: 4000, the preview of `npm run serve` (opened in the VS Code preview); 35729, its
  live reload (works in VS Code desktop; in a browser, reload by hand).
- **Skills and plugins of Claude Code**: `.claude/settings.json` declares the marketplace of
  `ui-ux-pro-max` and enables the plugin (Claude Code asks to install it when the folder is
  trusted; `/plugin` shows it); `scripts/install-skills.sh` copies `security-audit` of
  Cloudflare into `~/.claude/skills/`, so that nothing of it lands in the repository (issue
  #4).
- The devcontainer requests **read access to every repository of the organization and write
  on their `issues`** (`customizations.codespaces.repositories`), so that an assistant can
  read the repositories this one depends on and ask them for changes with issues (Section
  2); it cannot push to them nor open pull requests there. GitHub asks the user to authorize
  them when a Codespace is created; the caution at the top of `README.md` lists what they
  allow, and is updated in the same change as the permissions
  (`tests/test_devcontainer_permissions.py` checks both). thebox issue #2 proposes the same
  for every repository, with write on `pull_requests` too, from the owner's decision of
  2026-11-15; thesite asks for `issues` only, as the owner asked.
- **Extensions** (`devcontainer.json` and `.vscode/extensions.json`, kept identical): Claude
  Code, Git Graph (branches and release tags), GitHub Actions, Markdown Mermaid, Code Spell
  Checker, Python.
- **MCP** (`.mcp.json`, project server for Claude Code): `@playwright/mcp`, headless isolated
  Chromium, viewport 1280x800, output in `.playwright-mcp/`.
- **Pinned versions** (bump deliberately, and update this table in the same change):

| Tool | Version | Where |
|---|---|---|
| Base image | Ubuntu 24.04 (`devcontainers/base:noble`) | `.devcontainer/Dockerfile` |
| Node | 24 (package.json accepts 22 or later) | `devcontainer.json`, workflows |
| @playwright/mcp | 0.0.84 | `.mcp.json` |
| GitHub Actions | `checkout@v7`, `setup-node@v7`, `upload-artifact@v7`, `configure-pages@v6`, `upload-pages-artifact@v5`, `deploy-pages@v5` (all on Node 24; `release.yml` and `stage.yml` without dependency cache) | `.github/workflows/` |
| Ruby | 3.3 (`ruby/setup-ruby` v1.338.0, pinned by commit `b3aacea`) | `devcontainer.json`, workflows |
| Jekyll | 4.3.3, with the gems of `docs/Gemfile.lock` (Bundler 2.5.6) | `docs/` |
| Mascot | Meshy Image to 3D, `ai_model: latest` (Meshy 7.1 in 2026-11), then rigging; tasks and parameters in `media/mascot/provenance.json`, 2026-11-24, 35 credits | `scripts/meshy.py` |
| three.js | 0.187.0 (MIT), bundled by esbuild 0.28.2 (MIT); exact versions in `package.json` | `package.json`, `package-lock.json` |
| Leaflet | 1.9.4 (BSD 2-Clause), bundled by esbuild; its stylesheet, images and licence copied by `scripts/bundle.sh` | `package.json`, `package-lock.json` |
| Map tiles | the Standard tiles of OpenStreetMap, `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, the URL their tile usage policy asks for | `docs/_config.yml` (`map.tiles`) |
| Fonts | PT Sans 400, 400 italic, 700 and Roboto Mono 400, 700, latin and latin-ext, from `@fontsource/pt-sans` and `@fontsource/roboto-mono` 5.3.0 (`npm pack`, not dependencies), OFL 1.1 | `docs/assets/fonts/`, `docs/assets/css/fonts.css` |
| OpenStreetMap edits | the minutely replication of changesets, `https://planet.openstreetmap.org/replication/changesets/` (redirects to a mirror on S3): the edits closed in the 20 minutes before its last run (`WINDOW_MINUTES`), read from the files of 22 minutes, at most 3000: at every build, then every 19 minutes the Worker of production for every visitor, or the browser where there is no Worker (only the files not read yet) | `scripts/osm-activity.py`, `src/globe/live.js`, `worker/edits.js` |
| wrangler | 4.168.0, through `npx` (not a dependency of the site); `compatibility_date` 2026-11-24 | `scripts/worker.sh`, `wrangler.jsonc` |
| Natural Earth | v5.1.2, 1:50m land (public domain), the source of `docs/assets/globe/land.png` | `scripts/land-mask.py` |
| Plugin `ui-ux-pro-max` | v2.15.0 of `nextlevelbuilder/ui-ux-pro-max-skill` (MIT; its manifest at that tag says 2.13.0) | `.claude/settings.json` |
| Skill `security-audit` | commit `c1c8a8c` (2026-09-14) of `cloudflare/security-audit-skill` (MIT) | `scripts/install-skills.sh` |


## 11. Keeping in step with thebox

The harness (this file's structure, `CONTRIBUTING.md`, `.devcontainer/`, `.vscode/`,
`.githooks/`, `.github/`, `.mcp.json`, the scripts listed in Section 4, `tests/` of the
harness) comes from thebox, which is versioned and released like any other repository.

- What is specific to this repository goes in the spots marked `TEMPLATE` (resolved by
  replacing the marker with the content), so that the rest of each file can follow a new
  version of thebox with a plain diff. `npm run check:template -- --list` shows the markers
  left.
- An improvement that is useful to every repository is made in thebox first, then brought
  here (`README.md` of thebox, *Updating a repository*).
- This repository follows thebox **v0.1.2** (commit `d7b22c9`, 2026-11-23), adopted on
  2026-11-23. It was first set up from the archive `thebox-master.zip`, commit `db3b47c`,
  which is **v0.1.0** (`gh api repos/theplanet-earth/thebox/tags`); the update to v0.1.2
  brought v0.1.1 (`22cd1b6`: no `python.defaultInterpreterPath`, squash merges along the
  chain and their merges back, counted once by `scripts/version.py`) and v0.1.2 (`d7b22c9`:
  tests of the chain `dev`, `stage`, `master` and of branches merged into `dev`). Compute the
  diff of the next update from `v0.1.2`.
- Changes made here outside the `TEMPLATE` markers, to carry over by hand at the next update
  (and to propose to thebox where they are useful to every repository): the branch model
  `dev`, `stage`, `master` of issue #5, a rule of the whole organization (`ci.yml` triggers,
  `CONTRIBUTING.md`, *Branches and pull requests*, Sections 2 and 9 of this file); the
  workflows `stage.yml`, `production.yml` and `new-year.yml`; the note on `PUBLISH_PAGES` and the job `production` in `release.yml`; the Ruby step of the
  workflows; `scripts/serve.sh`, `scripts/install-skills.sh` and `.claude/settings.json`;
  the permissions of `devcontainer.json` on the organization, with the caution of
  `README.md`, `tests/test_devcontainer_permissions.py` and the paragraphs of
  `CONTRIBUTING.md` (*Getting started*, *Changes another repository needs*), a subset of
  the patch of thebox issue #2, not yet in a release of thebox.

## 12. Known issues and TODO

- **Access to the organization from a Codespace**: the token of a Codespace reads the
  repositories its devcontainer requested **when the Codespace was created**, and only if the
  user authorized them then; a rebuild does not renew them. Create a new Codespace, or export
  a fine-grained token with read access as `GH_TOKEN`, which `gh` prefers. The token of a
  Codespace cannot list the packages of the organization on the GHCR (HTTP 403), nor see
  workflow runs older than GitHub's retention. The Codespace created on `dev` on 2026-11-23,
  with the access authorized, reads thebox but cannot open issues there: on 2026-11-24
  `gh issue create` in thebox answered HTTP 403, "Resource not accessible by integration".
  Write on issues needs a Codespace created after the change of the devcontainer of
  2026-11-24, with the access authorized: GitHub applies changed permissions to new
  Codespaces only, "even if you rebuild the codespace"
  ([GitHub documentation](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-repository-access-for-your-codespaces)).
  **Correction of 2026-11-25**: this note said that a Codespace created on 2026-11-25 had
  it, from one request to thegame. The Codespace in use then was the one of 2026-11-23,
  rebuilt (its clone dates from 2026-11-23 23:18; `creation.log` records the rebuild at
  21:07), and requests without a title, which create nothing, show what its token may do:
  HTTP 422 ("title wasn't supplied") in the public repositories (thesite, thegame,
  theaction, mixamo-in-playcanvas), HTTP 403 "Resource not accessible by integration" in the
  private ones (thebox, thestory, thejungle, thepipeline, thedeal). Issues in the private
  repositories need a Codespace **created**, not rebuilt, after the change: confirmed on
  2026-11-25 by a Codespace created after commit `94c6aa0` (its clone and `creation.log`
  both start at 22:05 UTC that day, with a single creation of the container), whose token
  answered HTTP 422 in thebox and opened the issues of the 12 private repositories (the
  license of every repository, in the open points below).
- **Git LFS hooks**: Codespaces writes Git LFS hooks in `.git/hooks` that abort every push when
  `git-lfs` is not installed; `core.hooksPath .githooks` makes git ignore them.
- **Python interpreter in VS Code**: `.vscode/settings.json` does not set
  `python.defaultInterpreterPath`. When that path does not exist, the Python Environments
  extension (`ms-python.vscode-python-envs`, installed with `ms-python.python`) warns at every
  start ("Default interpreter path ... could not be resolved"): `.venv/` is missing in a
  repository without `requirements.txt`, as this one, and on the first start of a Codespace,
  because `postCreateCommand` runs after the editor has connected
  ([`waitFor`](https://containers.dev/implementors/json_reference/)). Without the setting, the
  extension chooses the `.venv/` of the workspace, otherwise the `python3` of the system
  ([startup flow](https://github.com/microsoft/vscode-python-environments/blob/main/docs/startup-flow.md)).
  A `.venv/` created while a window is open is chosen with *Python: Select Interpreter*.
- **First start of a Codespace**: `post-create.sh` runs after the editor has connected and
  takes about three minutes; until it ends, `~/.claude/skills/security-audit` and `build/` do
  not exist yet. `/workspaces/.codespaces/.persistedshare/creation.log` shows its progress.
- **Plugin `ui-ux-pro-max`**: `.claude/settings.json` declares it, but on 2026-11-23 the
  Claude Code extension of VS Code installed neither the marketplace nor the plugin in a new
  Codespace (`claude plugin list`: "No plugins installed"). Start `claude` in a terminal at
  the root of the repository, trust the folder and accept the marketplace and the plugin it
  offers (pinned to v2.15.0 by `.claude/settings.json`); `/plugin` shows them. Then start a
  new session. On 2026-11-26 the plugin was still not installed (`installed_plugins.json`
  empty), but its marketplace was cloned in `~/.claude/plugins/marketplaces/ui-ux-pro-max-skill`
  (tag v2.15.0), and the search of the skill runs from there:
  `python3 <clone>/.claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain ux`
  (not `python3 -I`, with which it does not find its own modules).
- **Stale `.venv/`**: a `.venv/` that survives a change of image keeps a dangling interpreter
  link; `scripts/setup-python.sh` recreates it with `--clear`.
- **The mascot from Meshy** (2026-11-24):
  - **inconsistency, reported**: `scripts/meshy.py` asks for `pose_mode: t-pose`
    ([Image to 3D](https://docs.meshy.ai/en/api/image-to-3d)), but the model kept the walking
    pose of the logo; the rigging worked all the same (24 bones, walking and running clips);
  - only `mascot-walking.glb` and the preview are committed, in `media/mascot/`; the model
    without skeleton, the rigged model and the running clip stay in `build/meshy/2026-11-24/`
    of the Codespace that made them, and Meshy deletes its copies on 2026-11-27;
  - its skeleton is in centimetres under an `Armature` scaled 0.01, and the mesh is turned
    against it (`media/mascot/README.md`).
- **The edits of OpenStreetMap** come from the minutely replication of changesets, not
  from the API: the API is "provided in order to edit the map data, **not** for read-only
  purposes or projects" ([API usage policy](https://operations.osmfoundation.org/policies/api/)).
  The window is the same everywhere (owner, 2026-11-25): the edits closed in the 20 minutes
  before the replication last ran, read from the files of 22 minutes (a changeset appears in
  the file of a minute or two after it closes), about 5 KB each; their number follows how busy
  the map is, and the caption shows it, never the window; `/globe/` names the window. A build reads them once. Then,
  every 19 minutes while the globe is shown and the tab visible, the browser asks
  `/api/osm-edits.json`: in production the Worker answers from the cache of Cloudflare, and
  reads the replication itself (22 files) at most every 19 minutes per data centre; where
  there is no Worker (the stage site on GitHub Pages, the preview), the browser reads the
  files it has not read yet, one at a time. The server and its mirror on S3 answer
  `Access-Control-Allow-Origin: *` (checked on 2026-11-24). No user, comment or tag is kept,
  only the centre of each changeset rounded to 0.01 degree, its number of changes and its
  time; changesets spanning more than 1 degree are left out.
  - No page of OpenStreetMap says how many clients may read the replication (the front page
    of planet.openstreetmap.org and `/replication/`, read on 2026-11-24): hence the Worker,
    which reads it once for all the visitors of a data centre.
  - The attribution "© OpenStreetMap contributors" stays next to the globe, visible without
    interaction: the guidelines want it "in the vicinity of the produced work" and not behind
    an interaction ([Attribution Guidelines](https://osmfoundation.org/wiki/Licence/Attribution_Guidelines));
    the other credits, which have no such rule, are on `/globe/`.
- **The preview kept an older bundle** (2026-11-24): Jekyll copies a file into
  `build/serve/` only when its time of modification moves, and two builds of esbuild within
  the same instant left the preview serving the first; the globe of the preview then did not
  read the edits. `scripts/bundle.mjs` touches the bundle a second after each build of the
  watch, and the pages ask for the bundle and the styles with `?v=` and the time of the
  build, so that no browser keeps an older copy. If it happens again: `touch
  docs/assets/bundle/globe.js`.
- **The Worker** (checked with wrangler 4.168.0 on 2026-11-24: `deploy --dry-run`, and
  `wrangler dev`, which read 120 edits and served the second call from the cache): the
  runtime takes every named export of the main module for an entrypoint and refuses the
  others ("Incorrect type for map entry"), so `worker/index.js` exports only its default
  handler and the rest lives in `worker/edits.js`.
- **esbuild and npm 11**: `npm ci` warns that the install script of esbuild is "not yet
  covered by allowScripts" and does not run it. esbuild works without it: its binary comes
  from the optional package of the platform (`@esbuild/linux-x64`), and the script only
  checks it. Nothing to approve.
- **Playwright MCP browser**: `@playwright/mcp` pins its own Playwright, which may expect a
  Chromium revision other than the one of the project; `post-create.sh` installs the one it
  needs. If it is missing, the MCP tool `browser_install` installs it.

- **GitHub Pages** (GitHub API, `GET /repos/theplanet-earth/thesite/pages` and
  `.../environments/github-pages`, 2026-11-23 and 2026-11-25): build type *GitHub Actions*,
  custom domain `theplanet.wtf`, the stage site, HTTPS enforced. The `github-pages`
  environment accepts deployments from `stage` only (set by the owner on 2026-11-23, issue
  #7); since 2026-11-25 every push to `stage` deploys it.
- **Both domains reach the site** (checked on 2026-11-25, issues #2 and #6, closed):
  `https://theplanet.wtf/` answers 200 from GitHub Pages, and
  `https://theplanet-earth.github.io/thesite/` 301 to it; `https://theplanet.observer/`
  answers 200 from the Worker `thesite`, whose custom domain created its DNS records and its
  certificate at the first deploy (`v0.2.0`), and `/api/osm-edits.json` 200. Until then the
  stage domain answered Cloudflare's "DNS points to prohibited IP"
  ([Error 1000](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-1xxx-errors/error-1000/)).
  The email records against spoofing (SPF `v=spf1 -all`, DMARC `p=reject`, an empty DKIM
  key and a null MX, issue #3) are on both domains: on `theplanet.wtf` since 2026-11-24, on
  `theplanet.observer` since 2026-11-25, after the first deploy as the owner chose, without
  harm to the custom domain of the Worker (`dig` and HTTP 200, 2026-11-25).
- **HTTPS and DNSSEC of the domains** (issue #3, checked from outside on 2026-11-25 with
  `curl` and DNS over HTTPS through `1.1.1.1` and `8.8.8.8`): `http://theplanet.observer/`
  answered 200 in plain HTTP until the owner turned on *Always Use HTTPS* in its zone; it
  now answers 301 to `https://`, the path and the query kept, and the site and
  `/api/osm-edits.json` still 200. `http://theplanet.wtf/` answers 301 from GitHub Pages
  (*Enforce HTTPS*). DNSSEC is on for `theplanet.observer`, `theplanet.wtf` and
  `theplanet.dev`: each zone answers its DNSKEY (algorithm 13) and a CDS record; the three
  are registered with Cloudflare Registrar (RDAP), which reads the CDS and sends the DS
  record to the registry within one to two days
  ([documentation](https://developers.cloudflare.com/registrar/get-started/enable-dnssec/)).
  The registries published it by 2026-11-27 (checked the same way, at 00:19 UTC, issue #3):
  in each of the three, the DS answers `2371 13 2` with the digest of the CDS of the zone,
  and `1.1.1.1` and `8.8.8.8` answer the DS, the A records of both sites and the MX of
  `theplanet.dev` with the flag AD, so validating resolvers now check them; both sites still
  answer 200. No site sends `Strict-Transport-Security`: HSTS is postponed (Section 2).
  Checked from outside on 2026-11-27, and written into the description of issue #3, which
  since then shows only what is done and what is left (the original checklist is in its
  edit history):
  - **Universal SSL stays on** (point 6 of #3): `theplanet.observer` serves a certificate of
    Google Trust Services for the apex and `*.theplanet.observer`, the coverage of Universal
    SSL, and disabling it without an advanced or custom certificate leaves HTTPS without one
    ([documentation](https://developers.cloudflare.com/ssl/edge-certificates/universal-ssl/disable-universal-ssl/)).
  - **The domains expire** on 2027-03-13 (`theplanet.wtf`), 2027-03-21 (`theplanet.dev`) and
    2027-05-11 (`theplanet.observer`), by RDAP; Cloudflare Registrar turns auto-renew on by
    default and tries 30 days before
    ([documentation](https://developers.cloudflare.com/registrar/account-options/renew-domains/)),
    which the owner checks in the dashboard.
  - **The apex and `www` of `theplanet.dev`** have proxied A and AAAA records that answer
    Cloudflare's Error 1000, "DNS points to prohibited IP": they point at an address of
    Cloudflare. No site lives there; Email Routing needs only its MX, SPF and DKIM records.
  - **The certificate of GitHub Pages** for `theplanet.wtf` and `www.theplanet.wtf` is
    approved until 2027-02-22, with *Enforce HTTPS* (API): the first condition of the proxy
    of `theplanet.wtf` is met. Behind the proxy GitHub may fail to renew it, and under *Full
    (strict)* Cloudflare would then answer 526: not verified; #3 says how to watch it.
- **The yearly rebuild** (`.github/workflows/new-year.yml`, 2026-11-25): GitHub runs a
  schedule only from the default branch, so it works since the file reached `master` with
  `v0.2.0` (*New year* is active); the run then has the ref of `master`, and the environment
  `github-pages` accepts `stage` only, so it starts `stage.yml` on `stage` by
  `workflow_dispatch`, which the `GITHUB_TOKEN` may trigger; it starts `production.yml` on
  `master` too, which deploys only while `DEPLOY_PRODUCTION` is `true`. In a public repository
  GitHub disables a schedule after 60 days without activity: after a quiet autumn, check in
  *Actions* that *New year* is enabled, or run it by hand on 1 January
  ([GitHub Docs](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)).
- **`PUBLISH_PAGES` stays unset** in this repository: the GitHub Pages site here is the stage
  site, and `release.yml` would publish `master` on it.
- **The map of the page Map** (2026-11-26, Section 2):
  - **The tiles** are the Standard tiles of OpenStreetMap, within their
    [tile usage policy](https://operations.osmfoundation.org/policies/tiles/) (read on
    2026-11-26): the URL `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, kept in
    `docs/_config.yml` as the policy recommends; only the tiles of the view on screen, and none
    before the map is shown: Home creates the map when its link is followed (Playwright: no
    request to the tile servers on Home, 16 when the map opens at 1280x800); no prefetch and
    nothing offline, which the policy forbids, so no proof of concept in an artifact of
    claude.ai, whose pages may load no image of another host; the credit on the map (Leaflet)
    and under it, which `check-site.py` checks.
  - **The Referer**: the tile servers answer "Access blocked" without it
    ([wiki](https://wiki.openstreetmap.org/wiki/Blocked)). The port forwarding of Codespaces
    serves pages with `Referrer-Policy: same-origin` (read from its answers on 2026-11-26),
    which sends none to another host: a preview opened at `*.app.github.dev` got the blocked
    tile everywhere. `src/globe/map.js` gives every tile `referrerPolicy:
    'strict-origin-when-cross-origin'`, so that the origin of the site goes with it whatever
    the page says; the sites send no `Referrer-Policy` (`docs/_includes/head.html`, the Worker).
  - **The privacy of the tiles**: the
    [privacy policy of the OpenStreetMap Foundation](https://osmfoundation.org/wiki/Privacy_Policy)
    (edited on 25 January 2026, read on 2026-11-26) says the tiles come from "a global network
    of cache servers" of a content distribution network it does not name, and leaves the data
    of tile requests out of its statement that it keeps data in the United Kingdom and the
    Netherlands: where they are kept is not said. `docs/privacy.md` says exactly that; the
    answers of `tile.openstreetmap.org` carry `via: 1.1 varnish` and `x-served-by: cache-ams-...`
    (one request, 2026-11-26), which name no provider either.
  - **Fractional zooms**: the first view of the map is at `log2(width / 256)`, between two
    zooms of the tiles, where Leaflet 1.9 leaves hairlines between tiles; its own fix,
    `mix-blend-mode: plus-lighter` (`leaflet.css`), turned the joins white here, together with
    the rounded corners that `poole.css` gives every image. `assets/css/globe.css` squares the
    tiles, draws them normally and makes them half a pixel larger.
  - **The opened globe stops at 83 degrees** of latitude, Web Mercator at 85.05: above the top
    of the map box on the screens measured (81.5 degrees at 1280x800), so the two meet; on a box
    as high as three quarters of its width the top reaches 82.4 degrees.
  - **During the transition** the canvas of the globe covers the window (it draws only, under
    the sidebar), at the pixel ratio of its quality tier; it goes back to the box of the globe
    at the end, and under the map it stays until the tiles of the first view have loaded.
  - **`/globe/` does not mention the map**: it had 31 pixels left at 1024x768, less than a
    line, and must fit one window (Section 2); Leaflet is credited on the map itself and in
    `README.md`, *Credits*, its licence published next to the bundle.
  - **Found on the way, and fixed**: on a narrow window the pointer over the logo of the
    sidebar made it jump at every frame. `.sidebar-logo:hover` set `display: block`, above the
    flex of narrow screens: the mascot stacked over the logotype, the logo left the pointer and
    came back (`assets/css/theplanet.css`).
- **What the preview shows** (`npm run serve`, Playwright at 1280x800 and 390x844, and at
  1440x900 and 1024x768 for the height, 2026-11-24; screenshots in `.playwright-mcp/`,
  git-ignored): the home page ("Global reach") fits one window, without scrolling, as
  `/globe/` did until 2026-11-26; the menu lists Home, Map, About and Privacy, then the icon of GitHub, on one row
  under the logotype (gaps of 0.65rem since Map, 2026-11-26); on narrow screens the
  sidebar is a single row, with the mascot and the logotype 56 pixels high and aligned
  (2026-11-25), down to 385 pixels (the gaps narrow below 426, so that 390 keeps one row);
  below, as at 360 and 320, two centred rows, the mascot and the logotype, then the menu
  (measured with Playwright, 2026-11-26); the page Map fits one window too, on the stage
  site between its banners (1280x800, 1024x768, 800x600); no console error from the site,
  no broken link, no horizontal scroll. Fixed on the way:
  the tiles of CARTO, which now need a key ([CARTO](https://carto.com/basemaps/apikey)),
  until the globe replaced the map; `/about/` without style (links relative to the page);
  the click towards `https://enjoy.theplanet.wtf`, a name with no DNS record, gone with the
  map; the demo text of Hyde; the title of the pages and the links, of low contrast on the
  dark grey; the fonts over `http`; `maximum-scale=1`, which stopped zooming on phones.
  The stage site (`npm run serve:stage`, 2026-11-25, the same four sizes and 768x1024): on
  wide screens each banner is one line 2rem high at its edge of the window, 22 pixels in a
  window less than 800 pixels high; the sidebar fits between them, and the home page gives
  them its vertical padding. On 390x844 each takes two lines, the top one scrolling away with the row of the
  sidebar, the bottom one ending the page. Still no scroll, no scrollbar in the sidebar, no
  console error. **Found on the way, not fixed**: below about 720 pixels of height the
  sidebar of the production site scrolls a little (7 pixels at 1024x688, 17 at 1280x640, 26
  at 1024x600); the stage site does the same with the height of its banners less (4 pixels
  at 800x600). To decide with the owner.
  The pages of text (2026-11-26, `/privacy/`, `/about/` and `/globe/` at 1920x1080, 1280x800,
  1200 and 1199 wide, 1024x768 and 390x844, as on dev and as the stage site): 57 to 76
  characters a line, 69 in the middle, on `/privacy/`; the index beside the text from 1200
  pixels (the text 510 pixels wide there, 540 from 1230), and a list of the sections under
  the title below, on `/about/` none, since it has one section. While the page scrolls, the
  index stays 2rem under the top of the window (under the banner on the stage site), marks
  the section whose heading passed 30% of the window, the last one at the end of the page,
  and an entry chosen by a click or by the address of the page until the reader scrolls. In a
  window of 1280x420 the index, higher than the window, scrolled by itself to keep the marked
  entry in its middle, its hidden edges faded, and the wheel over it scrolled it alone; where
  it fits, the wheel over it scrolls the page, which `overscroll-behavior: contain` had
  stopped in Chrome until it was kept to an index that overflows. A heading reached from the
  index stops 1.5rem under the top of the window, or under the banner; with reduced motion the
  page jumps instead of scrolling. No horizontal scroll, no console error.
  With the look of 2026-11-27 (Playwright at 1440x900, 1280x800, 1024x768 and 390x844, as on
  dev and as the stage site, every page): the home page still fits one window with Global
  reach in capitals, and goes to Map and back; the section numbers stand in the margin from
  768 pixels, before their headings below; no horizontal scroll, no console error.
- **Merge settings of the repository** (GitHub API, 2026-11-25, issue #7, closed): squash
  and merge commits allowed, rebase off; squash title `PR_TITLE` and message `BLANK`, as
  `CONTRIBUTING.md` expects.
- **Rulesets** (GitHub API, `GET /repos/theplanet-earth/thesite/rulesets`, 2026-11-25, set by
  the owner, issue #25): `chain` (id 28115089) on `stage` and `master`, with *deletion*,
  *non_fast_forward*, *pull_request* (squash only, 0 approvals) and *required_status_checks*
  (`check` of GitHub Actions, not strict); `dev` (id 28115148) on `dev`, with *deletion* and
  *non_fast_forward*; both active, bypassed always by the role *Repository admin* (actor 5),
  and the API answers `current_user_can_bypass: always` to the token of the Codespace.
  `chain` also held `require_extra_approval_for_unattributed_changes: true`, which the table
  of #25 did not list; reported, the owner turned it off the same day (`false`, ruleset
  updated at 22:47 UTC). The first merge back of `master` into `stage` under them
  (`7b74f29`, 2026-11-25, 23:21 UTC, after #40) was pushed from a Codespace with its token:
  GitHub accepted it and named the rule it bypassed ("Required status check "check" is
  expected."), so nothing needs adjusting; issue #25 is closed.
- **The labels** `release:major`, `release:minor` and `release:patch`, read by `ci.yml` and
  `release.yml`, exist since 2026-11-25 (issue #26, closed); none is on a pull request.
- **The address of the page *Privacy*** (2026-11-25, checked from outside): `privacy@theplanet.dev`
  is forwarded by Cloudflare Email Routing (Compute, Email Service, Email Routing; a routing
  rule *Send to an email* to the owner's verified inbox), and a test message arrived. The
  DNS of `theplanet.dev` holds the three MX records of Cloudflare (`route1` to `route3.mx.cloudflare.net`),
  the SPF `v=spf1 include:_spf.mx.cloudflare.net ~all`, the DKIM `cf2024-1._domainkey`, and
  the DMARC `v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s`, as on `theplanet.wtf`: nothing
  is sent from `theplanet.dev`. Email Routing only forwards
  ([documentation](https://developers.cloudflare.com/email-service/configuration/email-routing-addresses/)):
  a reply leaves from the owner's own address, and sending as `privacy@` would need a
  sending service, with its SPF and DKIM, before the DMARC lets it through. The owner
  approved the page on 2026-11-25 ("perfetta, va benissimo"). Mail servers of Cloudflare
  refuse SMTP connections from a Codespace (its address of Azure is on a blocklist), so an
  address is tested by sending it a message from another account.
- **The data of the visitors** (2026-11-25, `docs/privacy.md`): checked on the code and on
  both live sites, the site sets no cookie (no `Set-Cookie` on `theplanet.observer` nor on
  `theplanet.wtf`) and stores nothing in the browser. Until then every page loaded its fonts
  from Google Fonts, which received the address of every visitor: the Landgericht of Munich
  awarded damages for that on 20 January 2022 (3 O 17493/20,
  [text](https://www.gesetze-bayern.de/Content/Document/Y-300-Z-GRURRS-B-2022-N-612)),
  because the fonts could be served by the site; now they are, and `check-site.py` fails on
  any resource of another host. What other hosts still receive is said on the page: the
  servers of the site (Cloudflare, GitHub Pages), the reports of Network Error Logging that
  Cloudflare asks of browsers (`NEL` and `Report-To` headers on `theplanet.observer`), and
  the replication of OpenStreetMap, read by the browser on stage (it redirects to the bucket
  `osm-planet-eu-central-1` on Amazon S3, Frankfurt) and in production only when the Worker
  does not answer the first time. Found on the way, and reported rather than kept:
  - the prototype loaded **Abril Fatface** from Google, but no rule uses it (`hyde.css` has
    it commented out): it is not served any more;
  - Google Fonts served the Cyrillic subsets of PT Sans and Roboto Mono too; the site, in
    English, serves latin and latin-ext only;
  - **inconsistency, reported**: the licence of Roboto Mono is the SIL Open Font License 1.1
    in the repository of Google Fonts (`ofl/robotomono/OFL.txt` of `google/fonts`) and in
    the package `@fontsource/roboto-mono` 5.3.0, while older third-party pages give the
    Apache License 2.0, under which Google first published it; the site follows the
    repository of Google Fonts.

Open points:

- [ ] Optional, owner: turn off Network Error Logging on the zone of `theplanet.observer`;
  the page *Privacy* then no longer needs to name it.
- [ ] Owner, at any time (issue #3): confirm two-factor authentication on the Cloudflare
  account; check the auto-renew of the three domains; remove the A and AAAA records of the
  apex and `www` of `theplanet.dev` (Error 1000) or point them at a site; export the records
  of the three zones and compare them with those of #3.
- [ ] Owner, postponed (Section 2): HSTS, first without `preload`, and with it the proxy of
  `theplanet.wtf`, after SSL *Full (strict)* and a change of `docs/privacy.md` (Cloudflare
  would receive the visits of stage too). Later, the rotation of the token of production
  before about 2027-11-25. Issue #3 stays open for them, with the plan of each.
- [ ] Older issues to plan with the owner: #1 (coverage map: colours from an API,
  click to explore), #4 (security audit with the skill, profile `quick`, findings only as
  private advisories), #18 (a section of the site with a Leaflet map).
- [ ] The globe on the home of both sites (Section 2), released in `v0.2.0`. Issue #1 stays
  open for what it asked first: the colours of the coverage from an API not defined yet, and
  the click towards `explore.<domain>`, a site that does not exist yet.
- [ ] The mascot from Meshy (Section 2): kept in `media/mascot/` for thegame. Owner: whether to
  keep the other files of `build/meshy/2026-11-24/` (the running clip, the rigged model), and
  whether thegame wants it: asked in thegame#11 (2026-11-25), the easter egg of the mascot
  walking, with the files, how to load them and their rights.
- [ ] The license of every repository (owner, 2026-11-23): thesite decided on 2026-11-25
  (Section 2) and released it in `v0.2.0` (issue #10, closed). The same issue, "Change the
  license: candidate licenses compared", is open since 2026-11-25 in every other repository
  of the organization: thebox#11, which holds the overview (a row and a link for every
  issue) and the proposal of a common policy; the other private ones, thestory#7,
  thejungle#6, thepipeline#7, thedashboard#14, thehumongous#9, theburden#7, theshort#5,
  thedeal#11, theblend#3, theosm#12 and thepianist#8; the public ones, theaction#9,
  thegame#10 and mixamo-in-playcanvas#3. Every issue of the series, #10 included, links the
  issue of thebox, and a comment on #10 links it too. Before the 12 private ones were
  opened, the facts their texts give (the license of each branch, the branches of work, the
  issues they cite, the manifests) were checked again on 2026-11-25: none had changed since
  2026-11-23. The private artifact that kept the script and the texts while the series was
  opened, "License Issues Kit", was deleted by the owner on 2026-11-25, once every issue
  existed: the issues are the record, and the overview of thebox#11 lists them all. Now the
  owner decides, repository by repository; each issue is closed by the pull request that
  changes the license there.
- [ ] The logo (owner, 2026-11-25, "segnati queste due cose per ricordarmele"): it was
  generated with an AI tool, so its protection as a work rests on the human part of it.
  Issue #19: its provenance is in `media/README.md` since 2026-11-25 (ChatGPT with DALL-E;
  edited in GIMP on 8 and 11 March 2024); the owner still gives the prompt, the model, the
  day of the generation and the image chosen, the cells marked *to give*. Issue #20: register the logo,
  and possibly the name, as a trademark (UIBM or EUIPO), the owner's decision. Remind both
  in the recaps until they are done.
