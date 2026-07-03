import type { PredictResponse } from './ml-client'

export type DecisionCategory =
  | 'urgent_review'
  | 'spaced_revision'
  | 'challenge_next'
  | 'continuation'

export type ADKMode = 'coach' | 'challenge' | 'support' | 'neutral'

export interface DecisionResult {
  category: DecisionCategory
  mode: ADKMode
  reasoning: string
  priority: number
}

export function categorizePrediction(prediction: PredictResponse): DecisionResult {
  const { mastery_probability, forgetting_days, attention_risk, dropout_probability } = prediction

  if (dropout_probability >= 0.65 || attention_risk === 'critical') {
    return {
      category: 'urgent_review',
      mode: 'support',
      reasoning: 'High dropout risk or critical attention — prioritize recovery and check-ins.',
      priority: 1,
    }
  }

  if (forgetting_days <= 2 || mastery_probability < 0.45) {
    return {
      category: 'urgent_review',
      mode: 'coach',
      reasoning: 'Knowledge is fading quickly or mastery is low — review before moving on.',
      priority: 2,
    }
  }

  if (mastery_probability >= 0.8 && attention_risk === 'low') {
    return {
      category: 'challenge_next',
      mode: 'challenge',
      reasoning: 'Strong mastery with stable attention — advance to harder material.',
      priority: 4,
    }
  }

  if (forgetting_days <= 7) {
    return {
      category: 'spaced_revision',
      mode: 'coach',
      reasoning: 'Spaced revision window is open — reinforce before forgetting accelerates.',
      priority: 3,
    }
  }

  return {
    category: 'continuation',
    mode: 'neutral',
    reasoning: 'Steady progress — continue the current learning path.',
    priority: 5,
  }
}

export const DECISION_LABELS: Record<DecisionCategory, string> = {
  urgent_review: 'Urgent review',
  spaced_revision: 'Spaced revision',
  challenge_next: 'Challenge next',
  continuation: 'Continue learning',
}
