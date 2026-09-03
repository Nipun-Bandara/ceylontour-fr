# API contract

> Verbatim copy of `plan.md` section 7 from the backend repo, committed here so
> the frontend has the contract in-tree. **This file is a copy, not the source.**
> If it changes in `plan.md` it must be re-copied here, and both team members
> have to agree to the change first.
>
> Copied: 1 September 2026.

---

## 7. API contract

Agreed 1 September. Both sides build against this. Changes need agreement from both members.

### Envelope

Every response:

```json
{
  "data": { },
  "meta": { "model_version": "pressure-v1.2", "index_version": "weights-v1" }
}
```

Errors return HTTP status plus `{"error": {"code": "...", "message": "..."}}`.

### Endpoints

| Method | Path | Purpose | Feature |
|---|---|---|---|
| POST | `/api/recommend` | Ranked destinations with scores and contributions | F2, F3 |
| GET | `/api/destinations` | All destinations with coordinates and current band | F7 |
| GET | `/api/destinations/{id}` | Single destination detail | F7 |
| GET | `/api/risk/{id}?month=` | Pressure forecast, band, SHAP breakdown | F4 |
| GET | `/api/alternatives/{id}` | Similar destinations with lower pressure | F5 |
| POST | `/api/simulate` | Recomputed score from adjusted inputs | F6 |
| GET | `/api/dashboard/summary` | Authority overview. **Auth required** | F8 |
| POST | `/api/auth/login` | JWT issue for authority users | F8 |

### `POST /api/recommend`

Request:

```json
{
  "budget_lkr": 50000,
  "duration_days": 4,
  "interest": "nature",
  "crowd_preference": "low",
  "sustainability_weight": "high",
  "travel_month": 9
}
```

Response `data`:

```json
{
  "results": [
    {
      "destination_id": 7,
      "name": "Belihuloya",
      "sustainability_score": 89,
      "factors": {
        "environmental": 92, "community": 88, "crowd": 91,
        "infrastructure": 76, "suitability": 90
      },
      "contributions": [
        { "factor": "environmental", "percent": 32, "type": "exact" },
        { "factor": "crowd", "percent": 25, "type": "exact" }
      ],
      "explanation": "Recommended mainly because of low visitor pressure and strong environmental conditions.",
      "confidence": "measured"
    }
  ]
}
```

`type` is `"exact"` for index contributions and `"estimated"` for SHAP values. The UI must render these differently. `confidence` is `"measured"` or `"estimated"` depending on whether the underlying factor values came from real data or proxies.

---

## Checked against the running API — 3 September 2026

Every type in `types/api.ts` was compared field by field with the backend's own
OpenAPI schema, generated from `api.main:app`. The types now match it, and the
mocks in `lib/mocks.ts` were changed to match too — a mock that sends a field
the real API does not is worse than no mock at all.

Sixteen differences were found. These were the frontend's, and are fixed:

| Endpoint | Was | Now |
|---|---|---|
| `GET /destinations`, `/destinations/{id}` | `destination_id` | `id` |
| `GET /destinations/{id}` | had `landscape_type` | removed — does not exist |
| `GET /destinations/{id}` | had `simulation_baseline` | removed — derived in the UI instead |
| `GET /risk/{id}` | had `name` | removed — the page fetches the name separately |
| `GET /risk/{id}` | had `explanation` | removed — no sentence is sent |
| `GET /alternatives/{id}` | had `name`, `band` | removed |
| `GET /alternatives/{id}` | sent `month` | removed — not an accepted parameter |
| `POST /simulate` | `expected_visitor_level` | `expected_tourists` |
| `POST /simulate` | had `explanation` | removed |
| `GET /dashboard/summary` | per-row `recommended_action` | one at the top level |
| `GET /dashboard/summary` | had `model_explanation` | removed |
| `POST /auth/login` | had `expires_in` | removed — the cookie uses a fixed lifetime |
| `POST /recommend` | `Interest` missing `relaxation` | added |
| `predicted_pressure` | treated as an integer | it is a float; rounded for display |
| `GET /risk/{id}` | `month` treated as optional | it is required |
| `POST /recommend` meta | plain `Meta` | also carries `excluded` — not used yet |

