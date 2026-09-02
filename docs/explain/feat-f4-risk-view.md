# feat/f4-risk-view

**What this branch did:** built the overtourism risk view — the second AI
feature, and the only genuine machine learning in the system.

1. **`/destination/[id]/risk`** shows the pressure forecast for one destination
   in one month. Every result card now links to it by name, so it is reachable
   without typing a URL.
2. **`components/PressureBandMeter.tsx`** is the traffic light: green for low,
   amber for medium, red for high, with the forecast percentage printed on the
   meter and the band written out in words. The band name is text for the same
   reason F3's bars are hatched — red and green are the commonest pair to
   confuse, and someone who cannot tell them apart still reads "High pressure".
   Below 22% the fill is too narrow to hold its own label, so the percentage
   moves just past the end of it rather than being clipped.
3. **The SHAP breakdown reuses `ExplanationPanel` from F3.** No second bar
   component was written. The panel already drew each bar from that bar's own
   `type`, so every contribution here being TreeSHAP means every bar comes out
   hatched, outlined and marked `est.` without the panel being told anything.
4. **The regional-indicator line comes from the API.** F4 says the *response*
   has to state that pressure is regional and not per-site, so the sentence is
   read from the response and rendered, never written into the component. If
   the backend stops sending it the line disappears, rather than the app going
   on making a claim the data no longer supports.
5. **`model_version` from `meta`** is shown in small text under the forecast,
   so any number a user was given can be traced back to the model that produced
   it.
6. **A month selector** refetches on change. In-flight requests are aborted, so
   a fast second choice cannot be overwritten by a slower first response.
7. **Loading skeleton, error state with a working retry, and a "destination not
   found" page** for an id the API does not know or that was never a number.

**What had to change elsewhere, and why.**

- **`ExplanationPanel` now takes `heading`, `total`, `totalLabel`,
  `contributions` and `explanation` instead of a whole `Recommendation`.** That
  was the entire cost of reusing it. The panel was never really about
  recommendations — it is about contributions adding up to a total — and on
  this page the total is a forecast pressure of 84 rather than a score of 89.
- **The legend now lists only the bar styles actually on screen.** On this page
  every bar is a SHAP value, and a line reading "solid bar — calculated
  directly from the sustainability weights" would describe something that is
  not present and a calculation that is not involved.
- **`getRisk` returns the whole envelope** rather than just `data`, because
  requirement 5 needs `meta.model_version`. It is the only helper that does so
  far; the others want the same treatment as soon as a view of theirs shows a
  version.
- **`RiskResponse.scope_note` was renamed to `scope`** to match the field name
  in the brief. It was referenced only in `types/api.ts` and `lib/mocks.ts`, no
  components, so this cost nothing. The endpoint is still PROVISIONAL and
  unsigned either way.
- **The mock layer can now return errors, not just successes.** Before this, the
  only failure a mock could produce was "no mock defined", which is a developer
  mistake rather than something the UI should handle. A request for a
  destination that does not exist is an ordinary 404 and the app has to cope
  with it, so `resolveMock` can now return a status and an error body and
  `lib/api.ts` throws it exactly as it would from the real API. `undefined` is
  now reserved for a genuinely unknown route.
- **The risk mock responds to `?month=`.** Every stored figure is a September
  one and September sits at 1.00 on a crude seasonality curve, so the existing
  numbers are unchanged and the other eleven months move around them. The band
  is always derived from the pressure rather than stored next to it, and the
  sentence is rebuilt from the band and the month so it can never read "high"
  beside a green meter. This is not a model and is not meant to look like one —
  it exists so the month selector could be built and demonstrated against
  something that visibly responds.

**One real bug found and fixed.** The chart did not appear on this page at all
on first load, though it was fine on `/results`. The width measurement added in
F3 runs once when the panel mounts, and here the panel mounts as part of an
async update — the loading skeleton being swapped for the forecast — at which
point the box has not reached its final width and the first reading comes back
0. A second measurement on the next animation frame, after layout has settled,
fixes it. Confirmed by the fact that a stray window resize used to make the
chart appear.

**Verified** with `NEXT_PUBLIC_USE_MOCKS=true` and no backend. Ella in
September: red meter at 84% with "84%" on the bar and "High pressure" in words,
the scope line served from the response, `pressure-v1.2-mock` shown at the
bottom, and five bars every one of which is hatched, outlined and labelled
`est.`. Changing the month to June refetches through the skeleton and comes back
63% amber with the sentence and the card title regenerated — 84 × 0.75, matching
the curve. Meemure at 19% renders green with the percentage moved outside the
fill. Id 999 and id `not-a-number` both show "Destination not found" rather than
crashing or blanking. With mocks off against a dead port the error state appears
with a retry that genuinely fires a second request, confirmed in the network
log. `/results` still renders correctly after the panel's props changed, with
the legend showing one line on exact-only cards and two on Ella. At 375px the
panel is collapsed with no chart mounted, expands to a 283px chart inside a
343px card, and nothing scrolls sideways. `tsc --noEmit`, `npm run lint` and
`npm run build` pass.

**Still open:**

- **No test runner, still.** Same as F3. `lib/contributions.ts` and the mock's
  `bandFor` and seasonality curve are all pure functions waiting for one.
- **The band thresholds in the mock are a guess** — low under 40, medium 40 to
  69, high 70 and above. They fit the numbers already in the mocks but need
  checking against N's config, because a threshold disagreement would put a
  destination in a different colour on this page than on the map or dashboard.
- **The SHAP feature names** (`recent_occupancy`, `arrival_trend`,
  `holiday_indicator`, and so on) are the frontend's guess at N's feature names.
  `lib/factor-labels.ts` maps them to readable text and falls back to
  prettifying anything unrecognised, so a mismatch degrades rather than breaks —
  but they should be confirmed.
- **`GET /api/risk/{id}` is still PROVISIONAL** and needs sign-off along with
  the other six endpoints listed in `docs/api-contract.md`.
