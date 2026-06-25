/**
 * Brain Map™ Data Builder — VENDORED + TRIMMED from
 * aei-brainmap/builder/brain-map-builder.ts.
 *
 * Transforms a learner's mastery state into structured visual graph data for
 * the force-graph canvas. Pure: reads LearnerState + KnowledgeGraph, writes
 * nothing.
 *
 * Trimmed from the original: removed the `firebase-admin` type import, the
 * `graph-types` import, and the `../bridge/...` value import, plus the unused
 * `buildClassHeatmap`, `brainMapDataToGraphData`, and `buildBayesianBrainMap`.
 * Output types (BrainMapNode/Edge/Data/Stats) now live in `./types`.
 */

import type {
  LearnerState,
  TopicMastery,
  RevisionUrgency,
  KnowledgeNode,
  KnowledgeEdge,
  BrainMapNode,
  BrainMapEdge,
  BrainMapData,
} from "./types";
import { decayMastery } from "./bayesian";

/* ─── Color encoding ─────────────────────────────────────── */

/** Sentinel value indicating a topic has not yet been assessed. */
const NOT_ASSESSED = -1;

/**
 * Encode mastery + urgency into a hex color.
 *
 * Green  (#22c55e) — mastered (mastery > 0.8)
 * Blue   (#3b82f6) — learning well (mastery 0.5–0.8, no urgency)
 * Yellow (#f59e0b) — at risk (mastery 0.3–0.5 OR urgent)
 * Orange (#f97316) — struggling (mastery 0.15–0.3)
 * Red    (#ef4444) — critical (mastery < 0.15 OR critical urgency)
 * Gray   (#9ca3af) — not yet assessed
 */
function encodeMasteryColor(
  mastery: number,
  urgency: RevisionUrgency["urgency"] | "none",
): string {
  if (mastery < 0) return "#9ca3af"; // not assessed
  if (urgency === "critical" || mastery < 0.15) return "#ef4444";
  if (mastery < 0.3 || urgency === "high") return "#f97316";
  if (mastery < 0.5 || urgency === "medium") return "#f59e0b";
  if (mastery >= 0.8) return "#22c55e";
  return "#3b82f6";
}

/**
 * Compute node size (1–100) based on mastery and attempts.
 * More mastered and more practiced → larger node.
 */
function computeNodeSize(mastery: number, attempts: number): number {
  const base = 20;
  const masteryBonus = mastery * 50;
  const attemptsBonus = Math.min(attempts / 10, 1) * 30;
  return Math.round(base + masteryBonus + attemptsBonus);
}

/* ─── Core builder ──────────────────────────────────────── */

function buildNode(
  node: KnowledgeNode,
  mastery: TopicMastery | undefined,
  urgency: RevisionUrgency | undefined,
  nowISO: string,
): BrainMapNode {
  // Raw all-time estimate vs. how it reads TODAY after time-based forgetting.
  const decayed = mastery ? decayMastery(mastery, nowISO) : undefined;
  const rawMastery = mastery?.mastery ?? NOT_ASSESSED;
  const effMastery = decayed?.effectiveMastery ?? rawMastery;
  const retentionStrength = mastery?.retentionStrength ?? 0;
  const attempts = mastery?.attempts ?? 0;
  const urgencyLabel = urgency?.urgency ?? "none";

  const isAssessed = rawMastery >= 0;
  // Visuals follow the EFFECTIVE (cooled) mastery so the brain grows and fades.
  const visualMastery = isAssessed ? effMastery : NOT_ASSESSED;

  // Retrieval-gated "understood": a brain-dump self-claim that hasn't yet been
  // proven by a quiz is PROVISIONAL — it must not read as mastered, no matter
  // how high the claimed score. It gets a distinct violet "confirm me" look.
  const provisional = !!mastery?.claimedUnderstood && !mastery?.confirmedByRetrieval;
  const claimStatus: "unconfirmed" | "confirmed" | undefined = mastery?.claimedUnderstood
    ? (provisional ? "unconfirmed" : "confirmed")
    : undefined;

  const isMastered = visualMastery > 0.8 && !provisional;
  const isStruggling = isAssessed && visualMastery < 0.3 && !provisional;
  const dueForRevision = !!decayed?.dueForRevision;

  let badge: string | undefined;
  if (urgency?.urgency === "critical") badge = "⚠";
  else if (urgency?.urgency === "high") badge = "!";
  else if (provisional) badge = "?";
  else if (isMastered) badge = "✓";

  return {
    id: node.id,
    label: node.label,
    masteryLevel: Math.max(0, visualMastery),
    retentionStrength,
    size: isAssessed ? computeNodeSize(visualMastery, attempts) : 20,
    color: provisional
      ? "#a78bfa" // violet — claimed, awaiting confirmation
      : isAssessed ? encodeMasteryColor(visualMastery, urgencyLabel) : "#9ca3af",
    badge,
    metadata: {
      masteryPercent: isAssessed ? Math.round(visualMastery * 100) : 0,
      retentionPercent: Math.round(retentionStrength * 100),
      attempts,
      urgency: urgencyLabel,
      lastAssessedAt: mastery?.lastAssessedAt,
      daysSinceLastRevision: decayed?.daysSinceLastRevision ?? urgency?.daysSinceLastRevision,
      isStruggling,
      isMastered,
      effectiveMasteryPercent: isAssessed ? Math.round(effMastery * 100) : 0,
      dueForRevision,
      trajectorySlope: mastery?.trajectorySlope,
      recentScores: mastery?.recentScores,
      claimStatus,
    },
  };
}

