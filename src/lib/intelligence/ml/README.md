# `src/ml` — ML Serving integration spine

Wires the deployed **ensemble predictor** (patent Module 105) into the dashboard.
The ensemble itself lives in a separate repo and is served at
`https://web-production-19e90.up.railway.app` (LightGBM 0.40 · XGBoost 0.25 ·
DNN 0.20 · meta-learner 0.15). This folder is the **client side**: feature
assembly (Module 104) → prediction → decision (Module 106) → UI (Module 107).

## Files

| File | Module | Responsibility |
|------|--------|----------------|
| `feature-keys.ts` | 104 | Canonical **40 `ALL_FEATURES`** keys (4 groups) + `FeatureVector` type. Single source of truth — must track the server's `ensemble.py:ALL_FEATURES`. |
| `feature-extractor.ts` | 104 | Pure fn: brain-map + engagement/cognitive signals → 40-feature snake_case vector. No I/O. |
| `ml-client.ts` | 105 | Typed client: `/api/predict`, `/predict/batch`, `/feedback`, `/health`. Timeout, **circuit breaker**, retry, JSON logs, **client-side rule-based fallback** (never throws). |
| `decision-engine.ts` | 106 | Prediction → 4 categories (Urgent / Spaced / Challenge-Next / Continuation) + ADK mode + `reasoning[]`. |
| `index.ts` | — | Orchestrator: `predictForLearner()`, `predictClass()` (batch, for the teacher heatmap) + barrel exports. |
| `useMlPrediction.js` | — | React hook: `{ prediction, loading, error, refresh }`, abort-safe. |
| `MlInsightCard.jsx` | 107 | Mobile-first, WCAG-AA, navy/cyan card surfacing mastery + decision + reasoning + CI. |

## Usage

```jsx
import { useMlPrediction } from '../../ml/useMlPrediction';
import MlInsightCard from '../../ml/MlInsightCard';

const input = useMemo(() => ({ brainMap: data /*, engagement, cognitive, masteryPercentile */ }), [data]);
const { prediction, loading, refresh } = useMlPrediction(learnerId, input, { enabled: !!data });

<MlInsightCard prediction={prediction} loading={loading} onRefresh={refresh} />
```

Server-side, headless:

```ts
import { predictForLearner, predictClass } from '../../ml';
const pred = await predictForLearner(learnerId, { brainMap });          // one learner
const rows = await predictClass(learners.map(l => ({ learnerId: l.id, input: { brainMap: l.bm } }))); // heatmap
```

## Guarantees

- **Never throws.** API down / timeout / circuit-open → deterministic local
  rule-based prediction tagged `source: 'client-fallback'`. The UI keeps working.
- **All 40 keys always sent.** `normaliseFeatureVector` zero-fills + de-NaNs, so
  the server never silently defaults a feature you meant to provide.
- **Confidence-aware.** Wide CI → the card shows "Estimating…" not a hard number.
- **No PII.** Only `learner_id` + numeric features leave the client (DPDP).

## Wiring status

- ✅ Wired live into the student **Brain → Planner** view (`recall/mind/StudentMind.jsx`).
- ⏭️ Next: teacher heatmap (`predictClass` batch), feedback loop on quiz outcomes
  (`mlClient.sendFeedback`), and the prediction-dependent 51-features (F11, F30, F31, F35, F41).

## Config

`VITE_ML_API_URL` (see `.env.example`). Defaults to the Railway deploy if unset.
