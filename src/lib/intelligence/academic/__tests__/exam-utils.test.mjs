import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { gradeFromPercentage, totalMarks, examDocId } from '../exam-utils.js';

describe('gradeFromPercentage', () => {
  it('maps CBSE-ish bands', () => {
    assert.equal(gradeFromPercentage(95), 'A1');
    assert.equal(gradeFromPercentage(75), 'B1');
    assert.equal(gradeFromPercentage(30), 'E');
  });
});

describe('totalMarks', () => {
  it('sums theory and practical', () => {
    const r = totalMarks({ theory: 40, practical: 10 }, { theory: 70, practical: 30 });
    assert.equal(r.obtained.total, 50);
    assert.equal(r.max.total, 100);
  });
});

describe('examDocId', () => {
  it('includes school division subject slug', () => {
    assert.match(examDocId('s', 'd', 'math', 'unit-1'), /^s__d__math__unit-1$/);
  });
});
