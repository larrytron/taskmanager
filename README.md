# Task Manager

Gestor personal de tasques per programes (PRISMA, ATLAS, ATLAS X, EA al CTTI, Me), amb historial de completades i eliminades, arrossegar per reordenar, i desfer l'última acció.

## Fitxers

- `index.html` — l'aplicació completa, autònoma (HTML + CSS + JS en un sol fitxer). És el que serveix GitHub Pages.
- `template.html` — el mateix codi font, més fàcil de llegir/editar, amb dos marcadors interns (`@@CTTI_TASKS_STATE@@` i `@@CTTI_TASKS_TEMPLATE@@`) que `build.js` omple.
- `build.js` — script de construcció (Node.js) que genera `index.html` a partir de `template.html`, amb verificacions de sintaxi i d'integritat.

Per fer un canvi: edita `template.html` i executa `node build.js`, que regenera `index.html`.

## Desat de les dades

Dins de Claude, l'aplicació desa les dades publicant una nova versió de si mateixa (persisteix entre dispositius). Fora de Claude — com aquí, a GitHub Pages — no existeix aquest mecanisme, així que l'app fa servir `localStorage` del navegador com a alternativa: les dades es guarden automàticament, però **només en aquest navegador i aquest dispositiu** (no se sincronitzen entre l'ordinador i el mòbil, per exemple, i s'esborren si netegis les dades del lloc web).

## Publicar a GitHub Pages

A la configuració del repositori (Settings → Pages), selecciona la branca `main` i la carpeta arrel (`/`) com a font. GitHub publicarà `index.html` a `https://<usuari>.github.io/<repositori>/`.
