import { test } from 'node:test';
import assert from 'node:assert/strict';
import { participantDivisionId, effectiveClassId } from '../class-identity.js';

test('participantDivisionId prefers divisionId over legacy classId', () => {
  assert.equal(participantDivisionId({ divisionId: 'divA', classId: 'classA' }), 'divA');
});

test('participantDivisionId falls back to legacy classId', () => {
  assert.equal(participantDivisionId({ classId: 'classA' }), 'classA');
});

test('participantDivisionId is empty when no class identity exists', () => {
  assert.equal(participantDivisionId({}), '');
  assert.equal(participantDivisionId(null), '');
});

test('effectiveClassId alias matches participantDivisionId', () => {
  const row = { divisionId: 'divA', classId: 'classA' };
  assert.equal(effectiveClassId(row), participantDivisionId(row));
});
