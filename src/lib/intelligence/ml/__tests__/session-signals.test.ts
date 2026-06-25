import test from 'node:test';
import assert from 'node:assert/strict';
import { cognitiveLoad, isGuessing } from '../session-signals';

test('cognitiveLoad: low when fast + accurate', () => {
  const r = cognitiveLoad({ avgLatencyMs: 6000, accuracy: 0.9, changeRate: 0 });
  assert.equal(r.level, 'low');
});

test('cognitiveLoad: high when slow + inaccurate + indecisive', () => {
  const r = cognitiveLoad({ avgLatencyMs: 40000, accuracy: 0.3, changeRate: 1 });
  assert.equal(r.level, 'high');
});

test('cognitiveLoad: empty defaults to light', () => {
  assert.equal(cognitiveLoad().level, 'low');
});

test('isGuessing: flags many fast-wrong answers', () => {
  assert.equal(isGuessing({ fastWrongRate: 0.5 }), true);
  assert.equal(isGuessing({ fastWrongRate: 0.2 }), false);
  assert.equal(isGuessing(), false);
});
