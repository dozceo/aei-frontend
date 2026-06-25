/**
 * attempts-core — PURE attempt → mastery / knowledge-graph logic (no firebase).
 *
 * Split out of attempts.js so it can be unit-tested with `node --test` (the only
 * runtime imports are bayesian.ts, whose type-only imports are erased, and the
 * pure latency.js). attempts.js re-exports everything here, so all existing
 * importers (`./attempts`) are unchanged.
 */

import { updateBayesianMastery } from './bayesian.ts';
import { latencyContext } from './latency.js';

/**
 * Apply attempts onto a topicMasteryMap (mutates + returns it). Each attempt is
 * a Bayesian observation on its topicId; oldest applied first so the latest wins.
 */
export function applyAttempts(topicMasteryMap, attempts) {
  const ordered = [...(attempts || [])].sort((a, b) =>
    String(a.completedAt || '').localeCompare(String(b.completedAt || '')),
  );
  for (const at of ordered) {
    const id = at.topicId;
    if (!id || typeof at.score !== 'number') continue;
    const ts = at.completedAt || new Date().toISOString();
    const current = topicMasteryMap[id] || {
      topicId: id, mastery: 0, retentionStrength: 0.5, lastAssessedAt: '', attempts: 0,
    };
    const lctx = at.avgLatencyMs ? latencyContext(at.avgLatencyMs) : undefined;
    topicMasteryMap[id] = updateBayesianMastery(current, at.score, ts, lctx);

    // Slip-vs-misconception follow-up (set by the ANPS quiz). A CONFIRMED
    // misconception is strong evidence the concept is genuinely shaky → an extra
    // failure observation; a RECOVERED slip ("now I get it") a gentle positive.
    if (at.misconceptions > 0) {
      topicMasteryMap[id] = updateBayesianMastery(
        topicMasteryMap[id], 0, ts, { evidenceWeight: Math.min(2, 0.8 * at.misconceptions) },
      );
    } else if (at.recovered > 0) {
      topicMasteryMap[id] = updateBayesianMastery(
        topicMasteryMap[id], 0.7, ts, { evidenceWeight: Math.min(1, 0.3 * at.recovered) },
      );
    }
  }
  return topicMasteryMap;
}

/**
 * SCH-2 — synthesize knowledge-graph fragments from school recall attempts so a
 * pure-school map (no Zero2Dev recall taxonomy, no dumps) still grows nodes. Each
 * attempt carries the stable curriculum ids it was recorded under (subjectId +
 * chapterId + conceptId via SchoolRecall), so the map grows a THREE-level tree:
 *
 *   subject (top "session" node)
 *     └─ chapter ("topic" node — when it has concept children)
 *          └─ concept ("concept" leaf — one per AI quiz sub-concept)
 *
 * A subject with children is a top-level node (placed in NEITHER id-set, so
 * `enhanceGraph` tags it nodeKind:'session' — also populating the quick-nav strip).
 * A chapter with concept children is a mid node (`parentIds` → 'topic'); a chapter
 * with no concepts stays a leaf (`conceptIds` → 'concept'). A subject-level-only
 * attempt is a standalone leaf concept (backward compatible). Mastery itself is NOT
 * set here — applyAttempts folds each attempt onto topicMasteryMap[topicId]; parents
 * are pooled separately (poolRecallParents), bottom-up via `parentChildren` order.
 *
 * Node ids are the curriculum ids themselves so they line up with the mastery map.
 * Anything already present in `existingIds` (recall taxonomy / dump nodes) is skipped.
 */
