# feat/f6-simulator

**What this branch did:** built the what-if simulator at
`/destination/[id]/simulate`. Three sliders, all 0 to 100, starting where the
destination actually sits today. Move one and the index is run again with the
changed numbers.

1. **Nothing is calculated in the browser.** It would be easy to work the new
   score out client-side and have it update instantly, and that is exactly what
   must not happen. The weights live in the backend's config and are version
   tracked there; a second copy of the index in the frontend would drift, and
   this page would end up confidently showing numbers the real scorer disagrees
   with. Every recalculation is a round trip.
2. **200ms debounce.** Dragging a slider from one end to the other makes one
   request, not one per pixel.
3. **The previous score greys out** the moment a slider moves, so the number on
   screen is never silently stale. It dims rather than blanking, because
   blanking would make the layout jump on every move.
4. **Original, simulated and delta side by side**, with the delta coloured by
   direction.
5. **A warning when the drop is worse than 10 points**, naming the slider
   responsible. The sentence comes from the API, because the API is what knows
   the weights and can work out which slider actually did the damage.
6. **Reset** returns the sliders and the score to exactly the original values.
7. **`ExplanationPanel` is reused** for the recalculated contributions — the
   same component as a result card and the risk view, now on its third caller.

## The 300ms target cannot be met with a 200ms debounce

F6 asks for the score to update within 300ms of a slider moving. The brief asks
for a 200ms debounce. Those two only both hold if the API answers in under
100ms, and against `lib/mocks.ts` — which adds a deliberate 300ms so loading
states are visible elsewhere in the app — the settled figure takes roughly
500ms.

This was built as specified rather than quietly dropping the debounce or
shaving the mock delay to make a number look good. Two things are worth saying
about it:

- **The acknowledgement is immediate, the settled value is not.** The score
  greys the moment the slider moves. What takes 500ms against mocks is the
  final number, not the feedback.
- **It is achievable in production.** The index is a weighted sum over five
  numbers. If the real endpoint answers in single-digit milliseconds, 200ms of
  debounce plus the round trip lands comfortably inside 300ms. The mock's
  artificial delay is what breaks it, not the design. Worth re-timing against
  the real endpoint before this criterion is ticked.

## A real bug, found and fixed

The first version cleared the pending flag only when its own request had *not*
been aborted. If the newest request was the one that got aborted, nothing was
ever left to clear the flag — the score stayed greyed out over a stale number
indefinitely. Reproduced by moving a slider rapidly: the display stuck at 72
with the slider sitting at 90.

It is now a sequence number instead. The newest request owns the final write in
every path, and stale ones write nothing at all. The abort controller is still
there, but only to stop real network work, never to decide state. Worth
remembering generally: aborting is a performance concern, and hanging state
correctness off it creates exactly this class of stuck-forever bug.

## Contract changes

- **`expected_tourists` is now `expected_visitor_level`, 0 to 100.** It was
  documented as a count of visitors per month, but all three sliders share one
  scale, and a field named `expected_tourists` holding `45` would almost
  certainly have been implemented on the other side as forty-five visitors.
  Renamed while the endpoint is still unsigned rather than after.
- **`SimulateResponse` gained an `explanation`**, so the simulated state
  carries its sentence like every other explanation in the app.
- **`DestinationDetail` gained `simulation_baseline`** — the three starting
  slider values. Served rather than derived in the UI on purpose: F6 requires
  that reset returns *exactly* the original score, and that only holds if the
  starting values and the scoring agree perfectly. One rule, on the side that
  owns the weights.

## Verified

The scoring was checked exhaustively through a temporary route, since F6 says
to test the corners rather than a few slider positions. Across all five
destinations:

- **40 corners** — every extreme combination of the three sliders — all scores
  within 0 to 100, all contribution sets summing to 100.
- **6,655 combinations** on a dense grid: none out of range, none summing to
  anything but 100.
- **Direction holds everywhere.** Sweeping each slider 0 to 100 one point at a
  time, the score never rose when visitors rose, and never fell when waste
  management or infrastructure rose. Zero failures.
- **Reset is exact for all five.** Baseline inputs return the original score
  with a delta of exactly 0 — 58, 89, 72, 86 and 79.
- **The warning fires exactly when the delta is worse than -10**, checked
  across a sweep. Zero mismatches. It names the right slider: dropping
  Belihuloya's waste management to 0 blames waste management, and raising
  Meemure's visitors to 100 blames the number of visitors. Ella's visitor
  slider can only move it 9 points and correctly produces no warning.

In the browser, against the production build with no backend: eight rapid
slider changes over 240ms produced **exactly one** settled update, at the
correct value for the final slider position — the debounce doing its job.
Moving all three sliders to 95/10/5 gave 89 → 33 with a warning naming waste
management, and Reset put it back to exactly 86 with the delta at 0, the
warning gone and the button re-disabled. The explanation panel tracks the
simulated state: dropping waste management to 20 collapsed Environment's share
from 30% to 9%. At 375px nothing scrolls sideways and the panel collapses as it
does elsewhere. No console errors. `tsc --noEmit`, `npm run lint` and
`npm run build` pass.

**What could not be measured here:** end-to-end UI latency. The browser pane in
this environment runs as a hidden tab (`document.hidden` is true), which
throttles timers and rendering — early readings of "900ms to grey out" were
measuring a backgrounded tab, not the app. The debounce was verified by
counting settled updates instead, which is timing-robust. Real latency needs
measuring on a visible page.

## Still open

- **No test runner.** This branch is the strongest argument yet for one. The
  corner sweep, the monotonicity sweep and the reset-exactness check were all
  written as a throwaway route and then deleted; they are exactly the
  assertions that should be permanent, and `simulateFor` is a pure function
  waiting to be tested.
- **`waste_management_level` has no real field behind it.** It is stood up on
  the environmental factor, which is a proxy rather than a measurement. It
  needs a column of its own before this is more than a demonstration.
- **Re-time against the real endpoint** once it exists, for the 300ms
  criterion.
- **`POST /api/simulate` is still PROVISIONAL**, and now needs sign-off on the
  renamed field and the added `explanation` as well as the response shape.
- **A link to the simulator was added on the risk view**, since the page was
  otherwise reachable only by typing a URL. Not asked for; say if you would
  rather it went elsewhere.
