/**
 * Concept dependency relations (Wave F) — pure graph queries over brain-map nodes
 * + edges. Powers F46 (prerequisite mastery ratio), F47 (readiness lock), and
 * F49 (related topics). Deterministic, no I/O.
 */

export interface GraphNodeLite { id: string; label?: string; masteryLevel?: number }
export interface GraphEdgeLite { sourceId?: string; targetId?: string; type?: string }

export interface ConceptRelations {
  prerequisites: Array<{ id: string; label: string; mastery: number }>;
  related: Array<{ id: string; label: string }>;
  prereqRatio: number | null; // share of prerequisites mastered (F46); null when none
  locked: boolean; // F47 — most prerequisites not yet mastered
}

const num = (n: unknown): number => (typeof n === 'number' && Number.isFinite(n) ? n : 0);

export function conceptRelations(
  nodeId: string,
  nodes: GraphNodeLite[] = [],
  edges: GraphEdgeLite[] = [],
  masteredThreshold = 0.7,
): ConceptRelations {
  const byId = new Map((nodes ?? []).map((n) => [n.id, n]));
  const prerequisites: ConceptRelations['prerequisites'] = [];
  const relatedSeen = new Set<string>();
  const related: ConceptRelations['related'] = [];

  for (const e of edges ?? []) {
    if (!e) continue;
    if (e.type === 'prerequisite' && e.targetId === nodeId) {
      const n = byId.get(e.sourceId ?? '');
      if (n) prerequisites.push({ id: n.id, label: n.label ?? n.id, mastery: num(n.masteryLevel) });
    } else if (e.type === 'similarity' && (e.sourceId === nodeId || e.targetId === nodeId)) {
      const otherId = e.sourceId === nodeId ? e.targetId : e.sourceId;
      const n = otherId ? byId.get(otherId) : undefined;
      if (n && !relatedSeen.has(n.id) && n.id !== nodeId) {
        relatedSeen.add(n.id);
        related.push({ id: n.id, label: n.label ?? n.id });
      }
    }
  }

  const prereqRatio = prerequisites.length
    ? prerequisites.filter((p) => p.mastery >= masteredThreshold).length / prerequisites.length
    : null;
  return { prerequisites, related: related.slice(0, 5), prereqRatio, locked: prereqRatio != null && prereqRatio < 0.5 };
}
