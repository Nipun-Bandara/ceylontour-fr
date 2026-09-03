# Third-party software and data — CeylonTour frontend

Every open-source dependency this repo installs, with its licence. Required by
the competition guidelines (7.3), and it is the honest answer when a judge asks
what the project is built on.

Licences were read from the `license` field of every `package.json` under
`node_modules`, not from memory. **411 packages, and every one of them states a
licence** — there are no unknowns to explain away.

Last audited: 3 September 2026, against `package-lock.json` as committed.

To re-audit after adding or upgrading anything:

```bash
npx license-checker --summary
```

---

## Summary

| Licence | Packages |
|---|---|
| MIT | 333 |
| ISC | 40 |
| Apache-2.0 | 13 |
| BSD-2-Clause | 8 |
| BSD-3-Clause | 5 |
| BlueOak-1.0.0 | 3 |
| **Hippocratic-2.1** | **2** |
| MPL-2.0 | 1 |
| CC-BY-4.0 | 1 |
| Python-2.0 | 1 |
| CC0-1.0 | 1 |
| 0BSD | 1 |
| (MIT OR CC0-1.0) | 1 |
| MIT AND ISC | 1 |
| **Total** | **411** |

All but two are OSI-approved permissive licences with nothing more than an
attribution requirement.

---

## Direct dependencies — shipped to the browser

These are the ones the team chose.

| Package | Version | Licence |
|---|---|---|
| [next](https://github.com/vercel/next.js) | 14.2.35 | MIT |
| [react](https://github.com/facebook/react) | 18.3.1 | MIT |
| [react-dom](https://github.com/facebook/react) | 18.3.1 | MIT |
| [recharts](https://github.com/recharts/recharts) | 2.13.3 | MIT |
| [leaflet](https://github.com/Leaflet/Leaflet) | 1.9.4 | BSD-2-Clause |
| [react-leaflet](https://github.com/PaulLeCam/react-leaflet) | 4.2.1 | **Hippocratic-2.1** — see below |

## Development dependencies — not shipped

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

The remaining 394 packages are transitive dependencies of the above. They are
pinned in `package-lock.json`, and the licence breakdown in the summary table
covers all of them.

---

## ⚠ react-leaflet is not under an OSI-approved licence

`react-leaflet` 4.2.1 and its `@react-leaflet/core` 2.1.0 are released under
the **Hippocratic License 2.1**. Checked against
`node_modules/react-leaflet/LICENSE.md`.

These are the only two packages of 411 that are not OSI-approved. Two things
follow:

1. **The OSI does not classify Hippocratic 2.1 as open source.** It adds
   conditions about use consistent with human rights principles. If the
   competition or a sponsor requires OSI-approved licences only, these are the
   two that fail — nothing else does.
2. **It has a Notice condition.** Anyone receiving a copy must also receive the
   licence and copyright notice. Keeping this file with the project satisfies
   that.

`leaflet` itself — the library actually drawing the map — is BSD-2-Clause with
no such condition. `react-leaflet` is only the React binding around it, so if
this becomes a problem the map can be rebuilt directly against `leaflet` with a
small `useEffect` wrapper, removing both packages. Not done now, because
react-leaflet is what the proposal declared and changing a declared stack needs
a reason stated in the demo. This is that reason if it is needed.

## Other licences worth knowing about

None of these block anything, but a judge asking "any copyleft?" deserves a
precise answer rather than a shrug.

| Package | Licence | What it means here |
|---|---|---|
| `axe-core` 4.13.0 | MPL-2.0 | Weak copyleft, file-level. A build dependency of the linter, never shipped and never modified, so the reciprocity clause is not engaged. |
| `caniuse-lite` 1.0.30001810 | CC-BY-4.0 | Browser support data, attribution required — this file is that attribution. Build-time only. |
| `argparse` 2.0.1 | Python-2.0 | Permissive, attribution only. |
| `language-subtag-registry` 0.3.23 | CC0-1.0 | Public domain dedication, no obligations. |
| `tslib` 2.8.1 | 0BSD | Permissive with no attribution requirement at all. |

---

## Map data and tiles

The map is not just code; the data and the tile images have their own terms.

### OpenStreetMap data

- **Source:** [OpenStreetMap](https://www.openstreetmap.org)
- **Licence:** [Open Data Commons Open Database License (ODbL) 1.0](https://opendatacommons.org/licenses/odbl/)
- **Required attribution:** © OpenStreetMap contributors

### OpenStreetMap tile images

- **Source:** `https://tile.openstreetmap.org` (the OSM Foundation's servers)
- **Terms:** [OSMF Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/)
- **Attribution:** displayed on the map itself, bottom right. It is Leaflet's
  built-in attribution control and is not hidden, moved off screen or
  collapsed.

**On the tile servers.** OSMF tiles are provided free on a best-effort basis
and the policy discourages heavy or commercial use. The demo's traffic is
nowhere near a concern, but a deployed product with real users should move to a
commercial tile provider rather than lean on donated infrastructure.

---

## Data sources used by the backend

Consumed by the API rather than by this repo. The backend keeps its own record.

| Source | Used for |
|---|---|
| [Sri Lanka Tourism Development Authority](https://www.sltda.gov.lk) | Visitor arrivals, hotel occupancy, guest nights |
| [Open-Meteo](https://open-meteo.com) | Historical and forecast weather |
| [OpenAQ](https://openaq.org) | Air quality readings |
