# AmnesiaLight Toolkit — Outils de securite

AmnesiaLight embarque une extension (WebExtension, Manifest V2) appelee
**AmnesiaLight Toolkit**. Elle ajoute a la barre laterale et a une page
"Nouvel onglet" personnalisee une boite a outils pour les tests de securite
**autorises** : en-tetes HTTP, injection SQL (SQLi), XSS, encodeurs/decodeurs,
cookies et bibliotheque de payloads.

> ## Usage autorise uniquement
>
> **Cet outil est reserve aux tests de securite AUTORISES.**
>
> - Ne teste **que** les systemes que tu possedes, ou pour lesquels tu
>   disposes d'une **autorisation ecrite explicite** (contrat de test
>   d'intrusion, bug bounty dans son perimetre, environnement de labo).
> - L'acces non autorise a un systeme, l'extraction de donnees ou la
>   perturbation d'un service sont **illegaux** et peuvent entrainer des
>   poursuites penales.
> - Tu es seul responsable de l'usage que tu fais de ces outils. Les auteurs
>   d'AmnesiaLight declinent toute responsabilite en cas d'utilisation abusive.
>
> En cas de doute : **n'envoie rien**. Obtenir un accord ecrit d'abord.

---

## Ou se trouve l'extension

- Dossier : `profile/extensions/amnesialight-toolkit/`
- Manifest : `profile/extensions/amnesialight-toolkit/manifest.json`
  (id `amnesialight-toolkit@urbanyl`, version 1.0.0).
- L'extension est **embarquee** et chargee automatiquement : le profil a les
  signatures d'extensions desactivees et le chargement par sideload active, ce
  qui autorise l'installation d'une extension non signee livree avec le
  navigateur.

Aucune etape d'installation manuelle n'est necessaire.

## Ouvrir la boite a outils

Il y a trois points d'entree, tous branches sur la meme extension :

1. **Barre laterale** — `Affichage > Barre laterale > AmnesiaLight Toolkit`
   (ou le raccourci de la barre laterale). C'est la vue principale
   (`toolkit.html`) : les panneaux y sont listes.
2. **Bouton de la barre d'outils** — l'icone AmnesiaLight Toolkit ouvre un
   menu compact (`popup.html`) pour un acces rapide.
3. **Nouvel onglet** — la page "Nouvel onglet" (`newtab.html`) est remplacee
   par une page custom (voir ci-dessous), avec un acces direct aux outils.

La barre laterale (`sidebar.revamp` / `sidebar.verticalTabs`) est active par
defaut ; les outils s'integrent a cote des onglets verticaux.

## La page "Nouvel onglet"

La page nouvel onglet personnalisee remplace celle du moteur :

- **Recherche DuckDuckGo** integree.
- **Horloge** (date et heure locales).
- **Raccourcis** vers tes sites frequents.
- **Acces rapide aux outils** du Toolkit (un clic pour ouvrir un panneau).

## Les panneaux

Chaque panneau agit sur **l'onglet actif**.

### 1. En-tetes HTTP

Affiche les en-tetes de la requete de l'onglet actif et permet de les
**reecrire** (ajouter, modifier, supprimer) pour la requete suivante. Utile
pour tester la gestion du cache, du referer, du `User-Agent`, des en-tetes de
securite (`Content-Security-Policy`, `X-Frame-Options`, etc.).

### 2. Injection SQL (fuzzer)

Fuzzer qui injecte des **payloads SQL** dans les parametres d'une URL ou d'une
requete, puis **compare** pour chaque tentative :

- le **statut** HTTP,
- la **taille** de la reponse,
- le **temps** de reponse,
- les **messages d'erreur**.

Les differences aident a reperer d'eventuels points d'injection sur une cible
autorisee. Le resultat de chaque payload est liste avec ces indicateurs.

### 3. XSS / fuzzer

Teste la **reflexion** de payloads HTML/JS dans les parametres : le fuzzer
envoie les payloads et signale ceux qui sont renvoyes sans (ou avec un
echappement insuffisant), indice possible de faille XSS reflechie.

### 4. Encodeurs / decodeurs

Conversions utiles au pentest, en aller-retour :

- URL (percent-encoding)
- Base64
- Hex
- Entites HTML
- ROT13
- Decodage **JWT**
- Hashes **SHA-1 / SHA-256 / SHA-512**

### 5. Cookies

Liste les cookies du **domaine de l'onglet actif** et permet de les
**editer** ou **supprimer**. Pratique pour tester la gestion de session,
l'authentification et les proprietes `HttpOnly` / `Secure` / `SameSite`.

### 6. Bibliotheque de payloads

Collection de payloads prets a copier, classee par categorie :

- SQL injection (SQLi)
- XSS
- LFI (Local File Inclusion)
- SSRF (Server-Side Request Forgery)
- Command injection
- Open redirect

## Exemple de workflow : test SQLi manuel sur une cible autorisee

Scenario : tu testes une **application de labo/demo que tu possedes** et dont
l'URL ressemble a `https://cible-autorisee.example/item?id=1`.

1. **Verifie l'autorisation.** Confirme que la cible est bien dans ton
   perimetre autorise (labo, contrat, bug bounty) avant toute action.
2. Ouvre le site dans AmnesiaLight, puis ouvre la barre laterale
   **AmnesiaLight Toolkit** (`Affichage > Barre laterale`).
3. **Etablis une base.** Charge `...?id=1` normalement et note le **statut**,
   la **taille** et le **temps** de la reponse (le panneau *Injection SQL*
   les affiche apres chaque envoi).
4. **Ouvre le panneau "Injection SQL".** Colle l'URL de la cible et repere le
   parametre a fuzzer (`id`).
5. **Prepare une petite liste de payloads** cibles plutot qu'un scan massif,
   par exemple des tests de logique booleenne (`1' AND '1'='1`,
   `1' AND '1'='2`) et un test de citation (`1'`).
6. **Lance le fuzzer.** Pour chaque payload, compare les indicateurs :
   - une **erreur SQL** visible, ou
   - un **ecart de statut / taille / temps** entre les variantes booléennes,
   est un **indice** de point d'injection.
7. **Confirme manuellement** les resultats suspects avec un payload cible
   depuis la *Bibliotheque de payloads* (categorie **SQLi**), en construisant
   le test toi-meme pour eviter les faux positifs.
8. **Documente** chaque etape (URL, payload, reponse) pour le rapport de test.

> Rappel : cet exemple n'est legitime que sur une cible autorisee. Ne l'utilise
> jamais contre un systeme tiers, et arrete le test des que tu perds la
> certitude de ton autorisation.

## Depannage

- **La barre laterale n'apparait pas** : verifie `Affichage > Barre laterale`.
- **L'extension n'est pas chargee** : elle est deja presente dans le profil
  (signatures desactivees + sideload actif) ; si tu regeneres le profil,
  conserve le dossier `profile/extensions/amnesialight-toolkit/`.
- **Les panneaux n'agissent sur rien** : assure-toi qu'un onglet est bien
  actif et charge.

## Voir aussi

- `docs/SECURITY.md` — modele de securite du navigateur.
- `profile/extensions/amnesialight-toolkit/manifest.json` — permissions et
  points d'entree de l'extension.