### Asks for the backend

Small, and each removes a workaround rather than adding a feature.

1. **`name` on `GET /risk/{id}`.** The risk page needs the destination's name
   for its heading, and the forecast response has an id and a region but no
   name. It currently makes a second request to `GET /api/destinations/{id}`
   purely to get one.
2. **`explanation` on `GET /risk/{id}` and `POST /api/simulate`.** Every other
   explanation in the app is a fixed template filled server-side, which is what
   F3 requires. These two have none, so their panels show bars with no
   sentence. The UI will not invent one.
3. **The simulator's baseline.** F6 requires that resetting the sliders returns
   *exactly* the original score. The frontend derives the starting positions
   from the factors — `100 - crowd`, `environmental`, `infrastructure` — and
   that only holds if `POST /api/simulate` derives its baseline the same way.
   Worth confirming, or returning the baseline inputs alongside
   `baseline_score` so there is one rule rather than two.
4. **`expires_in` on login**, so the session cookie can match the token's real
   lifetime instead of the fixed hour in `lib/session.ts`.
5. **`id` versus `destination_id`.** The two destinations endpoints use `id`;
   everything else uses `destination_id`. Not wrong, just a seam worth
   flattening if it is cheap.

## Open points (frontend note, not part of the contract)

Section 7 above specifies the request and response body for `POST /api/recommend`
only. The other seven endpoints are named but their bodies are not written down.

`types/api.ts` in this repo carries a provisional type for each of them, derived
from `features.md` and the database schema in `plan.md` section 8. Every one of
those types is marked `PROVISIONAL` in a comment. They are the frontend's
proposal, not an agreement — they need N's sign-off, and once signed off they
belong back in `plan.md` section 7 and then re-copied into this file.

The list needing sign-off:

- `GET /api/destinations`
- `GET /api/destinations/{id}`
- `GET /api/risk/{id}?month=`
- `GET /api/alternatives/{id}`
- `POST /api/simulate`
- `GET /api/dashboard/summary`
- `POST /api/auth/login`

Also unspecified in section 7: the allowed values for `interest` on
`POST /api/recommend`. The example shows `"nature"`. The frontend has assumed
a fixed list; see `Interest` in `types/api.ts`.

### `POST /api/recommend` should return the forecast band per result

F5 requires a warning on any result card whose forecast band is `high`. The
recommend response has no band in it — section 7 returns a score, the five
factors, the contributions and a sentence, and nothing about pressure.

So the results page currently asks `GET /api/risk/{id}?month=` once per result
just to learn the band, for the `travel_month` that was searched. Five results
means five extra requests; twenty would mean twenty.

**Proposed:** add the forecast band for the requested `travel_month` to each
entry in `results`. The backend has already computed it, and it is one field:

```json
{ "destination_id": 3, "name": "Ella", "forecast_band": "high", "...": "..." }
```

This is the single change that would most improve F5.

### `GET /api/alternatives/{id}` needs query parameters

Section 7 lists this endpoint with no parameters. The frontend now sends three,
because F5 cannot be met without them:

| Parameter | Why |
|---|---|
| `budget_lkr` | F5: never suggest a destination outside the original budget filter |
| `duration_days` | F5: same, for trip length |
| `month` | "Lower pressure" means nothing without a month — a destination that is quieter in June may be busier in December |

All three are optional, so the endpoint still answers when there is no search
behind the page.

### Does `POST /api/recommend` return `"estimated"` contributions?

Section 7's worked example returns index contributions only, every one of them
`"exact"`. But `features.md` F3 describes the explanation panel as showing two
kinds of bar, with the estimated ones coming from TreeSHAP on the pressure
forecast. Those two statements cannot both be right, and F3 is the highest
marked part of the project, so it is worth settling explicitly.

- If the recommend response **does** carry SHAP contributions, the frontend is
  already correct and Ella's mock in `lib/mocks.ts` is the shape to build to.
- If it **only ever** carries exact contributions, then hatched bars belong
  solely to the F4 risk view, and Ella's mock should go back to five exact
  contributions.

Either way no component changes: `contributions` is typed as the discriminated
union and every bar is drawn from its own `type`. This only decides what the
mock should say and where hatched bars are ever seen.
