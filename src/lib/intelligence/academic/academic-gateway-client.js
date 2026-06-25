/**
 * Client wrapper for the server-authored academic write callables (§4).
 * Gated by VITE_USE_ACADEMIC_GATEWAY — when off, callers keep writing directly
 * (the existing client path stays the fallback). When on, high-risk finalizations
 * (attendance submit/lock/unlock, marks publish, report-card publish) go to the server,
 * which validates, audits, and authors the record.
 */
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase';

export function useAcademicGateway() {
  return import.meta.env.VITE_USE_ACADEMIC_GATEWAY === '1'
    || import.meta.env.VITE_USE_ACADEMIC_GATEWAY === 'true';
}

const _fns = {};
function callable(name) {
  if (!_fns[name] && app) {
    try { _fns[name] = httpsCallable(getFunctions(app), name); } catch { _fns[name] = null; }
  }
  return _fns[name];
}

async function call(name, payload) {
  const fn = callable(name);
  if (!fn) throw new Error(`${name} unavailable`);
  const res = await fn(payload);
  return res.data;
}

export const submitAttendanceRegister = (p) => call('submitAttendanceRegister', p);
export const lockAttendanceRegister = (p) => call('lockAttendanceRegister', p);
export const unlockAttendanceRegister = (p) => call('unlockAttendanceRegister', p);
export const publishExamMarks = (p) => call('publishExamMarks', p);
export const publishReportCards = (p) => call('publishReportCards', p);
