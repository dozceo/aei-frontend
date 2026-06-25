import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  attendanceDayDocId,
  computeRegisterSummary,
  studentAttendanceFromRegisters,
  loopAttendanceSummary,
} from '../attendance.js';

describe('attendanceDayDocId', () => {
  it('builds stable doc id', () => {
    assert.equal(attendanceDayDocId('sch', 'div-a', '2026-06-21'), 'sch__div-a__2026-06-21');
  });
});

describe('computeRegisterSummary', () => {
  it('counts statuses', () => {
    const s = computeRegisterSummary({
      a: { status: 'present' },
      b: { status: 'absent' },
      c: { status: 'late' },
      d: { status: 'excused' },
    });
    assert.equal(s.present, 1);
    assert.equal(s.absent, 1);
    assert.equal(s.late, 1);
    assert.equal(s.excused, 1);
    assert.equal(s.total, 4);
  });
});

describe('studentAttendanceFromRegisters', () => {
  it('derives percentage from submitted registers only', () => {
    const registers = [
      { status: 'draft', date: '2026-06-01', students: { x: { status: 'present' } } },
      { status: 'submitted', date: '2026-06-02', students: { x: { status: 'present' } } },
      { status: 'locked', date: '2026-06-03', students: { x: { status: 'absent' } } },
    ];
    const r = studentAttendanceFromRegisters(registers, 'x');
    assert.equal(r.workingDays, 2);
    assert.equal(r.presentDays, 1);
    assert.equal(r.absentDays, 1);
    assert.equal(r.percentage, 50);
  });
});

describe('loopAttendanceSummary', () => {
  it('counts completed days and streak from today', () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${d}`;
    const r = loopAttendanceSummary({ [key]: true, '2026-01-01': true });
    assert.equal(r.completedDays, 2);
    assert.ok(r.streak >= 1);
    assert.equal(r.lastCompleted, key);
  });
});
