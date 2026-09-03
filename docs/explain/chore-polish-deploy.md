# chore/polish-deploy

**What this branch did:** a responsive pass, an accessibility pass, and — the
big one — the first real comparison of the frontend's types against the backend
that now exists. Six of the seven items are done. The seventh, deploying,
cannot be done from here; the reasons are at the bottom.

## The contract check found sixteen mismatches

The backend was empty when this frontend started, so every endpoint except
`POST /api/recommend` was built against types marked PROVISIONAL — the
frontend's best guess from `features.md` and the section 8 schema. The backend
exists now, with all eight endpoints and Pydantic schemas.

Rather than reading the schema files and eyeballing it, the API's own OpenAPI
document was generated from `api.main:app` and compared field by field. **That
found sixteen differences, ten of them breaking.** The full table is in
`docs/api-contract.md`. The ones that mattered most:

- `GET /api/destinations` calls the key **`id`**, not `destination_id`. The map,
  the marker panel and every link off them used the wrong key.
- `GET /api/risk/{id}` sends **no `name`** and **no `explanation`**. The risk
  page was showing both.
- `POST /api/simulate` kept **`expected_tourists`** and documented it as a
  0–100 slider position. The rename to `expected_visitor_level` on the F6
  branch was the right *reasoning* — the backend independently reached the same
  0–100 meaning — but the wrong call: the backend is the contract, so the name
  is back.
- `GET /api/dashboard/summary` has **one top-level `recommended_action`**, not
  one per row.
- `POST /api/auth/login` sends **no `expires_in`**, which the session cookie was
  using for its lifetime.

Three fields the frontend had invented — `simulation_baseline`,
`model_explanation`, and `explanation` on simulate — do not exist and are gone.

**The mocks were changed too, not just the types.** A mock that sends a field
the real API does not is worse than no mock, because it hides exactly this
class of bug. The risk mock no longer sends a name or a sentence, so the
fallbacks are what you see in development rather than something that only
appears in production.

Strict TypeScript did the heavy lifting: renaming the fields surfaced all
twenty-odd call sites immediately, and nothing had to be hunted for.

### What the mismatches cost, and what they now cost

`ExplanationPanel` takes an optional `explanation` and renders the bars without
a sentence when none is sent. That is a real loss on the risk view and the
simulator — F3's whole point is that no result is shown without a reason — but
the alternative was for the UI to invent sentences, which F3 forbids more
strongly. Both are listed as asks for the backend.

The F6 reset guarantee is now weaker and the note says so. The starting slider
positions used to come from the API; they are derived in `lib/simulator.ts` now,
so "reset returns exactly the original score" holds only if the backend derives
its baseline the same way. The page shows `baseline_score` straight from the
response, so a disagreement shows up as a non-zero delta after a reset rather
than hiding.

## Responsive and accessibility

Every page was audited at 375px, 768px and 1440px — 27 combinations — using
same-origin iframes sized to each width, so all three widths could be checked
without resizing between every page. The audit measured horizontal overflow,
tap targets under 44px, text under 11px, images without `alt`, inputs without
an accessible name, and WCAG contrast against the effective background.

Eighteen of 27 were clean first time. Four real problems, each consistent
across all three widths:

1. **Leaflet's attribution measured 3.64:1** — `#0078A8` on the map's `#ddd`,
   below the 4.5:1 minimum. It is a licence condition, so it has to be legible
   and not merely present. Now white background, ink text, brand link.
2. **Map markers were 26×34**, under the 44px target. The visible pin is still
   26×34; the element Leaflet makes clickable is now 44×44 around it.
3. **Leaflet's zoom buttons were 30×30.** Now 44.
4. **A dashboard table link was 23×17** — a short name like "Ella" in a cell.
   The link now fills the row to 44px.

Plus the similarity ring's caption at 10px, raised to the 11px floor the rest
of the app uses.

The Leaflet fixes needed one non-obvious thing: Leaflet's CSS is imported
inside the dynamically loaded map chunk, so it arrives *after* `globals.css`
and wins on source order. The overrides are one class more specific than the
rules they replace, which settles it regardless of order. The first attempt did
not work for exactly this reason and the audit caught it.

