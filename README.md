# CeylonTour — Frontend

Next.js frontend for CeylonTour, a decision support system that recommends
destinations in Sri Lanka and explains why it recommended them.

**Team:** Blind Bandits, University of Moratuwa
**Built for CodeSplash '26**, Theme 01 — Decision Support System Using Explainable AI

At this point the repo is a skeleton: the app shell, the typed API layer and
the mock data. There are no feature pages yet.

---

## Stack

Declared in the proposal and fixed — changing it has to be justified at the
Grand Finale.

| Part | Choice |
|---|---|
| Framework | Next.js 14, App Router |
| Language | TypeScript, `strict: true` |
| Styling | Tailwind CSS |
| Charts | Recharts 2.13.3 |
| Map | react-leaflet *(added with F7)* |
| HTTP | `fetch`, wrapped in `lib/api.ts` |

react-leaflet is not installed yet. It arrives with F7, so the bundle stays
small until something needs it.

---

## Running it

Node 18.17 or newer.

```bash
npm install
```

```bash
cp .env.example .env.local
```

### With mocks, no backend needed

`.env.example` already sets `NEXT_PUBLIC_USE_MOCKS=true`, so a plain copy runs
against `lib/mocks.ts` with nothing else started:

```bash
npm run dev
```

Or without touching the env file at all:

```bash
NEXT_PUBLIC_USE_MOCKS=true npm run dev
```

Open http://localhost:3000.

### Against the real API

Start the backend from the `ceylontour-bk` repo first — it needs Docker,
Postgres, Redis and a trained model — then set in `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_USE_MOCKS=false
```

The types in `types/api.ts` were checked field by field against the backend's
own OpenAPI schema on 3 September 2026 and match it. Two fields the frontend
would like are not sent — see the asks at the bottom of `docs/api-contract.md`.

---

## Deploying

**Not deployed yet.** There is no live URL to put here, for two reasons worth
stating plainly rather than leaving a broken link:

1. Deploying needs the team's own Vercel account. Signing in as somebody else
   is not something that can be automated on their behalf.
2. There is nowhere for `NEXT_PUBLIC_API_URL` to point. The backend runs under
   Docker locally and has not been deployed either, and a frontend pointed at
   `localhost:8000` from the public internet reaches nothing.

Deploy the API first, then the frontend. Everything below is ready to run.

### Steps

```bash
npx vercel login
```

```bash
npx vercel link
```

Set the two variables for the production environment:

```bash
npx vercel env add NEXT_PUBLIC_API_URL production
```

```bash
npx vercel env add NEXT_PUBLIC_USE_MOCKS production
```

Then deploy:

```bash
npx vercel --prod
```

### Environment variables

| Variable | Production value | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://<the deployed API>` | **HTTPS.** A page served over HTTPS cannot call an `http://` API — the browser blocks it as mixed content, and every request in the app fails at once. |
| `NEXT_PUBLIC_USE_MOCKS` | `false` | Must be `false`. Left `true`, the deployed site quietly serves sample numbers and looks like it works. |

Both are `NEXT_PUBLIC_`, so both are compiled into the browser bundle. Never
put a secret in either. They are also baked in **at build time**, so changing
one in the Vercel dashboard does nothing until you redeploy.

### Checks after deploying

- The site loads over `https://`, and the padlock is clean — no mixed-content
  warning in the console.
- The home page does **not** show "This build is running on sample data". If it
  does, `NEXT_PUBLIC_USE_MOCKS` is still `true`.
- `/map` shows markers, and the OpenStreetMap attribution is visible on the map.
- `/authority/login` sets a `Secure` cookie. `secure` is switched on
  automatically when `NODE_ENV=production`, which Vercel sets for you.
- Put the resulting URL in this section, replacing this note.

### Other commands

```bash
npm run typecheck
```

```bash
npm run lint
```

```bash
npm run build
```

---

## Layout

```
app/                    App Router pages. layout.tsx wraps everything.
components/             Shared UI. Card, Loading, ErrorState, Header, Footer.
lib/api.ts              The only place this app calls the API from.
lib/mocks.ts            Mock responses for all 8 endpoints.
types/api.ts            TypeScript mirror of the API contract.
design-tokens.ts        Every colour in the app. tailwind.config.ts reads it.
docs/api-contract.md    Copy of plan.md section 7.
docs/explain/           One plain-English write-up per branch.
```

---

## How data gets in

Components call a helper from `lib/api.ts` and never call `fetch` themselves:

```ts
import { getRisk } from '@/lib/api';

const risk = await getRisk(7, 9); // destination 7, September
```

`lib/api.ts` handles four things so no component has to:

- **unwraps the envelope.** The API returns `{ data, meta }`; the helpers
  return `data`. Use `apiFetchWithMeta` when a component needs to display
  `model_version` or `index_version`.
- **throws `ApiError`.** The `{ error: { code, message } }` shape becomes a
  thrown `ApiError` with `code`, `message` and `status`. Network failures,
  malformed responses and missing config throw the same type, so a `catch`
  block only ever deals with one thing. Pass it straight to `<ErrorState />`.
- **serves mocks.** When `NEXT_PUBLIC_USE_MOCKS=true` it returns data from
  `lib/mocks.ts` after a 300ms delay, so loading states are visible while
  building.
- **reads the base URL** from `NEXT_PUBLIC_API_URL`.

---

## Colour

Every colour lives in `design-tokens.ts`, which `tailwind.config.ts` turns into
named classes. Components use the class names and never a raw hex value.

| Token | Class | Meaning |
|---|---|---|
| `band.low` | `bg-band-low` | Low visitor pressure — green |
| `band.medium` | `bg-band-medium` | Medium visitor pressure — amber |
| `band.high` | `bg-band-high` | High visitor pressure — red |
| `contribution.exact` | `bg-contribution-exact` | Index contribution, computed exactly |
| `contribution.estimated` | `bg-contribution-estimated` | TreeSHAP value, a model estimate |

The last two matter more than they look. Exact contributions and estimated
ones must be distinguishable without reading a tooltip — that is the marking
point the whole project turns on.

---

## The contract

`docs/api-contract.md` is a copy of section 7 of `plan.md` in the backend repo.
`types/api.ts` mirrors it. If the contract changes, it changes in `plan.md`
first, both members agree, then it is re-copied here and `types/api.ts` is
updated. Nowhere else declares an API shape.

**Not yet agreed:** section 7 writes out the body of `POST /api/recommend`
only. The other seven endpoints are named but not specified, so `types/api.ts`
carries a provisional type for each, marked `PROVISIONAL` in a comment and
derived from `features.md` and the section 8 schema. They need sign-off before
they can be treated as settled. The list is at the bottom of
`docs/api-contract.md`.

---

## House rules

From `CLAUDE.md`, repeated here because they are easy to break by accident:

1. All API calls go through `lib/api.ts`. No `fetch` in components.
2. `NEXT_PUBLIC_USE_MOCKS=true` must render every page with no backend running.
3. Types live in `types/api.ts` and nowhere else.
4. Exact and estimated contributions must look different without a tooltip.
5. Mobile first. Everything readable at 375px wide.
6. Escape all user-facing output. No `dangerouslySetInnerHTML`.
7. Small, clearly named components. Both of us must be able to explain them.
8. No features that were not asked for.

Every open-source dependency gets recorded with its licence in `THIRD_PARTY.md`
in the backend repo.
