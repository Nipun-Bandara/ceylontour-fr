# feat/f2-recommend

**What this branch did:** built F2 — the form that collects a traveller's
answers, and the ranked list of destinations that comes back. No F3 yet.

1. **`/recommend`** collects all six inputs from the contract: budget, trip
   length, interest, crowd preference, sustainability weighting and travel
   month. Months show as names, not numbers.
2. **Validation** lives in `lib/validate-recommend.ts` as plain functions with
   no React in them, so the rules can be read and explained on their own. It
   runs on every keystroke, which is what lets the submit button stay disabled
   until the whole form is good. A message only appears under a field once that
   field has been touched, otherwise the form would open covered in red.
3. **This does not replace server-side validation.** F2 requires both, and the
   server is the one that matters — anything here is bypassed by turning off
   JavaScript. What it buys is a clear message under the field instead of a
   round trip.
4. **Submitting** posts through `lib/api.ts`, shows the loading skeleton in
   place of the form, then routes to `/results`. The response is put in a React
   context that lives in the root layout, above both routes, so the results page
   renders what is already in memory. There is no fetch on the results page at
   all.
5. **`/results`** shows ranked cards: rank, name, the Sustainability Score as
   the biggest thing on the card, the five factor scores as a small labelled
   row, and a Measured or Estimated chip saying whether those values came from
   real data or from proxies.
6. **Empty state.** F2 says budget and duration are filters applied *before*
   scoring — a destination that does not fit is excluded, not given a low
   score. So an empty list means the filters were too tight, and the page says
   which budget and how many days came back with nothing, and which of the two
   to loosen. It also says that changing interest or crowd preference will not
   help, because those change the ranking and not who is eligible.
7. **Error state.** Any `ApiError` keeps the user on the form with their
   answers intact and shows `ErrorState` with a working retry. There is no path
   that ends in a blank screen.

**One change outside the page work:** the recommend mock now reads the request
body and applies the same budget and duration filter, because the empty state
was otherwise unreachable without a backend. Only those two inputs filter.
Interest, crowd preference and sustainability weighting are ignored by the mock
— reproducing the weighted index here would mean keeping a second copy of N's
Sustainability Index that would drift from the real one. Ranking stays the real
endpoint's job.

**Also added:** `confidence` colour tokens in `design-tokens.ts` for the chip,
and a link to `/recommend` on the placeholder home page, which was otherwise
only reachable by typing the URL. F1 replaces that page later.

**Verified** with `NEXT_PUBLIC_USE_MOCKS=true` and no backend: submit stays
disabled until every field is valid; `0`, `45` days and `50,000` each produce
the right message under the right field and set `aria-invalid`; a valid submit
shows the skeleton and lands on five ranked cards with all five factor scores
and the correct chips; a budget of Rs 10,000 gives the empty state; refreshing
`/results` offers a new search rather than a blank page. The error path was
checked separately by pointing `NEXT_PUBLIC_API_URL` at a dead port with mocks
off — the retry button fires a second request, confirmed in the network log.
No horizontal scroll at 375px on any of these. `tsc --noEmit`, `npm run lint`
and `npm run build` pass.

**Left for F3:** each card has a marked slot where the explanation panel goes.
`contributions` and `explanation` are already on every result and typed; this
branch renders neither.
