# Third-party software and data — CeylonTour frontend

Every open-source dependency this repo ships, with its licence. Required by
the competition guidelines (7.3), and it is also the honest answer when a judge
asks what the project is built on.

Licences below were read from the installed packages in `node_modules`, not
from memory. Re-check them when a dependency is added or upgraded.

Last checked: 3 September 2026.

---

## Runtime dependencies

These are shipped to the browser.

| Package | Version | Licence |
|---|---|---|
| [next](https://github.com/vercel/next.js) | 14.2.35 | MIT |
| [react](https://github.com/facebook/react) | 18.3.1 | MIT |
| [react-dom](https://github.com/facebook/react) | 18.3.1 | MIT |
| [recharts](https://github.com/recharts/recharts) | 2.13.3 | MIT |
| [leaflet](https://github.com/Leaflet/Leaflet) | 1.9.4 | BSD-2-Clause |
| [react-leaflet](https://github.com/PaulLeCam/react-leaflet) | 4.2.1 | **Hippocratic-2.1** — see the note below |

## Build and development dependencies

Not shipped to the browser.

| Package | Version | Licence |
|---|---|---|
| typescript | 5.7.2 | Apache-2.0 |
| tailwindcss | 3.4.17 | MIT |
| postcss | 8.4.49 | MIT |
| autoprefixer | 10.4.20 | MIT |
| eslint | 8.57.1 | MIT |
| eslint-config-next | 14.2.35 | MIT |
| @types/leaflet | 1.9.14 | MIT |
| @types/node | 22.10.2 | MIT |
| @types/react | 18.3.17 | MIT |
| @types/react-dom | 18.3.5 | MIT |

---

## ⚠ react-leaflet is not under an OSI-approved licence

`react-leaflet` 4.2.1 is released under the **Hippocratic License 2.1**, not
MIT. This was checked against `node_modules/react-leaflet/LICENSE.md`.

Two things follow from it, and both are worth knowing before the demo:

1. **It is not an OSI-approved open source licence.** Hippocratic 2.1 adds
   conditions about use consistent with human rights principles, which is why
   the OSI does not classify it as open source. If the competition, or a
   sponsor, requires OSI-approved licences only, this dependency is the one
   that will fail that check — nothing else here does.
2. **It has a Notice condition.** Anyone who receives a copy of the software
   must also receive the licence and the copyright notice. Shipping a built
   bundle is fine as long as this file travels with the project and the licence
   text stays in `node_modules`/the repository, which it does.

`leaflet` itself, the library actually drawing the map, is BSD-2-Clause and has
no such condition. `react-leaflet` is only the React binding around it.

**If this turns out to be a problem**, the map can be built directly against
`leaflet` with a small `useEffect` wrapper and no React binding at all. That is
perhaps thirty lines and would remove the only non-OSI dependency in the
project. Not done now, because react-leaflet is what the proposal declared and
changing the declared stack needs a reason stated in the demo — this note is
that reason if it is needed.

---

## Map data and tiles

The map is not just code; the data and the tile images have their own terms.

### OpenStreetMap data

- **Source:** [OpenStreetMap](https://www.openstreetmap.org)
- **Licence:** [Open Data Commons Open Database License (ODbL) 1.0](https://opendatacommons.org/licenses/odbl/)
- **Required attribution:** © OpenStreetMap contributors

### OpenStreetMap tile images

- **Source:** `https://tile.openstreetmap.org` (the OSM Foundation's public
  tile servers)
- **Terms:** [OSMF Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/)
- **Attribution:** displayed on the map itself, in the bottom-right corner, as
  the policy requires. It is Leaflet's built-in attribution control and is not
  hidden, moved off screen or collapsed.

**Note on the tile servers.** The OSMF tiles are provided for free on a
best-effort basis and the usage policy discourages heavy or commercial use. The
demo's traffic is nowhere near a concern, but a deployed product with real users
should move to a commercial tile provider rather than lean on donated
infrastructure.

---

## Data sources used by the backend

Listed here for completeness; they are consumed by the API rather than by this
repo. See the backend's own record for details.

| Source | Used for |
|---|---|
| [Sri Lanka Tourism Development Authority](https://www.sltda.gov.lk) | Visitor arrivals, hotel occupancy, guest nights |
| [Open-Meteo](https://open-meteo.com) | Historical and forecast weather |
| [OpenAQ](https://openaq.org) | Air quality readings |
