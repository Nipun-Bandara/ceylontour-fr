# feat/f8-dashboard

**What this branch did:** built the tourism authority dashboard and the sign-in
that guards it. This is the second audience the proposal promised — the same
forecasts, read by someone deciding policy rather than deciding a holiday.

Built in the order F8 asks for: **the dashboard content first, the auth last**,
so the fallback was never more than a step away.

1. **Four stat cards** — destinations monitored, and the split across low,
   medium and high.
2. **A table of the five highest-pressure destinations**, each with a band
   chip and a link to its risk view.
3. **The recommended action in a callout**, for the most pressured destination,
   because that is the one an official has to deal with first.
4. **The global SHAP feature importance chart**, reusing `ExplanationPanel`.
5. **`/authority/login`** posts to this app's own route handler, which sets the
   JWT as an httpOnly cookie.
6. **`/authority/dashboard`** is behind middleware, and a tourist-role account
   gets told plainly that it cannot see the page.
7. **Sign out** clears the cookie.

## Where the token lives, and why

The token is in an **httpOnly cookie**, set server-side by
`app/api/session/route.ts`. The browser posts an email and password there, that
handler calls `POST /api/auth/login` through `lib/api.ts` like every other
request in the app, and only the *role* comes back in the response body.

The reason not to use `localStorage` is simple: anything in `localStorage` is
readable by any script on the page, so one XSS bug hands an attacker a valid
official's session. An httpOnly cookie is not readable by script at all —
verified in the browser, where `document.cookie` comes back as an empty string
on a signed-in dashboard, and both storages are empty.

That choice has a consequence worth stating: **the dashboard has to be a server
component**. If script cannot read the token, script cannot attach it to a
request, so the only place that can call the API with it is the server. The
token is read from the cookie, used, and never sent to the browser — confirmed
by grepping the rendered HTML for it and finding nothing.

## Middleware checks the session; the API decides the role

Middleware answers one question — is there a session cookie at all — and sends
you to the login page if not. It deliberately does not look at the role.

Two reasons. A JWT read in middleware cannot be trusted without verifying its
signature, and that secret belongs on the backend, so any role read there would
be a claim rather than a fact. And a role check that *redirects* is exactly how
redirect loops start.

So authorisation is the API's decision: `GET /api/dashboard/summary` returns
200, 401 or 403, and the page renders each of those as a screen. A tourist gets
"You do not have access to this page" at **HTTP 200 with zero redirects** —
a rendered page cannot loop, which is what F8 asks for.

## Everything on the dashboard is derived, not stored

F8 requires the counts to match the destination table exactly and the
recommended action to be generated from the data rather than hardcoded. Both
were true of the old mock only by coincidence, so the dashboard summary is now
built from the same `riskFor` forecasts as the map, the risk view and the
alternatives:

- `band_counts` is counted from the forecasts, so it cannot disagree with the
  map's marker colours.
- `highest_pressure` is the destinations sorted by forecast pressure.
- `recommended_action` is composed per destination from its band, its region
  and which comparable destinations are quieter. A stored sentence would go
  stale the moment a forecast moved — a destination could drop to a low band
  while still carrying advice about crowding.

## The importance chart is the F3 panel again

`global_feature_importance` maps straight onto the contribution shape:
`importance` is a fraction of 1, so it scales to a percentage, and the five
features account for the whole model, which is why the total is 100.

Every one of them is a mean absolute SHAP value — an estimate from the model,
not a measured quantity — so every bar comes out hatched, outlined and marked
`est.` without the panel being told anything. The legend correctly shows only
the estimated line, because there is nothing exact on this chart. That is the
same distinction the recommendation cards make, applied to the model as a
whole, and it is the fourth caller of that one component.

`DashboardSummaryResponse` gained a `model_explanation` for the sentence under
the chart, so it comes from the API like every other explanation in the app.

## Verified

With `NEXT_PUBLIC_USE_MOCKS=true` and no backend, over HTTP and in the browser
at 1280px and 375px.

| Check | Result |
|---|---|
| Dashboard with no cookie | 307 to `/authority/login?next=%2Fauthority%2Fdashboard` |
| Sign in as an official | 200, body is `{"role":"authority"}` — no token in it |
| Cookie flags | `#HttpOnly_` in the jar; `document.cookie` empty in the browser |
| Browser storage | `localStorage` and `sessionStorage` both empty |
| Token in rendered HTML | 0 occurrences |
| Dashboard as an official | 200; cards 5 / 2 / 2 / 1; five table rows with band chips |
| Counts vs destinations | 1 high, 2 medium, 2 low in the table — matches the cards and the map's bands |
| Recommended action | generated: "Uva is forecast at 84% occupancy for September, which is above what Ella comfortably holds. Consider promoting Meemure and Belihuloya instead." |
| Importance chart | 5 bars, all hatched, all outlined `#7c3aed`, all labelled `est.` |
| Tourist account | **HTTP 200, 0 redirects**, "You do not have access to this page", no dashboard data on the page |
| Sign out | `Set-Cookie` expires it; jar empty; dashboard 307s again |
| Bad input | missing password → 400 with a clear message |
| 375px | stat cards drop to two columns; the 480px table scrolls inside its own 318px box, page stays at 375 |

No console errors. `tsc --noEmit`, `npm run lint` and `npm run build` pass, with
middleware registered at 26.5KB.

## The fallback, honestly

F8 says that if time runs short, a static summary with no login still
demonstrates the two-audience idea, and that auth should be cut before the
dashboard. `DashboardContent` takes the summary as a prop and does no fetching
and no auth of its own, so **the component needs no change at all** to become
that fallback — it would only need rendering from an unauthenticated source and
the middleware matcher removing. Two small edits to two files, and nothing to
rewrite.

## Still open

- **The mock's tokens are not JWTs.** They are two fixed strings that carry a
  role so the 401 and 403 paths could be exercised without a backend. Real
  signing, real verification, and taking the role from verified claims rather
  than from the token text are all D's work on the API. Nothing in
  `lib/mocks.ts` should outlive that.
- **Password hashing is entirely backend work.** F8 requires bcrypt or argon2.
  This branch only guarantees the frontend never stores, logs or echoes the
  password — it exists as a local variable in the route handler and nowhere
  else, which was checked by grep.
- **The login error is deliberately vague** — "that email and password did not
  match an account" rather than saying which was wrong, because the specific
  version tells an attacker which emails exist. Worth keeping when the real
  endpoint lands.
- **No rate limiting on sign-in.** The cross-cutting requirements list per-client
  limits for `/api/recommend` and `/api/risk`; a login endpoint wants one at
  least as much. Backend work, but worth adding to that list.
- **There is no link to `/authority/login` anywhere in the app.** That is
  deliberate — it is a staff page, not a traveller one, and both authority
  routes are marked `noindex`. Officials get the URL directly. Say if you would
  rather it were discoverable.
- **No test runner, still.** `dashboardSummaryFor` and `recommendedActionFor`
  are pure functions and the band counts are exactly the kind of invariant that
  should be asserted rather than eyeballed.
