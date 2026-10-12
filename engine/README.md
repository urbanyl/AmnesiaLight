# engine/

Place ici le binaire du moteur de rendu que lance AmnesiaLight.

- Windows : `engine\amnesialight.exe` (ou `engine\firefox.exe`)
- Linux   : `engine/amnesialight` (ou `engine/firefox`)

Le lanceur (`launch/AmnesiaLight.cmd` / `launch/amnesialight.sh`) detecte
automatiquement le binaire present ici, puis, en second recours, une
installation syteme sous `AmnesiaLight`.

Le contenu de ce dossier n'est pas versionne (voir `.gitignore`).

## Policies

Le moteur lit le fichier de politiques directement a cote de son binaire :
`engine\distribution\policies.json` (Windows) / `engine/distribution/policies.json`
(Linux). C'est ce fichier qui force **DuckDuckGo** comme moteur par defaut et
applique le durcissement. Il est synchronise depuis `../distribution/policies.json`.

## Version installee

- Windows : `amnesialight.exe` — moteur renomme, icone = **logo AmnesiaLight**
  (ProductName `AmnesiaLight`, vendor `urbanyl`). `firefox.exe` reste en secours.
- Version et provenance : voir `VERSION.txt`.

