# feat/f7-map

**What this branch did:** built the destination map at `/map` — Leaflet, OSM
tiles, one coloured marker per destination, and a panel for whichever one you
click.

1. **`/map`** centres on Sri Lanka with the whole island in view, and is held
   inside loose bounds so it cannot be dragged off into the Indian Ocean. No
   GIS work, as F7 says: fixed coordinates and the standard tile layer.
2. **Markers are coloured from the same tokens as the rest of the app** —
   `band.low`, `band.medium`, `band.high`, imported from `design-tokens.ts`
   exactly the way the Recharts bars import theirs.
3. **Clicking a marker opens a panel** with the name, sustainability score,
   pressure band, community score, environmental score and a link to the
   destination's own page. It is a bottom sheet on a phone and a column beside
   the map from `lg` up.
4. **The map is loaded with `next/dynamic` and `ssr: false`**, with a skeleton
   at the same height so nothing jumps when it arrives.
5. **The OpenStreetMap attribution is on the map**, bottom right, not hidden or
   collapsed.
6. **`THIRD_PARTY.md` now exists in this repo**, covering every frontend
   dependency — which also closes the Recharts gap flagged back on F3.

## react-leaflet is not under an OSI-approved licence

This is the thing to take away from this branch.

`react-leaflet` 4.2.1 is released under the **Hippocratic License 2.1**, not
MIT. I read `node_modules/react-leaflet/LICENSE.md` rather than assuming, and
the `license` field in its `package.json` says `Hippocratic-2.1` outright.

It matters for two reasons:

- **The OSI does not classify it as open source.** Hippocratic 2.1 adds
  conditions about use consistent with human rights principles. If the
  competition or a sponsor requires OSI-approved licences, this is the single
  dependency in the project that fails that test. Everything else is MIT,
  BSD-2-Clause or Apache-2.0.
- **It has a Notice condition** — anyone receiving a copy must also receive the
  licence and copyright notice.

`leaflet` itself, the library actually drawing the map, is BSD-2-Clause and
carries no such condition. `react-leaflet` is only the React binding around it,
so if this turns out to be a problem the map can be rebuilt directly against
`leaflet` with a small `useEffect` wrapper — perhaps thirty lines, and it would
remove the only non-OSI dependency in the project. Not done now, because
react-leaflet is what the proposal declared and changing the declared stack
needs a stated reason. This note is that reason if you need it.

## Three decisions worth explaining

**Markers are hand-drawn SVG rather than Leaflet's default.** Leaflet's default
marker is an image loaded from a path that bundlers rewrite, which is the usual
reason markers silently vanish in a Next build. Drawing our own sidesteps that
and is the only way to colour them from the tokens. Nothing from the API is
interpolated into that HTML string — it is geometry and a token colour, and the
destination name goes on the marker's `title`, which Leaflet sets as a DOM
property rather than as markup. That keeps the no-`dangerouslySetInnerHTML`
rule honest in a place where it would be easy to break by accident.

**The panel fetches on click, not up front.** `GET /api/destinations` gives the
map everything it needs to draw a marker but not the community and
environmental figures the panel has to show. Those come from
`GET /api/destinations/{id}` — which is exactly why F7 lists both endpoints.
Fetching on click means opening the map does not pull down five destination
records nobody has asked to see.

**There is a plain list of the destinations under the map.** A map is unusable
with a keyboard and a screen reader however carefully the markers are labelled,
so the same information is reachable without one, and clicking a row opens the
same panel. It also means the page says something useful before the map chunk
has arrived.

## One mock change

`GET /api/destinations` now derives each band from the same forecast the risk
view uses, for the current calendar month, rather than returning a second
stored copy. F7 requires the marker colours to match the bands shown elsewhere
in the app, and two hardcoded lists would have disagreed the first time either
was edited.

## Verified

With `NEXT_PUBLIC_USE_MOCKS=true` and no backend, at 1280px and 375px.

- **All five markers at the correct coordinates.** Checked by reading each
  marker's screen position and sorting: west to east came out Kalpitiya,
  Belihuloya, Knuckles, Meemure, Ella, and north to south came out Kalpitiya,
  Knuckles, Meemure, Ella, Belihuloya. Both match the real latitudes and
  longitudes exactly.
- **Marker colours are the tokens themselves** — `#15803d`, `#b45309`,
  `#b91c1c` read straight off the rendered SVG paths, and they agree with the
  bands the risk view shows for the same month.
- **Attribution is present and visible**: "Leaflet | © OpenStreetMap
  contributors", linking to the copyright page. Tiles load from
  `tile.openstreetmap.org`.
- **The panel opens with everything F7 asks for.** Ella gave 58, High pressure,
  Environment 64, Community 70, and a link to `/destination/3/risk`. It closes
  cleanly on the close button and on Escape, and switching directly from one
  marker to another swaps the whole panel rather than leaving one
  destination's name above another's numbers.
- **The bottom sheet behaves on a phone**: `position: fixed`, pinned to the
  bottom, full width, at `z-index: 1100` so it clears Leaflet's own controls,
  which go up to 1000. No horizontal scroll at 375px on any state.
- **The map genuinely does not block the page.** Leaflet compiles into its own
  148KB chunk — 42.6KB gzipped — which is not one of the shared chunks and is
  not referenced anywhere in the map page's prerendered HTML. It is fetched
  only after hydration, when the dynamic import resolves. The map page's First
  Load JS is 108KB against 205KB for `/results`.
- No console errors. `tsc --noEmit`, `npm run lint` and `npm run build` pass.

## Still open

- **Decide about the Hippocratic licence.** Nothing else in this branch needs a
  decision; this does.
- **The OSM tile servers are donated infrastructure.** The usage policy
  discourages heavy use, and the demo is nowhere near a concern, but a real
  deployment should move to a commercial tile provider rather than lean on it.
  Noted in `THIRD_PARTY.md`.
- **`THIRD_PARTY.md` covers this repo only.** The backend's dependencies need
  the same treatment in its own repo, and the guidelines ask for it.
- **A text link to the map was added on the home page**, under the two buttons,
  rather than as a third button — the map is a stretch feature and the two
  buttons F1 specifies should stay the obvious choices. Without it the page was
  only reachable by typing a URL.
- **No test runner, still.** Same as the last four branches.