/**
 * Build Brain Map edge data. Marks whether the source prerequisite is met (mastery > 0.5).
 */
function buildEdge(
  edge: KnowledgeEdge,
  topicMasteryMap: Record<string, TopicMastery>,
): BrainMapEdge | null {
  if (!["prerequisite", "progression", "relation"].includes(edge.type)) return null;

  const sourceMastery = topicMasteryMap[edge.sourceId]?.mastery ?? 0;
  const prerequisiteMet = sourceMastery >= 0.5;

  return {
    sourceId: edge.sourceId,
    targetId: edge.targetId,
    edgeType: edge.type as BrainMapEdge["edgeType"],
    weight: edge.weight ?? 0.5,
    prerequisiteMet,
  };
}

/**
 * Build the full Brain Map data structure from a learner's mastery state.
 */
export function buildBrainMap(
  learnerState: LearnerState,
  knowledgeGraph: KnowledgeGraphLike,
): BrainMapData {
  const now = new Date().toISOString();
  const { topicMasteryMap, revisionUrgencyMap } = learnerState;

  const nodes: BrainMapNode[] = knowledgeGraph.nodes.map((node) =>
    buildNode(node, topicMasteryMap[node.id], revisionUrgencyMap[node.id], now),
  );

  const nodeIds = new Set(knowledgeGraph.nodes.map((n) => n.id));
  const edges: BrainMapEdge[] = knowledgeGraph.edges
    .filter((e) => nodeIds.has(e.sourceId) && nodeIds.has(e.targetId))
    .map((e) => buildEdge(e, topicMasteryMap))
    .filter((e): e is BrainMapEdge => e !== null);

  // Learning frontier: a still-weak concept whose prerequisites are MET is
  // "ready to grow next". Mark them so the canvas can beckon the student there.
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  for (const e of edges) {
    if (e.edgeType !== "prerequisite" || !e.prerequisiteMet) continue;
    const target = nodeById.get(e.targetId);
    if (target && target.masteryLevel > 0 && target.masteryLevel < 0.45) {
      target.metadata.isFrontier = true;
    }
  }

  const assessedNodes = nodes.filter((n) => n.masteryLevel > 0);
  const masteredTopics = assessedNodes.filter((n) => n.metadata.isMastered);
  const strugglingTopics = assessedNodes.filter((n) => n.metadata.isStruggling);
  const learningTopics = assessedNodes.filter(
    (n) => !n.metadata.isMastered && !n.metadata.isStruggling,
  );

  const avgMastery = assessedNodes.length
    ? assessedNodes.reduce((s, n) => s + n.masteryLevel, 0) / assessedNodes.length
    : 0;
  const avgRetention = assessedNodes.length
    ? assessedNodes.reduce((s, n) => s + n.retentionStrength, 0) / assessedNodes.length
    : 0;

  const criticalTopics = nodes
    .filter((n) => n.metadata.urgency === "critical" || n.metadata.urgency === "high")
    .sort((a, b) => a.masteryLevel - b.masteryLevel)
    .slice(0, 5)
    .map((n) => n.id);

  const strongestTopics = nodes
    .filter((n) => n.metadata.isMastered)
    .sort((a, b) => b.masteryLevel - a.masteryLevel)
    .slice(0, 5)
    .map((n) => n.id);

  return {
    learnerId: learnerState.actorId,
    generatedAt: now,
    nodes,
    edges,
    stats: {
      totalTopics: nodes.length,
      masteredTopics: masteredTopics.length,
      learningTopics: learningTopics.length,
      strugglingTopics: strugglingTopics.length,
      averageMastery: avgMastery,
      averageRetention: avgRetention,
      criticalTopics,
      strongestTopics,
    },
  };
}

/** Minimal shape the builder reads from a knowledge graph. */
interface KnowledgeGraphLike {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}
