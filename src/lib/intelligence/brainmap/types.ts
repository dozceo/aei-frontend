/**
 * Brain Map — self-contained type definitions for the dashboard's vendored
 * brain-map module. Merged from the aei-brainmap package so nothing in this
 * folder reaches outside `src/brainmap/` (the upstream barrels transitively
 * pull firebase-admin shapes that are not browser-safe).
 *
 * Sources:
 *   - aei-brainmap/types/common.ts
 *   - aei-brainmap/types/learner-state.ts
 *   - aei-brainmap/types/knowledge-graph.ts
 *   - aei-brainmap/ui/types.ts
 */

// ── Common ────────────────────────────────────────────────────────────────
export type ActorId = string;
export type ActorRole = "student" | "teacher" | "mentor" | "parent" | "admin";
export type ISOTimestamp = string;
export type Probability = number;

export interface AcademicContext {
  institutionId: string;
  curriculumId: string;
  classId: string;
  sectionId?: string;
  academicYear: string;
}

// ── Learner state ─────────────────────────────────────────────────────────
export interface TopicMastery {
  topicId: string;
  mastery: Probability;
  retentionStrength: Probability;
  lastAssessedAt: ISOTimestamp;
  attempts: number;

  // Bayesian posterior state (optional — populated by the engine)
  posteriorAlpha?: number;
  posteriorBeta?: number;
  posteriorVariance?: number;
  ciLower?: number;
  ciUpper?: number;
  uncertainty?: number;
  trajectorySlope?: number;
  struggleFlags?: string[];
  forgettingStrength?: number;
  recentScores?: number[];

  // ── Forgetting-curve outputs (populated by decayMastery) ──
  // `mastery` stays the raw Bayesian estimate; these capture how it reads TODAY
  // after time-based forgetting, so the map can visibly cool and re-warm.
  effectiveMastery?: number; // mastery after recency decay (drives colour/size)
  effectiveRetention?: number; // retentionStrength after time decay (0–1)
  daysSinceLastRevision?: number;
  dueForRevision?: boolean; // cooled enough to deserve a "revise me" pulse

  // ── Retrieval-gated "understood" claims (brain dumps) ──
  // A dump can CLAIM a concept is understood, but that stays a hypothesis until
  // the student passes a short retrieval check. `claimedUnderstood` marks the
  // self-claim; `confirmedByRetrieval` flips true once a real quiz attempt exists.
  claimedUnderstood?: boolean;
  confirmedByRetrieval?: boolean;
}

export type BayesianTopicMastery = Required<TopicMastery>;

export interface RevisionUrgency {
  topicId: string;
  urgency: "low" | "medium" | "high" | "critical";
  estimatedForgetDate: ISOTimestamp;
  daysSinceLastRevision: number;
}

export interface AttentionState {
  riskClass: "low" | "moderate" | "high" | "critical";
  dropoutProbability: Probability;
  lastActiveAt: ISOTimestamp;
  sessionFrequency: number;
  engagementTrend: "improving" | "stable" | "declining";
}

export interface PerformanceTrend {
  direction: "improving" | "stable" | "declining";
  averageScore: number;
  scoreVariance: number;
  recentScores: number[];
}

export interface LearnerState {
  actorId: ActorId;
  actorRole: ActorRole;
  academicContext: AcademicContext;
  subjectMap: Record<string, boolean>;
  topicMasteryMap: Record<string, TopicMastery>;
  revisionUrgencyMap: Record<string, RevisionUrgency>;
  attentionState: AttentionState;
  performanceTrend: PerformanceTrend;
  interventionRisk: "none" | "low" | "medium" | "high" | "critical";
  progressionState: "on-track" | "at-risk" | "behind" | "ahead";
  lastActiveAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

// ── Knowledge graph ───────────────────────────────────────────────────────
export type KnowledgeNodeType =
  | "subject"
  | "chapter"
  | "topic"
  | "skill"
  | "strength"
  | "weakness";

export type KnowledgeEdgeType =
  | "hierarchy"
  | "prerequisite"
  | "progression"
  | "relation"
  | "peer"
  | "similarity";

export interface KnowledgeNode {
  id: string;
  type: KnowledgeNodeType;
  label: string;
  parentId?: string;
  metadata: Record<string, unknown>;
}

export interface KnowledgeEdge {
  sourceId: string;
  targetId: string;
  type: KnowledgeEdgeType;
  weight?: number;
  knnRank?: number;
  cosineSimilarity?: number;
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

// ── Brain Map visual data (builder output / canvas input) ──────────────────
export interface BrainMapNodeMetadata {
  masteryPercent: number;
  retentionPercent: number;
  attempts: number;
  urgency: RevisionUrgency["urgency"] | "none";
  lastAssessedAt?: string;
  daysSinceLastRevision?: number;
  isStruggling: boolean;
  isMastered: boolean;
  // ── Growth / forgetting overlays ──
  effectiveMasteryPercent?: number; // mastery after time decay (what the colour shows)
  dueForRevision?: boolean; // cooled → pulse "revise me"
  isFrontier?: boolean; // prereqs met but still weak → "ready to grow next"
  trajectorySlope?: number; // recent trend (for the growth sparkline / arrow)
  recentScores?: number[]; // last few scores (sparkline)
  childCount?: number; // hidden descendants rolled up under a collapsed node
  // Dump "understood" claim lifecycle: 'unconfirmed' = claimed but not yet
  // proven by a retrieval check (provisional, NOT mastered); 'confirmed' = a
  // claim that has since been tested. Drives the violet "confirm me" visual.
  claimStatus?: "unconfirmed" | "confirmed";
}

export interface BrainMapNode {
  id: string;
  label: string;
  masteryLevel: number;
  retentionStrength: number;
  size: number;
  color: string;
  badge?: string;
  metadata: BrainMapNodeMetadata;
  // ── Graph-enhancement overlays (KNN / Louvain) ──
  nodeKind?: "session" | "topic" | "concept";
  clusterId?: string;
  clusterColor?: string;
  salience?: number;
  uncertainty?: number; // CI width 0–1
}

export interface BrainMapEdge {
  sourceId: string;
  targetId: string;
  edgeType: "prerequisite" | "progression" | "relation";
  weight: number;
  prerequisiteMet: boolean;
  // 'hierarchy' (session/topic → concept), 'similarity' (KNN), 'prerequisite',
  // or 'relation' (Gemini). Drives edge styling + the edge-type filters.
  edgeKind?: "hierarchy" | "similarity" | "prerequisite" | "relation";
  similarity?: number; // cosine, for KNN edges
}

export interface BrainMapStats {
  totalTopics: number;
  masteredTopics: number;
  learningTopics: number;
  strugglingTopics: number;
  averageMastery: number;
  averageRetention: number;
  criticalTopics: string[];
  strongestTopics: string[];
}

export interface BrainMapData {
  learnerId: string;
  generatedAt: string;
  nodes: BrainMapNode[];
  edges: BrainMapEdge[];
  stats: BrainMapStats;
}
