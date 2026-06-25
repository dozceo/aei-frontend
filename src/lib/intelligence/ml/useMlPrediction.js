/**
 * useMlPrediction - React hook around the ML spine.
 *
 * Gives a component a live { prediction, loading, error, refresh } for one
 * learner. Re-runs when the inputs change. Aborts stale runs (via a monotonic
 * runId) so a fast tab-switch can't land an old prediction on a new learner.
 * The orchestrator never throws, so `error` is reserved for truly unexpected
 * faults.
 *
 * @param {string|null} learnerId
 * @param {object} input  FeatureExtractionInput: { brainMap, engagement, cognitive, masteryPercentile, timeToAssessmentDays }
 * @param {object} [options]
 * @param {boolean} [options.enabled=true]
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { predictForLearner } from './index';

export function useMlPrediction(learnerId, input, options = {}) {
  const { enabled = true } = options;
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const runId = useRef(0);
  const inputRef = useRef(input);

  // Keep the latest input available to async runs without re-creating callbacks.
  // Updated in an effect (never during render).
  useEffect(() => {
    inputRef.current = input;
  });

  // Only re-run on meaningful input changes (not every render's new object ref).
  const inputKey = JSON.stringify({
    bm: input?.brainMap?.generatedAt ?? null,
    topics: input?.brainMap?.stats?.totalTopics ?? null,
    eng: input?.engagement ?? null,
    cog: input?.cognitive ?? null,
    pct: input?.masteryPercentile ?? null,
    tta: input?.timeToAssessmentDays ?? null,
  });

  const execute = useCallback(
    (id) =>
      // Async work only - no synchronous setState in the caller's effect body.
      Promise.resolve().then(async () => {
        if (id !== runId.current) return;
        setLoading(true);
        setError(null);
        try {
          const result = await predictForLearner(learnerId ?? '', inputRef.current ?? {});
          if (id === runId.current) setPrediction(result);
        } catch (e) {
          if (id === runId.current) setError(e instanceof Error ? e : new Error(String(e)));
        } finally {
          if (id === runId.current) setLoading(false);
        }
      }),
    [learnerId],
  );

  const refresh = useCallback(() => {
    if (!enabled || !learnerId) return;
    execute((runId.current += 1));
  }, [enabled, learnerId, execute]);

  useEffect(() => {
    if (!enabled || !learnerId) return undefined;
    const id = (runId.current += 1);
    execute(id);
    return () => {
      // Invalidate any in-flight run when inputs change or on unmount.
      runId.current += 1;
    };
  }, [enabled, learnerId, inputKey, execute]);

  return { prediction, loading, error, refresh };
}

export default useMlPrediction;
