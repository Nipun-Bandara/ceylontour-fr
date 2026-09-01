# chore/setup-skeleton

**What this branch did:** set the frontend up so both of us can build pages on
it. No feature pages — nothing here is F1 to F8.

1. **Next.js 14 App Router, TypeScript, Tailwind.** `strict: true`, plus
   `noUncheckedIndexedAccess` so looking up a destination by id gives us
   `T | undefined` and we have to handle the miss.
2. **`docs/api-contract.md`** is a copy of `plan.md` section 7 from the backend
   repo, so the contract is in this repo rather than only in D's. It is a copy:
   changes happen in `plan.md` first, we both agree, then it comes back here.
3. **`types/api.ts`** mirrors the contract. Every request and response has a
   type, and no other file declares an API shape.
4. **The contribution union.** `Contribution` is a discriminated union on
   `type`: `"exact"` for index contributions, `"estimated"` for SHAP values.
   TypeScript makes a component narrow on `type` before it can draw a bar,
   which is what stops us accidentally showing a model estimate as if it were
   arithmetic. That distinction is the marking point of the whole project.
5. **`lib/api.ts`** is the only place we call the API from. It unwraps the
   `{ data, meta }` envelope so callers get the payload, turns the
   `{ error: { code, message } }` shape into a thrown `ApiError`, and reads the
   base URL from `NEXT_PUBLIC_API_URL`. Network failures, malformed responses
   and missing config all throw `ApiError` too, so a `catch` block only ever
   handles one type and can hand it straight to `<ErrorState />`.
6. **`lib/mocks.ts`** has a realistic response for all eight endpoints, built
   on Belihuloya, Meemure, Ella, Knuckles and Kalpitiya with their real
   coordinates. With `NEXT_PUBLIC_USE_MOCKS=true`, `lib/api.ts` serves these
   after 300ms so loading states are visible while we build. A path with no
   mock throws rather than returning nothing, so a missing mock is obvious.
7. **App shell:** root layout, header with the project name, footer with the
   team name and the CodeSplash note, and three shared components — `Card`,
   `Loading` (a skeleton, not a spinner, so the page does not jump) and
   `ErrorState`.
8. **`design-tokens.ts`** holds every colour, and `tailwind.config.ts` turns it
   into named classes: green `band-low`, amber `band-medium`, red `band-high`,
   plus `contribution-exact` and `contribution-estimated`. Components use the
   names. There is no raw hex anywhere outside that one file.

**Verified:** `NEXT_PUBLIC_USE_MOCKS=true npm run dev` runs with nothing else
started. All eight endpoints were called through `lib/api.ts` with no backend
on port 8000 and all returned mock data. Contribution percentages sum to 100 in
every recommendation and in the risk breakdown. `npm run build`, `npm run lint`
and `tsc --noEmit` all pass. The page has no horizontal overflow at 375px.

**Needs N's sign-off before anything is built on it.** Section 7 writes out the
body of `POST /api/recommend` only. The other seven endpoints are named but
their shapes are not specified, so I derived them from `features.md` and the
section 8 schema and marked every one `PROVISIONAL` in `types/api.ts`. The list
is at the bottom of `docs/api-contract.md`. Also unspecified: the allowed
values for `interest` — the form currently assumes nature, culture, adventure,
beach and wildlife.

**Also outstanding:** `CLAUDE.md` says to read `features.md` in this repo, but
it has not been copied across yet. It still only exists in the backend repo.
