import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildChapterHeatmap, compactChapterHeatmap, parseCompactChapterHeatmap } from '../chapter-heatmap.js';

describe('buildChapterHeatmap', () => {
  it('groups attempts by subject and chapter', () => {
    const cube = buildChapterHeatmap([
      { bookingId: 'a', subjectId: 'math', chapterId: 'ch1', subjectLabel: 'Math', chapterLabel: 'Algebra', score: 0.8, completedAt: '2026-06-01' },
      { bookingId: 'b', subjectId: 'math', chapterId: 'ch1', subjectLabel: 'Math', chapterLabel: 'Algebra', score: 0.3, completedAt: '2026-06-02' },
    ], 'sch', '10A');
    assert.ok(cube.math);
    assert.ok(cube.math.chapters.ch1);
    assert.equal(cube.math.chapters.ch1.students.a.mastery, 0.8);
    assert.equal(cube.math.chapters.ch1.summary.strugglingCount, 1);
  });
});

describe('compact round-trip', () => {
  it('preserves chapter labels and student mastery', () => {
    const cube = buildChapterHeatmap([
      { bookingId: 'a', subjectId: 'math', chapterId: 'ch1', score: 0.5 },
    ], 'sch', '10A');
    const compact = compactChapterHeatmap(cube.math.chapters);
    const parsed = parseCompactChapterHeatmap({ chaptersJson: JSON.stringify(compact) });
    assert.equal(parsed.ch1.chapterLabel, 'ch1');
    assert.equal(parsed.ch1.students.a.mastery, 0.5);
  });
});
