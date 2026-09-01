# CeylonTour Frontend

Read `features.md` in this repo before doing anything. The API contract is in
`plan.md` section 7 of the backend repo, copied here as `docs/api-contract.md`.

## Stack (declared in the proposal, cannot change)
Next.js 14 App Router, TypeScript, Tailwind CSS, Recharts, react-leaflet, fetch.

## Hard rules
1. All API calls go through lib/api.ts. No fetch calls scattered in components.
2. NEXT_PUBLIC_USE_MOCKS=true must render every page from lib/mocks.ts with no backend running.
3. Types in types/api.ts mirror the contract exactly. Update them there, nowhere else.
4. Exact contributions and estimated (SHAP) contributions must look different
   without reading a tooltip. This is the core marking point of the whole project.
5. Mobile first. Everything must be readable at 375px wide.
6. Escape all user-facing output. No dangerouslySetInnerHTML.
7. Keep components small and named clearly. Two students must be able to explain them.
8. Do not add features that were not asked for.

## After every task
Write or update `docs/explain/<branch-name>.md`: 10 to 15 lines in plain English.