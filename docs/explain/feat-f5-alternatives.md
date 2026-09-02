# feat/f5-alternatives

**What this branch did:** built the alternative destination suggestion — the
piece that joins the recommendation engine to the pressure model. Without it
the two AI features sit side by side doing nothing for each other, which is the
thing the proposal claims they do.

1. **`components/HighPressureAlternatives.tsx`** is the whole block: the
   warning, the cards, and the empty case. It renders nothing at all unless the
   forecast band is `high`, and it does not even make the request in that case.
2. **The same component is used by the result card and the risk view**, so the
   two cannot drift apart in what they warn about or how they word it.
3. **Each alternative** shows the destination name, a similarity ring, its
   pressure band chip and the one-sentence reason from the API. The whole card
   is the link, so the tap target on a phone is the card rather than a few
   words, and it goes to that destination's risk view — where the traveller can
   check the forecast themselves instead of taking "more room" on trust.
4. **The empty case shows the API's message and no list.** There is no path
   that renders an empty section: no warning without a band, no list without
   alternatives, and no bare banner without either cards or a message under it.
5. **Budget and trip length are passed to the endpoint**, so an alternative can
   never fall outside the filters the traveller already set.

**The banner's second sentence is conditional.** The full text is "This
destination is under high visitor pressure in {month}. Here are similar places
with more room." The second sentence is a promise, so it is only made once we
know there is something to show. Printing "here are similar places" directly
above a message explaining that there are none would be worse than saying
nothing. The first sentence always appears.

**The result card had no band, and that is a contract gap.** F5 needs to warn
on a result card whose forecast band is `high`, but the recommend response does
not carry a band — section 7 returns a score, the five factors, the
contributions and a sentence, and nothing about pressure. So the results page
now asks for the forecast separately, one request per destination, for the
month the traveller is actually travelling in. That is five parallel requests
for five results, which is fine here and would not be fine for twenty.

**The right fix is on the other side of the contract:** `POST /api/recommend`
should return the forecast band for the requested `travel_month` alongside each
result. The backend has already computed it and it is one field. Until then, a
forecast that fails is quietly left out — it only decides whether an extra
warning appears, and a ranked list that renders without it is far better than
one that does not render at all. Written up in `docs/api-contract.md`.

**Three smaller changes.** `GET /api/alternatives/{id}` now takes `budget_lkr`,
`duration_days` and `month` as optional query parameters; section 7 lists it
with none, but F5 cannot be satisfied without them, and "lower pressure" means
nothing without a month. All three are optional so the endpoint still answers
when there is no search behind the page. `PressureBandChip` was pulled out of
`PressureBandMeter` so the meter and the alternative cards cannot name or
colour a band differently. And the alternatives mock was replaced with a
generator, because the old one was hardcoded for two destinations, ignored the
month and ignored the filters — it could not have demonstrated requirement 5 at
all.

**The similarity ring is drawn with two SVG circles and a dash offset**, not a
chart library. Recharts is for the contribution bars; a single arc does not
need it. It is brand green rather than a band colour on purpose — the band
colours mean visitor pressure everywhere else in the app, and a ring that
filled up red would read as a warning when it means the opposite.

**Verified** with `NEXT_PUBLIC_USE_MOCKS=true` and no backend. On the results
page for a September trip, exactly one warning appears — on Ella, the only
high-band destination — with the full banner text and three alternatives
(Belihuloya 82%, Knuckles 76%, Meemure 68%), sorted most similar first, all
three forecast below Ella's 84%, each with a band chip, a ring and a templated
reason. The other four cards render no warning and no empty section. Re-running
the same search with a trip length of 2 days drops the results to three and
**removes Knuckles from Ella's alternatives**, because Knuckles needs three
days — which is the filter reaching the endpoint and being honoured, not just
being sent. The same block renders on the risk view. At 375px the three cards
sit at 318px inside the viewport with the rings visible and the chips wrapping
inside the card, and nothing scrolls sideways. No console errors. `tsc
--noEmit`, `npm run lint` and `npm run build` pass.

**The empty case was verified by forcing it.** With only five mock destinations
it is not reachable through normal use: a high-band source always has a
comparable destination that is both quieter and cheaper, because the quiet
destinations in the mock data are also the cheap ones. So the branch was tested
by temporarily returning an empty list, confirming that the banner drops its
promise sentence, no empty list element is rendered, and the API's message
appears instead — then reverted. It should become genuinely reachable once the
real fifteen-to-twenty destination dataset lands.

**Still open:**

- **Add the forecast band to the recommend response.** Everything above works
  without it; it just costs one request per result. This is the single change
  that would most improve this feature.
- **No test runner, still.** `alternativesFor` is a pure function with a filter
  chain that is exactly what a test should be pinning down — lower pressure
  only, inside budget, inside duration, at most three, most similar first.
- **The similarity numbers are a fixed pairwise table** standing in for the
  cosine similarity over landscape type, activities, distance and climate that
  F5 describes. They are plausible orderings, not computed ones, and they are
  replaced the moment N's similarity module lands.
- **`GET /api/alternatives/{id}` is still PROVISIONAL** and now needs sign-off
  on its query parameters as well as its response shape.
