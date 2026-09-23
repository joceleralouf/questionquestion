# Culture Bar, le cahier

App de révision de culture bar (Histoire, Culture bar, Connaissance produits), hébergée sur GitHub Pages.

## Organisation des fichiers

- `index.html` : la page (structure seulement)
- `style.css` : la direction artistique « cahier d'écolier »
- `app.js` : le fonctionnement (interro, répétition espacée, réponse libre, exercices, bulletin, sauvegarde)
- `data/meta.js` : les matières et chapitres
- `data/q-*.js` : les questions, un fichier par chapitre (h = Histoire, c = Culture bar, p = Connaissance produits)
- `data/fiches-*.js` : le cahier de cours, un fichier par matière
- `data/exos.js` : la frise chronologique et les paires à relier
- `sw.js`, `manifest.webmanifest`, `icon-*.png` : installation sur téléphone et hors ligne

Chaque question : `id`, `t` (chapitre), `q` (question), `o` (propositions), `r` (index de la bonne réponse), `e` (explication), `s` (source), `lv` (1 facile, 2 moyen, 3 expert).

La progression est stockée dans le navigateur (clé `culturebar-cahier-v3`) : elle n'est pas touchée par les mises à jour du site.
