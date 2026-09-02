# feat/f3-explanation-panel

**What this branch did:** built the XAI explanation panel — the part of the
project the marking actually turns on. Every result card now answers "Why was
this recommended?" instead of just showing a number.

1. **`components/ExplanationPanel.tsx`** sits inside each result card. Legend,
   a thin total bar, the contribution bars, and the sentence from the API.
2. **The bars** are Recharts, horizontal, at most five, sorted high to low,
   each labelled with a friendly factor name and its percentage. Ties keep the
   order the API sent them, so a destination with two factors on the same
   percentage renders identically on every load rather than swapping places.
3. **Exact and estimated are separated three ways, not one.** Solid fill versus
   a diagonal SVG hatch; no outline versus a violet outline; and an `est.`
   marker in the text next to the percentage. Colour is reinforcement only —
   every one of those three survives greyscale printing and colour blindness.
   The tooltip is a fourth layer and the only optional one, because F3 requires
   the difference to be visible *without* reading it.
4. **The legend above the bars** explains both styles in one line each, using
   the same words as the tooltips, and its swatches are drawn from the same
   pattern definition as the bars so they cannot drift apart.
5. **The sentence** is rendered from `result.explanation` at 16px, larger than
   everything around it. Nothing on this side generates or edits it — F3 says
   fixed templates, and they are filled server-side.
6. **Bars sum to the total score.** The API's percentages sum to 100, which is
   not the score, so each bar's length is `percent ÷ 100 × score` — the share
   of the score it accounts for. The thin strip above lays those same parts end
   to end and stops exactly where the score does. For Belihuloya the five parts
   are 28.5 + 22.3 + 17.8 + 12.5 + 8, and the strip ends at 89.
7. **Collapsible below `sm`, always open above it**, done with CSS so the
   server and browser render the same markup.

**Three attempts at sizing the chart, and why the third one stuck.** This is
worth writing down because the first two looked fine on a laptop and were
broken on a phone. `ResponsiveContainer` measures once on mount: mounted inside
the collapsed panel it measured zero and never drew anything, and carried from a
wide viewport to a narrow one it kept the old width and drew a 924px chart
inside a 343px card. A `matchMedia` query knows the viewport width but not
whether this particular box is visible. A `ResizeObserver` turned out never to
fire at all for an element that starts inside `display: none` — not on observe,
and not when it is later revealed; that was checked in the browser rather than
assumed. So the width is measured explicitly on mount, whenever the panel is
expanded, and on window resize. Nothing in the component needs to know where
the `sm:` breakpoint is.

**One more trap worth knowing about:** Recharts silently drops `<defs>` children
it does not recognise. The hatch pattern put inside `<BarChart>` never reached
the DOM, and the bars only looked right because they were quietly borrowing the
definition from the total bar's SVG — remove that strip and every hatch would
have turned transparent. The pattern is now declared once in its own zero-sized
SVG that everything references on purpose.

**Mock changes.** Knuckles now has a genuine tie (crowd and community both on
22), so the ordering path is exercised on every run rather than only in a
fixture. Ella carries one `estimated` contribution, so both bar styles appear in
the default demo. `mockRecommendEdgeCases` holds three stress fixtures that are
deliberately kept out of the demo data — an 80% single factor is not something
the index can produce, since no weight is above 0.30. The file says how to swap
them in.

**Verified** with `NEXT_PUBLIC_USE_MOCKS=true` and no backend. Default data, all
five cards: five bars each, sorted descending, and the total strip ending exactly
on the score (86, 79, 72, 58; Belihuloya lands on 89.1 against 89, which is the
one-decimal rounding and is inside the half-point tolerance — a tenth of a pixel
on screen). Ella renders one hatched, outlined bar labelled `20% est.` and four
solid ones. Knuckles renders its two tied 22% bars at identical width. The three
edge fixtures: the 80% case keeps its 2% bar visible at 7.7px; the tied-at-the-top
case renders both 30% bars at exactly 120.7px; the six-contribution case shows
five bars and says so — "These bars cover 93% of the reasons; 1 smaller factor is
not shown" — with the strip correctly stopping at 53.9 rather than pretending to
reach 58. At 375px the panel is collapsed with no chart mounted at all, expands
to a 283px chart inside a 343px card, and never scrolls sideways. `tsc --noEmit`,
`npm run lint` and `npm run build` pass.

**Not done, and you should decide on these:**

- **There is still no test runner in this repo.** F3's first acceptance
  criterion is "contribution percentages sum to 100, asserted in a test", and
  right now that is checked by eye. `lib/contributions.ts` was written as pure
  functions specifically so it can be tested the moment a runner exists.
  Installing one is a call for both of you, not something to slip into this
  branch.
- **Does `POST /api/recommend` actually return estimated contributions?**
  Section 7's example says no, F3's table says yes. The panel handles either
  without changing, but the mock and the demo depend on the answer. Written up
  at the bottom of `docs/api-contract.md`.
- **Recharts is not yet in `THIRD_PARTY.md`** — that file lives in the backend
  repo. It is MIT. `npm audit` reports five high-severity advisories, all of
  them pre-existing in Next 14.2.35 and `eslint-config-next`; Recharts added
  none, and fixing them means a Next major upgrade, which is a declared-stack
  decision.
- **F3's last criterion cannot be met from inside the team:** "test this on
  somebody outside the team". Still to do.
