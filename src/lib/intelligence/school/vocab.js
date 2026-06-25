/**
 * vocab.js — the context-aware vocabulary layer (plan §1b).
 *
 * One codebase, two voices. Every user-facing label that used to be hardcoded
 * event-language ("Participant", "Recall", "Pilot", "ANPS") is keyed here by a
 * SEMANTIC key. `orgType` on the school doc (`schools/{id}.orgType`) selects the voice:
 *
 *   - orgType: 'event'  → Zero2Dev keeps its bootcamp identity (Participant / Recall / Pilot).
 *   - orgType: 'school' → real schools read Student / Quiz / Personalized Learning.
 *
 * This is a PURE module (no React, no Firestore) so it stays trivially testable and can be
 * imported anywhere. Consumers get the resolved dictionary via `useVocab()` (SchoolContext).
 *
 * Resolution order (plan §1b): SCHOOL defaults → EVENT overlay (only when orgType==='event')
 * → per-school `vocabOverrides`. School is the base because the platform is multi-school now;
 * Zero2Dev is the single special case overlaid on top.
 */

/** Base voice: a real school. `appName` is a placeholder; resolveVocab injects the shortName. */
const SCHOOL_VOCAB = {
  appName: 'Sankalp AEI',
  adminTitle: 'Admin Console',
  learner: 'Student',
  learners: 'Students',
  group: 'Class',
  groups: 'Classes',
  unit: 'Subject',
  units: 'Subjects',
  assessment: 'Quiz',
  assessmentVerb: 'Quiz',
  advancedTrack: 'Personalized Learning',
  planner: 'Adaptive Neural Planner',
  plannerShort: 'Planner',
  knowledgeMap: 'Brain Map',          // product name — kept in both modes
  calendar: 'Calendar',               // schools: a plain academic calendar
  journeyPhrase: 'your learning journey',
};

/** Event overlay: only the keys where Zero2Dev's bootcamp wording differs from a school. */
const EVENT_VOCAB = {
  appName: 'Sankalp AEI',
  adminTitle: 'Command Center',
  learner: 'Participant',
  learners: 'Participants',
  group: 'Cohort',
  groups: 'Cohorts',
  unit: 'Session',
  units: 'Sessions',
  assessment: 'Recall Quiz',
  assessmentVerb: 'Recall',
  advancedTrack: 'Pilot',
  planner: 'ANPS',
  plannerShort: 'ANPS',
  knowledgeMap: 'Brain Map',
  calendar: 'Event Calendar',         // event: the bootcamp schedule
  journeyPhrase: 'your Sankalp AEI journey',
};

// Keys that frequently appear mid-sentence ("No students yet") — derive lowercase variants
// once so call sites don't sprinkle `.toLowerCase()` (and never drift out of sync).
const LOWER_KEYS = ['learner', 'learners', 'group', 'groups', 'unit', 'units'];
function withLower(v) {
  const out = { ...v };
  for (const k of LOWER_KEYS) if (out[k]) out[`${k}Lower`] = String(out[k]).toLowerCase();
  return out;
}

/**
 * resolveVocab(orgType, overrides, shortName) → a flat label dictionary.
 *
 * @param {'event'|'school'} orgType  selects the voice (anything not 'event' → school)
 * @param {object} overrides          per-school `vocabOverrides` (e.g. { learner: 'Pupil' })
 * @param {string} shortName          school shortName → becomes `appName` in school mode
 */
export function resolveVocab(orgType, overrides = {}, shortName = '') {
  const base = { ...SCHOOL_VOCAB };
  if (shortName) base.appName = shortName;                 // school appName = its shortName
  const merged = orgType === 'event' ? { ...base, ...EVENT_VOCAB } : base;
  // `orgType` is a STRUCTURAL flag (not a label) so consumers can branch layout/nav on the
  // active voice — e.g. school students get a different student tab set (DashboardApp).
  // Appended last so per-school overrides can never clobber it.
  return withLower({ ...merged, ...(overrides || {}), orgType: orgType === 'event' ? 'event' : 'school' });
}

/** The default dictionary (school voice) — fallbacks / "All schools" super-admin chrome. */
export const DEFAULT_VOCAB = resolveVocab('school');

/** Event-voice dictionary — the fail-soft fallback so Zero2Dev never breaks (plan §1c). */
export const EVENT_FALLBACK_VOCAB = resolveVocab('event');