**Focus.** No element had an invisible focus state — every `focus:outline-none`
in the codebase was already paired with a ring. But a dozen plain text links
were falling back to whatever ring the browser drew. There is now one
`:focus-visible` rule for everything, in the brand colour, verified present in
the compiled CSS. It was checked by reading the served stylesheet rather than
by triggering the state, because programmatic `.focus()` does not reliably set
`:focus-visible` in Chrome.

**The greyscale test is the interesting one.** Converted to greyscale, the two
contribution colours are 96 and 85 — **11 points apart out of 255.** Colour
alone would not survive it. What does survive, verified under a real
`grayscale(1)` filter on a card carrying both kinds: four solid bars against one
patterned-and-outlined bar, and `20% est.` against plain percentages. The
distinction the whole project is marked on does not depend on colour, which is
what F3 asked for and is now measured rather than asserted.

## The rest

**Raw hex:** none left in `app/`, `components/`, `lib/`, `types/`, `globals.css`
or `tailwind.config.ts`. The one exception is `app/global-error.tsx`, which is
deliberate and commented — it is the boundary that catches a failure in the
root layout itself, so it cannot rely on Tailwind or a token import being
available.

**Error boundary and 404:** `app/error.tsx` catches anything a page throws and
keeps the header and footer; `app/global-error.tsx` replaces the whole document
if the layout itself fails; `app/not-found.tsx` gives a 404 with somewhere to
go. Verified: `/nope` returns a real 404, and with the API unreachable every
page still answers 200 with its error state — no 500s anywhere, including the
dashboard, which fetches on the server.

**`THIRD_PARTY.md`:** re-audited. **411 packages, every one stating a licence,
no unknowns.** 333 MIT, 40 ISC, 13 Apache-2.0, and a long tail. Two are not
OSI-approved — `react-leaflet` and `@react-leaflet/core`, both Hippocratic-2.1,
flagged on the F7 branch and still the only ones. One MPL-2.0 (`axe-core`, a
lint dependency, never shipped or modified) and one CC-BY-4.0 (`caniuse-lite`,
build-time, attribution satisfied by that file).

**Mocks off:** confirmed. The production build with `NEXT_PUBLIC_USE_MOCKS=false`
serves no mock data at all — zero occurrences of any mock destination name in
the HTML — and every page degrades to its error state rather than crashing.

## Deploying — not done, and why

**I have not deployed this, and I would not have been able to.**

- Deploying to Vercel means signing in to the team's Vercel account. There are
  no credentials on this machine and no Vercel CLI installed, and authenticating
  as somebody else is not something to automate on their behalf. This is yours
  to run.
- **There is nowhere for `NEXT_PUBLIC_API_URL` to point.** The backend runs
  under Docker locally and has not been deployed either. A frontend deployed
  today would have to point at `localhost:8000`, which from the public internet
  reaches nothing. **Deploy the API first.**
- So there is no live URL to put in the README. I have written the section, the
  commands, both environment variables and a post-deploy checklist, and left an
  explicit note where the URL goes rather than a placeholder link that looks
  real and 404s.

The one thing worth knowing before you run it: both variables are compiled into
the bundle **at build time**, so changing either in the Vercel dashboard does
nothing until you redeploy. And the API must be `https://` — a page served over
HTTPS cannot call an `http://` API, and the browser will block every request in
the app at once.

## Still open

- **Deploy the backend, then the frontend, then put the URL in the README.**
- **Five asks for the backend**, listed in `docs/api-contract.md`. The two that
  matter are `name` and `explanation` on the risk endpoint; the rest are tidying.
- **Confirm the simulator baseline rule** matches the backend's, or have the API
  return the baseline inputs. Until then F6's "reset returns exactly the
  original score" is unproven against the real API.
- **No test runner.** Six branches now. The audit written for this branch — the
  contrast, tap-target and overflow checks — is the same shape as a Playwright
  suite and was thrown away after use, along with the F6 corner sweep and the
  F5 filter checks before it.
- **F1's "loads in under 2 seconds" is still unmeasured on a real network**, and
  cannot be until the site is deployed.
