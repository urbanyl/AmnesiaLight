# Changelog

Toutes les modifications notables d'AmnesiaLight sont documentees ici.

## [0.2.1] - 2026-10-13

### Ajoute
- **Galerie de fonds d'ecran** dans le nouvel onglet : 4 fonds AmnesiaLight
  (motif de lotus, logos, mandala, degrade + logo), selectionnable et memorise.
  Fond applique au nouvel onglet, au toolkit et au popup.
- Fond d'ecran sur les pages de depart (`about:home`, `about:newtab`,
  `about:privatebrowsing`) et sur le site de presentation.
- UUID d'extension deterministe (`7a1e5c20-9b6a-4d3e-8f21-0a1b2c3d4e5f`).

### Modifie
- Fonds d'ecran **optimises** (1600 px, JPEG q82) : ~394 Ko au total (au lieu de ~1,9 Mo).

## [0.2.0] - 2026-10-13

### Ajoute
- Extension embarquee **AmnesiaLight Toolkit** (`profile/extensions/amnesialight-toolkit/`,
  Manifest V2, usage autorise uniquement) : en-tetes HTTP, fuzzer SQL/XSS,
  encodeurs/decodeurs, cookies et bibliotheque de payloads.
- Page **"Nouvel onglet" personnalisee** (`newtab.html`) : recherche DuckDuckGo,
  horloge, raccourcis et acces rapide aux outils.
- Panneau de parametres : signatures d'extensions **desactivees** et
  **sideload** active, pour charger l'extension embarquee non signee du profil.

### Modifie
- Retouches visuelles : panneaux du Toolkit et page nouvel onglet alignes sur le
  theme AmnesiaLight (accent degrade vert → cyan, geometrie par defaut).
- Documentation : nouvelle page `docs/SECURITY-TOOLS.md`, section dediee et
  arborescence mises a jour dans `README.md`.

## [0.1.0] - 2026-10-12

### Ajoute
- Identite visuelle AmnesiaLight (logo, icones 16 -> 512, favicon).
- Theme Arc/macOS vert & bleu (`userChrome.css`, `userContent.css`).
- Preferences durcies par defaut (`profile/user.js`) :
  - DuckDuckGo par defaut, suggestions desactivees ;
  - prive par defaut (via lanceur), cache en memoire, anti-empreinte ;
  - HTTPS obligatoire, DNS-over-HTTPS strict (Quad9) ;
  - WebRTC / DRM desactives, permissions refusees par defaut ;
  - telemetrie, Pocket, sponsorise, extraits, etudes desactives.
- Verrouillage via `distribution/policies.json`.
- Lanceurs Windows/Linux, mode prive par defaut, option `--session`.
- Scripts d'effacement immediat (`wipe`).
- Generateur d'icones depuis le logo (`tools/make-icons.ps1`).

## [0.1.0] - 2026-10-12 (suite)

### Ajoute
- Moteur de rendu provisionne dans `engine/` (ESR 140.17.0, Windows x64) + `VERSION.txt`.
- Paquet portable Windows : `tools/package-portable.ps1` -> `dist/*.zip`.
- Logo vectoriel et captures dans `assets/`.
- Outillage Phase 2 complet dans `build/` (mozconfig, rebrand, packaging) +
  CI GitHub Actions (`.github/workflows/amnesialight-build.yml`).
- Documentation : `docs/INSTALL.md`, `docs/SECURITY.md`, `docs/CONTRIBUTING.md`.
- Sync automatique des policies dans `engine/distribution/` par les lanceurs.

### Corrige
- DuckDuckGo reellement par defaut : le fichier de politiques doit etre lu depuis
  `engine/distribution/policies.json` (et non le dossier `profile/`).
- Profil remis a l'etat *seed* (plus d'etat de navigation mis en cache).
- Theme simplifie : suppression des arrondis forces, marges et transparences
  (`backdrop-filter`) qui provoquaient des bugs visuels. Geometrie par defaut,
  seul l'onglet actif est colore (degrade vert -> cyan).
- Icone de l'application = logo AmnesiaLight :
  - `engine/amnesialight.exe` (icone + ProductName `AmnesiaLight`, vendor `urbanyl`) ;
  - raccourcis Windows (projet + Bureau) pointant sur l'exe avec l'icone logo.

### Ajoute
- Rebranding du moteur (Phase 1) directement dans `engine/browser/omni.ja` :
  - nom affiche **AmnesiaLight** (barre de titre, menus, messages) ;
  - vendor `urbanyl` ; logos/icones remplaces par le logo ;
  - URLs Mozilla (welcome/update/notes) neutralisees.
- Site statique de presentation dans `website/` (pret pour GitHub Pages).
- Page d'accueil par defaut definie : <https://amnesialight.edgeone.dev/>
  (`browser.startup.homepage` dans `profile/user.js` + policy `Homepage`).

### Corrige
- Policies : cle `HttpsOnly` corrigee (etait ignoree), doublon
  `OfferToSaveLogins` supprime, policy `resistFingerprinting` retiree
  (gere par `user.js`). Plus aucun avertissement au demarrage.
