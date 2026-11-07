# Puntea Edu MD

Catalog pilot DigiEduHack pentru Republica Moldova. O căutare deschide fișa unei oportunități, cu sursă, calendar și sprijin. Etichetele M1–M6 arată contribuțiile echipelor.

## Rulare locală

1. Rulează `node build.mjs`.
2. Rulează `python -m http.server 8766 --directory dist`.
3. Deschide `http://127.0.0.1:8766/`.

Fișele sunt în `catalog.mjs`, sursele în `research.mjs` și interfața în `build.mjs` și `src/`. Nu sunt necesare pachete externe.

Pentru GitHub Pages, rulează `node build.mjs https://gout648.github.io/puntea-edu-md/` și publică fișierele din `dist` în rădăcina ramurii `gh-pages`, cu fișierul `.nojekyll`.

## Pilot

Editorul validează sursa, data și condițiile fiecărei ediții. Fișa de practică se descarcă pe dispozitiv. Legătura M6 preia adresa ediției în demo-ul separat, unde utilizatorul confirmă sursa. Deciziile din demo sunt simulate.
