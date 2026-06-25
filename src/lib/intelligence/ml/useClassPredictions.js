/**
 * useClassPredictions - batch ensemble predictions for a roster (teacher view,
 * patent Module 107). Uses predictClass (which chunks <=100/req and falls back
 * per-learner), then summarises into risk tiers. Anonymous by construction.
 *
 * @param {Array<{ learnerId: string, input: object }>} learners
 * @param {object} [options] { enabled?: boolean }
 * @returns {{ predictions: object[], summary: object|null, loading: boolean }}
 */
import { useEffect, useRef, useState } from 'react';
import { predictClass } from './index';
import { summariseClass } from './class-metrics';

export function useClassPredictions(learners, options = {}) {
  const { enabled = true } = options;
  const [predictions, setPredictions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const runId = useRef(0);
  const learnersRef = useRef(learners);
  useEffect(() => {
    learnersRef.current = learners;
  });

  // Re-run only when the roster identity set changes (not every render).
  const key = (learners || []).map((l) => l.learnerId).join('|');

  useEffect(() => {
    if (!enabled || !(learnersRef.current || []).length) {
      setPredictions([]);
      setSummary(null);
      return undefined;
    }
    const id = (runId.current += 1);
    Promise.resolve().then(async () => {
      if (id !== runId.current) return;
      setLoading(true);
      try {
        const result = await predictClass(learnersRef.current);
        if (id === runId.current) {
          setPredictions(result);
          setSummary(summariseClass(result));
        }
      } finally {
        if (id === runId.current) setLoading(false);
      }
    });
    return () => {
      runId.current += 1;
    };
  }, [enabled, key]);

  return { predictions, summary, loading };
}

export default useClassPredictions;
