import test from 'node:test';
import assert from 'node:assert/strict';
import { summariseEvents, participationSlope } from '../event-metrics';

test('summariseEvents: quiz completion rate (F18)', () => {
  const s = summariseEvents([
    { type: 'quiz_started', ts: '2026-06-14T09:00:00' },
    { type: 'quiz_completed', ts: '2026-06-14T09:10:00' },
    { type: 'quiz_started', ts: '2026-06-14T10:00:00' },
  ]);
  assert.equal(s.quizStarted, 2);
  assert.equal(s.quizCompleted, 1);
  assert.equal(s.completionRate, 0.5);
});

test('summariseEvents: time-of-day histogram + peak (F22)', () => {
  const s = summariseEvents([
    { type: 'topic_viewed', ts: '2026-06-14T09:00:00' },
    { type: 'topic_viewed', ts: '2026-06-14T09:30:00' },
    { type: 'topic_viewed', ts: '2026-06-14T21:00:00' },
  ]);
  assert.equal(s.hourHistogram.length, 24);
  assert.equal(s.hourHistogram[9], 2);
  assert.equal(s.peakHour, 9);
});

test('summariseEvents: empty safe', () => {
  const s = summariseEvents([]);
  assert.equal(s.completionRate, null);
  assert.equal(s.peakHour, null);
  assert.equal(s.total, 0);
  assert.ok(s.hourHistogram.every((x) => x === 0));
  assert.equal(s.guideOpens, 0);
  assert.equal(s.distinctTabs, 0);
});

test('summariseEvents: feature-usage events (Wave-F)', () => {
  const s = summariseEvents([
    { type: 'guide_open', ts: '2026-06-14T09:00:00' },
    { type: 'guide_open', ts: '2026-06-14T09:05:00' },
    { type: 'tab_open', ts: '2026-06-14T09:10:00', payload: { tabId: 'learn' } },
    { type: 'tab_open', ts: '2026-06-14T09:11:00', payload: { tabId: 'query' } },
    { type: 'tab_open', ts: '2026-06-15T09:11:00', payload: { tabId: 'learn' } },
    { type: 'clarify_answered', ts: '2026-06-15T09:20:00', payload: { count: 2 } },
  ]);
  assert.equal(s.guideOpens, 2);
  assert.equal(s.tabOpens, 3);
  assert.equal(s.queryOpens, 1);
  assert.equal(s.clarifyAnswered, 1);
  assert.equal(s.distinctTabs, 2); // learn, query
  assert.equal(s.dailyCounts['2026-06-14'], 4);
  assert.equal(s.dailyCounts['2026-06-15'], 2);
});

test('participationSlope: rising / declining / flat', () => {
  assert.ok(participationSlope([1, 1, 4, 4]) > 0); // second half higher → rising
  assert.ok(participationSlope([4, 4, 1, 1]) < 0); // declining
  assert.equal(participationSlope([2, 2, 2, 2]), 0); // flat
  assert.equal(participationSlope([5]), 0); // <2 points → 0
  assert.equal(participationSlope([]), 0);
  // accepts a daily-count map (sorted by key)
  assert.ok(participationSlope({ '2026-06-10': 1, '2026-06-11': 1, '2026-06-12': 5, '2026-06-13': 5 }) > 0);
});
