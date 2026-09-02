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