export function attemptsToGraph(attempts, existingIds = new Set()) {
  // Newest label wins for each topic.
  const ordered = [...(attempts || [])].sort((a, b) =>
    String(a.completedAt || '').localeCompare(String(b.completedAt || '')),
  );

  // subjectId → { label, hasSubjectLevel, chapters: Map<chapterId,{label,hasChapterLevel,concepts:Map}>, directConcepts: Map }
  const subjects = {};
  const standalone = []; // attempts with no subjectId (e.g. legacy/event recall not already a node)

  const ensureSubject = (sid, label) =>
    (subjects[sid] ||= { label: label || sid, hasSubjectLevel: false, chapters: new Map(), directConcepts: new Map() });
  const ensureChapter = (s, cid, label) => {
    let ch = s.chapters.get(cid);
    if (!ch) { ch = { label: label || cid, hasChapterLevel: false, concepts: new Map() }; s.chapters.set(cid, ch); }
    return ch;
  };

  for (const at of ordered) {
    const topicId = at?.topicId;
    if (!topicId) continue;
    const subjectId = at.subjectId || '';
    if (!subjectId) { standalone.push({ topicId, label: at.topicLabel || topicId }); continue; }

    const s = ensureSubject(subjectId, at.subjectLabel || subjectId);
    if (at.subjectLabel) s.label = at.subjectLabel;

    const chapterId = at.chapterId || '';
    const conceptId = at.conceptId || '';
    // A concept leaf is a distinct id below its chapter/subject (the AI quiz sub-concept).
    const conceptIsLeaf = conceptId && conceptId !== subjectId && conceptId !== chapterId;

    if (conceptIsLeaf) {
      const conceptLabel = at.conceptLabel || at.topicLabel || conceptId;
      if (chapterId) {
        const ch = ensureChapter(s, chapterId, at.chapterLabel || chapterId);
        if (at.chapterLabel) ch.label = at.chapterLabel;
        ch.concepts.set(conceptId, { label: conceptLabel });
      } else {
        s.directConcepts.set(conceptId, { label: conceptLabel });
      }
    } else if (topicId === subjectId) {
      s.hasSubjectLevel = true;
    } else {
      // Chapter-level attempt (topicId is the chapter id, with or without an explicit chapterId).
      const cid = chapterId || topicId;
      const ch = ensureChapter(s, cid, at.chapterLabel || at.topicLabel || cid);
      if (at.chapterLabel || at.topicLabel) ch.label = at.chapterLabel || at.topicLabel || ch.label;
      ch.hasChapterLevel = true;
    }
  }

  const nodes = [];
  const edges = [];
  const conceptIds = new Set();
  const parentIds = new Set();
  const sessionIds = new Set();             // subjects with children → top-level 'session' nodes
  const chapterParentChildren = {};         // chapterId → [conceptIds]  (pooled FIRST)
  const subjectParentChildren = {};         // subjectId → [childIds]    (pooled AFTER chapters)
  const seenEdge = new Set();
  const pushNode = (n) => { if (!existingIds.has(n.id)) nodes.push(n); };
  const addEdge = (src, tgt) => {
    const ek = `${src}->${tgt}`;
    if (!seenEdge.has(ek)) { seenEdge.add(ek); edges.push({ sourceId: src, targetId: tgt, type: 'progression', weight: 0.5 }); }
  };

  for (const [sid, s] of Object.entries(subjects)) {
    const hasChildren = s.chapters.size > 0 || s.directConcepts.size > 0;
    if (!hasChildren) {
      // Subject-level only → standalone concept leaf (backward compatible).
      conceptIds.add(sid);
      pushNode({ id: sid, type: 'topic', label: s.label || sid, metadata: { kind: 'concept', source: 'recall' } });
      continue;
    }

    // Subject with children → top-level "session" node (kept out of both id-sets).
    sessionIds.add(sid);
    pushNode({ id: sid, type: 'chapter', label: s.label || sid, metadata: { kind: 'subject', source: 'recall' } });

    // Concepts attached directly to the subject (no chapter tier configured).
    for (const [cid, c] of s.directConcepts) {
      conceptIds.add(cid);
      pushNode({ id: cid, type: 'topic', label: c.label || cid, parentId: sid, metadata: { kind: 'concept', source: 'recall' } });
      addEdge(sid, cid);
      (subjectParentChildren[sid] ||= []).push(cid);
    }

    for (const [chId, ch] of s.chapters) {
      if (ch.concepts.size > 0) {
        parentIds.add(chId); // mid node → nodeKind:'topic'
        pushNode({ id: chId, type: 'chapter', label: ch.label || chId, parentId: sid, metadata: { kind: 'chapter', source: 'recall' } });
      } else {
        conceptIds.add(chId); // chapter leaf → nodeKind:'concept'
        pushNode({ id: chId, type: 'topic', label: ch.label || chId, parentId: sid, metadata: { kind: 'concept', source: 'recall' } });
      }
      addEdge(sid, chId);
      (subjectParentChildren[sid] ||= []).push(chId);

      for (const [cid, c] of ch.concepts) {
        conceptIds.add(cid);
        pushNode({ id: cid, type: 'topic', label: c.label || cid, parentId: chId, metadata: { kind: 'concept', source: 'recall' } });
        addEdge(chId, cid);
        (chapterParentChildren[chId] ||= []).push(cid);
      }
    }
  }

  for (const t of standalone) {
    conceptIds.add(t.topicId);
    pushNode({ id: t.topicId, type: 'topic', label: t.label || t.topicId, metadata: { kind: 'concept', source: 'recall' } });
  }

  // Bottom-up pooling order: chapter parents (pooled from concepts) come BEFORE subject
  // parents (pooled from chapters) so a single forward poolRecallParents pass is correct.
  const parentChildren = { ...chapterParentChildren, ...subjectParentChildren };

  return { nodes, edges, conceptIds, parentIds, sessionIds, parentChildren };
}

/**
 * Give each synthesized subject parent a mastery from the mean of its chapter
 * children (run AFTER applyAttempts). Skips a subject that already has a direct
 * subject-level attempt mastery. Simple mean — full Bayesian pooling is Option B.
 */
export function poolRecallParents(topicMasteryMap, parentChildren) {
  for (const [pid, kids] of Object.entries(parentChildren || {})) {
    if (topicMasteryMap[pid]) continue;
    const present = (kids || []).map((k) => topicMasteryMap[k]).filter((m) => m && typeof m.mastery === 'number');
    if (!present.length) continue;
    const mean = present.reduce((s, m) => s + m.mastery, 0) / present.length;
    topicMasteryMap[pid] = {
      topicId: pid,
      mastery: mean,
      retentionStrength: present.reduce((s, m) => s + (m.retentionStrength || 0), 0) / present.length,
      attempts: present.reduce((s, m) => s + (m.attempts || 0), 0),
      lastAssessedAt: present.map((m) => m.lastAssessedAt || '').sort().pop() || '',
    };
  }
  return topicMasteryMap;
}

/** Signature fragment so the admin map cache invalidates when attempts change. */
export function attemptsSignature(attempts) {
  return [...(attempts || [])]
    .map((a) => `${a.id}:${a.completedAt || ''}`)
    .sort()
    .join(',');
}
