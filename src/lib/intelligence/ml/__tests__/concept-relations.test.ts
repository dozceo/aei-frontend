import test from 'node:test';
import assert from 'node:assert/strict';
import { conceptRelations } from '../concept-relations';

const nodes = [
  { id: 'a', label: 'Algebra', masteryLevel: 0.9 },
  { id: 'b', label: 'Basics', masteryLevel: 0.3 },
  { id: 't', label: 'Calculus', masteryLevel: 0.5 },
  { id: 'r', label: 'Trig', masteryLevel: 0.8 },
];
const edges = [
  { sourceId: 'a', targetId: 't', type: 'prerequisite' },
  { sourceId: 'b', targetId: 't', type: 'prerequisite' },
  { sourceId: 't', targetId: 'r', type: 'similarity' },
];

test('conceptRelations: prerequisites + ratio (F46)', () => {
  const r = conceptRelations('t', nodes, edges);
  assert.equal(r.prerequisites.length, 2);
  assert.equal(r.prereqRatio, 0.5); // a mastered (0.9), b not (0.3)
});

test('conceptRelations: readiness lock (F47)', () => {
  // Lower the mastered prereq → ratio 0 → locked.
  const r = conceptRelations('t', nodes.map((n) => (n.id === 'a' ? { ...n, masteryLevel: 0.1 } : n)), edges);
  assert.equal(r.locked, true);
});

test('conceptRelations: related topics (F49)', () => {
  const r = conceptRelations('t', nodes, edges);
  assert.equal(r.related.length, 1);
  assert.equal(r.related[0].label, 'Trig');
});

test('conceptRelations: no edges → empty, unlocked', () => {
  const r = conceptRelations('t', nodes, []);
  assert.equal(r.prereqRatio, null);
  assert.equal(r.locked, false);
  assert.equal(r.related.length, 0);
});
