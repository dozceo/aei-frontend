import { describe, it, expect } from 'vitest';
import { participantDivisionId, effectiveClassId } from '../class-identity.js';

describe('participantDivisionId', () => {
  it('prefers divisionId', () => {
    expect(participantDivisionId({ divisionId: 'd1', classId: 'c1' })).toBe('d1');
  });
  it('falls back to classId when no divisionId', () => {
    expect(participantDivisionId({ classId: 'c1' })).toBe('c1');
  });
  it('returns empty string for missing/empty row', () => {
    expect(participantDivisionId(null)).toBe('');
    expect(participantDivisionId({})).toBe('');
  });
});

describe('effectiveClassId (deprecated alias)', () => {
  it('delegates to participantDivisionId', () => {
    expect(effectiveClassId({ divisionId: 'd9', classId: 'c9' })).toBe('d9');
    expect(effectiveClassId({ classId: 'c9' })).toBe('c9');
  });
});
