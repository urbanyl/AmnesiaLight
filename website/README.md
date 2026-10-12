# Site de présentation AmnesiaLight

Site statique, sans dépendance externe (aucune police distante, aucun tracker).
Prêt pour GitHub Pages.

## Contenu

```
website/
├─ index.html      # page unique (hero, fonctionnalités, sécurité, téléchargement)
├─ style.css       # thème vert & bleu
├─ .nojekyll       # désactive le traitement Jekyll sur GitHub Pages
└─ assets/         # logo, favicon, capture d'écran
```

## Publier sur GitHub Pages

### Option 1 — dossier `/website` (le plus simple)
1. Pousse le dépôt sur `https://github.com/urbanyl/AmnesiaLight`.
2. *Settings → Pages → Build and deployment → Source* : **Deploy from a branch**.
3. Branche `main`, dossier `/website`, puis **Save**.
4. L'URL sera du type `https://urbanyl.github.io/AmnesiaLight/`.

### Option 2 — branche `gh-pages`
```bash
git subtree push --prefix website origin gh-pages
```
Puis *Settings → Pages → Source* : branche `gh-pages` (racine).

### Option 3 — domaine personnalisé
Ajoute un fichier `website/CNAME` contenant le domaine, puis configure le DNS.

## Une fois l'URL connue

Donne l'URL finale : elle sera définie comme **page d'accueil par défaut**
d'AmnesiaLight (`browser.startup.homepage` dans `profile/user.js`).
