import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildReportCard, reportCardDocId } from '../report-card-builder.js';

describe('buildReportCard', () => {
  it('aggregates published exams and attendance', () => {
    const card = buildReportCard({
      student: { id: 'STU1', name: 'Ada', rollNo: '12', divisionId: '10A', loopAttendance: { '2026-06-20': true, '2026-06-21': true } },
      schoolId: 'sch',
      academicYearId: '2026',
      termId: 'term1',
      exams: [
        { exam: { subjectId: 'math', name: 'Unit 1', maxMarks: 100 }, mark: { published: true, obtained: { total: 80 }, max: { total: 100 }, grade: 'A2' } },
        { exam: { subjectId: 'phy', name: 'Unit 1', maxMarks: 50 }, mark: { published: true, obtained: { total: 40 }, max: { total: 50 } } },
      ],
      registers: [
        { status: 'submitted', students: { STU1: { status: 'present' } } },
        { status: 'locked', students: { STU1: { status: 'present' } } },
      ],
      subjectLabels: { math: { title: 'Mathematics' }, phy: { title: 'Physics' } },
    });
    assert.equal(card.subjects.length, 2);
    assert.equal(card.overall.total, 120);
    assert.equal(card.overall.maxTotal, 150);
    assert.equal(card.attendance.percentage, 100);
    assert.equal(card.loopCompletion.completedDays, 2);
    assert.equal(card.status, 'draft');
  });
});

describe('reportCardDocId', () => {
  it('is deterministic', () => {
    assert.equal(reportCardDocId('s', '2026', 't1', 'bid'), 's__2026__t1__bid');
  });
});
